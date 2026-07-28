from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('patient', 'Patient'),
        ('nutritionist', 'Nutritionist'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Appointment(models.Model):
    TYPE_CHOICES = (
        ('online', 'Online - Google Meet'),
        ('inperson', 'In-Person - Clinic Visit'),
    )
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_appointments')
    nutritionist_name = models.CharField(max_length=100) # e.g., Dr. Priya Menon
    consultation_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='online')
    date = models.DateField()
    time = models.CharField(max_length=20) # e.g., '10:00 AM'
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.username} with {self.nutritionist_name} on {self.date}"