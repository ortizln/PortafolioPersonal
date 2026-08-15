import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User, Profile, Experience, Education, Certification,
  Project, ProjectImage, Technology, Skill, Language,
  SocialLink, Repository, ContactMessage, Category,
  Setting, CertificateFile, Company, Service, Client, Testimonial, TeamMember,
  Role, Permission, MediaFile, Notification, AuditLog,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Auth
  login(credentials: { email: string; password: string }): Observable<{ accessToken: string; refreshToken: string; user: User }> {
    return this.http.post<{ accessToken: string; refreshToken: string; user: User }>(`${this.apiUrl}/auth/login`, credentials);
  }

  register(data: { email: string; password: string; name: string }): Observable<{ user: User; accessToken: string; refreshToken: string }> {
    return this.http.post<{ user: User; accessToken: string; refreshToken: string }>(`${this.apiUrl}/auth/register`, data);
  }

  refreshToken(token: string): Observable<{ accessToken: string; refreshToken: string }> {
    return this.http.post<{ accessToken: string; refreshToken: string }>(`${this.apiUrl}/auth/refresh-token`, { refreshToken: token });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {});
  }

  getMe(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`).pipe(
      map((res) => res.user)
    );
  }

  // Profile
  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: Partial<Profile>): Observable<Profile> {
    return this.http.put<Profile>(`${this.apiUrl}/profile`, data);
  }

  uploadPhoto(file: File): Observable<Profile> {
    const formData = new FormData();
    formData.append('profile', file);
    return this.http.post<Profile>(`${this.apiUrl}/profile/photo`, formData);
  }

  uploadBanner(file: File): Observable<Profile> {
    const formData = new FormData();
    formData.append('banner', file);
    return this.http.post<Profile>(`${this.apiUrl}/profile/banner`, formData);
  }

  uploadCV(file: File): Observable<Profile> {
    const formData = new FormData();
    formData.append('resume', file);
    return this.http.post<Profile>(`${this.apiUrl}/profile/cv`, formData);
  }

  getUploadUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${environment.uploadUrl}/${path}`;
  }

  // Experiences
  getExperiencesAll(): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.apiUrl}/experiences`);
  }

  getExperienceById(id: number): Observable<Experience> {
    return this.http.get<Experience>(`${this.apiUrl}/experiences/${id}`);
  }

  createExperience(data: Partial<Experience>): Observable<Experience> {
    return this.http.post<Experience>(`${this.apiUrl}/experiences`, data);
  }

  updateExperience(id: number, data: Partial<Experience>): Observable<Experience> {
    return this.http.put<Experience>(`${this.apiUrl}/experiences/${id}`, data);
  }

  deleteExperience(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/experiences/${id}`);
  }

  // Education
  getEducationAll(): Observable<Education[]> {
    return this.http.get<Education[]>(`${this.apiUrl}/education`);
  }

  getEducationById(id: number): Observable<Education> {
    return this.http.get<Education>(`${this.apiUrl}/education/${id}`);
  }

  createEducation(data: Partial<Education>): Observable<Education> {
    return this.http.post<Education>(`${this.apiUrl}/education`, data);
  }

  updateEducation(id: number, data: Partial<Education>): Observable<Education> {
    return this.http.put<Education>(`${this.apiUrl}/education/${id}`, data);
  }

  deleteEducation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/education/${id}`);
  }

  // Certifications
  getCertificationsAll(): Observable<Certification[]> {
    return this.http.get<Certification[]>(`${this.apiUrl}/certifications`);
  }

  getCertificationById(id: number): Observable<Certification> {
    return this.http.get<{ certification: Certification }>(`${this.apiUrl}/certifications/${id}`).pipe(
      map((res) => res.certification)
    );
  }

  createCertification(data: Partial<Certification>): Observable<Certification> {
    return this.http.post<{ certification: Certification }>(`${this.apiUrl}/certifications`, data).pipe(
      map((res) => res.certification)
    );
  }

  updateCertification(id: number, data: Partial<Certification>): Observable<Certification> {
    return this.http.put<{ certification: Certification }>(`${this.apiUrl}/certifications/${id}`, data).pipe(
      map((res) => res.certification)
    );
  }

  deleteCertification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/certifications/${id}`);
  }

  uploadCertificationFile(id: number, file: File): Observable<CertificateFile> {
    const formData = new FormData();
    formData.append('certificate', file);
    return this.http.post<{ file: CertificateFile }>(`${this.apiUrl}/certifications/${id}/files`, formData).pipe(
      map((res) => res.file)
    );
  }

  uploadCertificationImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('certificate-image', file);
    return this.http.post<{ certification: Certification }>(`${this.apiUrl}/certifications/${id}/image`, formData).pipe(
      map((res) => res.certification)
    );
  }

  // Projects
  getProjectsAll(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<{ project: Project }>(`${this.apiUrl}/projects/${id}`).pipe(
      map(r => r.project)
    );
  }

  createProject(data: Partial<Project>): Observable<Project> {
    return this.http.post<{ project: Project }>(`${this.apiUrl}/projects`, data).pipe(
      map(r => r.project)
    );
  }

  updateProject(id: string, data: Partial<Project>): Observable<Project> {
    return this.http.put<{ project: Project }>(`${this.apiUrl}/projects/${id}`, data).pipe(
      map(r => r.project)
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  addProjectImage(projectId: string, file: File, isPrimary?: boolean): Observable<ProjectImage> {
    const formData = new FormData();
    formData.append('project', file);
    if (isPrimary != null) formData.append('isPrimary', String(isPrimary));
    return this.http.post<ProjectImage>(`${this.apiUrl}/projects/${projectId}/images`, formData);
  }

  removeProjectImage(projectId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}/images/${imageId}`);
  }

  // Technologies
  getTechnologiesAll(): Observable<Technology[]> {
    return this.http.get<Technology[]>(`${this.apiUrl}/technologies`);
  }

  createTechnology(data: Partial<Technology>): Observable<Technology> {
    return this.http.post<Technology>(`${this.apiUrl}/technologies`, data);
  }

  updateTechnology(id: string, data: Partial<Technology>): Observable<Technology> {
    return this.http.put<Technology>(`${this.apiUrl}/technologies/${id}`, data);
  }

  deleteTechnology(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/technologies/${id}`);
  }

  // Skills
  getSkillsAll(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/skills`);
  }

  getSkillById(id: string): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/skills/${id}`);
  }

  createSkill(data: Partial<Skill>): Observable<Skill> {
    return this.http.post<Skill>(`${this.apiUrl}/skills`, data);
  }

  updateSkill(id: string, data: Partial<Skill>): Observable<Skill> {
    return this.http.put<Skill>(`${this.apiUrl}/skills/${id}`, data);
  }

  deleteSkill(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/skills/${id}`);
  }

  // Languages
  getLanguagesAll(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.apiUrl}/languages`);
  }

  getLanguageById(id: string): Observable<Language> {
    return this.http.get<{ language: Language }>(`${this.apiUrl}/languages/${id}`).pipe(
      map((res) => res.language)
    );
  }

  createLanguage(data: Partial<Language>): Observable<Language> {
    return this.http.post<{ language: Language }>(`${this.apiUrl}/languages`, data).pipe(
      map((res) => res.language)
    );
  }

  updateLanguage(id: string, data: Partial<Language>): Observable<Language> {
    return this.http.put<{ language: Language }>(`${this.apiUrl}/languages/${id}`, data).pipe(
      map((res) => res.language)
    );
  }

  deleteLanguage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/languages/${id}`);
  }

  // Social Links
  getSocialLinksAll(): Observable<SocialLink[]> {
    return this.http.get<SocialLink[]>(`${this.apiUrl}/social-links`);
  }

  getSocialLinkById(id: string): Observable<SocialLink> {
    return this.http.get<{ socialLink: SocialLink }>(`${this.apiUrl}/social-links/${id}`).pipe(
      map((res) => res.socialLink)
    );
  }

  createSocialLink(data: Partial<SocialLink>): Observable<SocialLink> {
    return this.http.post<{ socialLink: SocialLink }>(`${this.apiUrl}/social-links`, data).pipe(
      map((res) => res.socialLink)
    );
  }

  updateSocialLink(id: string, data: Partial<SocialLink>): Observable<SocialLink> {
    return this.http.put<{ socialLink: SocialLink }>(`${this.apiUrl}/social-links/${id}`, data).pipe(
      map((res) => res.socialLink)
    );
  }

  deleteSocialLink(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social-links/${id}`);
  }

  // Repositories
  getRepositoriesAll(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/repositories`);
  }

  getRepositoryById(id: string): Observable<Repository> {
    return this.http.get<{ repository: Repository }>(`${this.apiUrl}/repositories/${id}`).pipe(
      map((res) => res.repository)
    );
  }

  createRepository(data: Partial<Repository>): Observable<Repository> {
    return this.http.post<{ repository: Repository }>(`${this.apiUrl}/repositories`, data).pipe(
      map((res) => res.repository)
    );
  }

  updateRepository(id: string, data: Partial<Repository>): Observable<Repository> {
    return this.http.put<{ repository: Repository }>(`${this.apiUrl}/repositories/${id}`, data).pipe(
      map((res) => res.repository)
    );
  }

  deleteRepository(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/repositories/${id}`);
  }

  syncGithub(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/repositories/sync/github`);
  }

  syncGitlab(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/repositories/sync/gitlab`);
  }

  // Categories
  getCategoriesAll(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<{ category: Category }>(`${this.apiUrl}/categories/${id}`).pipe(
      map((res) => res.category)
    );
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<{ category: Category }>(`${this.apiUrl}/categories`, data).pipe(
      map((res) => res.category)
    );
  }

  updateCategory(id: string, data: Partial<Category>): Observable<Category> {
    return this.http.put<{ category: Category }>(`${this.apiUrl}/categories/${id}`, data).pipe(
      map((res) => res.category)
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Contact
  getContactMessagesAll(params?: { read?: boolean }): Observable<ContactMessage[]> {
    let httpParams = new HttpParams();
    if (params?.read != null) httpParams = httpParams.set('read', String(params.read));
    return this.http.get<any>(`${this.apiUrl}/contact`, { params: httpParams }).pipe(
      map((res) => (Array.isArray(res) ? res : (res.contacts || [])))
    );
  }

  getLeads(params?: { page?: number; limit?: number; status?: string; search?: string; unreadOnly?: boolean }): Observable<{
    contacts: ContactMessage[];
    total: number;
    page: number;
    limit: number;
    statusCounts: Record<string, number>;
    statuses: string[];
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.unreadOnly) httpParams = httpParams.set('unreadOnly', 'true');
    return this.http.get<any>(`${this.apiUrl}/contact`, { params: httpParams });
  }

  updateLead(id: string, data: { status?: string; notes?: string; assignedToId?: string; isRead?: boolean }): Observable<ContactMessage> {
    return this.http.put<{ contact: ContactMessage }>(`${this.apiUrl}/contact/${id}/lead`, data).pipe(
      map((res) => res.contact)
    );
  }

  getContactMessageById(id: string): Observable<ContactMessage> {
    return this.http.get<{ contact: ContactMessage }>(`${this.apiUrl}/contact/${id}`).pipe(
      map((res) => res.contact)
    );
  }

  createContactMessage(data: Partial<ContactMessage>): Observable<ContactMessage> {
    return this.http.post<{ contact: ContactMessage }>(`${this.apiUrl}/contact`, data).pipe(
      map((res) => res.contact)
    );
  }

  deleteContactMessage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/contact/${id}`);
  }

  markContactMessageAsRead(id: string): Observable<ContactMessage> {
    return this.http.put<{ contact: ContactMessage }>(`${this.apiUrl}/contact/${id}/read`, {}).pipe(
      map((res) => res.contact)
    );
  }

  // Settings
  getSettingsAll(): Observable<Setting[]> {
    return this.http.get<Setting[]>(`${this.apiUrl}/settings`);
  }

  getSettingByKey(key: string): Observable<Setting> {
    return this.http.get<{ setting: Setting }>(`${this.apiUrl}/settings/${key}`).pipe(
      map((res) => res.setting)
    );
  }

  updateSetting(key: string, data: Partial<Setting>): Observable<Setting> {
    return this.http.put<{ setting: Setting }>(`${this.apiUrl}/settings/${key}`, data).pipe(
      map((res) => res.setting)
    );
  }

  // Stats
  getStats(): Observable<Record<string, number>> {
    return this.http.get<{ stats: Record<string, number> }>(`${this.apiUrl}/stats`).pipe(
      map((res) => res.stats)
    );
  }

  getProjectStats(): Observable<Record<string, any>> {
    return this.http.get<{ stats: Record<string, any> }>(`${this.apiUrl}/stats/projects`).pipe(
      map((res) => res.stats)
    );
  }

  // Public endpoints
  getPortfolio(username?: string): Observable<{
    profile: Profile;
    experiences: Experience[];
    education: Education[];
    certifications: Certification[];
    skills: Skill[];
    socialLinks: SocialLink[];
  }> {
    const params = username ? new HttpParams().set('username', username) : undefined;
    return this.http.get<any>(`${this.apiUrl}/public/portfolio`, { params });
  }

  getPublicProjects(filters?: { search?: string; category?: string; technology?: string; status?: string }): Observable<Project[]> {
    const params = new HttpParams({ fromObject: (filters || {}) as any });
    return this.http.get<{ projects: Project[] }>(`${this.apiUrl}/public/projects`, { params }).pipe(
      map((res) => res.projects)
    );
  }

  getPublicProjectById(id: number): Observable<Project> {
    return this.http.get<{ project: Project }>(`${this.apiUrl}/public/projects/${id}`).pipe(
      map((res) => res.project)
    );
  }

  getPublicProjectBySlug(slug: string): Observable<{ project: Project; related: Project[] }> {
    return this.http.get<{ project: Project; related: Project[] }>(`${this.apiUrl}/public/projects/slug/${slug}`);
  }

  getPublicExperiences(): Observable<Experience[]> {
    return this.http.get<{ experiences: Experience[] }>(`${this.apiUrl}/public/experiences`).pipe(
      map((res) => res.experiences || [])
    );
  }

  getPublicEducation(): Observable<Education[]> {
    return this.http.get<{ education: Education[] }>(`${this.apiUrl}/public/education`).pipe(
      map((res) => res.education || [])
    );
  }

  getPublicCertifications(): Observable<Certification[]> {
    return this.http.get<{ certifications: Certification[] }>(`${this.apiUrl}/public/certifications`).pipe(
      map((res) => res.certifications || [])
    );
  }

  getPublicSkills(): Observable<Skill[]> {
    return this.http.get<{ skills: { [key: string]: Skill[] } }>(`${this.apiUrl}/public/skills`).pipe(
      map((res) => {
        const all: Skill[] = [];
        Object.values(res.skills || {}).forEach((arr) => all.push(...arr));
        return all;
      })
    );
  }

  // Upload
  uploadFile(file: File, folder?: string): Observable<{ url: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    return this.http.post<{ url: string; fileName: string }>(`${this.apiUrl}/upload`, formData);
  }

  deleteFile(filename: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/upload/${filename}`);
  }

  // Company
  getCompany(): Observable<Company> {
    return this.http.get<{ company: Company }>(`${this.apiUrl}/company`).pipe(
      map((res) => res.company)
    );
  }

  upsertCompany(data: Partial<Company>): Observable<Company> {
    return this.http.put<{ company: Company }>(`${this.apiUrl}/company`, data).pipe(
      map((res) => res.company)
    );
  }

  // Services
  getServicesAll(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services`);
  }

  getServiceById(id: string): Observable<Service> {
    return this.http.get<{ service: Service }>(`${this.apiUrl}/services/${id}`).pipe(
      map((res) => res.service)
    );
  }

  createService(data: Partial<Service>): Observable<Service> {
    return this.http.post<{ service: Service }>(`${this.apiUrl}/services`, data).pipe(
      map((res) => res.service)
    );
  }

  updateService(id: string, data: Partial<Service>): Observable<Service> {
    return this.http.put<{ service: Service }>(`${this.apiUrl}/services/${id}`, data).pipe(
      map((res) => res.service)
    );
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/services/${id}`);
  }

  // Clients
  getClientsAll(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/clients`);
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<{ client: Client }>(`${this.apiUrl}/clients/${id}`).pipe(
      map((res) => res.client)
    );
  }

  createClient(data: Partial<Client>): Observable<Client> {
    return this.http.post<{ client: Client }>(`${this.apiUrl}/clients`, data).pipe(
      map((res) => res.client)
    );
  }

  updateClient(id: string, data: Partial<Client>): Observable<Client> {
    return this.http.put<{ client: Client }>(`${this.apiUrl}/clients/${id}`, data).pipe(
      map((res) => res.client)
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`);
  }

  // Testimonials
  getTestimonialsAll(): Observable<Testimonial[]> {
    return this.http.get<Testimonial[]>(`${this.apiUrl}/testimonials`);
  }

  getTestimonialById(id: string): Observable<Testimonial> {
    return this.http.get<{ testimonial: Testimonial }>(`${this.apiUrl}/testimonials/${id}`).pipe(
      map((res) => res.testimonial)
    );
  }

  createTestimonial(data: Partial<Testimonial>): Observable<Testimonial> {
    return this.http.post<{ testimonial: Testimonial }>(`${this.apiUrl}/testimonials`, data).pipe(
      map((res) => res.testimonial)
    );
  }

  updateTestimonial(id: string, data: Partial<Testimonial>): Observable<Testimonial> {
    return this.http.put<{ testimonial: Testimonial }>(`${this.apiUrl}/testimonials/${id}`, data).pipe(
      map((res) => res.testimonial)
    );
  }

  deleteTestimonial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/testimonials/${id}`);
  }

  // Team members
  getTeamAll(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.apiUrl}/team`);
  }

  getTeamMemberById(id: string): Observable<TeamMember> {
    return this.http.get<{ member: TeamMember }>(`${this.apiUrl}/team/${id}`).pipe(
      map((res) => res.member)
    );
  }

  createTeamMember(data: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.post<{ member: TeamMember }>(`${this.apiUrl}/team`, data).pipe(
      map((res) => res.member)
    );
  }

  updateTeamMember(id: string, data: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.put<{ member: TeamMember }>(`${this.apiUrl}/team/${id}`, data).pipe(
      map((res) => res.member)
    );
  }

  deleteTeamMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/team/${id}`);
  }

  // Public corporate endpoints
  getPublicCompany(): Observable<Company> {
    return this.http.get<{ company: Company }>(`${this.apiUrl}/public/company`).pipe(
      map((res) => res.company)
    );
  }

  getPublicServices(): Observable<Service[]> {
    return this.http.get<{ services: Service[] }>(`${this.apiUrl}/public/services`).pipe(
      map((res) => res.services || [])
    );
  }

  getPublicClients(): Observable<Client[]> {
    return this.http.get<{ clients: Client[] }>(`${this.apiUrl}/public/clients`).pipe(
      map((res) => res.clients || [])
    );
  }

  getPublicTestimonials(): Observable<Testimonial[]> {
    return this.http.get<{ testimonials: Testimonial[] }>(`${this.apiUrl}/public/testimonials`).pipe(
      map((res) => res.testimonials || [])
    );
  }

  getPublicTeam(): Observable<TeamMember[]> {
    return this.http.get<{ team: TeamMember[] }>(`${this.apiUrl}/public/team`).pipe(
      map((res) => res.team || [])
    );
  }

  getPublicTeamMember(slug: string): Observable<TeamMember> {
    return this.http.get<{ member: TeamMember }>(`${this.apiUrl}/public/team/${slug}`).pipe(
      map((res) => res.member)
    );
  }

  // FASE 5 — Auth / password
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { token, password });
  }

  // FASE 5 — Media library
  getMedia(params?: { page?: number; limit?: number; search?: string; folder?: string; mimeType?: string }): Observable<{
    files: MediaFile[];
    total: number;
    page: number;
    limit: number;
    folders: { folder: string; _count: { _all: number } }[];
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.folder) httpParams = httpParams.set('folder', params.folder);
    if (params?.mimeType) httpParams = httpParams.set('mimeType', params.mimeType);
    return this.http.get<any>(`${this.apiUrl}/media`, { params: httpParams });
  }

  updateMediaFile(id: string, data: { altText?: string; folder?: string }): Observable<MediaFile> {
    return this.http.put<{ file: MediaFile }>(`${this.apiUrl}/media/${id}`, data).pipe(
      map((res) => res.file)
    );
  }

  deleteMediaFile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/media/${id}`);
  }

  uploadImage(file: File): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ image: MediaFile }>(`${this.apiUrl}/upload/image`, formData).pipe(
      map((res) => res.image)
    );
  }

  // FASE 5 — RBAC
  getRoles(): Observable<Role[]> {
    return this.http.get<{ roles: Role[] }>(`${this.apiUrl}/roles`).pipe(
      map((res) => res.roles)
    );
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<{ permissions: Permission[] }>(`${this.apiUrl}/roles/permissions`).pipe(
      map((res) => res.permissions)
    );
  }

  createRole(data: { name: string; description?: string; permissionIds?: string[] }): Observable<Role> {
    return this.http.post<{ role: Role }>(`${this.apiUrl}/roles`, data).pipe(
      map((res) => res.role)
    );
  }

  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.http.put<{ role: Role }>(`${this.apiUrl}/roles/${roleId}/permissions`, { permissionIds }).pipe(
      map((res) => res.role)
    );
  }

  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${roleId}`);
  }

  // FASE 5 — Users
  getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }): Observable<{
    users: User[];
    total: number;
    totalPages: number;
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.role) httpParams = httpParams.set('role', params.role);
    return this.http.get<any>(`${this.apiUrl}/users`, { params: httpParams });
  }

  assignUserRole(userId: string, roleId: string): Observable<User> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/users/${userId}/role`, { roleId }).pipe(
      map((res) => res.user)
    );
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/users/${id}`, data).pipe(
      map((res) => res.user)
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // FASE 5 — Audit
  getAuditLogs(params?: { page?: number; limit?: number; entity?: string; action?: string; search?: string }): Observable<{
    logs: AuditLog[];
    total: number;
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.entity) httpParams = httpParams.set('entity', params.entity);
    if (params?.action) httpParams = httpParams.set('action', params.action);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any>(`${this.apiUrl}/audit`, { params: httpParams });
  }

  // FASE 5 — Notifications
  getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Observable<{
    notifications: Notification[];
    total: number;
    unread: number;
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.unreadOnly) httpParams = httpParams.set('unreadOnly', 'true');
    return this.http.get<any>(`${this.apiUrl}/notifications`, { params: httpParams });
  }

  markNotificationRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/read-all`, {});
  }

  // FASE 5 — Corporate stats
  getCorporateStats(): Observable<Record<string, any>> {
    return this.http.get<{ stats: Record<string, any> }>(`${this.apiUrl}/stats/corporate`).pipe(
      map((res) => res.stats)
    );
  }
}
