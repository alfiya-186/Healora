from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
import datetime
from .serializers import (
    RegisterSerializer, AppointmentSerializer, CustomTokenObtainPairSerializer, 
    PatientProfileSerializer, UserListSerializer, DietPlanSerializer, 
    WellnessLogSerializer, SystemAuditLogSerializer, NutritionistPatientSerializer,
    ClinicHolidaySerializer
)
from .models import Appointment, PatientProfile, DietPlan, WellnessLog, SystemAuditLog, ClinicHoliday

User = get_user_model()

# --- HELPER: SYSTEM AUDIT LOGGER ---
def log_event(action_type, description):
    SystemAuditLog.objects.create(action_type=action_type, description=description)

# --- PUBLIC / AUTH VIEWS ---
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                log_event("AUTH_SUCCESS", f"User '{request.data.get('username')}' authenticated successfully.")
            return response
        except Exception as e:
            log_event("AUTH_FAILED", f"Failed login attempt for '{request.data.get('username')}'.")
            raise e

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 201:
            log_event("DB_UPDATE", f"New {request.data.get('role')} account provisioned for '{request.data.get('email')}'.")
        return response

# --- PATIENT & NUTRITIONIST DASHBOARD VIEWS ---
class PatientProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset = PatientProfile.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = PatientProfileSerializer
    lookup_field = 'user_id'

class WellnessLogListCreateView(generics.ListCreateAPIView):
    serializer_class = WellnessLogSerializer
    permission_classes = (AllowAny,)
    def get_queryset(self):
        return WellnessLog.objects.filter(patient_id=self.kwargs['user_id']).order_by('-date')

class PatientDietPlanView(generics.ListAPIView):
    serializer_class = DietPlanSerializer
    permission_classes = (AllowAny,)
    def get_queryset(self):
        return DietPlan.objects.filter(patient_id=self.kwargs['user_id']).order_by('-created_at')

class NutritionistPublishDietPlanView(generics.CreateAPIView):
    queryset = DietPlan.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = DietPlanSerializer

    def post(self, request, *args, **kwargs):
        patient_id = kwargs.get('user_id')
        try:
            patient = User.objects.get(pk=patient_id, role='PATIENT', is_active=True)
        except User.DoesNotExist:
            return Response({'status': 'error', 'message': 'The selected patient no longer exists or is inactive.'}, status=404)

        data = request.data.copy()
        # The frontend sends the complete 4-week plan. Persist the whole structure
        # instead of throwing away weeks/days when saving the legacy flat fields.
        plan_data = data.get('plan_data') or data.get('weeks') and data or data.get('instructions')
        if isinstance(plan_data, str):
            try:
                import json
                plan_data = json.loads(plan_data)
            except Exception:
                plan_data = {}
        if not isinstance(plan_data, dict):
            plan_data = {}

        # Avoid nesting transport-only fields inside plan_data.
        plan_data = dict(plan_data)
        plan_data.pop('patient', None)
        plan_data.pop('nutritionist', None)

        nutritionist_id = request.data.get('nutritionist')
        nutritionist = None
        if nutritionist_id not in (None, '', 'null'):
            try:
                nutritionist = User.objects.filter(pk=int(nutritionist_id), role='NUTRITIONIST', is_active=True).first()
            except (TypeError, ValueError):
                nutritionist = None

        flat = {
            'patient': patient.id,
            'nutritionist': nutritionist.id if nutritionist else None,
            'breakfast': data.get('breakfast', ''),
            'lunch': data.get('lunch', ''),
            'dinner': data.get('dinner', ''),
            'instructions': data.get('instructions', ''),
            'plan_data': plan_data,
            'status': 'PUBLISHED',
            'published_at': timezone.now(),
        }

        # Replace the previous published plan for this patient so the patient
        # portal always shows one authoritative current clinical plan.
        DietPlan.objects.filter(patient=patient).delete()
        serializer = self.get_serializer(data=flat)
        if serializer.is_valid():
            plan = serializer.save()
            log_event('DB_UPDATE', f'Nutritionist published 4-week care plan for patient ID {patient_id}.')
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class NutritionistPatientListView(generics.ListAPIView):
    serializer_class = NutritionistPatientSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        # The backend is the source of truth for the directory. Never invent
        # patient names from nutritionist/session/local demo data.
        return User.objects.filter(role='PATIENT', is_active=True).select_related('patient_profile').order_by('-date_joined')

class NutritionistListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = (AllowAny,)
    def get_queryset(self):
        return User.objects.filter(role='NUTRITIONIST', is_active=True)
        
class PatientAppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = (AllowAny,)
    
    def get_queryset(self):
        return Appointment.objects.filter(patient_id=self.kwargs['user_id']).order_by('-date')

    def create(self, request, *args, **kwargs):
        appt_date_str = request.data.get('date')
        nut_id = request.data.get('nutritionist')
        
        if appt_date_str:
            try:
                appt_date = datetime.datetime.strptime(appt_date_str, '%Y-%m-%d').date()
                # Check Sunday (6 in python weekday where Mon=0, Sun=6)
                if appt_date.weekday() == 6:
                    return Response({'error': 'The clinic is closed on all Sundays. Please select a working day.'}, status=status.HTTP_400_BAD_REQUEST)
                # Check 2nd Saturday (weekday 5 and day of month 8-14)
                if appt_date.weekday() == 5 and 8 <= appt_date.day <= 14:
                    return Response({'error': 'The clinic is closed on the 2nd Saturday of the month.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check Full Clinic Holidays
                clinic_holiday = ClinicHoliday.objects.filter(date=appt_date, holiday_type='CLINIC_HOLIDAY').first()
                if clinic_holiday:
                    return Response({'error': f'The clinic is closed on this date for {clinic_holiday.reason}.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check Nutritionist Leaves if specific nutritionist selected
                if nut_id and nut_id not in ('AUTO', '', None):
                    nut_leave = ClinicHoliday.objects.filter(date=appt_date, holiday_type='NUTRITIONIST_LEAVE', nutritionist_id=nut_id).first()
                    if nut_leave:
                        nut_name = nut_leave.nutritionist.first_name if nut_leave.nutritionist else "The nutritionist"
                        return Response({'error': f'Dr. {nut_name} is on leave on this date ({nut_leave.reason}). Please choose another doctor or date.'}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                pass

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs['user_id'])
        log_event("API_REQUEST", f"New Consultation appointment booked for patient ID {self.kwargs['user_id']}.")

class AppointmentUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = (AllowAny,)

    def patch(self, request, *args, **kwargs):
        response = super().patch(request, *args, **kwargs)
        if response.status_code == 200 and 'meet_link' in request.data:
            log_event("TELEHEALTH", f"Clinic Manager updated Telehealth consultation Google Meet link for Appointment ID {kwargs.get('pk')}.")
        return response

class PatientDocumentListCreateView(generics.ListAPIView):

    permission_classes = (AllowAny,)
    def get(self, request, *args, **kwargs):
        return Response([])

# --- CLINIC HOLIDAYS & LEAVES MANAGEMENT VIEWS ---
class ClinicHolidayListCreateView(generics.ListCreateAPIView):
    queryset = ClinicHoliday.objects.all().order_by('date')
    permission_classes = (AllowAny,)
    serializer_class = ClinicHolidaySerializer

    def perform_create(self, serializer):
        holiday = serializer.save()
        label = "Full Clinic Holiday" if holiday.holiday_type == 'CLINIC_HOLIDAY' else f"Leave for {holiday.nutritionist.first_name if holiday.nutritionist else 'Staff'}"
        log_event("DB_UPDATE", f"Clinic schedule marked: {label} on {holiday.date} ({holiday.reason}).")

class ClinicHolidayDeleteView(generics.DestroyAPIView):
    queryset = ClinicHoliday.objects.all()
    permission_classes = (AllowAny,)

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        log_event("DB_UPDATE", f"Clinic Holiday/Leave for {instance.date} deleted.")
        return super().delete(request, *args, **kwargs)


# --- ADMIN DASHBOARD VIEWS ---
class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = (AllowAny,)
    serializer_class = UserListSerializer

class AdminAppointmentListView(generics.ListAPIView):
    queryset = Appointment.objects.all().order_by('-created_at')
    permission_classes = (AllowAny,)
    serializer_class = AppointmentSerializer

class AdminAuditLogListView(generics.ListAPIView):
    queryset = SystemAuditLog.objects.all()[:50]
    permission_classes = (AllowAny,)
    serializer_class = SystemAuditLogSerializer

class AdminDeleteUserView(generics.DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    def delete(self, request, *args, **kwargs):
        log_event("CRITICAL_WARN", f"System Administrator deleted user account ID: {kwargs.get('pk')}.")
        return super().delete(request, *args, **kwargs)

class AdminEditUserView(generics.UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserListSerializer
    def patch(self, request, *args, **kwargs):
        log_event("DB_UPDATE", f"System Administrator modified user profile ID: {kwargs.get('pk')}.")
        return super().patch(request, *args, **kwargs)

class AdminToggleUserStatusView(generics.UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        log_event("SECURITY_EVENT", f"Admin {'activated' if user.is_active else 'suspended'} account '{user.email}'.")
        return Response({"status": "success", "is_active": user.is_active})