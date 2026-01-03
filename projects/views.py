from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Project, ProjectCategory, ProjectTemplate, ProjectAttachment, ProjectView
from .serializers import (
    ProjectSerializer, ProjectCategorySerializer,
    ProjectTemplateSerializer, ProjectAttachmentSerializer, ProjectViewSerializer
)


class ProjectCategoryList(generics.ListCreateAPIView):
    """List all project categories or create a new one"""
    queryset = ProjectCategory.objects.filter(is_active=True).order_by('name')
    serializer_class = ProjectCategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProjectTemplateList(generics.ListAPIView):
    """List all active project templates"""
    queryset = ProjectTemplate.objects.filter(is_active=True).select_related('category').prefetch_related('required_skills')
    serializer_class = ProjectTemplateSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title', 'description']
    filterset_fields = ['category']


class ProjectTemplateDetail(generics.RetrieveAPIView):
    """Retrieve a single project template"""
    queryset = ProjectTemplate.objects.filter(is_active=True).select_related('category').prefetch_related('required_skills')
    serializer_class = ProjectTemplateSerializer
    permission_classes = [permissions.AllowAny]


class ProjectList(generics.ListCreateAPIView):
    """
    List projects or create a new project.
    - GET: Returns published projects (+ own projects if authenticated)
    - POST: Creates a new project (requires authentication)
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['title', 'description']
    filterset_fields = ['status', 'category', 'is_remote', 'priority']
    ordering_fields = ['created_at', 'deadline', 'budget_min', 'views_count']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Project.objects.select_related(
            'client', 'category', 'template'
        ).prefetch_related('required_skills', 'attachments')

        # Filter by budget range
        budget_min = self.request.query_params.get('budget_min', None)
        budget_max = self.request.query_params.get('budget_max', None)
        if budget_min:
            try:
                queryset = queryset.filter(budget_max__gte=float(budget_min))
            except ValueError:
                pass
        if budget_max:
            try:
                queryset = queryset.filter(budget_min__lte=float(budget_max))
            except ValueError:
                pass

        # Filter by skills
        skill_ids = self.request.query_params.get('skills', None)
        if skill_ids:
            try:
                skill_list = [int(s) for s in skill_ids.split(',') if s.strip()]
                if skill_list:
                    queryset = queryset.filter(required_skills__id__in=skill_list).distinct()
            except ValueError:
                pass

        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(Q(location__icontains=location) | Q(is_remote=True))

        # For authenticated users, show their own projects regardless of status
        if self.request.user.is_authenticated:
            user_projects = queryset.filter(client=self.request.user)
            public_projects = queryset.filter(status='published')
            return (user_projects | public_projects).distinct()

        return queryset.filter(status='published')

    def create(self, request, *args, **kwargs):
        """Create a new project with better error handling"""
        print(f"DEBUG: Received project creation request")
        print(f"DEBUG: Request data: {request.data}")
        print(f"DEBUG: User: {request.user}")

        # Ensure user is authenticated
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to create a project.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Create serializer with request context
        serializer = self.get_serializer(data=request.data, context={'request': request})

        if not serializer.is_valid():
            print(f"DEBUG: Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Save with the current user as client and draft status
            project = serializer.save(client=request.user, status='draft')
            print(f"DEBUG: Project created successfully: ID={project.id}, Title={project.title}")

            # Return the created project
            response_serializer = self.get_serializer(project)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"DEBUG: Error creating project: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create project: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a project.
    - Only project owner can update/delete
    - Anyone can view published projects
    - Providers with accepted proposals can view in_progress projects
    """
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        from proposals.models import Proposal

        queryset = Project.objects.select_related(
            'client', 'category', 'template'
        ).prefetch_related('required_skills', 'attachments')

        if self.request.user.is_authenticated:
            # Get project IDs where user has an accepted proposal
            accepted_project_ids = Proposal.objects.filter(
                freelancer=self.request.user,
                status='accepted'
            ).values_list('project_id', flat=True)

            # Users can see:
            # 1. Their own projects (as client)
            # 2. Published projects
            # 3. Projects where they have an accepted proposal (in_progress)
            return queryset.filter(
                Q(client=self.request.user) |
                Q(status='published') |
                Q(id__in=accepted_project_ids)
            ).distinct()
        return queryset.filter(status='published')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        # Track view (avoid duplicate tracking for rapid requests)
        try:
            viewer_ip = self.get_client_ip(request)

            # Check if this IP/user viewed recently (within 1 hour)
            one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
            recent_view_exists = ProjectView.objects.filter(
                project=instance,
                viewer_ip=viewer_ip,
                viewed_at__gte=one_hour_ago
            ).exists()

            if not recent_view_exists:
                ProjectView.objects.create(
                    project=instance,
                    viewer=request.user if request.user.is_authenticated else None,
                    viewer_ip=viewer_ip
                )
                # Update view count
                instance.views_count += 1
                instance.save(update_fields=['views_count'])
        except Exception as e:
            print(f"DEBUG: Error tracking view: {e}")
            # Don't fail the request if view tracking fails

        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Only owner can update
        if instance.client != request.user:
            return Response(
                {'error': 'You do not have permission to update this project.'},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Only owner can delete
        if instance.client != request.user:
            return Response(
                {'error': 'You do not have permission to delete this project.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Don't allow deleting projects that are in progress
        if instance.status == 'in_progress':
            return Response(
                {'error': 'Cannot delete a project that is in progress.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def publish_project(request, pk):
    """Publish a draft project"""
    try:
        project = Project.objects.get(pk=pk, client=request.user)

        if project.status == 'draft':
            # Validate project has required fields before publishing
            errors = []
            if not project.title:
                errors.append('Title is required')
            if not project.description:
                errors.append('Description is required')
            if not project.budget_min or not project.budget_max:
                errors.append('Budget range is required')
            if not project.deadline:
                errors.append('Deadline is required')
            if project.deadline and project.deadline <= timezone.now():
                errors.append('Deadline must be in the future')

            if errors:
                return Response(
                    {'errors': errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            project.status = 'published'
            project.published_at = timezone.now()
            project.save()

            return Response({
                'message': 'Project published successfully',
                'id': project.id,
                'status': project.status
            }, status=status.HTTP_200_OK)

        return Response(
            {'error': f'Project is not in draft status (current status: {project.status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Project.DoesNotExist:
        return Response(
            {'error': 'Project not found or you do not have permission to publish it'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unpublish_project(request, pk):
    """Unpublish a project (change back to draft)"""
    try:
        project = Project.objects.get(pk=pk, client=request.user)

        if project.status == 'published':
            # Check if there are any accepted proposals
            if hasattr(project, 'proposals') and project.proposals.filter(status='accepted').exists():
                return Response(
                    {'error': 'Cannot unpublish a project with accepted proposals'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            project.status = 'draft'
            project.save()

            return Response({
                'message': 'Project unpublished successfully',
                'id': project.id,
                'status': project.status
            }, status=status.HTTP_200_OK)

        return Response(
            {'error': f'Project is not in published status (current status: {project.status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Project.DoesNotExist:
        return Response(
            {'error': 'Project not found or you do not have permission'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_projects(request):
    """Get all projects for the current user"""
    status_filter = request.query_params.get('status', None)

    queryset = Project.objects.filter(client=request.user).select_related(
        'category', 'template'
    ).prefetch_related('required_skills').order_by('-created_at')

    if status_filter:
        queryset = queryset.filter(status=status_filter)

    serializer = ProjectSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def project_stats(request):
    """Get general project statistics"""
    total_published = Project.objects.filter(status='published').count()
    total_completed = Project.objects.filter(status='completed').count()
    total_in_progress = Project.objects.filter(status='in_progress').count()

    # Get category distribution
    categories = ProjectCategory.objects.filter(is_active=True).values('id', 'name')
    category_stats = []
    for cat in categories:
        count = Project.objects.filter(category_id=cat['id'], status='published').count()
        category_stats.append({
            'id': cat['id'],
            'name': cat['name'],
            'count': count
        })

    return Response({
        'total_published': total_published,
        'total_completed': total_completed,
        'total_in_progress': total_in_progress,
        'categories': category_stats
    })
