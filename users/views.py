from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from .models import User, UserProfile, VerificationCode
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserProfileSerializer, VerificationSerializer, VerifyCodeSerializer
)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Send email verification
        verification_serializer = VerificationSerializer(data={
            'email': user.email,
            'verification_type': 'email'
        })
        if verification_serializer.is_valid():
            verification_code = verification_serializer.create_verification_code()
            # Send verification email
            send_verification_email(user.email, verification_code.code)

        return Response({
            'message': 'User registered successfully. Please check your email for verification.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_verification_code(request):
    serializer = VerificationSerializer(data=request.data)
    if serializer.is_valid():
        verification_code = serializer.create_verification_code()

        # Send verification code via email or SMS
        if serializer.validated_data['verification_type'] == 'email':
            send_verification_email(
                serializer.validated_data['email'],
                verification_code.code
            )

        return Response({
            'message': 'Verification code sent successfully'
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_code(request):
    serializer = VerifyCodeSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        verification_code = serializer.validated_data['verification_code']
        verification_type = serializer.validated_data['verification_type']

        # Mark code as used
        verification_code.is_used = True
        verification_code.save()

        # Update user verification status
        if verification_type == 'email':
            user.is_email_verified = True
        elif verification_type == 'phone':
            user.is_phone_verified = True

        user.save()

        return Response({
            'message': f'{verification_type.title()} verified successfully'
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    """
    Lightweight user search so providers/requesters can find each other before messaging.
    Supports filtering by user_type and provider_mode (online/offline).
    """
    query = request.query_params.get('q', '').strip()
    user_type = request.query_params.get('user_type')
    provider_mode = request.query_params.get('mode')
    limit = int(request.query_params.get('limit', 20))

    # Start with all users except the current user
    qs = User.objects.exclude(id=request.user.id).select_related('profile')

    # Filter by search query if provided
    if query:
        qs = qs.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(profile__bio__icontains=query) |
            Q(profile__city__icontains=query)
        )

    # Filter by user type
    if user_type:
        qs = qs.filter(user_type=user_type)

    # Filter by provider mode (online/offline)
    if provider_mode:
        qs = qs.filter(profile__provider_mode=provider_mode)

    # Order by hustle score (best providers first)
    qs = qs.order_by('-profile__hustle_score', 'username')

    serializer = UserSerializer(qs[:limit], many=True)
    return Response({'results': serializer.data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def browse_providers(request):
    """
    PUBLIC endpoint to browse service providers.
    Anyone can view providers - no login required.
    Returns limited public info: name, picture, score, rating, skills, online/offline status.
    """
    query = request.query_params.get('q', '').strip()
    provider_mode = request.query_params.get('mode')
    min_rating = request.query_params.get('min_rating')
    city = request.query_params.get('city', '').strip()
    country = request.query_params.get('country', '').strip()
    skill_id = request.query_params.get('skill')
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))

    # Start with service providers only
    qs = User.objects.filter(
        user_type='service_provider',
        is_active=True
    ).select_related('profile').prefetch_related('skills__skill__category')

    # Filter by search query (username only for privacy)
    if query:
        qs = qs.filter(username__icontains=query)

    # Filter by provider mode (online/offline)
    if provider_mode:
        qs = qs.filter(profile__provider_mode=provider_mode)

    # Filter by minimum rating
    if min_rating:
        try:
            min_rating_float = float(min_rating)
            qs = qs.filter(profile__customer_rating__gte=min_rating_float)
        except ValueError:
            pass

    # Filter by city
    if city:
        qs = qs.filter(profile__city__icontains=city)

    # Filter by country
    if country:
        qs = qs.filter(profile__country__icontains=country)

    # Filter by skill
    if skill_id:
        try:
            skill_id_int = int(skill_id)
            qs = qs.filter(skills__skill_id=skill_id_int)
        except ValueError:
            pass

    # Remove duplicates and order by hustle score
    qs = qs.distinct().order_by('-profile__hustle_score', '-profile__customer_rating', 'username')

    # Get total count before pagination
    total_count = qs.count()

    # Apply pagination
    providers = qs[offset:offset + limit]

    # Build response with LIMITED public info only
    results = []
    for provider in providers:
        # Get profile info
        profile = getattr(provider, 'profile', None)

        # Get skills
        user_skills = []
        for user_skill in provider.skills.select_related('skill').all()[:5]:
            user_skills.append({
                'id': user_skill.skill.id,
                'name': user_skill.skill.name,
                'skill_name': user_skill.skill.name,
                'level': user_skill.level,
                'is_certified': user_skill.is_certified
            })

        # Build limited public profile
        provider_data = {
            'id': provider.id,
            'username': provider.username,
            'profile': {
                'profile_picture': profile.profile_picture.url if profile and profile.profile_picture else None,
                'provider_mode': profile.provider_mode if profile else 'offline',
                'hustle_score': float(profile.hustle_score) if profile else 0,
                'customer_rating': float(profile.customer_rating) if profile else 0,
                'city': profile.city if profile else '',
                'country': profile.country if profile else '',
            } if profile else {
                'profile_picture': None,
                'provider_mode': 'offline',
                'hustle_score': 0,
                'customer_rating': 0,
                'city': '',
                'country': '',
            },
            'skills': user_skills,
            'is_email_verified': provider.is_email_verified,
        }
        results.append(provider_data)

    return Response({
        'results': results,
        'total': total_count,
        'limit': limit,
        'offset': offset,
        'has_more': (offset + limit) < total_count
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_provider_profile(request, user_id):
    """
    PUBLIC endpoint - Get public profile of a service provider.
    Shows limited info: name, picture, rating, skills, online/offline status.
    """
    try:
        provider = User.objects.select_related('profile').prefetch_related(
            'skills__skill__category'
        ).get(
            id=user_id,
            user_type='service_provider',
            is_active=True
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'Provider not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    profile = getattr(provider, 'profile', None)

    # Get provider's skills
    user_skills = []
    for user_skill in provider.skills.select_related('skill__category').all():
        user_skills.append({
            'id': user_skill.skill.id,
            'name': user_skill.skill.name,
            'level': user_skill.level,
            'years_of_experience': float(user_skill.years_of_experience),
            'is_certified': user_skill.is_certified,
            'category': user_skill.skill.category.name if user_skill.skill.category else None
        })

    # Build limited public profile
    data = {
        'id': provider.id,
        'username': provider.username,
        'is_email_verified': provider.is_email_verified,
        'profile': {
            'profile_picture': profile.profile_picture.url if profile and profile.profile_picture else None,
            'bio': profile.bio if profile else '',
            'provider_mode': profile.provider_mode if profile else 'offline',
            'hustle_score': float(profile.hustle_score) if profile else 0,
            'customer_rating': float(profile.customer_rating) if profile else 0,
            'response_time': profile.response_time if profile else 0,
            'city': profile.city if profile else '',
            'country': profile.country if profile else '',
            'base_hourly_rate': float(profile.base_hourly_rate) if profile and profile.base_hourly_rate else 0,
        } if profile else None,
        'skills': user_skills,
        'stats': {
            'completed_projects': provider.proposals.filter(status='accepted').count(),
            'total_proposals': provider.proposals.count(),
            'member_since': provider.date_joined.strftime('%B %Y'),
        }
    }

    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_provider_mode(request):
    """
    Allows a service provider to update their online/offline mode.
    """
    if request.user.user_type != 'service_provider':
        return Response(
            {'error': 'Only service providers can update their mode'},
            status=status.HTTP_403_FORBIDDEN
        )

    mode = request.data.get('mode')
    if mode not in ['online', 'offline']:
        return Response(
            {'error': 'Invalid mode. Must be "online" or "offline"'},
            status=status.HTTP_400_BAD_REQUEST
        )

    profile, created = UserProfile.objects.get_or_create(user=request.user)
    profile.provider_mode = mode
    profile.save()

    return Response({
        'message': f'Mode updated to {mode}',
        'mode': mode,
        'effective_hourly_rate': str(profile.effective_hourly_rate)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_provider_stats(request):
    """
    PUBLIC endpoint - Get aggregate statistics about providers on the platform.
    """
    total_providers = User.objects.filter(user_type='service_provider', is_active=True).count()
    online_providers = User.objects.filter(
        user_type='service_provider',
        is_active=True,
        profile__provider_mode='online'
    ).count()
    offline_providers = total_providers - online_providers

    verified_providers = User.objects.filter(
        user_type='service_provider',
        is_active=True,
        is_email_verified=True
    ).count()

    return Response({
        'total_providers': total_providers,
        'online_providers': online_providers,
        'offline_providers': offline_providers,
        'verified_providers': verified_providers
    }, status=status.HTTP_200_OK)


def send_verification_email(email, code):
    subject = 'Verify Your CampusHustle Account'
    message = f'''
    Welcome to CampusHustle!

    Your verification code is: {code}

    This code will expire in 15 minutes.

    If you didn't request this verification, please ignore this email.

    Best regards,
    CampusHustle Team
    '''

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Error sending verification email: {e}")
