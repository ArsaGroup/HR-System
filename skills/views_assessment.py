from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from users.models import User

from .assessment_data import ASSESSMENT_QUESTIONS
from .models import (
    AssessmentQuestion,
    QuestionOption,
    Skill,
    SkillAssessment,
    SkillCategory,
    UserSkill,
)


def update_provider_score_for_assessment(user, score, passed):
    """
    Update the provider's score when they complete an assessment.
    This function handles the score update logic for skill assessments.
    """
    try:
        from reviews.models import ProviderScore, ScoreHistory

        # Get or create ProviderScore for the user
        provider_score, created = ProviderScore.objects.get_or_create(user=user)

        old_assessment_score = provider_score.assessment_score
        old_total_score = provider_score.total_score

        if passed:
            provider_score.assessments_passed += 1
            # Bonus points for passing based on score
            if score >= 90:
                bonus = 5.00
                description = f"Excellent assessment score ({score:.1f}%) - +5 points"
            elif score >= 80:
                bonus = 3.00
                description = f"Good assessment score ({score:.1f}%) - +3 points"
            else:
                bonus = 2.00
                description = f"Passed assessment ({score:.1f}%) - +2 points"

            from decimal import Decimal

            provider_score.assessment_score += Decimal(str(bonus))
        else:
            provider_score.assessments_failed += 1
            description = f"Assessment not passed ({score:.1f}%)"

        # Update average assessment score
        total_assessments = (
            provider_score.assessments_passed + provider_score.assessments_failed
        )
        if total_assessments > 0:
            from decimal import Decimal

            current_total = float(provider_score.average_assessment_score) * (
                total_assessments - 1
            )
            provider_score.average_assessment_score = Decimal(
                str((current_total + score) / total_assessments)
            )

        provider_score.save()

        # Recalculate total score
        provider_score.calculate_total_score()

        # Log the score change
        if passed:
            from decimal import Decimal

            ScoreHistory.objects.create(
                user=user,
                change_type="assessment",
                points_change=Decimal(str(bonus if passed else 0)),
                old_score=old_assessment_score,
                new_score=provider_score.assessment_score,
                reference_type="skill_assessment",
                reference_id=0,  # Could be assessment attempt ID if tracked
                description=description,
            )

        return True
    except Exception as e:
        print(f"Error updating provider score: {e}")
        return False


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_assessment_questions(request, skill_name):
    """Get assessment questions for a specific skill - checks both hardcoded and database"""

    # First check if it's a database assessment (skill_name could be an ID)
    try:
        assessment_id = int(skill_name)
        try:
            db_assessment = SkillAssessment.objects.prefetch_related(
                "questions__options"
            ).get(id=assessment_id, is_active=True)

            # Get questions from database
            questions = []
            db_questions = db_assessment.questions.filter(is_active=True).order_by(
                "order", "id"
            )

            if db_questions.count() == 0:
                return Response(
                    {"error": "This assessment has no questions configured yet."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for i, q in enumerate(db_questions):
                # Get options - use option_text field (not text)
                options = []
                for opt in q.options.all().order_by("order", "id"):
                    options.append(opt.option_text)

                questions.append(
                    {"id": q.id, "question": q.question_text, "options": options}
                )

            return Response(
                {
                    "title": db_assessment.title,
                    "description": db_assessment.description or "",
                    "time_limit": db_assessment.time_limit,
                    "passing_score": float(db_assessment.passing_score),
                    "total_questions": len(questions),
                    "questions": questions,
                    "source": "database",
                }
            )
        except SkillAssessment.DoesNotExist:
            # Not found by ID, try other methods
            pass
    except (ValueError, TypeError):
        # Not a valid integer ID, try as skill name
        pass

    # Check hardcoded assessments by key
    skill_key = skill_name.lower().replace(" ", "_").replace("/", "_").replace("-", "_")

    if skill_key in ASSESSMENT_QUESTIONS:
        assessment_data = ASSESSMENT_QUESTIONS[skill_key]

        # Return questions without correct answers
        questions = []
        for i, q in enumerate(assessment_data["questions"]):
            questions.append(
                {"id": i + 1, "question": q["question"], "options": q["options"]}
            )

        return Response(
            {
                "title": assessment_data["title"],
                "description": assessment_data["description"],
                "time_limit": assessment_data["time_limit"],
                "passing_score": assessment_data["passing_score"],
                "total_questions": len(questions),
                "questions": questions,
                "source": "hardcoded",
            }
        )

    return Response(
        {"error": f"Assessment not found for: {skill_name}"},
        status=status.HTTP_404_NOT_FOUND,
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def submit_assessment(request, skill_name):
    """Submit assessment answers and calculate score - handles both hardcoded and database assessments"""
    answers = request.data.get("answers", {})

    if not answers:
        return Response(
            {"error": "No answers provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # First check if it's a database assessment (skill_name could be an ID)
    try:
        assessment_id = int(skill_name)
        try:
            db_assessment = SkillAssessment.objects.prefetch_related(
                "questions__options"
            ).get(id=assessment_id, is_active=True)

            # Calculate score from database assessment
            correct = 0
            db_questions = db_assessment.questions.filter(is_active=True)
            total = db_questions.count()

            if total == 0:
                return Response(
                    {"error": "This assessment has no questions."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for question in db_questions:
                question_id = question.id
                # Try both string and integer keys
                user_answer = answers.get(str(question_id))
                if user_answer is None:
                    user_answer = answers.get(question_id)

                if user_answer is not None:
                    try:
                        user_answer_int = int(user_answer)
                        # Get options in order
                        options = list(question.options.all().order_by("order", "id"))

                        # Check if the selected option is correct
                        if 0 <= user_answer_int < len(options):
                            if options[user_answer_int].is_correct:
                                correct += 1
                    except (ValueError, TypeError, IndexError):
                        pass

            score = (correct / total) * 100 if total > 0 else 0
            passed = score >= float(db_assessment.passing_score)

            # Update or create UserSkill
            skill = db_assessment.skill
            with transaction.atomic():
                user_skill, created = UserSkill.objects.get_or_create(
                    user=request.user,
                    skill=skill,
                    defaults={
                        "assessment_score": score,
                        "last_assessment_date": timezone.now(),
                        "is_certified": passed,
                        "level": "intermediate",
                    },
                )

                # Track if this is an improvement
                is_improvement = False
                if not created:
                    # Only update if new score is better or it's a first attempt
                    if user_skill.assessment_score is None or score >= float(
                        user_skill.assessment_score
                    ):
                        is_improvement = (
                            user_skill.assessment_score is None
                            or score > float(user_skill.assessment_score)
                        )
                        user_skill.assessment_score = score
                        user_skill.last_assessment_date = timezone.now()
                        if passed:
                            user_skill.is_certified = True
                        user_skill.save()
                else:
                    is_improvement = True

                # Update provider score if passed (only for new passes or improvements)
                if passed and (created or is_improvement):
                    update_provider_score_for_assessment(request.user, score, passed)

            return Response(
                {
                    "score": round(score, 2),
                    "correct": correct,
                    "total": total,
                    "passed": passed,
                    "passing_score": float(db_assessment.passing_score),
                    "skill_name": skill.name,
                    "source": "database",
                    "score_updated": passed and (created or is_improvement),
                }
            )

        except SkillAssessment.DoesNotExist:
            pass
    except (ValueError, TypeError):
        pass

    # Check hardcoded assessments
    skill_key = skill_name.lower().replace(" ", "_").replace("/", "_").replace("-", "_")

    if skill_key not in ASSESSMENT_QUESTIONS:
        return Response(
            {"error": f"Assessment not found: {skill_name}"},
            status=status.HTTP_404_NOT_FOUND,
        )

    assessment_data = ASSESSMENT_QUESTIONS[skill_key]

    # Calculate score
    correct = 0
    total = len(assessment_data["questions"])

    for i, question in enumerate(assessment_data["questions"]):
        question_id = i + 1
        # Try both string and integer keys
        user_answer = answers.get(str(question_id))
        if user_answer is None:
            user_answer = answers.get(question_id)

        if user_answer is not None:
            try:
                user_answer_int = int(user_answer)
                if user_answer_int == question["correct_answer"]:
                    correct += 1
            except (ValueError, TypeError):
                pass

    score = (correct / total) * 100 if total > 0 else 0
    passed = score >= assessment_data["passing_score"]

    # Get or create default category if it doesn't exist
    default_category, _ = SkillCategory.objects.get_or_create(
        name="General",
        defaults={"description": "General skills category", "is_active": True},
    )

    # Get or create skill
    skill_name_clean = assessment_data["title"].replace(" Assessment", "")
    skill, _ = Skill.objects.get_or_create(
        name=skill_name_clean,
        defaults={
            "category": default_category,
            "description": assessment_data["description"],
            "is_verified": True,
        },
    )

    # Update or create UserSkill with assessment score
    with transaction.atomic():
        user_skill, created = UserSkill.objects.get_or_create(
            user=request.user,
            skill=skill,
            defaults={
                "assessment_score": score,
                "last_assessment_date": timezone.now(),
                "is_certified": passed,
                "level": "intermediate",
            },
        )

        is_improvement = False
        if not created:
            # Only update if new score is better
            if user_skill.assessment_score is None or score >= float(
                user_skill.assessment_score
            ):
                is_improvement = user_skill.assessment_score is None or score > float(
                    user_skill.assessment_score
                )
                user_skill.assessment_score = score
                user_skill.last_assessment_date = timezone.now()
                if passed:
                    user_skill.is_certified = True
                user_skill.save()
        else:
            is_improvement = True

        # Update provider score if passed
        if passed and (created or is_improvement):
            update_provider_score_for_assessment(request.user, score, passed)

    return Response(
        {
            "score": round(score, 2),
            "correct": correct,
            "total": total,
            "passed": passed,
            "passing_score": assessment_data["passing_score"],
            "skill_name": skill_name_clean,
            "source": "hardcoded",
            "score_updated": passed and (created or is_improvement),
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_available_assessments(request):
    """Get list of available assessments - combines hardcoded and database assessments"""
    assessments = []
    seen_titles = set()

    # First, add database assessments (they take priority)
    db_assessments = (
        SkillAssessment.objects.filter(is_active=True)
        .select_related("skill")
        .prefetch_related("questions__options")
    )

    for db_assessment in db_assessments:
        # Count active questions that have at least one option
        questions_with_options = db_assessment.questions.filter(
            is_active=True, options__isnull=False
        ).distinct()
        question_count = questions_with_options.count()

        # Only include assessments that have questions with options
        if question_count > 0:
            assessments.append(
                {
                    "id": db_assessment.id,
                    "name": db_assessment.skill.name
                    if db_assessment.skill
                    else db_assessment.title,
                    "title": db_assessment.title,
                    "description": db_assessment.description
                    or f"Test your {db_assessment.skill.name if db_assessment.skill else ''} skills",
                    "time_limit": db_assessment.time_limit,
                    "total_questions": question_count,
                    "passing_score": float(db_assessment.passing_score),
                    "source": "database",
                }
            )
            seen_titles.add(db_assessment.title.lower())
            if db_assessment.skill:
                seen_titles.add(db_assessment.skill.name.lower())

    # Then add hardcoded assessments (skip if already in database)
    for key, data in ASSESSMENT_QUESTIONS.items():
        title_lower = data["title"].lower()
        skill_name_lower = data["title"].replace(" Assessment", "").lower()

        # Skip if we already have this assessment from the database
        if title_lower in seen_titles or skill_name_lower in seen_titles:
            continue

        assessments.append(
            {
                "id": key,
                "name": data["title"].replace(" Assessment", ""),
                "title": data["title"],
                "description": data["description"],
                "time_limit": data["time_limit"],
                "total_questions": len(data["questions"]),
                "passing_score": data["passing_score"],
                "source": "hardcoded",
            }
        )

    # Sort by title
    assessments.sort(key=lambda x: x["title"].lower())

    return Response(assessments)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_user_assessment_history(request):
    """Get the user's assessment history and scores"""
    user_skills = (
        UserSkill.objects.filter(user=request.user, assessment_score__isnull=False)
        .select_related("skill")
        .order_by("-last_assessment_date")
    )

    history = []
    for user_skill in user_skills:
        history.append(
            {
                "skill_name": user_skill.skill.name,
                "score": float(user_skill.assessment_score),
                "is_certified": user_skill.is_certified,
                "level": user_skill.level,
                "last_assessment_date": user_skill.last_assessment_date.isoformat()
                if user_skill.last_assessment_date
                else None,
            }
        )

    # Get provider score summary
    score_summary = None
    try:
        from reviews.models import ProviderScore

        provider_score = ProviderScore.objects.get(user=request.user)
        score_summary = {
            "total_score": float(provider_score.total_score),
            "assessment_score": float(provider_score.assessment_score),
            "assessments_passed": provider_score.assessments_passed,
            "assessments_failed": provider_score.assessments_failed,
            "average_assessment_score": float(provider_score.average_assessment_score),
            "level": provider_score.level,
            "level_title": provider_score.level_title,
        }
    except:
        pass

    return Response({"history": history, "score_summary": score_summary})
