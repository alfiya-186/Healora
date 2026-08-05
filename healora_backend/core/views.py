from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, AppointmentSerializer, CustomTokenObtainPairSerializer, PatientProfileSerializer
from .models import Appointment, PatientProfile

User = get_user_model()

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class AppointmentCreateView(generics.CreateAPIView):
    queryset = Appointment.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = AppointmentSerializer

class PatientProfileUpdateView(generics.UpdateAPIView):
    queryset = PatientProfile.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = PatientProfileSerializer
    lookup_field = 'user_id'