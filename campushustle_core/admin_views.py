# campushustle_core/admin_views.py
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from users.models import User
from projects.models import Project, ProjectCategory, ProjectTemplate
from proposals.models import Proposal
from payments.models import Transaction, Escrow
from skills.models import (
    Skill, SkillCategory, UserSkill, SkillAssessment,
    AssessmentQuestion, QuestionOption
)
from portfolio.models import PortfolioItem
from skills.serializers import (
    SkillCategorySerializer, SkillSerializer, SkillAssessmentSerializer,
    SkillDropdownSerializer, AssessmentQuestionSerializer,
    AssessmentQuestionCreateSerializer, SkillAssessmentCreateSerializer,
    SkillAssessmentListSerializer
)
from projects.serializers import ProjectCategorySerializer, ProjectTemplateSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_dashboard_stats(request):
    """Get platform statistics for admin dashboard"""

    # User Statistics
    total_users = User.objects.count()
    service_providers = User.objects.filter(user_type='service_provider').count()
    service_requesters = User.objects.filter(user_type='service_requester').count()
    new_users_today = User.objects.filter(created_at__date=timezone.now().date()).count()
    new_users_this_week = User.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()

    # Project Statistics
    total_projects = Project.objects.count()
    published_projects = Project.objects.filter(status='published').count()
    in_progress_projects = Project.objects.filter(status='in_progress').count()
    completed_projects = Project.objects.filter(status='completed').count()
    new_projects_today = Project.objects.filter(created_at__date=timezone.now().date()).count()

    # Proposal Statistics
    total_proposals = Proposal.objects.count()
    accepted_proposals = Proposal.objects.filter(status='accepted').count()
    pending_proposals = Proposal.objects.filter(status='pending').count()

    # Financial Statistics
    total_transactions = Transaction.objects.filter(status='completed').count()
    total_revenue = Transaction.objects.filter(
        status='completed',
        transaction_type__in=['commission', 'escrow_hold']
    ).aggregate(total=Sum('amount'))['total'] or 0

    total_payments = Transaction.objects.filter(
        status='completed',
        transaction_type='escrow_release'
    ).aggregate(total=Sum('amount'))['total'] or 0

    active_escrows = Escrow.objects.filter(status__in=['funded', 'in_progress']).count()
    total_escrow_amount = Escrow.objects.filter(
        status__in=['funded', 'in_progress']
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Skill Statistics
    total_skills = Skill.objects.count()
    total_user_skills = UserSkill.objects.count()
    certified_users = UserSkill.objects.filter(is_certified=True).count()
    total_assessments = SkillAssessment.objects.filter(is_active=True).count()

    # Portfolio Statistics
    total_portfolio_items = PortfolioItem.objects.count()
    public_portfolio_items = PortfolioItem.objects.filter(is_public=True).count()

    return Response({
        'users': {
            'total': total_users,
            'service_providers': service_providers,
            'service_requesters': service_requesters,
            'new_today': new_users_today,
            'new_this_week': new_users_this_week
        },
        'projects': {
            'total': total_projects,
            'published': published_projects,
            'in_progress': in_progress_projects,
            'completed': completed_projects,
            'new_today': new_projects_today
        },
        'proposals': {
            'total': total_proposals,
            'accepted': accepted_proposals,
            'pending': pending_proposals
        },
        'financial': {
            'total_revenue': float(total_revenue),
            'total_payments': float(total_payments),
            'active_escrows': active_escrows,
            'total_escrow_amount': float(total_escrow_amount or 0),
            'total_transactions': total_transactions
        },
        'skills': {
            'total_skills': total_skills,
            'total_user_skills': total_user_skills,
            'certified_users': certified_users,
            'total_assessments': total_assessments
        },
        'portfolio': {
            'total_items': total_portfolio_items,
            'public_items': public_portfolio_items
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_category_stats(request):
    """Get statistics by category"""

    category_stats = ProjectCategory.objects.annotate(
        project_count=Count('projects')
    ).values('id', 'name', 'project_count')

    return Response(list(category_stats))


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def get_skills_dropdown(request):
    """Get all skills for dropdown selection in admin forms"""
    skills = Skill.objects.select_related('category').all().order_by('category__name', 'name')
    serializer = SkillDropdownSerializer(skills, many=True)
    return Response(serializer.data)


# =====================================================
# Skill Category Management
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def manage_skill_categories(request):
    """Allow admins to list or create skill categories for providers to choose from."""
    if request.method == 'GET':
        serializer = SkillCategorySerializer(
            SkillCategory.objects.all().order_by('name'),
            many=True
        )
        return Response(serializer.data)

    serializer = SkillCategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def skill_category_detail(request, pk):
    try:
        category = SkillCategory.objects.get(pk=pk)
    except SkillCategory.DoesNotExist:
        return Response({'detail': 'Skill category not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = SkillCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    category.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# Skills Management
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def manage_skills(request):
    """Allow admins to list or create skills"""
    if request.method == 'GET':
        skills = Skill.objects.select_related('category').all().order_by('category__name', 'name')
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        print(f"DEBUG: Received data for skill creation: {request.data}")

        data = request.data.copy()

        # Convert string booleans to actual booleans
        if 'is_verified' in data:
            if isinstance(data['is_verified'], str):
                data['is_verified'] = data['is_verified'].lower() in ['true', '1', 'yes']

        # Make sure category_id is present
        if 'category_id' not in data:
            return Response(
                {'category_id': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert category_id to integer
        try:
            if isinstance(data['category_id'], str):
                data['category_id'] = int(data['category_id'])
        except ValueError:
            return Response(
                {'category_id': ['Must be a valid integer.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if category exists
        try:
            category = SkillCategory.objects.get(pk=data['category_id'])
        except SkillCategory.DoesNotExist:
            return Response(
                {'category_id': [f'Skill category with ID {data["category_id"]} does not exist.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SkillSerializer(data=data)
        if serializer.is_valid():
            skill = serializer.save()
            print(f"DEBUG: Created skill: {skill.name} (ID: {skill.id})")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def skill_detail(request, pk):
    """Allow admins to get, update or delete a specific skill"""
    try:
        skill = Skill.objects.get(pk=pk)
    except Skill.DoesNotExist:
        return Response({'detail': 'Skill not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SkillSerializer(skill)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy()

        if 'category_id' in data:
            try:
                category_id = int(data['category_id']) if isinstance(data['category_id'], str) else data['category_id']
                SkillCategory.objects.get(pk=category_id)
            except (ValueError, SkillCategory.DoesNotExist):
                return Response(
                    {'category_id': ['Invalid category ID.']},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = SkillSerializer(skill, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        skill.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# Skill Assessment Management
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def manage_skill_assessments(request):
    """Allow admins to list or create skill assessments with questions"""
    if request.method == 'GET':
        assessments = SkillAssessment.objects.select_related('skill').prefetch_related(
            'questions__options'
        ).all().order_by('-created_at')
        serializer = SkillAssessmentListSerializer(assessments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        print(f"DEBUG: Creating skill assessment with data: {request.data}")

        data = request.data.copy()

        # Validate skill_id
        skill_id = data.get('skill_id')
        if not skill_id:
            return Response(
                {'skill_id': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            skill = Skill.objects.get(pk=int(skill_id))
        except (ValueError, Skill.DoesNotExist):
            return Response(
                {'skill_id': ['Invalid skill ID.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if questions are provided
        questions_data = data.get('questions', [])

        # Create assessment
        try:
            assessment = SkillAssessment.objects.create(
                skill=skill,
                title=data.get('title', f'{skill.name} Assessment'),
                description=data.get('description', ''),
                passing_score=float(data.get('passing_score', 70)),
                total_questions=int(data.get('total_questions', len(questions_data) or 10)),
                time_limit=int(data.get('time_limit', 30)),
                is_active=data.get('is_active', True)
            )

            # Create questions if provided
            for idx, q_data in enumerate(questions_data):
                options_data = q_data.get('options', [])

                question = AssessmentQuestion.objects.create(
                    assessment=assessment,
                    question_text=q_data.get('question_text', ''),
                    question_type=q_data.get('question_type', 'single'),
                    points=int(q_data.get('points', 1)),
                    explanation=q_data.get('explanation', ''),
                    order=q_data.get('order', idx + 1),
                    is_active=q_data.get('is_active', True)
                )

                # Create options
                for opt_idx, opt_data in enumerate(options_data):
                    QuestionOption.objects.create(
                        question=question,
                        option_text=opt_data.get('option_text', ''),
                        is_correct=opt_data.get('is_correct', False),
                        order=opt_data.get('order', opt_idx)
                    )

            # Return the created assessment with questions
            serializer = SkillAssessmentSerializer(assessment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"DEBUG: Error creating assessment: {str(e)}")
            return Response(
                {'error': f'Failed to create assessment: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def skill_assessment_detail(request, pk):
    """Allow admins to get, update or delete a specific skill assessment"""
    try:
        assessment = SkillAssessment.objects.prefetch_related('questions__options').get(pk=pk)
    except SkillAssessment.DoesNotExist:
        return Response({'detail': 'Skill assessment not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SkillAssessmentSerializer(assessment)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy()

        # Update basic fields
        if 'title' in data:
            assessment.title = data['title']
        if 'description' in data:
            assessment.description = data['description']
        if 'passing_score' in data:
            assessment.passing_score = float(data['passing_score'])
        if 'total_questions' in data:
            assessment.total_questions = int(data['total_questions'])
        if 'time_limit' in data:
            assessment.time_limit = int(data['time_limit'])
        if 'is_active' in data:
            assessment.is_active = data['is_active'] in [True, 'true', '1', 'True']

        assessment.save()

        serializer = SkillAssessmentSerializer(assessment)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        assessment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# Assessment Question Management
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def manage_assessment_questions(request, assessment_id):
    """Manage questions for a specific assessment"""
    try:
        assessment = SkillAssessment.objects.get(pk=assessment_id)
    except SkillAssessment.DoesNotExist:
        return Response({'detail': 'Assessment not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        questions = assessment.questions.prefetch_related('options').all().order_by('order')
        serializer = AssessmentQuestionSerializer(questions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        options_data = data.pop('options', [])

        # Validate options
        if len(options_data) < 2:
            return Response(
                {'options': ['At least 2 options are required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        has_correct = any(opt.get('is_correct', False) for opt in options_data)
        if not has_correct:
            return Response(
                {'options': ['At least one option must be marked as correct.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get the next order number
            max_order = assessment.questions.aggregate(max_order=Count('id'))['max_order'] or 0

            question = AssessmentQuestion.objects.create(
                assessment=assessment,
                question_text=data.get('question_text', ''),
                question_type=data.get('question_type', 'single'),
                points=int(data.get('points', 1)),
                explanation=data.get('explanation', ''),
                order=data.get('order', max_order + 1),
                is_active=data.get('is_active', True)
            )

            # Create options
            for idx, opt_data in enumerate(options_data):
                QuestionOption.objects.create(
                    question=question,
                    option_text=opt_data.get('option_text', ''),
                    is_correct=opt_data.get('is_correct', False),
                    order=opt_data.get('order', idx)
                )

            serializer = AssessmentQuestionSerializer(question)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Failed to create question: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def assessment_question_detail(request, pk):
    """Get, update or delete a specific question"""
    try:
        question = AssessmentQuestion.objects.prefetch_related('options').get(pk=pk)
    except AssessmentQuestion.DoesNotExist:
        return Response({'detail': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = AssessmentQuestionSerializer(question)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy()
        options_data = data.pop('options', None)

        # Update question fields
        if 'question_text' in data:
            question.question_text = data['question_text']
        if 'question_type' in data:
            question.question_type = data['question_type']
        if 'points' in data:
            question.points = int(data['points'])
        if 'explanation' in data:
            question.explanation = data['explanation']
        if 'order' in data:
            question.order = int(data['order'])
        if 'is_active' in data:
            question.is_active = data['is_active'] in [True, 'true', '1', 'True']

        question.save()

        # Update options if provided
        if options_data is not None:
            # Delete existing options and recreate
            question.options.all().delete()

            for idx, opt_data in enumerate(options_data):
                QuestionOption.objects.create(
                    question=question,
                    option_text=opt_data.get('option_text', ''),
                    is_correct=opt_data.get('is_correct', False),
                    order=opt_data.get('order', idx)
                )

        serializer = AssessmentQuestionSerializer(question)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# Project Category Management
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def manage_project_categories(request):
    """Allow admins to create the categories shown when requesters post projects."""
    if request.method == 'GET':
        categories = ProjectCategory.objects.all().order_by('name')
        serializer = ProjectCategorySerializer(categories, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        print(f"DEBUG: Creating project category with data: {request.data}")

        data = request.data.copy()

        # Ensure is_active defaults to True
        if 'is_active' not in data:
            data['is_active'] = True

        serializer = ProjectCategorySerializer(data=data)
        if serializer.is_valid():
            category = serializer.save()
            print(f"DEBUG: Created project category: {category.name} (ID: {category.id})")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        print(f"DEBUG: Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def project_category_detail(request, pk):
    try:
        category = ProjectCategory.objects.get(pk=pk)
    except ProjectCategory.DoesNotExist:
        return Response({'detail': 'Project category not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProjectCategorySerializer(category)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProjectCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# Project Template Management
# =====================================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAdminUser])
def manage_project_templates(request):
    """Allow admins to list or create project templates"""
    if request.method == 'GET':
        templates = ProjectTemplate.objects.select_related('category').prefetch_related(
            'required_skills'
        ).all().order_by('category__name', 'title')
        serializer = ProjectTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        print(f"DEBUG: Creating project template with data: {request.data}")

        data = request.data.copy()

        # Validate category_id
        category_id = data.get('category_id')
        if not category_id:
            return Response(
                {'category_id': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            category = ProjectCategory.objects.get(pk=int(category_id))
        except (ValueError, ProjectCategory.DoesNotExist):
            return Response(
                {'category_id': ['Invalid category ID.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract required_skill_ids if provided
        required_skill_ids = data.pop('required_skill_ids', [])
        if isinstance(required_skill_ids, str):
            required_skill_ids = [int(x) for x in required_skill_ids.split(',') if x.strip()]

        # Ensure is_active defaults to True
        if 'is_active' not in data:
            data['is_active'] = True

        try:
            # Create template
            template = ProjectTemplate.objects.create(
                category=category,
                title=data.get('title', 'Untitled Template'),
                description=data.get('description', ''),
                default_budget_range=data.get('default_budget_range', ''),
                estimated_duration=data.get('estimated_duration', ''),
                template_fields=data.get('template_fields', {}),
                is_active=data.get('is_active', True)
            )

            # Set required skills if provided
            if required_skill_ids:
                skills = Skill.objects.filter(id__in=required_skill_ids)
                template.required_skills.set(skills)

            serializer = ProjectTemplateSerializer(template)
            print(f"DEBUG: Created template: {template.title} (ID: {template.id})")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"DEBUG: Error creating template: {str(e)}")
            return Response(
                {'error': f'Failed to create template: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def project_template_detail(request, pk):
    """Allow admins to get, update or delete a specific project template"""
    try:
        template = ProjectTemplate.objects.select_related('category').prefetch_related(
            'required_skills'
        ).get(pk=pk)
    except ProjectTemplate.DoesNotExist:
        return Response({'detail': 'Project template not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProjectTemplateSerializer(template)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy()

        # Update category if provided
        if 'category_id' in data:
            try:
                category = ProjectCategory.objects.get(pk=int(data['category_id']))
                template.category = category
            except (ValueError, ProjectCategory.DoesNotExist):
                return Response(
                    {'category_id': ['Invalid category ID.']},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Update other fields
        if 'title' in data:
            template.title = data['title']
        if 'description' in data:
            template.description = data['description']
        if 'default_budget_range' in data:
            template.default_budget_range = data['default_budget_range']
        if 'estimated_duration' in data:
            template.estimated_duration = data['estimated_duration']
        if 'template_fields' in data:
            template.template_fields = data['template_fields']
        if 'is_active' in data:
            template.is_active = data['is_active'] in [True, 'true', '1', 'True']

        template.save()

        # Update required skills if provided
        if 'required_skill_ids' in data:
            required_skill_ids = data['required_skill_ids']
            if isinstance(required_skill_ids, str):
                required_skill_ids = [int(x) for x in required_skill_ids.split(',') if x.strip()]
            skills = Skill.objects.filter(id__in=required_skill_ids)
            template.required_skills.set(skills)

        serializer = ProjectTemplateSerializer(template)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
