from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Skill, UserSkill, SkillCategory
from .serializers import SkillSerializer, UserSkillSerializer, SkillCategorySerializer


class SkillList(generics.ListAPIView):
    """
    List all skills.
    By default returns all skills (for project creation forms).
    Pass ?verified_only=true to get only verified skills.
    """
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Skill.objects.select_related('category').all()

        # Filter by verified only if requested
        verified_only = self.request.query_params.get('verified_only', '').lower()
        if verified_only in ['true', '1', 'yes']:
            queryset = queryset.filter(is_verified=True)

        # Filter by category if provided
        category_id = self.request.query_params.get('category')
        if category_id:
            try:
                queryset = queryset.filter(category_id=int(category_id))
            except ValueError:
                pass

        # Search by name
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by('category__name', 'name')


class SkillCategoryList(generics.ListAPIView):
    """List all active skill categories"""
    queryset = SkillCategory.objects.filter(is_active=True).order_by('name')
    serializer_class = SkillCategorySerializer
    permission_classes = [permissions.AllowAny]


class UserSkillList(generics.ListCreateAPIView):
    """
    List user's skills or add a new skill to user's profile.
    """
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserSkill.objects.filter(user=self.request.user).select_related('skill__category')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Check if user already has this skill
        skill_id = request.data.get('skill')
        if skill_id:
            existing = UserSkill.objects.filter(user=request.user, skill_id=skill_id).first()
            if existing:
                return Response(
                    {'error': 'You already have this skill in your profile.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().create(request, *args, **kwargs)


class UserSkillDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a user's skill.
    """
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserSkill.objects.filter(user=self.request.user).select_related('skill__category')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_skills_by_category(request):
    """
    Get skills grouped by category for display purposes.
    """
    categories = SkillCategory.objects.filter(is_active=True).prefetch_related('skills').order_by('name')

    result = []
    for category in categories:
        skills = category.skills.all().order_by('name')
        if skills.exists():
            result.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'skills': [
                    {
                        'id': skill.id,
                        'name': skill.name,
                        'description': skill.description,
                        'is_verified': skill.is_verified
                    }
                    for skill in skills
                ]
            })

    return Response(result)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_skills_summary(request):
    """
    Get a summary of the current user's skills.
    """
    user_skills = UserSkill.objects.filter(user=request.user).select_related('skill__category')

    total_skills = user_skills.count()
    certified_skills = user_skills.filter(is_certified=True).count()

    skills_by_level = {
        'beginner': user_skills.filter(level='beginner').count(),
        'intermediate': user_skills.filter(level='intermediate').count(),
        'advanced': user_skills.filter(level='advanced').count(),
        'expert': user_skills.filter(level='expert').count(),
    }

    recent_assessments = user_skills.filter(
        last_assessment_date__isnull=False
    ).order_by('-last_assessment_date')[:5]

    return Response({
        'total_skills': total_skills,
        'certified_skills': certified_skills,
        'skills_by_level': skills_by_level,
        'recent_assessments': [
            {
                'skill_name': us.skill.name,
                'score': float(us.assessment_score) if us.assessment_score else None,
                'date': us.last_assessment_date.isoformat() if us.last_assessment_date else None
            }
            for us in recent_assessments
        ]
    })
