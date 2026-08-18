import { Routes } from '@angular/router';
import { authGuard, permissionGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent
      ),
    children: [
      { path: '', loadComponent: () => import('./public-portfolio/portfolio.component').then((m) => m.PortfolioComponent), data: { animation: 'page' } },
      { path: 'nosotros', loadComponent: () => import('./pages/nosotros-page.component').then((m) => m.NosotrosPageComponent), data: { animation: 'page' } },
      { path: 'servicios', loadComponent: () => import('./pages/servicios-page.component').then((m) => m.ServiciosPageComponent), data: { animation: 'page' } },
      { path: 'servicios/:slug', loadComponent: () => import('./pages/servicio-detail-page.component').then((m) => m.ServicioDetailPageComponent), data: { animation: 'page' } },
      { path: 'equipo', loadComponent: () => import('./pages/team-page.component').then((m) => m.TeamPageComponent), data: { animation: 'page' } },
      { path: 'equipo/:slug', loadComponent: () => import('./pages/team-detail-page.component').then((m) => m.TeamDetailPageComponent), data: { animation: 'page' } },
      { path: 'clientes', loadComponent: () => import('./pages/clientes-page.component').then((m) => m.ClientesPageComponent), data: { animation: 'page' } },
      { path: 'portafolio', loadComponent: () => import('./pages/projects-page.component').then((m) => m.ProjectsPageComponent), data: { animation: 'page' } },
      { path: 'proyectos/:slug', loadComponent: () => import('./pages/project-detail-page.component').then((m) => m.ProjectDetailPageComponent), data: { animation: 'page' } },
      { path: 'contacto', loadComponent: () => import('./pages/contact-page.component').then((m) => m.ContactPageComponent), data: { animation: 'page' } },
      { path: 'about', loadComponent: () => import('./pages/about-page.component').then((m) => m.AboutPageComponent), data: { animation: 'page' } },
      { path: 'experience', loadComponent: () => import('./pages/experience-page.component').then((m) => m.ExperiencePageComponent), data: { animation: 'page' } },
      { path: 'projects', redirectTo: 'portafolio', pathMatch: 'full' },
      { path: 'skills', loadComponent: () => import('./pages/skills-page.component').then((m) => m.SkillsPageComponent), data: { animation: 'page' } },
      { path: 'contact', redirectTo: 'contacto', pathMatch: 'full' },
      { path: 'portfolio', redirectTo: '', pathMatch: 'full' },
      { path: 'blog', loadComponent: () => import('./pages/blog-page.component').then((m) => m.BlogPageComponent), data: { animation: 'page' } },
      { path: 'blog/:slug', loadComponent: () => import('./pages/blog-detail-page.component').then((m) => m.BlogDetailPageComponent), data: { animation: 'page' } },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./shared/layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/corporate-dashboard.component').then((m) => m.CorporateDashboardComponent), data: { animation: 'page' } },
      { path: 'media', loadComponent: () => import('./media/media-list.component').then((m) => m.MediaListComponent), data: { animation: 'page' } },
      { path: 'leads', loadComponent: () => import('./leads/leads.component').then((m) => m.LeadsComponent), data: { animation: 'page' } },
      { path: 'users', loadComponent: () => import('./users/user-list.component').then((m) => m.UserListComponent), canActivate: [permissionGuard('users.manage')], data: { animation: 'page' } },
      { path: 'roles', loadComponent: () => import('./roles/role-list.component').then((m) => m.RoleListComponent), canActivate: [permissionGuard('roles.manage')], data: { animation: 'page' } },
      { path: 'audit', loadComponent: () => import('./audit/audit-log.component').then((m) => m.AuditLogComponent), canActivate: [permissionGuard('audit.read')], data: { animation: 'page' } },
      { path: 'posts', loadComponent: () => import('./posts/post-list.component').then((m) => m.PostListComponent), canActivate: [permissionGuard('posts.read')], data: { animation: 'page' } },
      { path: 'technologies', loadComponent: () => import('./technologies/technology-list.component').then((m) => m.TechnologyListComponent), data: { animation: 'page' } },
      { path: 'profile', loadComponent: () => import('./profile/profile-edit.component').then((m) => m.ProfileEditComponent), data: { animation: 'page' } },
      { path: 'experiences', loadComponent: () => import('./experiences/experience-list.component').then((m) => m.ExperienceListComponent), data: { animation: 'page' } },
      { path: 'education', loadComponent: () => import('./education/education-list.component').then((m) => m.EducationListComponent), data: { animation: 'page' } },
      { path: 'certificates', loadComponent: () => import('./certificates/certificate-list.component').then((m) => m.CertificateListComponent), data: { animation: 'page' } },
      { path: 'projects', loadComponent: () => import('./projects/project-list.component').then((m) => m.ProjectListComponent), data: { animation: 'page' } },
      { path: 'skills', loadComponent: () => import('./skills/skill-list.component').then((m) => m.SkillListComponent), data: { animation: 'page' } },
      { path: 'languages', loadComponent: () => import('./languages/language-list.component').then((m) => m.LanguageListComponent), data: { animation: 'page' } },
      { path: 'social-links', loadComponent: () => import('./social-links/social-links.component').then((m) => m.SocialLinksComponent), data: { animation: 'page' } },
      { path: 'repositories', loadComponent: () => import('./repositories/repository-list.component').then((m) => m.RepositoryListComponent), data: { animation: 'page' } },
      { path: 'categories', loadComponent: () => import('./categories/category-list.component').then((m) => m.CategoryListComponent), data: { animation: 'page' } },
      { path: 'messages', loadComponent: () => import('./dashboard/contact-messages.component').then((m) => m.ContactMessagesComponent), data: { animation: 'page' } },
      { path: 'settings', loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent), canActivate: [permissionGuard('settings.manage')], data: { animation: 'page' } },
      { path: 'company', loadComponent: () => import('./company/company-edit.component').then((m) => m.CompanyEditComponent), data: { animation: 'page' } },
      { path: 'services', loadComponent: () => import('./services/service-list.component').then((m) => m.ServiceListComponent), data: { animation: 'page' } },
      { path: 'clients', loadComponent: () => import('./clients/client-list.component').then((m) => m.ClientListComponent), data: { animation: 'page' } },
      { path: 'testimonials', loadComponent: () => import('./testimonials/testimonial-list.component').then((m) => m.TestimonialListComponent), data: { animation: 'page' } },
      { path: 'team', loadComponent: () => import('./team/team-list.component').then((m) => m.TeamListComponent), data: { animation: 'page' } },
    ],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./shared/layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent
      ),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./auth/reset-password.component').then((m) => m.ResetPasswordComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
