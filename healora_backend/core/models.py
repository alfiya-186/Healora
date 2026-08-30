from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = 'PATIENT', 'Patient'
        NUTRITIONIST = 'NUTRITIONIST', 'Nutritionist'
        MANAGER = 'MANAGER', 'Clinic Manager'
        ADMIN = 'ADMIN', 'Administrator'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} ({self.get_role_display()})"

class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    age = models.IntegerField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    medical_history = models.TextField(blank=True)
    food_allergies = models.TextField(blank=True)
    food_preferences = models.CharField(max_length=200, blank=True)
    health_goals = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Appointment(models.Model):
    MODE_CHOICES = [('ONLINE', 'Online (Video Call)'), ('OFFLINE', 'In-Clinic')]
    STATUS_CHOICES = [('SCHEDULED', 'Scheduled'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled')]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_appointments')
    nutritionist = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    time = models.TimeField()
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='ONLINE')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='SCHEDULED')
    meet_link = models.URLField(max_length=500, blank=True, null=True)
    health_notes = models.TextField(blank=True)
    amount_paid = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)


class DietPlan(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_diet_plans')
    nutritionist = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    breakfast = models.TextField(blank=True)
    lunch = models.TextField(blank=True)
    dinner = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    # Structured 4-week clinical plan published by the nutritionist.
    # Kept as JSON so week/day/meal data is persisted exactly as authored.
    plan_data = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, default='DRAFT')
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class WellnessLog(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wellness_history')
    date = models.DateField(auto_now_add=True)
    water_glasses = models.IntegerField(default=0)
    weight_kg = models.FloatField(null=True, blank=True)
    sleep_hours = models.FloatField(default=0.0)
    physical_activity = models.CharField(max_length=200, blank=True)

class SystemAuditLog(models.Model):
    action_type = models.CharField(max_length=50)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']

class ClinicHoliday(models.Model):
    TYPE_CHOICES = [
        ('CLINIC_HOLIDAY', 'Full Clinic Holiday'),
        ('NUTRITIONIST_LEAVE', 'Nutritionist Leave'),
    ]

    date = models.DateField()
    holiday_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='CLINIC_HOLIDAY')
    reason = models.CharField(max_length=255)
    nutritionist = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leaves')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_holidays')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']
        unique_together = ('date', 'nutritionist', 'holiday_type')

    def __str__(self):
        return f"{self.date} - {self.get_holiday_type_display()}: {self.reason}"