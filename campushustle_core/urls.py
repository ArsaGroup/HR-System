from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from . import admin_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/users/", include("users.urls_profile")),
    path("api/skills/", include("skills.urls")),
    path("api/portfolio/", include("portfolio.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/proposals/", include("proposals.urls")),
    path("api/messaging/", include("messaging.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/disputes/", include("disputes.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/ai/", include("ai_services.urls")),
    # Admin Dashboard
    path("api/admin/stats/", admin_views.admin_dashboard_stats, name="admin-stats"),
    path(
        "api/admin/categories/",
        admin_views.admin_category_stats,
        name="admin-categories",
    ),
    # Admin - Skill Categories
    path(
        "api/admin/skill-categories/",
        admin_views.manage_skill_categories,
        name="admin-skill-categories",
    ),
    path(
        "api/admin/skill-categories/<int:pk>/",
        admin_views.skill_category_detail,
        name="admin-skill-category-detail",
    ),
    # Admin - Skills
    path("api/admin/skills/", admin_views.manage_skills, name="admin-skills"),
    path(
        "api/admin/skills/<int:pk>/",
        admin_views.skill_detail,
        name="admin-skill-detail",
    ),
    path(
        "api/admin/skills/dropdown/",
        admin_views.get_skills_dropdown,
        name="admin-skills-dropdown",
    ),
    # Admin - Skill Assessments
    path(
        "api/admin/skill-assessments/",
        admin_views.manage_skill_assessments,
        name="admin-skill-assessments",
    ),
    path(
        "api/admin/skill-assessments/<int:pk>/",
        admin_views.skill_assessment_detail,
        name="admin-skill-assessment-detail",
    ),
    # Admin - Assessment Questions
    path(
        "api/admin/skill-assessments/<int:assessment_id>/questions/",
        admin_views.manage_assessment_questions,
        name="admin-assessment-questions",
    ),
    path(
        "api/admin/questions/<int:pk>/",
        admin_views.assessment_question_detail,
        name="admin-question-detail",
    ),
    # Admin - Project Categories
    path(
        "api/admin/project-categories/",
        admin_views.manage_project_categories,
        name="admin-project-categories",
    ),
    path(
        "api/admin/project-categories/<int:pk>/",
        admin_views.project_category_detail,
        name="admin-project-category-detail",
    ),
    # Admin - Project Templates
    path(
        "api/admin/project-templates/",
        admin_views.manage_project_templates,
        name="admin-project-templates",
    ),
    path(
        "api/admin/project-templates/<int:pk>/",
        admin_views.project_template_detail,
        name="admin-project-template-detail",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
