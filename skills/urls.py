from django.urls import path

from . import views, views_assessment

urlpatterns = [
    # Skills listing
    path("", views.SkillList.as_view(), name="skill-list"),
    # Skill categories
    path("categories/", views.SkillCategoryList.as_view(), name="skill-category-list"),
    # Skills grouped by category
    path("by-category/", views.get_skills_by_category, name="skills-by-category"),
    # User skills CRUD
    path("user-skills/", views.UserSkillList.as_view(), name="user-skill-list"),
    path(
        "user-skills/<int:pk>/",
        views.UserSkillDetail.as_view(),
        name="user-skill-detail",
    ),
    # User skills summary
    path("my-summary/", views.get_my_skills_summary, name="my-skills-summary"),
    # Skill assessments
    path(
        "assessments/",
        views_assessment.get_available_assessments,
        name="available-assessments",
    ),
    path(
        "assessments/history/",
        views_assessment.get_user_assessment_history,
        name="assessment-history",
    ),
    path(
        "assessments/<str:skill_name>/questions/",
        views_assessment.get_assessment_questions,
        name="assessment-questions",
    ),
    path(
        "assessments/<str:skill_name>/submit/",
        views_assessment.submit_assessment,
        name="submit-assessment",
    ),
]
