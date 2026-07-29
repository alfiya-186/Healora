from django.contrib.auth.models import AbstractUser
from django.db import models

# 1. Custom User Model (Already created, keeping it here)
class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = 'PATIENT', 'Patient'
        NUTRITIONIST = 'NUTRITIONIST', 'Nutritionist'
        MANAGER = 'MANAGER', 'Clinic Manager'
        ADMIN = 'ADMIN', 'Administrator'
        YOGA_INSTRUCTOR = 'YOGA', 'Yoga Instructor'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} ({self.get_role_display()})"


# 2. Patient Profile (Based on PDF Page 3 & 8 - Patient Management)
class PatientProfile(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    
    # Nutrition Assessment (PDF Page 8)
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    
    # Health Records & History
    medical_history = models.TextField(blank=True, help_text="e.g., PCOS, Diabetes, Hypertension")
    family_medical_history = models.TextField(blank=True)
    food_allergies = models.TextField(blank=True, help_text="e.g., Peanuts, Dairy")
    food_preferences = models.CharField(max_length=100, blank=True, help_text="e.g., Vegan, Keto")
    health_goals = models.TextField(blank=True, help_text="e.g., Weight Loss")

    def __str__(self):
        return f"Profile: {self.user.first_name}"


# 3. Appointments (Based on PDF Page 8 - Appointment Management)
class Appointment(models.Model):
    MODE_CHOICES = [
        ('ONLINE', 'Online (Video Call)'), 
        ('OFFLINE', 'In-Clinic')
    ]
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'), 
        ('COMPLETED', 'Completed'), 
        ('CANCELLED', 'Cancelled')
    ]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_appointments')
    # Nutritionist can be assigned later by a Clinic Manager
    nutritionist = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctor_appointments') 
    
    date = models.DateField()
    time = models.TimeField()
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='ONLINE')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='SCHEDULED')
    
    health_notes = models.TextField(blank=True, help_text="Reason for visit")
    amount_paid = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appt: {self.patient.first_name} on {self.date} at {self.time}"