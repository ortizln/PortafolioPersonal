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
      { path: '', loadComponent: () => import('./public-portfolio/portfolio.component').then((m) => m.PortfolioComponent) },
      { path: 'nosotros', loadComponent: () => import('./pages/nosotros-page.component').then((m) => m.NosotrosPageComponent) },
      { path: 'servicios', loadComponent: () => import('./pages/servicios-page.component').then((m) => m.ServiciosPageComponent) },
      { path: 'servicios/:slug', loadComponent: () => import('./pages/servicio-detail-page.component').then((m) => m.ServicioDetailPageComponent) },
      { path: 'equipo', loadComponent: () => import('./pages/team-page.component').then((m) => m.TeamPageComponent) },
      { path: 'equipo/:slug', loadComponent: () => import('./pages/team-detail-page.component').then((m) => m.TeamDetailPageComponent) },
      { path: 'clientes', loadComponent: () => import('./pages/clientes-page.component').then((m) => m.ClientesPageComponent) },
      { path: 'portafolio', loadComponent: () => import('./pages/projects-page.component').then((m) => m.ProjectsPageComponent) },
      { path: 'proyectos/:slug', loadComponent: () => import('./pages/project-detail-page.component').then((m) => m.ProjectDetailPageComponent) },
      { path: 'contacto', loadComponent: () => import('./pages/contact-page.component').then((m) => m.ContactPageComponent) },
      { path: 'about', loadComponent: () => import('./pages/about-page.component').then((m) => m.AboutPageComponent) },
      { path: 'experience', loadComponent: () => import('./pages/experience-page.component').then((m) => m.ExperiencePageComponent) },
      { path: 'projects', redirectTo: 'portafolio', pathMatch: 'full' },
      { path: 'skills', loadComponent: () => import('./pages/skills-page.component').then((m) => m.SkillsPageComponent) },
      { path: 'contact', redirectTo: 'contacto', pathMatch: 'full' },
      { path: 'portfolio', redirectTo: '', pathMatch: 'full' },
      { path: 'blog', loadComponent: () => import('./pages/blog-page.component').then((m) => m.BlogPageComponent) },
      { path: 'blog/:slug', loadComponent: () => import('./pages/blog-detail-page.component').then((m) => m.BlogDetailPageComponent) },
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
      { path: 'dashboard', loadComponent: () => import('./dashboard/corporate-dashboard.component').then((m) => m.CorporateDashboardComponent) },
      { path: 'media', loadComponent: () => import('./media/media-list.component').then((m) => m.MediaListComponent) },
      { path: 'leads', loadComponent: () => import('./leads/leads.component').then((m) => m.LeadsComponent) },
      { path: 'users', loadComponent: () => import('./users/user-list.component').then((m) => m.UserListComponent), canActivate: [permissionGuard('users.manage')] },
      { path: 'roles', loadComponent: () => import('./roles/role-list.component').then((m) => m.RoleListComponent), canActivate: [permissionGuard('roles.manage')] },
      { path: 'audit', loadComponent: () => import('./audit/audit-log.component').then((m) => m.AuditLogComponent), canActivate: [permissionGuard('audit.read')] },
      { path: 'posts', loadComponent: () => import('./posts/post-list.component').then((m) => m.PostListComponent), canActivate: [permissionGuard('posts.read')] },
      { path: 'technologies', loadComponent: () => import('./technologies/technology-list.component').then((m) => m.TechnologyListComponent) },
      { path: 'profile', loadComponent: () => import('./profile/profile-edit.component').then((m) => m.ProfileEditComponent) },
      { path: 'experiences', loadComponent: () => import('./experiences/experience-list.component').then((m) => m.ExperienceListComponent) },
      { path: 'education', loadComponent: () => import('./education/education-list.component').then((m) => m.EducationListComponent) },
      { path: 'certificates', loadComponent: () => import('./certificates/certificate-list.component').then((m) => m.CertificateListComponent) },
      { path: 'projects', loadComponent: () => import('./projects/project-list.component').then((m) => m.ProjectListComponent) },
      { path: 'skills', loadComponent: () => import('./skills/skill-list.component').then((m) => m.SkillListComponent) },
      { path: 'languages', loadComponent: () => import('./languages/language-list.component').then((m) => m.LanguageListComponent) },
      { path: 'social-links', loadComponent: () => import('./social-links/social-links.component').then((m) => m.SocialLinksComponent) },
      { path: 'repositories', loadComponent: () => import('./repositories/repository-list.component').then((m) => m.RepositoryListComponent) },
      { path: 'categories', loadComponent: () => import('./categories/category-list.component').then((m) => m.CategoryListComponent) },
      { path: 'messages', loadComponent: () => import('./dashboard/contact-messages.component').then((m) => m.ContactMessagesComponent) },
      { path: 'settings', loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent), canActivate: [permissionGuard('settings.manage')] },
      { path: 'company', loadComponent: () => import('./company/company-edit.component').then((m) => m.CompanyEditComponent) },
      { path: 'services', loadComponent: () => import('./services/service-list.component').then((m) => m.ServiceListComponent) },
      { path: 'clients', loadComponent: () => import('./clients/client-list.component').then((m) => m.ClientListComponent) },
      { path: 'testimonials', loadComponent: () => import('./testimonials/testimonial-list.component').then((m) => m.TestimonialListComponent) },
      { path: 'team', loadComponent: () => import('./team/team-list.component').then((m) => m.TeamListComponent) },
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
