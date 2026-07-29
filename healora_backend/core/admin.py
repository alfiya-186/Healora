from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PatientProfile, Appointment

# Register Custom User
admin.site.register(User, UserAdmin)

# Register Patient Profile & Appointments
admin.site.register(PatientProfile)
admin.site.register(Appointment)