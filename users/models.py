from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    USER_TYPES = (
        ('service_provider', 'Service Provider'),
        ('service_requester', 'Service Requester'),
        ('admin', 'Platform Admin'),
    )
    
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='service_provider')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"

class UserProfile(models.Model):
    PROVIDER_MODES = (
        ('online', 'Online / Remote'),
        ('offline', 'Offline / On-site'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Hustle Score components
    hustle_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    response_time = models.IntegerField(default=0)  # in hours
    customer_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    provider_mode = models.CharField(max_length=10, choices=PROVIDER_MODES, default='offline')
    base_hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    online_rate_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('1.20'))
    
    # Team information
    is_team_member = models.BooleanField(default=False)
    team_id = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def update_hustle_score(self):
        # Calculate hustle score based on various factors
        # This will be implemented with business logic
        pass
    
    @property
    def effective_hourly_rate(self):
        """
        Returns the hourly rate after applying the provider mode multiplier.
        Online providers earn more by design.
        """
        base = self.base_hourly_rate or Decimal('0.00')
        multiplier = self.get_mode_multiplier()
        return (base * multiplier).quantize(Decimal('0.01'))
    
    def get_mode_multiplier(self):
        if self.provider_mode == 'online':
            return self.online_rate_multiplier or Decimal('1.20')
        return Decimal('1.00')
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class VerificationCode(models.Model):
    VERIFICATION_TYPES = (
        ('email', 'Email Verification'),
        ('phone', 'Phone Verification'),
        ('password_reset', 'Password Reset'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPES)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(default=timezone.now)
    
    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()
    
    def __str__(self):
        return f"{self.verification_type} code for {self.user.email}"