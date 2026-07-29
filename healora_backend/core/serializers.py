from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('email', 'password', 'role', 'full_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'], # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('full_name', ''),
            role=validated_data.get('role', 'PATIENT')
        )
        return user