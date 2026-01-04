from django.db import models
from django.utils import timezone
from users.models import User


class SkillCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='subcategories'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name_plural = "Skill Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Skill(models.Model):
    SKILL_LEVELS = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    )

    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        SkillCategory,
        on_delete=models.CASCADE,
        related_name='skills'
    )
    description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class UserSkill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=Skill.SKILL_LEVELS, default='intermediate')
    years_of_experience = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    is_certified = models.BooleanField(default=False)
    certificate_file = models.FileField(upload_to='skill_certificates/', blank=True, null=True)
    certificate_issuer = models.CharField(max_length=200, blank=True)
    certificate_date = models.DateField(blank=True, null=True)

    # Skill assessment scores
    assessment_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    last_assessment_date = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'skill']
        ordering = ['-assessment_score', 'skill__name']

    def __str__(self):
        return f"{self.user.username} - {self.skill.name} ({self.level})"


class SkillAssessment(models.Model):
    """
    A skill assessment/test that providers can take to get certified.
    """
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='assessments')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    passing_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=70.00,
        help_text="Minimum percentage to pass"
    )
    total_questions = models.IntegerField(default=10)
    time_limit = models.IntegerField(
        default=30,
        help_text="Time limit in minutes"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.skill.name} - {self.title}"

    @property
    def question_count(self):
        return self.questions.count()


class AssessmentQuestion(models.Model):
    """
    A question in a skill assessment with multiple choice options.
    """
    QUESTION_TYPES = (
        ('single', 'Single Choice'),
        ('multiple', 'Multiple Choice'),
        ('true_false', 'True/False'),
    )

    assessment = models.ForeignKey(
        SkillAssessment,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES,
        default='single'
    )
    points = models.IntegerField(default=1, help_text="Points for correct answer")
    explanation = models.TextField(
        blank=True,
        help_text="Explanation shown after answering (optional)"
    )
    order = models.IntegerField(default=0, help_text="Question order in the assessment")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."


class QuestionOption(models.Model):
    """
    An answer option for an assessment question.
    """
    question = models.ForeignKey(
        AssessmentQuestion,
        on_delete=models.CASCADE,
        related_name='options'
    )
    option_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        correct_mark = "✓" if self.is_correct else "✗"
        return f"{correct_mark} {self.option_text[:50]}"


class AssessmentAttempt(models.Model):
    """
    Records a user's attempt at taking an assessment.
    """
    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('timed_out', 'Timed Out'),
        ('abandoned', 'Abandoned'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_attempts')
    assessment = models.ForeignKey(SkillAssessment, on_delete=models.CASCADE, related_name='attempts')
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.IntegerField(null=True, blank=True, help_text="Time taken in seconds")

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} - {self.assessment.title} ({self.status})"

    @property
    def is_timed_out(self):
        if self.status != 'in_progress':
            return False
        elapsed = (timezone.now() - self.started_at).total_seconds() / 60
        return elapsed > self.assessment.time_limit


class AttemptAnswer(models.Model):
    """
    Records a user's answer to a specific question in an attempt.
    """
    attempt = models.ForeignKey(
        AssessmentAttempt,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        AssessmentQuestion,
        on_delete=models.CASCADE
    )
    selected_options = models.ManyToManyField(
        QuestionOption,
        blank=True,
        related_name='selected_in_answers'
    )
    is_correct = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)
    answered_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['attempt', 'question']

    def __str__(self):
        return f"Answer to Q{self.question.order} by {self.attempt.user.username}"

    def check_answer(self):
        """Check if the selected options match the correct options"""
        correct_options = set(self.question.options.filter(is_correct=True).values_list('id', flat=True))
        selected = set(self.selected_options.values_list('id', flat=True))

        if self.question.question_type == 'single':
            # For single choice, must select exactly one correct option
            self.is_correct = (selected == correct_options and len(selected) == 1)
        elif self.question.question_type == 'multiple':
            # For multiple choice, must select all correct options and no incorrect ones
            self.is_correct = (selected == correct_options)
        elif self.question.question_type == 'true_false':
            # For true/false, same as single choice
            self.is_correct = (selected == correct_options)

        self.points_earned = self.question.points if self.is_correct else 0
        self.save()
        return self.is_correct
