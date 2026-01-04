from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Proposal, ProposalAttachment, ProposalComparison
from .serializers import ProposalSerializer, ProposalAttachmentSerializer, ProposalComparisonSerializer
from projects.models import Project


class ProposalList(generics.ListCreateAPIView):
    """
    List proposals or create a new proposal.
    - Providers see their submitted proposals
    - Requesters see proposals on their projects
    """
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'project']

    def get_queryset(self):
        user = self.request.user
        # Users can see proposals they sent or received (as project owner)
        queryset = Proposal.objects.filter(
            Q(freelancer=user) | Q(project__client=user)
        ).select_related(
            'freelancer', 'project', 'project__client', 'project__category'
        ).distinct().order_by('-created_at')

        # Filter by project if specified
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new proposal with comprehensive error handling"""
        print(f"DEBUG: Proposal creation request from user: {request.user}")
        print(f"DEBUG: Request data: {request.data}")

        # Ensure user is a service provider
        if request.user.user_type != 'service_provider':
            return Response(
                {'error': 'Only service providers can submit proposals.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get project_id from request
        project_id = request.data.get('project_id')
        if not project_id:
            return Response(
                {'error': 'Project ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate project exists and is published
        try:
            project = Project.objects.get(id=project_id)
            print(f"DEBUG: Found project: {project.title} (ID: {project.id})")
        except Project.DoesNotExist:
            return Response(
                {'error': f'Project with ID {project_id} does not exist.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if project.status != 'published':
            return Response(
                {'error': 'You can only submit proposals to published projects.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is trying to bid on their own project
        if project.client == request.user:
            return Response(
                {'error': 'You cannot submit a proposal to your own project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already has a proposal for this project
        existing_proposal = Proposal.objects.filter(
            freelancer=request.user,
            project=project
        ).first()

        if existing_proposal:
            return Response(
                {'error': 'You have already submitted a proposal for this project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create serializer with context
        serializer = self.get_serializer(data=request.data, context={'request': request})

        if not serializer.is_valid():
            print(f"DEBUG: Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Save the proposal
            proposal = serializer.save()
            print(f"DEBUG: Proposal created successfully: ID={proposal.id}")

            # Auto-submit the proposal (mark it as submitted)
            proposal.submitted_at = timezone.now()
            proposal.save()

            # Update project proposals count
            project.proposals_count += 1
            project.save(update_fields=['proposals_count'])

            print(f"DEBUG: Proposal submitted and project count updated")

            # Return the created proposal
            response_serializer = self.get_serializer(proposal)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"DEBUG: Error creating proposal: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create proposal: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProposalDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a proposal.
    """
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Proposal.objects.filter(
            Q(freelancer=user) | Q(project__client=user)
        ).select_related('freelancer', 'project', 'project__client')

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Only allow updating if status is pending
        if instance.status != 'pending':
            return Response(
                {'error': 'Cannot update proposal that is not pending.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only the freelancer can update their proposal
        if instance.freelancer != request.user:
            return Response(
                {'error': 'You can only update your own proposals.'},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Only allow deleting if status is pending
        if instance.status != 'pending':
            return Response(
                {'error': 'Cannot delete proposal that is not pending.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only the freelancer can delete their proposal
        if instance.freelancer != request.user:
            return Response(
                {'error': 'You can only delete your own proposals.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Decrease project proposals count
        if instance.project:
            instance.project.proposals_count = max(0, instance.project.proposals_count - 1)
            instance.project.save(update_fields=['proposals_count'])

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_proposal(request, pk):
    """Mark a proposal as submitted (if not already)"""
    try:
        proposal = Proposal.objects.get(pk=pk, freelancer=request.user)

        if proposal.submitted_at:
            return Response(
                {'message': 'Proposal has already been submitted.'},
                status=status.HTTP_200_OK
            )

        if proposal.status != 'pending':
            return Response(
                {'error': f'Cannot submit proposal with status: {proposal.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark as submitted
        proposal.submitted_at = timezone.now()
        proposal.save()

        # Update project proposals count if not already counted
        proposal.project.proposals_count += 1
        proposal.project.save(update_fields=['proposals_count'])

        return Response({
            'message': 'Proposal submitted successfully',
            'id': proposal.id,
            'submitted_at': proposal.submitted_at.isoformat()
        }, status=status.HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response(
            {'error': 'Proposal not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_proposal(request, pk):
    """Accept a proposal (project owner only)"""
    try:
        proposal = Proposal.objects.select_related('project').get(pk=pk)

        # Check if current user is the project owner
        if proposal.project.client != request.user:
            return Response(
                {'error': 'Only the project owner can accept proposals.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if proposal.status != 'pending':
            return Response(
                {'error': f'Cannot accept proposal with status: {proposal.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Accept the proposal
        proposal.status = 'accepted'
        proposal.responded_at = timezone.now()
        proposal.save()

        # Update project status to in_progress
        proposal.project.status = 'in_progress'
        proposal.project.save(update_fields=['status'])

        # Reject other pending proposals for the same project
        rejected_count = Proposal.objects.filter(
            project=proposal.project,
            status='pending'
        ).exclude(pk=pk).update(status='rejected', responded_at=timezone.now())

        return Response({
            'message': 'Proposal accepted successfully',
            'id': proposal.id,
            'rejected_others': rejected_count
        }, status=status.HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response(
            {'error': 'Proposal not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_proposal(request, pk):
    """Reject a proposal (project owner only)"""
    try:
        proposal = Proposal.objects.select_related('project').get(pk=pk)

        # Check if current user is the project owner
        if proposal.project.client != request.user:
            return Response(
                {'error': 'Only the project owner can reject proposals.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if proposal.status != 'pending':
            return Response(
                {'error': f'Cannot reject proposal with status: {proposal.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reject the proposal
        proposal.status = 'rejected'
        proposal.responded_at = timezone.now()
        proposal.save()

        return Response({
            'message': 'Proposal rejected',
            'id': proposal.id
        }, status=status.HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response(
            {'error': 'Proposal not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def withdraw_proposal(request, pk):
    """Withdraw a proposal (freelancer only)"""
    try:
        proposal = Proposal.objects.get(pk=pk, freelancer=request.user)

        if proposal.status not in ['pending']:
            return Response(
                {'error': f'Cannot withdraw proposal with status: {proposal.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Withdraw the proposal
        proposal.status = 'withdrawn'
        proposal.save()

        # Update project proposals count
        if proposal.project:
            proposal.project.proposals_count = max(0, proposal.project.proposals_count - 1)
            proposal.project.save(update_fields=['proposals_count'])

        return Response({
            'message': 'Proposal withdrawn successfully',
            'id': proposal.id
        }, status=status.HTTP_200_OK)

    except Proposal.DoesNotExist:
        return Response(
            {'error': 'Proposal not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_proposals(request):
    """Get all proposals submitted by the current user"""
    status_filter = request.query_params.get('status')

    proposals = Proposal.objects.filter(
        freelancer=request.user
    ).select_related(
        'project', 'project__client', 'project__category'
    ).order_by('-created_at')

    if status_filter:
        proposals = proposals.filter(status=status_filter)

    serializer = ProposalSerializer(proposals, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_proposals(request, project_id):
    """Get all proposals for a specific project (project owner only)"""
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response(
            {'error': 'Project not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if current user is the project owner
    if project.client != request.user:
        return Response(
            {'error': 'Only the project owner can view proposals.'},
            status=status.HTTP_403_FORBIDDEN
        )

    proposals = Proposal.objects.filter(
        project=project
    ).select_related('freelancer').order_by('-created_at')

    serializer = ProposalSerializer(proposals, many=True, context={'request': request})
    return Response({
        'project_id': project.id,
        'project_title': project.title,
        'proposals': serializer.data,
        'total': proposals.count()
    })


class ProposalComparisonList(generics.ListCreateAPIView):
    serializer_class = ProposalComparisonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProposalComparison.objects.filter(
            created_by=self.request.user
        ).select_related('project').prefetch_related('proposals')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProposalComparisonDetail(generics.RetrieveDestroyAPIView):
    serializer_class = ProposalComparisonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProposalComparison.objects.filter(created_by=self.request.user)
