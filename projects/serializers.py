from rest_framework import serializers
from .models import Project, ProjectCategory, ProjectTemplate, ProjectAttachment, ProjectView
from users.serializers import UserSerializer
from skills.serializers import SkillSerializer

class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = '__all__'

class ProjectTemplateSerializer(serializers.ModelSerializer):
    category = ProjectCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=ProjectCategory.objects.all(),
        write_only=True,
        required=False,
        allow_null=True
    )
    required_skills = SkillSerializer(many=True, read_only=True)
    required_skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )

    class Meta:
        model = ProjectTemplate
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['category_id'] = instance.category.id if instance.category else None
        return representation

class ProjectAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectAttachment
        fields = '__all__'
        read_only_fields = ('uploaded_at',)

class ProjectSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    category = ProjectCategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    template = ProjectTemplateSerializer(read_only=True)
    template_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    required_skills = SkillSerializer(many=True, read_only=True)
    required_skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'client', 'title', 'description',
            'category', 'category_id',
            'template', 'template_id',
            'budget_min', 'budget_max', 'budget_currency',
            'deadline', 'priority',
            'required_skills', 'required_skill_ids',
            'location', 'is_remote',
            'status', 'is_featured',
            'views_count', 'proposals_count',
            'created_at', 'updated_at', 'published_at',
            'attachments'
        ]
        read_only_fields = ('client', 'views_count', 'proposals_count', 'created_at', 'updated_at', 'published_at')

    def validate_budget_min(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Minimum budget cannot be negative.")
        return value

    def validate_budget_max(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Maximum budget cannot be negative.")
        return value

    def validate(self, attrs):
        budget_min = attrs.get('budget_min')
        budget_max = attrs.get('budget_max')

        if budget_min is not None and budget_max is not None:
            if budget_min > budget_max:
                raise serializers.ValidationError({
                    "budget_max": "Maximum budget must be greater than or equal to minimum budget."
                })

        # Validate deadline is in the future for new projects
        deadline = attrs.get('deadline')
        if deadline:
            from django.utils import timezone
            if self.instance is None and deadline <= timezone.now():
                raise serializers.ValidationError({
                    "deadline": "Deadline must be in the future."
                })

        return attrs

    def create(self, validated_data):
        # Extract related field IDs
        required_skill_ids = validated_data.pop('required_skill_ids', [])
        category_id = validated_data.pop('category_id', None)
        template_id = validated_data.pop('template_id', None)

        # Set category if provided
        if category_id:
            try:
                category = ProjectCategory.objects.get(id=category_id)
                validated_data['category'] = category
            except ProjectCategory.DoesNotExist:
                raise serializers.ValidationError({
                    "category_id": f"Category with ID {category_id} does not exist."
                })

        # Set template if provided
        if template_id:
            try:
                template = ProjectTemplate.objects.get(id=template_id)
                validated_data['template'] = template
            except ProjectTemplate.DoesNotExist:
                raise serializers.ValidationError({
                    "template_id": f"Template with ID {template_id} does not exist."
                })

        # Create the project
        project = Project.objects.create(**validated_data)

        # Set required skills
        if required_skill_ids:
            from skills.models import Skill
            skills = Skill.objects.filter(id__in=required_skill_ids)
            project.required_skills.set(skills)

        return project

    def update(self, instance, validated_data):
        # Extract related field IDs
        required_skill_ids = validated_data.pop('required_skill_ids', None)
        category_id = validated_data.pop('category_id', None)
        template_id = validated_data.pop('template_id', None)

        # Update category if provided
        if category_id is not None:
            if category_id:
                try:
                    category = ProjectCategory.objects.get(id=category_id)
                    instance.category = category
                except ProjectCategory.DoesNotExist:
                    raise serializers.ValidationError({
                        "category_id": f"Category with ID {category_id} does not exist."
                    })
            else:
                instance.category = None

        # Update template if provided
        if template_id is not None:
            if template_id:
                try:
                    template = ProjectTemplate.objects.get(id=template_id)
                    instance.template = template
                except ProjectTemplate.DoesNotExist:
                    raise serializers.ValidationError({
                        "template_id": f"Template with ID {template_id} does not exist."
                    })
            else:
                instance.template = None

        # Update required skills if provided
        if required_skill_ids is not None:
            from skills.models import Skill
            skills = Skill.objects.filter(id__in=required_skill_ids)
            instance.required_skills.set(skills)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

class ProjectViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectView
        fields = '__all__'

class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing projects"""
    client_username = serializers.CharField(source='client.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    skills_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description',
            'client_username', 'category_name',
            'budget_min', 'budget_max', 'budget_currency',
            'deadline', 'priority', 'status',
            'is_remote', 'views_count', 'proposals_count',
            'skills_count', 'created_at'
        ]

    def get_skills_count(self, obj):
        return obj.required_skills.count()
