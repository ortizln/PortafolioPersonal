import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User, Profile, Experience, Education, Certification,
  Project, ProjectImage, Technology, Skill, Language,
  SocialLink, Repository, ContactMessage, Category,
  Setting, CertificateFile,
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
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
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
    return this.http.get<Certification>(`${this.apiUrl}/certifications/${id}`);
  }

  createCertification(data: Partial<Certification>): Observable<Certification> {
    return this.http.post<Certification>(`${this.apiUrl}/certifications`, data);
  }

  updateCertification(id: number, data: Partial<Certification>): Observable<Certification> {
    return this.http.put<Certification>(`${this.apiUrl}/certifications/${id}`, data);
  }

  deleteCertification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/certifications/${id}`);
  }

  uploadCertificationFile(id: number, file: File): Observable<CertificateFile> {
    const formData = new FormData();
    formData.append('certificate', file);
    return this.http.post<CertificateFile>(`${this.apiUrl}/certifications/${id}/files`, formData);
  }

  // Projects
  getProjectsAll(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`);
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`);
  }

  createProject(data: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, data);
  }

  updateProject(id: number, data: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  addProjectImage(projectId: number, file: File, isPrimary?: boolean): Observable<ProjectImage> {
    const formData = new FormData();
    formData.append('project', file);
    if (isPrimary != null) formData.append('isPrimary', String(isPrimary));
    return this.http.post<ProjectImage>(`${this.apiUrl}/projects/${projectId}/images`, formData);
  }

  removeProjectImage(projectId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}/images/${imageId}`);
  }

  // Skills
  getSkillsAll(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/skills`);
  }

  getSkillById(id: number): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/skills/${id}`);
  }

  createSkill(data: Partial<Skill>): Observable<Skill> {
    return this.http.post<Skill>(`${this.apiUrl}/skills`, data);
  }

  updateSkill(id: number, data: Partial<Skill>): Observable<Skill> {
    return this.http.put<Skill>(`${this.apiUrl}/skills/${id}`, data);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/skills/${id}`);
  }

  // Languages
  getLanguagesAll(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.apiUrl}/languages`);
  }

  getLanguageById(id: number): Observable<Language> {
    return this.http.get<Language>(`${this.apiUrl}/languages/${id}`);
  }

  createLanguage(data: Partial<Language>): Observable<Language> {
    return this.http.post<Language>(`${this.apiUrl}/languages`, data);
  }

  updateLanguage(id: number, data: Partial<Language>): Observable<Language> {
    return this.http.put<Language>(`${this.apiUrl}/languages/${id}`, data);
  }

  deleteLanguage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/languages/${id}`);
  }

  // Social Links
  getSocialLinksAll(): Observable<SocialLink[]> {
    return this.http.get<SocialLink[]>(`${this.apiUrl}/social-links`);
  }

  getSocialLinkById(id: number): Observable<SocialLink> {
    return this.http.get<SocialLink>(`${this.apiUrl}/social-links/${id}`);
  }

  createSocialLink(data: Partial<SocialLink>): Observable<SocialLink> {
    return this.http.post<SocialLink>(`${this.apiUrl}/social-links`, data);
  }

  updateSocialLink(id: number, data: Partial<SocialLink>): Observable<SocialLink> {
    return this.http.put<SocialLink>(`${this.apiUrl}/social-links/${id}`, data);
  }

  deleteSocialLink(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social-links/${id}`);
  }

  // Repositories
  getRepositoriesAll(): Observable<Repository[]> {
    return this.http.get<Repository[]>(`${this.apiUrl}/repositories`);
  }

  getRepositoryById(id: number): Observable<Repository> {
    return this.http.get<Repository>(`${this.apiUrl}/repositories/${id}`);
  }

  createRepository(data: Partial<Repository>): Observable<Repository> {
    return this.http.post<Repository>(`${this.apiUrl}/repositories`, data);
  }

  updateRepository(id: number, data: Partial<Repository>): Observable<Repository> {
    return this.http.put<Repository>(`${this.apiUrl}/repositories/${id}`, data);
  }

  deleteRepository(id: number): Observable<void> {
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

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Contact
  getContactMessagesAll(params?: { read?: boolean }): Observable<ContactMessage[]> {
    let httpParams = new HttpParams();
    if (params?.read != null) httpParams = httpParams.set('read', String(params.read));
    return this.http.get<ContactMessage[]>(`${this.apiUrl}/contact`, { params: httpParams });
  }

  getContactMessageById(id: number): Observable<ContactMessage> {
    return this.http.get<ContactMessage>(`${this.apiUrl}/contact/${id}`);
  }

  createContactMessage(data: Partial<ContactMessage>): Observable<ContactMessage> {
    return this.http.post<ContactMessage>(`${this.apiUrl}/contact`, data);
  }

  deleteContactMessage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/contact/${id}`);
  }

  markContactMessageAsRead(id: number): Observable<ContactMessage> {
    return this.http.put<ContactMessage>(`${this.apiUrl}/contact/${id}/read`, {});
  }

  // Settings
  getSettingsAll(): Observable<Setting[]> {
    return this.http.get<Setting[]>(`${this.apiUrl}/settings`);
  }

  getSettingByKey(key: string): Observable<Setting> {
    return this.http.get<Setting>(`${this.apiUrl}/settings/${key}`);
  }

  updateSetting(key: string, data: Partial<Setting>): Observable<Setting> {
    return this.http.put<Setting>(`${this.apiUrl}/settings/${key}`, data);
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

  getPublicProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/public/projects`);
  }

  getPublicProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/public/projects/${id}`);
  }

  getPublicExperiences(): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.apiUrl}/public/experiences`);
  }

  getPublicEducation(): Observable<Education[]> {
    return this.http.get<Education[]>(`${this.apiUrl}/public/education`);
  }

  getPublicCertifications(): Observable<Certification[]> {
    return this.http.get<Certification[]>(`${this.apiUrl}/public/certifications`);
  }

  getPublicSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/public/skills`);
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
}
