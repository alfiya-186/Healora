from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import PatientProfile, Appointment, DietPlan, WellnessLog, SystemAuditLog, ClinicHoliday

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username', '').strip()
        password = attrs.get('password', '')

        try:
            data = super().validate(attrs)
        except Exception:
            user = (
                User.objects.filter(email__iexact=username).first() or 
                User.objects.filter(username__iexact=username).first()
            )
            if user and user.is_active:
                refresh = self.get_token(user)
                data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
                self.user = user
            else:
                raise

        data['role'] = self.user.role
        data['first_name'] = self.user.first_name
        data['id'] = self.user.id
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'role', 'first_name', 'last_name', 'phone_number')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=validated_data.get('role', 'PATIENT')
        )
        if user.role == 'PATIENT':
            PatientProfile.objects.create(user=user)
        return user

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ['age', 'height_cm', 'weight_kg', 'medical_history', 'food_allergies', 'food_preferences', 'health_goals']

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'

class DietPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietPlan
        fields = '__all__'

class NutritionistPatientSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    height_cm = serializers.SerializerMethodField()
    weight_kg = serializers.SerializerMethodField()
    food_allergies = serializers.SerializerMethodField()
    food_preferences = serializers.SerializerMethodField()
    medical_history = serializers.SerializerMethodField()
    health_goals = serializers.SerializerMethodField()
    enrolled_program = serializers.SerializerMethodField()

    def _profile(self, obj):
        try:
            return obj.patient_profile
        except PatientProfile.DoesNotExist:
            return None

    def _get(self, obj, field, default=''):
        profile = self._profile(obj)
        return getattr(profile, field, default) if profile else default

    def get_age(self, obj): return self._get(obj, 'age', None)
    def get_height_cm(self, obj): return self._get(obj, 'height_cm', None)
    def get_weight_kg(self, obj): return self._get(obj, 'weight_kg', None)
    def get_food_allergies(self, obj): return self._get(obj, 'food_allergies', 'None')
    def get_food_preferences(self, obj): return self._get(obj, 'food_preferences', 'No preference')
    def get_medical_history(self, obj): return self._get(obj, 'medical_history', 'None reported')
    def get_health_goals(self, obj): return self._get(obj, 'health_goals', 'Weight Management')
    def get_enrolled_program(self, obj): return self._get(obj, 'health_goals', 'Weight Management')

    class Meta:
        model = User
        fields = (
            'id', 'first_name', 'last_name', 'email', 'phone_number', 'role', 'is_active',
            'age', 'height_cm', 'weight_kg', 'food_allergies',
            'food_preferences', 'medical_history', 'health_goals', 'enrolled_program'
        )


class WellnessLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WellnessLog
        fields = '__all__'

class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'phone_number', 'role', 'date_joined', 'is_active')


class SystemAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemAuditLog
        fields = '__all__'

class ClinicHolidaySerializer(serializers.ModelSerializer):
    nutritionist_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ClinicHoliday
        fields = ('id', 'date', 'holiday_type', 'reason', 'nutritionist', 'nutritionist_name', 'created_by', 'created_by_name', 'created_at')

    def get_nutritionist_name(self, obj):
        if obj.nutritionist:
            return f"Dr. {obj.nutritionist.first_name} {obj.nutritionist.last_name}".strip()
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return "Clinic Manager"