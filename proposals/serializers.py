from decimal import Decimal
from rest_framework import serializers
from .models import Proposal, ProposalAttachment, ProposalComparison
from users.serializers import UserSerializer
from projects.models import Project


class ProposalAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposalAttachment
        fields = '__all__'
        read_only_fields = ('uploaded_at',)


class ProjectMinimalSerializer(serializers.Serializer):
    """Minimal project serializer to avoid circular imports"""
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    budget_min = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    budget_max = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    budget_currency = serializers.CharField(read_only=True)
    deadline = serializers.DateTimeField(read_only=True)
    status = serializers.CharField(read_only=True)
    client = UserSerializer(read_only=True)


class ProposalSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    project = ProjectMinimalSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True)
    attachments = ProposalAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'freelancer', 'project', 'project_id',
            'cover_letter', 'proposed_price', 'proposed_timeline', 'currency',
            'status', 'milestones', 'terms_and_conditions',
            'created_at', 'updated_at', 'submitted_at', 'responded_at',
            'attachments'
        ]
        read_only_fields = (
            'freelancer', 'status', 'created_at', 'updated_at',
            'submitted_at', 'responded_at'
        )

    def validate_project_id(self, value):
        """Validate that the project exists and is published"""
        try:
            project = Project.objects.get(id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project does not exist.")

        if project.status != 'published':
            raise serializers.ValidationError("You can only submit proposals to published projects.")

        return value

    def validate_proposed_price(self, value):
        """Validate that proposed price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Proposed price must be greater than zero.")
        return value

    def validate_proposed_timeline(self, value):
        """Validate that proposed timeline is positive"""
        if value <= 0:
            raise serializers.ValidationError("Proposed timeline must be at least 1 day.")
        return value

    def validate(self, attrs):
        """Additional validation"""
        project_id = attrs.get('project_id')
        request = self.context.get('request')

        if project_id and request:
            project = Project.objects.get(id=project_id)

            # Check if user is trying to bid on their own project
            if project.client == request.user:
                raise serializers.ValidationError({
                    "project_id": "You cannot submit a proposal to your own project."
                })

            # Check if user already has a proposal for this project (only for create)
            if not self.instance:  # Only check on create, not update
                existing_proposal = Proposal.objects.filter(
                    freelancer=request.user,
                    project_id=project_id
                ).exists()

                if existing_proposal:
                    raise serializers.ValidationError({
                        "project_id": "You have already submitted a proposal for this project."
                    })

            # Check if proposed price is within budget range
            proposed_price = attrs.get('proposed_price')
            if proposed_price:
                if proposed_price < project.budget_min:
                    raise serializers.ValidationError({
                        "proposed_price": f"Proposed price is below the minimum budget (${project.budget_min})."
                    })
                if proposed_price > project.budget_max * Decimal('1.5'):  # Allow 50% above max
                    raise serializers.ValidationError({
                        "proposed_price": f"Proposed price is too far above the maximum budget (${project.budget_max})."
                    })

        return attrs

    def create(self, validated_data):
        """Create a new proposal"""
        project_id = validated_data.pop('project_id')
        validated_data['project'] = Project.objects.get(id=project_id)
        validated_data['freelancer'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update an existing proposal (only if still pending)"""
        # Remove project_id if present (can't change project)
        validated_data.pop('project_id', None)
        return super().update(instance, validated_data)


class ProposalListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing proposals"""
    freelancer_username = serializers.CharField(source='freelancer.username', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'freelancer_username', 'project_title',
            'proposed_price', 'proposed_timeline', 'currency',
            'status', 'created_at', 'submitted_at'
        ]


class ProposalComparisonSerializer(serializers.ModelSerializer):
    project = ProjectMinimalSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True, required=False)
    proposals = ProposalSerializer(many=True, read_only=True)
    proposal_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = ProposalComparison
        fields = [
            'id', 'project', 'project_id', 'proposals', 'proposal_ids',
            'created_by', 'notes', 'created_at'
        ]
        read_only_fields = ('created_by', 'created_at')

    def validate_proposal_ids(self, value):
        """Validate that at least 2 proposals are provided for comparison"""
        if len(value) < 2:
            raise serializers.ValidationError("At least 2 proposals are required for comparison.")

        # Verify all proposals exist
        proposals = Proposal.objects.filter(id__in=value)
        if proposals.count() != len(value):
            raise serializers.ValidationError("One or more proposals do not exist.")

        # Verify all proposals are for the same project
        project_ids = proposals.values_list('project_id', flat=True).distinct()
        if len(project_ids) > 1:
            raise serializers.ValidationError("All proposals must be for the same project.")

        return value

    def create(self, validated_data):
        proposal_ids = validated_data.pop('proposal_ids')
        validated_data.pop('project_id', None)

        # Get the project from the first proposal
        first_proposal = Proposal.objects.get(id=proposal_ids[0])
        validated_data['project'] = first_proposal.project
        validated_data['created_by'] = self.context['request'].user

        comparison = ProposalComparison.objects.create(**validated_data)
        comparison.proposals.set(proposal_ids)

        return comparison
