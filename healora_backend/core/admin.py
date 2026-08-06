from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PatientProfile, Appointment

# Tell Django to show the Role and Phone Number fields in the Admin panel!
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Healora Custom Fields', {'fields': ('role', 'phone_number')}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(PatientProfile)
admin.site.register(Appointment)