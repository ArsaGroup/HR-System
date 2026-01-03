from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from .models import User, UserProfile, VerificationCode
import random
import string

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'phone', 'user_type', 'password', 'password_confirm')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        # Create user profile
        UserProfile.objects.create(user=user)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        print(f"🔐 LOGIN VALIDATION STARTED")
        print(f"📧 Email: {email}")
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required')
        
        # Use Django's authenticate with our custom backend
        user = authenticate(username=email, password=password)
        
        if user:
            print(f"✅ Django authentication SUCCESSFUL: {user.email}")
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled')
            attrs['user'] = user
            return attrs
        else:
            print("❌ Django authentication FAILED")
            # Additional debugging
            try:
                test_user = User.objects.get(email=email)
                print(f"⚠️ User exists but auth failed. Password check: {test_user.check_password(password)}")
            except User.DoesNotExist:
                print("⚠️ User does not exist")
            raise serializers.ValidationError('Invalid credentials')

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    effective_hourly_rate = serializers.SerializerMethodField()
    mode_multiplier = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user', 'hustle_score', 'created_at', 'updated_at')
    
    def update(self, instance, validated_data):
        # Handle file uploads properly
        if 'profile_picture' in self.context.get('request', {}).FILES:
            instance.profile_picture = self.context['request'].FILES['profile_picture']
        return super().update(instance, validated_data)
    
    def get_effective_hourly_rate(self, obj):
        return str(obj.effective_hourly_rate)
    
    def get_mode_multiplier(self, obj):
        return str(obj.get_mode_multiplier())

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone', 'user_type', 'is_email_verified', 
                 'is_phone_verified', 'profile', 'date_joined')
        read_only_fields = ('id', 'date_joined', 'is_email_verified', 'is_phone_verified')

class VerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    verification_type = serializers.ChoiceField(choices=['email', 'phone', 'password_reset'])
    
    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
            attrs['user'] = user
        except User.DoesNotExist:
            raise serializers.ValidationError('User with this email does not exist')
        return attrs
    
    def create_verification_code(self):
        user = self.validated_data['user']
        verification_type = self.validated_data['verification_type']
        
        # Generate 6-digit code
        code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timedelta(minutes=15)
        
        # Deactivate previous codes
        VerificationCode.objects.filter(
            user=user, 
            verification_type=verification_type,
            is_used=False
        ).update(is_used=True)
        
        return VerificationCode.objects.create(
            user=user,
            code=code,
            verification_type=verification_type,
            expires_at=expires_at
        )

class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    verification_type = serializers.ChoiceField(choices=['email', 'phone', 'password_reset'])
    
    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
            verification_code = VerificationCode.objects.filter(
                user=user,
                code=attrs['code'],
                verification_type=attrs['verification_type'],
                is_used=False
            ).latest('created_at')
            
            if not verification_code.is_valid():
                raise serializers.ValidationError('Invalid or expired verification code')
            
            attrs['user'] = user
            attrs['verification_code'] = verification_code
            
        except (User.DoesNotExist, VerificationCode.DoesNotExist):
            raise serializers.ValidationError('Invalid verification code')
        
        return attrs