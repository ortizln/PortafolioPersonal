import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'portfolio', pathMatch: 'full' },
  {
    path: 'portfolio',
    loadComponent: () =>
      import('./shared/layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent
      ),
    children: [
      { path: '', loadComponent: () => import('./public-portfolio/portfolio.component').then((m) => m.PortfolioComponent) },
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
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent) },
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
      { path: 'settings', loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent) },
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
        path: 'register',
        loadComponent: () => import('./auth/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'portfolio' },
];
