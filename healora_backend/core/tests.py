from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Appointment, PatientProfile, DietPlan, WellnessLog, ClinicHoliday, TelehealthSignal, PasswordResetOTP
from django.core import mail
import re
import datetime

User = get_user_model()

class HealoraCoreSecurityAndWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Patient A
        self.patient_a = User.objects.create_user(
            username='patient_a@gmail.com', email='patient_a@gmail.com',
            password='Test@1234', first_name='Patient', last_name='A', role='PATIENT'
        )
        self.profile_a = PatientProfile.objects.create(user=self.patient_a, age=25, height_cm=165, weight_kg=60)

        # Create Patient B
        self.patient_b = User.objects.create_user(
            username='patient_b@gmail.com', email='patient_b@gmail.com',
            password='Test@1234', first_name='Patient', last_name='B', role='PATIENT'
        )
        self.profile_b = PatientProfile.objects.create(user=self.patient_b, age=30, height_cm=170, weight_kg=70)

        # Create Nutritionist
        self.nutritionist = User.objects.create_user(
            username='doctor_sarah@gmail.com', email='doctor_sarah@gmail.com',
            password='Test@1234', first_name='Sarah', last_name='John', role='NUTRITIONIST'
        )

        # Create Clinic Manager
        self.manager = User.objects.create_user(
            username='manager_aliz@gmail.com', email='manager_aliz@gmail.com',
            password='Test@1234', first_name='Aliz', last_name='Manager', role='MANAGER'
        )

        # Create Administrator
        self.admin = User.objects.create_user(
            username='admin_healora@gmail.com', email='admin_healora@gmail.com',
            password='Test@1234', first_name='Super', last_name='Admin', role='ADMIN', is_staff=True
        )

    # 1. AUTHENTICATION TESTS
    def test_login_valid_credentials(self):
        response = self.client.post('/api/login/', {'username': 'patient_a@gmail.com', 'password': 'Test@1234'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['role'], 'PATIENT')

    def test_login_invalid_password_strictly_rejected(self):
        response = self.client.post('/api/login/', {'username': 'patient_a@gmail.com', 'password': 'WrongPassword999!'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn('access', response.data)

    def test_public_registration_role_escalation_prevented(self):
        payload = {
            'email': 'evil_admin_attempt@gmail.com',
            'password': 'Test@1234',
            'role': 'ADMIN', # Attacker attempts to become Administrator
            'first_name': 'Hacker',
            'last_name': 'User'
        }
        response = self.client.post('/api/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email='evil_admin_attempt@gmail.com')
        self.assertEqual(new_user.role, 'PATIENT', "Security flaw: Public registration must never allow ADMIN role")

    # 2. ROLE-BASED ACCESS CONTROL (RBAC) & PRIVACY ISOLATION
    def test_unauthenticated_api_requests_blocked(self):
        response = self.client.get('/api/admin-api/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patient_cross_user_access_blocked(self):
        # Patient A logs in
        self.client.force_authenticate(user=self.patient_a)

        # Patient A attempts to update Patient B's profile
        response = self.client.patch(f'/api/profile/update/{self.patient_b.id}/', {'weight_kg': 99.0})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Patient A attempts to view Patient B's wellness logs
        response = self.client.get(f'/api/patient/{self.patient_b.id}/wellness/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_access_admin_endpoints(self):
        self.client.force_authenticate(user=self.patient_a)
        response = self.client.get('/api/admin-api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.nutritionist)
        response = self.client.get('/api/admin-api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # 3. APPOINTMENT SCHEDULING & DOUBLE-BOOKING CONFLICTS
    def test_appointment_double_booking_conflict(self):
        self.client.force_authenticate(user=self.patient_a)

        # Book slot for tomorrow 10:00 AM (ensuring it is not a Sunday)
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        if tomorrow.weekday() == 6: # Sunday
            tomorrow += datetime.timedelta(days=1)
        if tomorrow.weekday() == 5 and 8 <= tomorrow.day <= 14: # 2nd Saturday
            tomorrow += datetime.timedelta(days=2)

        date_str = tomorrow.strftime('%Y-%m-%d')
        time_str = '10:00:00'

        # First booking succeeds
        resp1 = self.client.post(f'/api/patient/{self.patient_a.id}/appointments/', {
            'date': date_str,
            'time': time_str,
            'nutritionist': self.nutritionist.id,
            'mode': 'ONLINE',
            'status': 'SCHEDULED'
        }, format='json')
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)

        # Patient B tries to book the SAME nutritionist for the SAME date and time
        self.client.force_authenticate(user=self.patient_b)
        resp2 = self.client.post(f'/api/patient/{self.patient_b.id}/appointments/', {
            'date': date_str,
            'time': time_str,
            'nutritionist': self.nutritionist.id,
            'mode': 'ONLINE',
            'status': 'SCHEDULED'
        }, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('already booked', resp2.data.get('error', '').lower())

    # 4. DIET PLAN HISTORICAL PRESERVATION
    def test_diet_plan_publishing_preserves_history(self):
        self.client.force_authenticate(user=self.nutritionist)

        # Publish Plan 1
        plan1_data = {
            'breakfast': 'Idli & Sambar',
            'lunch': 'Brown Rice with Fish Curry',
            'dinner': 'Oats Upma',
            'instructions': 'Drink plenty of water'
        }
        res1 = self.client.post(f'/api/nutritionist/patient/{self.patient_a.id}/publish-diet/', plan1_data)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DietPlan.objects.filter(patient=self.patient_a, status='PUBLISHED').count(), 1)

        # Publish Plan 2 (Updating protocol)
        plan2_data = {
            'breakfast': 'Appam with Vegetable Stew',
            'lunch': 'Quinoa salad with grilled chicken',
            'dinner': 'Soup & sauteed vegetables',
            'instructions': 'Updated clinical protocol'
        }
        res2 = self.client.post(f'/api/nutritionist/patient/{self.patient_a.id}/publish-diet/', plan2_data)
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        # Verify Plan 1 was archived, not deleted!
        total_plans = DietPlan.objects.filter(patient=self.patient_a).count()
        self.assertEqual(total_plans, 2, "Diet plans must not be deleted; history should be preserved!")
        self.assertEqual(DietPlan.objects.filter(patient=self.patient_a, status='ARCHIVED').count(), 1)
        self.assertEqual(DietPlan.objects.filter(patient=self.patient_a, status='PUBLISHED').count(), 1)

    # 5. WEBRTC TELEHEALTH SIGNALLING & NOTES PERSISTENCE
    def test_telehealth_signalling_and_authorization(self):
        # Create an active appointment
        appt = Appointment.objects.create(
            patient=self.patient_a,
            nutritionist=self.nutritionist,
            date=datetime.date.today(),
            time='14:00:00',
            mode='ONLINE',
            status='SCHEDULED'
        )

        # 1. Nutritionist sends WebRTC Offer signal
        self.client.force_authenticate(user=self.nutritionist)
        offer_payload = {'type': 'offer', 'sdp': 'v=0\r\no=healora...'}
        resp_offer = self.client.post(f'/api/telehealth/signal/{appt.id}/', {
            'type': 'offer',
            'payload': offer_payload
        }, format='json')
        self.assertEqual(resp_offer.status_code, status.HTTP_201_CREATED)

        # 2. Patient A retrieves signals sent by the other party
        self.client.force_authenticate(user=self.patient_a)
        resp_poll = self.client.get(f'/api/telehealth/signal/{appt.id}/?since_id=0')
        self.assertEqual(resp_poll.status_code, status.HTTP_200_OK)
        signals = resp_poll.data['signals']
        self.assertEqual(len(signals), 1)
        self.assertEqual(signals[0]['signal_type'], 'offer')

        # 3. Unauthorized User (Patient B) cannot eavesdrop on this consultation
        self.client.force_authenticate(user=self.patient_b)
        resp_unauth = self.client.get(f'/api/telehealth/signal/{appt.id}/?since_id=0')
        self.assertEqual(resp_unauth.status_code, status.HTTP_403_FORBIDDEN)

    def test_telehealth_doctor_notes_persistence(self):
        appt = Appointment.objects.create(
            patient=self.patient_a,
            nutritionist=self.nutritionist,
            date=datetime.date.today(),
            time='16:00:00',
            mode='ONLINE',
            status='SCHEDULED'
        )

        self.client.force_authenticate(user=self.nutritionist)
        notes_data = {
            'doctorNotes': 'Patient reports improved metabolic energy. Fasting blood sugar normal.',
            'prescriptionNote': 'Continue low GI Kerala protocol with 30 mins brisk walking.'
        }
        resp = self.client.post(f'/api/telehealth/notes/{appt.id}/', notes_data)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        appt.refresh_from_db()
        self.assertEqual(appt.status, 'COMPLETED')
        self.assertIn('Clinical Findings: Patient reports improved metabolic energy', appt.health_notes)
        self.assertIn('Prescription: Continue low GI Kerala protocol', appt.health_notes)

    # 7. PASSWORD RESET REAL EMAIL OTP TESTS
    def test_password_reset_request_sends_email_and_hashes_otp(self):
        mail.outbox.clear()
        response = self.client.post('/api/password-reset/request/', {'email': 'patient_a@gmail.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('verification code has been sent', response.data['message'])

        # 1. Verify email was dispatched
        self.assertEqual(len(mail.outbox), 1)
        email_msg = mail.outbox[0]
        self.assertEqual(email_msg.to, ['patient_a@gmail.com'])
        self.assertIn('Healora', email_msg.subject)

        # 2. Extract code from email body
        otp_match = re.search(r'\b(\d{6})\b', email_msg.body)
        self.assertIsNotNone(otp_match, '6-digit OTP not found in email body')
        raw_otp = otp_match.group(1)

        # 3. Verify OTP is NEVER returned in API response
        self.assertNotIn(raw_otp, str(response.data))
        self.assertNotIn('otp', response.data)
        self.assertNotIn('code', response.data)

        # 4. Verify OTP is hashed in PostgreSQL database
        otp_record = PasswordResetOTP.objects.filter(user=self.patient_a).latest('created_at')
        self.assertTrue(otp_record.verify_otp(raw_otp))
        self.assertNotEqual(otp_record.otp_hash, raw_otp)
        self.assertIsNone(otp_record.otp_code)

    def test_password_reset_unknown_email_neutral_response(self):
        mail.outbox.clear()
        response = self.client.post('/api/password-reset/request/', {'email': 'unknown_person@gmail.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('verification code has been sent', response.data['message'])
        # Account provisioned and real email sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['unknown_person@gmail.com'])

    def test_password_reset_verify_and_update_password(self):
        mail.outbox.clear()
        self.client.post('/api/password-reset/request/', {'email': 'patient_a@gmail.com'})
        email_msg = mail.outbox[0]
        raw_otp = re.search(r'\b(\d{6})\b', email_msg.body).group(1)

        # Verify and set new strong password
        resp_verify = self.client.post('/api/password-reset/verify/', {
            'email': 'patient_a@gmail.com',
            'otp_code': raw_otp,
            'new_password': 'UpdatedPassword@2026'
        })
        self.assertEqual(resp_verify.status_code, status.HTTP_200_OK)

        # Confirm old password fails
        resp_old = self.client.post('/api/login/', {'username': 'patient_a@gmail.com', 'password': 'Test@1234'})
        self.assertEqual(resp_old.status_code, status.HTTP_400_BAD_REQUEST)

        # Confirm new password succeeds
        resp_new = self.client.post('/api/login/', {'username': 'patient_a@gmail.com', 'password': 'UpdatedPassword@2026'})
        self.assertEqual(resp_new.status_code, status.HTTP_200_OK)

    def test_password_reset_invalid_otp_locks_after_failed_attempts(self):
        mail.outbox.clear()
        self.client.post('/api/password-reset/request/', {'email': 'patient_a@gmail.com'})

        # Fail 5 times
        for _ in range(5):
            resp = self.client.post('/api/password-reset/verify/', {
                'email': 'patient_a@gmail.com',
                'otp_code': '000000',
                'new_password': 'UpdatedPassword@2026'
            })
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # 6th attempt should be blocked due to lock
        resp_blocked = self.client.post('/api/password-reset/verify/', {
            'email': 'patient_a@gmail.com',
            'otp_code': '000000',
            'new_password': 'UpdatedPassword@2026'
        })
        self.assertEqual(resp_blocked.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_cannot_reuse_otp(self):
        mail.outbox.clear()
        self.client.post('/api/password-reset/request/', {'email': 'patient_a@gmail.com'})
        raw_otp = re.search(r'\b(\d{6})\b', mail.outbox[0].body).group(1)

        # First verification succeeds
        resp1 = self.client.post('/api/password-reset/verify/', {
            'email': 'patient_a@gmail.com',
            'otp_code': raw_otp,
            'new_password': 'ValidPassword1@2026'
        })
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Second verification with same code fails
        resp2 = self.client.post('/api/password-reset/verify/', {
            'email': 'patient_a@gmail.com',
            'otp_code': raw_otp,
            'new_password': 'ValidPassword2@2026'
        })
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_rate_limiting(self):
        mail.outbox.clear()
        # 1st request succeeds
        resp1 = self.client.post('/api/password-reset/request/', {'email': 'patient_a@gmail.com'})
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Immediate 2nd request is throttled
        resp2 = self.client.post('/api/password-reset/request/', {'email': 'patient_a@gmail.com'})
        self.assertEqual(resp2.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
