from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import (
    RegisterSerializer, AppointmentSerializer, CustomTokenObtainPairSerializer, 
    PatientProfileSerializer, UserListSerializer, DietPlanSerializer, 
    WellnessLogSerializer, SystemAuditLogSerializer, NutritionistPatientSerializer
)
from .models import Appointment, PatientProfile, DietPlan, WellnessLog, SystemAuditLog

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

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs['user_id'])
        log_event("API_REQUEST", f"New Consultation appointment booked for patient ID {self.kwargs['user_id']}.")

class PatientDocumentListCreateView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    def get(self, request, *args, **kwargs):
        return Response([])

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