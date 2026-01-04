# skills/serializers.py
from rest_framework import serializers
from .models import (
    Skill, UserSkill, SkillCategory, SkillAssessment,
    AssessmentQuestion, QuestionOption, AssessmentAttempt, AttemptAnswer
)


class SkillCategorySerializer(serializers.ModelSerializer):
    skills_count = serializers.SerializerMethodField()

    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'skills_count']
        read_only_fields = ['created_at', 'skills_count']

    def get_skills_count(self, obj):
        return obj.skills.count()


class SkillSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=SkillCategory.objects.all(),
        write_only=True,
        required=True
    )

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category_id', 'category_name', 'description', 'is_verified', 'created_at']
        read_only_fields = ['category_name', 'created_at']

    def to_representation(self, instance):
        """Custom representation to include category_id in response"""
        representation = super().to_representation(instance)
        representation['category_id'] = instance.category.id if instance.category else None
        return representation


class SkillDropdownSerializer(serializers.ModelSerializer):
    """Simplified serializer for dropdown selection"""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category_name']


class UserSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    skill_category = serializers.CharField(source='skill.category.name', read_only=True)

    class Meta:
        model = UserSkill
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class SimpleSkillSerializer(serializers.ModelSerializer):
    """Very simple serializer for basic skill info"""
    class Meta:
        model = Skill
        fields = ['id', 'name']


# =====================================================
# Assessment Serializers
# =====================================================

class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer for answer options"""

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct', 'order']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Hide is_correct from non-admin users during test-taking
        request = self.context.get('request')
        hide_answers = self.context.get('hide_answers', False)

        if hide_answers:
            representation.pop('is_correct', None)

        return representation


class QuestionOptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating answer options (admin)"""

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct', 'order']


