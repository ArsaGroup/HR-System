from django.core.management.base import BaseCommand
from projects.models import ProjectCategory, ProjectTemplate
from skills.models import SkillCategory, Skill


class Command(BaseCommand):
    help = 'Seed initial categories, skills, and templates for the platform'

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed initial data...\n')

        # Seed Skill Categories
        self.seed_skill_categories()

        # Seed Skills
        self.seed_skills()

        # Seed Project Categories
        self.seed_project_categories()

        # Seed Project Templates
        self.seed_project_templates()

        self.stdout.write(self.style.SUCCESS('\n✓ Initial data seeding completed successfully!'))

    def seed_skill_categories(self):
        self.stdout.write('Seeding skill categories...')

        skill_categories = [
            {'name': 'Web Development', 'description': 'Frontend and backend web development skills'},
            {'name': 'Mobile Development', 'description': 'iOS, Android, and cross-platform mobile app development'},
            {'name': 'Design', 'description': 'Graphic design, UI/UX, and visual design skills'},
            {'name': 'Writing & Content', 'description': 'Content writing, copywriting, and editing'},
            {'name': 'Marketing', 'description': 'Digital marketing, SEO, and social media'},
            {'name': 'Data & Analytics', 'description': 'Data analysis, visualization, and business intelligence'},
            {'name': 'Video & Animation', 'description': 'Video editing, animation, and motion graphics'},
            {'name': 'Music & Audio', 'description': 'Music production, audio editing, and sound design'},
            {'name': 'Business', 'description': 'Business consulting, strategy, and management'},
            {'name': 'Academic', 'description': 'Tutoring, research assistance, and academic writing'},
        ]

        for cat_data in skill_categories:
            cat, created = SkillCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            status = 'created' if created else 'exists'
            self.stdout.write(f'  - {cat.name}: {status}')

    def seed_skills(self):
        self.stdout.write('\nSeeding skills...')

        skills_data = {
            'Web Development': [
                'React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript',
                'Python', 'Django', 'Node.js', 'PHP', 'Laravel',
                'HTML/CSS', 'Tailwind CSS', 'Bootstrap', 'WordPress',
                'Next.js', 'Express.js', 'Ruby on Rails', 'GraphQL', 'REST API'
            ],
            'Mobile Development': [
                'React Native', 'Flutter', 'Swift', 'Kotlin',
                'iOS Development', 'Android Development', 'Xamarin'
            ],
            'Design': [
                'UI/UX Design', 'Graphic Design', 'Logo Design', 'Figma',
                'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD',
                'Web Design', 'Brand Identity', 'Wireframing', 'Prototyping'
            ],
            'Writing & Content': [
                'Content Writing', 'Copywriting', 'Blog Writing', 'Technical Writing',
                'Editing & Proofreading', 'Creative Writing', 'SEO Writing',
                'Grant Writing', 'Resume Writing', 'Ghostwriting'
            ],
            'Marketing': [
                'Social Media Marketing', 'SEO', 'Content Marketing',
                'Email Marketing', 'Google Ads', 'Facebook Ads',
                'Influencer Marketing', 'Marketing Strategy', 'Brand Strategy'
            ],
            'Data & Analytics': [
                'Data Analysis', 'Excel', 'SQL', 'Python (Data Science)',
                'Tableau', 'Power BI', 'Google Analytics', 'Machine Learning',
                'Statistical Analysis', 'Data Visualization'
            ],
            'Video & Animation': [
                'Video Editing', 'Adobe Premiere Pro', 'Final Cut Pro',
                'After Effects', '2D Animation', '3D Animation',
                'Motion Graphics', 'YouTube Video Editing'
            ],
            'Music & Audio': [
                'Music Production', 'Audio Editing', 'Podcast Editing',
                'Voice Over', 'Sound Design', 'Mixing & Mastering'
            ],
            'Business': [
                'Business Plan Writing', 'Financial Modeling', 'Market Research',
                'Project Management', 'Virtual Assistant', 'Customer Service',
                'Data Entry', 'Bookkeeping', 'Business Consulting'
            ],
            'Academic': [
                'Math Tutoring', 'Science Tutoring', 'Essay Writing',
                'Research Assistance', 'Statistics Help', 'Programming Tutoring',
                'Language Tutoring', 'Test Prep', 'Presentation Design'
            ],
        }

        for category_name, skill_names in skills_data.items():
            try:
                category = SkillCategory.objects.get(name=category_name)
                for skill_name in skill_names:
                    skill, created = Skill.objects.get_or_create(
                        name=skill_name,
                        category=category,
                        defaults={
                            'description': f'{skill_name} skill',
                            'is_verified': True
                        }
                    )
                    if created:
                        self.stdout.write(f'  - {skill_name} ({category_name}): created')
            except SkillCategory.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Category {category_name} not found, skipping skills'))

    def seed_project_categories(self):
        self.stdout.write('\nSeeding project categories...')

        project_categories = [
            {'name': 'Web Development', 'description': 'Website and web application development projects', 'icon': '🌐'},
            {'name': 'Mobile Apps', 'description': 'Mobile application development for iOS and Android', 'icon': '📱'},
            {'name': 'Design & Creative', 'description': 'Graphic design, UI/UX, and creative projects', 'icon': '🎨'},
            {'name': 'Writing & Translation', 'description': 'Content writing, copywriting, and translation services', 'icon': '✍️'},
            {'name': 'Marketing', 'description': 'Digital marketing, SEO, and advertising projects', 'icon': '📈'},
            {'name': 'Video & Animation', 'description': 'Video production and animation projects', 'icon': '🎬'},
            {'name': 'Data & Research', 'description': 'Data analysis, research, and reporting', 'icon': '📊'},
            {'name': 'Academic Help', 'description': 'Tutoring, homework help, and academic assistance', 'icon': '📚'},
            {'name': 'Business Services', 'description': 'Business consulting, planning, and admin services', 'icon': '💼'},
            {'name': 'Music & Audio', 'description': 'Music production, audio editing, and sound design', 'icon': '🎵'},
            {'name': 'Other', 'description': 'Other projects and services', 'icon': '📋'},
        ]

        for cat_data in project_categories:
            cat, created = ProjectCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'description': cat_data['description'],
                    'icon': cat_data['icon'],
                    'is_active': True
                }
            )
            status = 'created' if created else 'exists'
            self.stdout.write(f'  - {cat.name}: {status}')

    def seed_project_templates(self):
        self.stdout.write('\nSeeding project templates...')

        templates_data = {
            'Web Development': [
                {
                    'title': 'Business Website',
                    'description': 'Build a professional business website with contact form, about page, services page, and responsive design. Includes basic SEO optimization and mobile-friendly layout.',
                    'default_budget_range': '$200 - $800',
                    'estimated_duration': '1-2 weeks'
                },
                {
                    'title': 'E-commerce Store',
                    'description': 'Create an online store with product catalog, shopping cart, checkout system, and payment integration. Includes admin panel for managing products and orders.',
                    'default_budget_range': '$500 - $2000',
                    'estimated_duration': '2-4 weeks'
                },
                {
                    'title': 'Landing Page',
                    'description': 'Design and develop a high-converting landing page for marketing campaigns. Includes responsive design, call-to-action buttons, and lead capture form.',
                    'default_budget_range': '$100 - $400',
                    'estimated_duration': '3-7 days'
                },
                {
                    'title': 'Portfolio Website',
                    'description': 'Create a personal portfolio website to showcase your work. Includes project gallery, about section, contact form, and responsive design.',
                    'default_budget_range': '$150 - $500',
                    'estimated_duration': '1-2 weeks'
                },
            ],
            'Mobile Apps': [
                {
                    'title': 'Simple Mobile App',
                    'description': 'Build a basic mobile application with essential features. Includes UI design, backend integration, and testing.',
                    'default_budget_range': '$500 - $2000',
                    'estimated_duration': '2-4 weeks'
                },
                {
                    'title': 'App UI/UX Design',
                    'description': 'Design user interface and user experience for mobile application. Includes wireframes, mockups, and interactive prototype.',
                    'default_budget_range': '$200 - $800',
                    'estimated_duration': '1-2 weeks'
                },
            ],
            'Design & Creative': [
                {
                    'title': 'Logo Design',
                    'description': 'Create a unique and memorable logo for your brand. Includes multiple concepts, revisions, and final files in various formats.',
                    'default_budget_range': '$50 - $300',
                    'estimated_duration': '3-7 days'
                },
                {
                    'title': 'Brand Identity Package',
                    'description': 'Complete brand identity design including logo, color palette, typography, and brand guidelines document.',
                    'default_budget_range': '$200 - $800',
                    'estimated_duration': '1-2 weeks'
                },
                {
                    'title': 'Social Media Graphics',
                    'description': 'Design a set of social media graphics for your profiles and posts. Includes templates for multiple platforms.',
                    'default_budget_range': '$50 - $200',
                    'estimated_duration': '3-5 days'
                },
                {
                    'title': 'Flyer/Poster Design',
                    'description': 'Design an eye-catching flyer or poster for your event or promotion. Includes print-ready files.',
                    'default_budget_range': '$30 - $150',
                    'estimated_duration': '2-5 days'
                },
            ],
            'Writing & Translation': [
                {
                    'title': 'Blog Article',
                    'description': 'Write an engaging blog article on your chosen topic. Includes research, SEO optimization, and revisions.',
                    'default_budget_range': '$30 - $150',
                    'estimated_duration': '2-5 days'
                },
                {
                    'title': 'Website Content',
                    'description': 'Write compelling content for your website pages. Includes homepage, about, services, and contact page copy.',
                    'default_budget_range': '$100 - $400',
                    'estimated_duration': '1 week'
                },
                {
                    'title': 'Resume/CV Writing',
                    'description': 'Professional resume or CV writing service. Includes tailored content, formatting, and cover letter.',
                    'default_budget_range': '$50 - $150',
                    'estimated_duration': '3-5 days'
                },
            ],
            'Marketing': [
                {
                    'title': 'Social Media Management',
                    'description': 'Manage your social media accounts for a month. Includes content creation, scheduling, and engagement.',
                    'default_budget_range': '$200 - $600',
                    'estimated_duration': '1 month'
                },
                {
                    'title': 'SEO Optimization',
                    'description': 'Optimize your website for search engines. Includes keyword research, on-page SEO, and recommendations report.',
                    'default_budget_range': '$150 - $500',
                    'estimated_duration': '1-2 weeks'
                },
                {
                    'title': 'Marketing Strategy',
                    'description': 'Develop a comprehensive marketing strategy for your business. Includes market analysis and actionable recommendations.',
                    'default_budget_range': '$200 - $800',
                    'estimated_duration': '1-2 weeks'
                },
            ],
            'Video & Animation': [
                {
                    'title': 'Video Editing',
                    'description': 'Professional video editing service. Includes cutting, transitions, color correction, and basic effects.',
                    'default_budget_range': '$50 - $300',
                    'estimated_duration': '3-7 days'
                },
                {
                    'title': 'Explainer Video',
                    'description': 'Create an animated explainer video for your product or service. Includes script, voiceover, and animation.',
                    'default_budget_range': '$200 - $1000',
                    'estimated_duration': '1-2 weeks'
                },
                {
                    'title': 'YouTube Video Editing',
                    'description': 'Edit your YouTube videos with engaging cuts, transitions, thumbnails, and basic graphics.',
                    'default_budget_range': '$30 - $150',
                    'estimated_duration': '2-5 days'
                },
            ],
            'Academic Help': [
                {
                    'title': 'Essay Editing',
                    'description': 'Professional editing and proofreading for your academic essay. Includes grammar, structure, and citation check.',
                    'default_budget_range': '$30 - $100',
                    'estimated_duration': '2-4 days'
                },
                {
                    'title': 'Research Assistance',
                    'description': 'Help with academic research including literature review, data collection, and analysis assistance.',
                    'default_budget_range': '$50 - $200',
                    'estimated_duration': '1-2 weeks'
                },
                {
                    'title': 'Tutoring Session',
                    'description': 'One-on-one tutoring session for any subject. Includes personalized teaching and practice problems.',
                    'default_budget_range': '$20 - $60',
                    'estimated_duration': '1-2 hours'
                },
                {
                    'title': 'Presentation Design',
                    'description': 'Design a professional presentation for your class or meeting. Includes slides, graphics, and formatting.',
                    'default_budget_range': '$30 - $150',
                    'estimated_duration': '2-5 days'
                },
            ],
            'Data & Research': [
                {
                    'title': 'Data Analysis',
                    'description': 'Analyze your data and provide insights. Includes data cleaning, analysis, and visualization report.',
                    'default_budget_range': '$100 - $500',
                    'estimated_duration': '1-2 weeks'
                },
                {
                    'title': 'Survey & Data Collection',
                    'description': 'Design and distribute surveys for your research. Includes survey design and basic analysis.',
                    'default_budget_range': '$50 - $200',
                    'estimated_duration': '1 week'
                },
            ],
        }

        for category_name, templates in templates_data.items():
            try:
                category = ProjectCategory.objects.get(name=category_name)
                for template_data in templates:
                    template, created = ProjectTemplate.objects.get_or_create(
                        category=category,
                        title=template_data['title'],
                        defaults={
                            'description': template_data['description'],
                            'default_budget_range': template_data['default_budget_range'],
                            'estimated_duration': template_data['estimated_duration'],
                            'is_active': True
                        }
                    )
                    if created:
                        self.stdout.write(f'  - {template.title}: created')
            except ProjectCategory.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Category {category_name} not found, skipping templates'))