class AssessmentQuestionSerializer(serializers.ModelSerializer):
    """Serializer for assessment questions"""
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = AssessmentQuestion
        fields = [
            'id', 'question_text', 'question_type', 'points',
            'explanation', 'order', 'is_active', 'options'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        hide_answers = self.context.get('hide_answers', False)

        # Hide explanation during test-taking
        if hide_answers:
            representation.pop('explanation', None)

        # Pass hide_answers context to options
        options_serializer = QuestionOptionSerializer(
            instance.options.all(),
            many=True,
            context={'hide_answers': hide_answers, 'request': self.context.get('request')}
        )
        representation['options'] = options_serializer.data

        return representation


class AssessmentQuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating assessment questions with options (admin)"""
    options = QuestionOptionCreateSerializer(many=True, required=True)

    class Meta:
        model = AssessmentQuestion
        fields = [
            'id', 'assessment', 'question_text', 'question_type',
            'points', 'explanation', 'order', 'is_active', 'options'
        ]

    def validate_options(self, value):
        if not value or len(value) < 2:
            raise serializers.ValidationError("At least 2 options are required.")

        has_correct = any(opt.get('is_correct', False) for opt in value)
        if not has_correct:
            raise serializers.ValidationError("At least one option must be marked as correct.")

        return value

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = AssessmentQuestion.objects.create(**validated_data)

        for idx, option_data in enumerate(options_data):
            option_data['order'] = option_data.get('order', idx)
            QuestionOption.objects.create(question=question, **option_data)

        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)

        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update options if provided
        if options_data is not None:
            # Delete existing options and recreate
            instance.options.all().delete()
            for idx, option_data in enumerate(options_data):
                option_data['order'] = option_data.get('order', idx)
                QuestionOption.objects.create(question=instance, **option_data)

        return instance


class SkillAssessmentSerializer(serializers.ModelSerializer):
    """Serializer for skill assessments"""
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(
        source='skill',
        queryset=Skill.objects.all(),
        write_only=True,
        required=True
    )
    question_count = serializers.SerializerMethodField()
    questions = AssessmentQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = SkillAssessment
        fields = [
            'id', 'title', 'description', 'skill_id', 'skill_name',
            'passing_score', 'total_questions', 'time_limit',
            'is_active', 'created_at', 'question_count', 'questions'
        ]
        read_only_fields = ['skill_name', 'created_at', 'question_count']

    def get_question_count(self, obj):
        return obj.questions.filter(is_active=True).count()

    def to_representation(self, instance):
        """Custom representation to include skill_id in response"""
        representation = super().to_representation(instance)
        representation['skill_id'] = instance.skill.id if instance.skill else None

        # Pass hide_answers context to questions
        hide_answers = self.context.get('hide_answers', False)
        if hide_answers:
            questions_serializer = AssessmentQuestionSerializer(
                instance.questions.filter(is_active=True),
                many=True,
                context={'hide_answers': True, 'request': self.context.get('request')}
            )
            representation['questions'] = questions_serializer.data

        return representation


class SkillAssessmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing assessments"""
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = SkillAssessment
        fields = [
            'id', 'title', 'description', 'skill_name',
            'passing_score', 'time_limit', 'is_active',
            'question_count', 'created_at'
        ]

    def get_question_count(self, obj):
        return obj.questions.filter(is_active=True).count()


class SkillAssessmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating assessments with questions (admin)"""
    skill_id = serializers.PrimaryKeyRelatedField(
        source='skill',
        queryset=Skill.objects.all(),
        write_only=True,
        required=True
    )
    questions = AssessmentQuestionCreateSerializer(many=True, required=False)

    class Meta:
        model = SkillAssessment
        fields = [
            'id', 'title', 'description', 'skill_id',
            'passing_score', 'total_questions', 'time_limit',
            'is_active', 'questions'
        ]

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        assessment = SkillAssessment.objects.create(**validated_data)

        for idx, question_data in enumerate(questions_data):
            options_data = question_data.pop('options', [])
            question_data['order'] = question_data.get('order', idx + 1)
            question = AssessmentQuestion.objects.create(
                assessment=assessment,
                **question_data
            )

            for opt_idx, option_data in enumerate(options_data):
                option_data['order'] = option_data.get('order', opt_idx)
                QuestionOption.objects.create(question=question, **option_data)

        return assessment


# =====================================================
# Assessment Attempt Serializers
# =====================================================

class AttemptAnswerSerializer(serializers.ModelSerializer):
    """Serializer for recording answers"""
    selected_option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    question_text = serializers.CharField(source='question.question_text', read_only=True)

    class Meta:
        model = AttemptAnswer
        fields = [
            'id', 'question', 'question_text', 'selected_option_ids',
            'is_correct', 'points_earned', 'answered_at'
        ]
        read_only_fields = ['is_correct', 'points_earned', 'answered_at']


class AssessmentAttemptSerializer(serializers.ModelSerializer):
    """Serializer for assessment attempts"""
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    skill_name = serializers.CharField(source='assessment.skill.name', read_only=True)
    answers = AttemptAnswerSerializer(many=True, read_only=True)
    time_remaining = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentAttempt
        fields = [
            'id', 'user', 'assessment', 'assessment_title', 'skill_name',
            'score', 'percentage', 'passed', 'status',
            'started_at', 'completed_at', 'time_taken',
            'time_remaining', 'answers'
        ]
        read_only_fields = [
            'user', 'score', 'percentage', 'passed', 'status',
            'started_at', 'completed_at', 'time_taken'
        ]

    def get_time_remaining(self, obj):
        if obj.status != 'in_progress':
            return 0

        from django.utils import timezone
        elapsed_seconds = (timezone.now() - obj.started_at).total_seconds()
        time_limit_seconds = obj.assessment.time_limit * 60
        remaining = max(0, time_limit_seconds - elapsed_seconds)
        return int(remaining)


class AssessmentAttemptResultSerializer(serializers.ModelSerializer):
    """Serializer for showing attempt results after completion"""
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    skill_name = serializers.CharField(source='assessment.skill.name', read_only=True)
    passing_score = serializers.DecimalField(
        source='assessment.passing_score',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    total_questions = serializers.SerializerMethodField()
    correct_answers = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentAttempt
        fields = [
            'id', 'assessment_title', 'skill_name',
            'score', 'percentage', 'passed', 'passing_score',
            'total_questions', 'correct_answers',
            'started_at', 'completed_at', 'time_taken'
        ]

    def get_total_questions(self, obj):
        return obj.answers.count()

    def get_correct_answers(self, obj):
        return obj.answers.filter(is_correct=True).count()


class SubmitAnswerSerializer(serializers.Serializer):
    """Serializer for submitting a single answer"""
    question_id = serializers.IntegerField()
    selected_option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        allow_empty=False
    )

    def validate_selected_option_ids(self, value):
        if not value:
            raise serializers.ValidationError("At least one option must be selected.")
        return value


class SubmitAssessmentSerializer(serializers.Serializer):
    """Serializer for submitting all answers at once"""
    answers = serializers.ListField(
        child=SubmitAnswerSerializer(),
        required=True,
        allow_empty=False
    )

    def validate_answers(self, value):
        if not value:
            raise serializers.ValidationError("At least one answer is required.")
        return value


class StartAssessmentSerializer(serializers.Serializer):
    """Serializer for starting an assessment"""
    assessment_id = serializers.IntegerField()

    def validate_assessment_id(self, value):
        try:
            assessment = SkillAssessment.objects.get(id=value, is_active=True)
        except SkillAssessment.DoesNotExist:
            raise serializers.ValidationError("Assessment not found or is not active.")

        if assessment.questions.filter(is_active=True).count() == 0:
            raise serializers.ValidationError("This assessment has no questions yet.")

        return value
