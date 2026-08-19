import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { ConfirmService } from '../core/services/confirm.service';
import { AuthService } from '../core/services/auth.service';
import { Experience, Education, Certification, Skill, Language, SocialLink, Profile } from '../core/models';

type Tab = 'profile' | 'experience' | 'education' | 'certificates' | 'skills' | 'languages' | 'social';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private auth = inject(AuthService);

  activeTab: Tab = 'profile';
  loading = true;

  // Profile
  profile: Profile | null = null;
  profileForm: any = {};
  savingProfile = false;
  cvFile: File | null = null;
  photoFile: File | null = null;
  uploadingCv = false;
  uploadingPhoto = false;

  // Experience
  experiences: Experience[] = [];
  expForm: any = this.emptyExp();
  editingExpId: number | null = null;
  showExpForm = false;
  savingExp = false;

  // Education
  educations: Education[] = [];
  eduForm: any = this.emptyEdu();
  editingEduId: number | null = null;
  showEduForm = false;
  savingEdu = false;

  // Certificates
  certificates: Certification[] = [];
  certForm: any = this.emptyCert();
  editingCertId: number | null = null;
  showCertForm = false;
  savingCert = false;
  certImageFile: File | null = null;
  certFile: File | null = null;

  // Skills
  skills: Skill[] = [];
  skillForm: any = this.emptySkill();
  editingSkillId: string | null = null;
  showSkillForm = false;
  savingSkill = false;

  // Languages
  languages: Language[] = [];
  langForm: any = this.emptyLang();
  editingLangId: string | null = null;
  showLangForm = false;
  savingLang = false;

  // Social Links
  socialLinks: SocialLink[] = [];
  socialForm: any = this.emptySocial();
  editingSocialId: string | null = null;
  showSocialForm = false;
  savingSocial = false;

  toasts: { message: string; type: 'success' | 'error'; id: number }[] = [];
  private toastId = 0;

  readonly SKILL_CATEGORIES = ['FRONTEND', 'BACKEND', 'DEVOPS', 'DATABASE', 'DESIGN', 'CLOUD', 'MOBILE', 'OTHER'];
  readonly SOCIAL_PLATFORMS = [
    { name: 'GitHub', icon: 'bi-github' },
    { name: 'LinkedIn', icon: 'bi-linkedin' },
    { name: 'Twitter/X', icon: 'bi-twitter-x' },
    { name: 'YouTube', icon: 'bi-youtube' },
    { name: 'Instagram', icon: 'bi-instagram' },
    { name: 'Facebook', icon: 'bi-facebook' },
    { name: 'Website', icon: 'bi-globe' },
    { name: 'Email', icon: 'bi-envelope' },
    { name: 'Otro', icon: 'bi-link-45deg' },
  ];

  ngOnInit(): void {
    this.loadTab(this.activeTab);
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
    this.loadTab(tab);
  }

  private loadTab(tab: Tab): void {
    this.loading = true;
    switch (tab) {
      case 'profile': this.loadProfile(); break;
      case 'experience': this.loadExperiences(); break;
      case 'education': this.loadEducations(); break;
      case 'certificates': this.loadCertificates(); break;
      case 'skills': this.loadSkills(); break;
      case 'languages': this.loadLanguages(); break;
      case 'social': this.loadSocialLinks(); break;
    }
  }

  // ─── PROFILE ─────────────────────────────────────────────
  private loadProfile(): void {
    this.api.getProfile().subscribe({
      next: (p) => { this.profile = p; this.profileForm = { ...p }; },
      error: () => { this.profileForm = {}; },
      complete: () => this.loading = false,
    });
  }

  saveProfile(): void {
    this.savingProfile = true;
    this.api.updateProfile(this.profileForm).subscribe({
      next: (p) => { this.profile = p; this.toast('Perfil actualizado', 'success'); },
      error: (e) => this.toast(e?.error?.error || 'Error al guardar', 'error'),
      complete: () => this.savingProfile = false,
    });
  }

  onPhotoSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoFile = file;
    this.uploadingPhoto = true;
    this.api.uploadPhoto(file).subscribe({
      next: (res) => { this.profileForm.profileImage = res.profileImage; this.toast('Foto actualizada', 'success'); },
      error: (e) => this.toast(e?.error?.error || 'Error al subir foto', 'error'),
      complete: () => { this.uploadingPhoto = false; this.photoFile = null; },
    });
  }

  onCvSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.cvFile = file;
    this.uploadingCv = true;
    this.api.uploadCV(file).subscribe({
      next: (res) => { this.profileForm.cvFile = res.cvFile; this.toast('CV actualizado', 'success'); },
      error: (e) => this.toast(e?.error?.error || 'Error al subir CV', 'error'),
      complete: () => { this.uploadingCv = false; this.cvFile = null; },
    });
  }

  // ─── EXPERIENCE ──────────────────────────────────────────
  private loadExperiences(): void {
    this.api.getExperiencesAll().subscribe({
      next: (list) => this.experiences = list,
      complete: () => this.loading = false,
    });
  }

  private emptyExp(): any {
    return { company: '', position: '', description: '', startDate: '', endDate: '', current: false, location: '' };
  }

  openExpForm(exp?: Experience): void {
    if (exp) {
      this.editingExpId = exp.id;
      this.expForm = { ...exp, startDate: exp.startDate?.slice(0, 10) || '', endDate: exp.endDate?.slice(0, 10) || '' };
    } else {
      this.editingExpId = null;
      this.expForm = this.emptyExp();
    }
    this.showExpForm = true;
  }

  saveExp(): void {
    if (!this.expForm.company || !this.expForm.position) return;
    this.savingExp = true;
    const obs = this.editingExpId
      ? this.api.updateExperience(this.editingExpId, this.expForm)
      : this.api.createExperience(this.expForm);
    obs.subscribe({
      next: () => { this.toast(this.editingExpId ? 'Experiencia actualizada' : 'Experiencia creada', 'success'); this.showExpForm = false; this.loadExperiences(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
      complete: () => this.savingExp = false,
    });
  }

  async deleteExp(id: number): Promise<void> {
    if (!await this.confirm.confirm({ message: '¿Eliminar esta experiencia?' })) return;
    this.api.deleteExperience(id).subscribe({
      next: () => { this.toast('Experiencia eliminada', 'success'); this.loadExperiences(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
    });
  }

  // ─── EDUCATION ───────────────────────────────────────────
  private loadEducations(): void {
    this.api.getEducationAll().subscribe({
      next: (list) => this.educations = list,
      complete: () => this.loading = false,
    });
  }

  private emptyEdu(): any {
    return { institution: '', degree: '', field: '', level: '', description: '', startDate: '', endDate: '', current: false, grade: '' };
  }

  openEduForm(edu?: Education): void {
    if (edu) {
      this.editingEduId = edu.id;
      this.eduForm = { ...edu, startDate: edu.startDate?.slice(0, 10) || '', endDate: edu.endDate?.slice(0, 10) || '' };
    } else {
      this.editingEduId = null;
      this.eduForm = this.emptyEdu();
    }
    this.showEduForm = true;
  }

  saveEdu(): void {
    if (!this.eduForm.institution || !this.eduForm.degree) return;
    this.savingEdu = true;
    const obs = this.editingEduId
      ? this.api.updateEducation(this.editingEduId, this.eduForm)
      : this.api.createEducation(this.eduForm);
    obs.subscribe({
      next: () => { this.toast(this.editingEduId ? 'Educación actualizada' : 'Educación creada', 'success'); this.showEduForm = false; this.loadEducations(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
      complete: () => this.savingEdu = false,
    });
  }

  async deleteEdu(id: number): Promise<void> {
    if (!await this.confirm.confirm({ message: '¿Eliminar esta educación?' })) return;
    this.api.deleteEducation(id).subscribe({
      next: () => { this.toast('Educación eliminada', 'success'); this.loadEducations(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
    });
  }

  // ─── CERTIFICATES ────────────────────────────────────────
  private loadCertificates(): void {
    this.api.getCertificationsAll().subscribe({
      next: (list) => this.certificates = list,
      complete: () => this.loading = false,
    });
  }

  private emptyCert(): any {
    return { name: '', issuingOrganization: '', description: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '', category: '' };
  }

  openCertForm(cert?: Certification): void {
    if (cert) {
      this.editingCertId = cert.id;
      this.certForm = { ...cert, issueDate: cert.issueDate?.slice(0, 10) || '', expiryDate: cert.expiryDate?.slice(0, 10) || '' };
    } else {
      this.editingCertId = null;
      this.certForm = this.emptyCert();
    }
    this.showCertForm = true;
  }

  saveCert(): void {
    if (!this.certForm.name || !this.certForm.issuingOrganization) return;
    this.savingCert = true;
    const obs = this.editingCertId
      ? this.api.updateCertification(this.editingCertId, this.certForm)
      : this.api.createCertification(this.certForm);
    obs.subscribe({
      next: (res: any) => {
        const certId = this.editingCertId || res?.certification?.id || res?.id;
        const uploads: Promise<any>[] = [];
        if (this.certImageFile && certId) uploads.push(this.api.uploadCertificationImage(certId, this.certImageFile).toPromise());
        if (this.certFile && certId) uploads.push(this.api.uploadCertificationFile(certId, this.certFile).toPromise());
        Promise.all(uploads).then(() => {
          this.toast(this.editingCertId ? 'Certificado actualizado' : 'Certificado creado', 'success');
          this.showCertForm = false;
          this.certImageFile = null;
          this.certFile = null;
          this.loadCertificates();
        }).catch(() => {
          this.toast('Certificado guardado pero error subiendo archivos', 'error');
          this.showCertForm = false;
          this.loadCertificates();
        });
      },
      error: (e) => { this.savingCert = false; this.toast(e?.error?.error || 'Error', 'error'); },
      complete: () => this.savingCert = false,
    });
  }

  async deleteCert(id: number): Promise<void> {
    if (!await this.confirm.confirm({ message: '¿Eliminar este certificado?' })) return;
    this.api.deleteCertification(id).subscribe({
      next: () => { this.toast('Certificado eliminado', 'success'); this.loadCertificates(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
    });
  }

  onCertImageSelect(event: Event): void {
    this.certImageFile = (event.target as HTMLInputElement).files?.[0] || null;
  }

  onCertFileSelect(event: Event): void {
    this.certFile = (event.target as HTMLInputElement).files?.[0] || null;
  }

  // ─── SKILLS ──────────────────────────────────────────────
  private loadSkills(): void {
    this.api.getSkillsAll().subscribe({
      next: (list) => this.skills = list.sort((a, b) => (a.order || 0) - (b.order || 0)),
      complete: () => this.loading = false,
    });
  }

  private emptySkill(): any {
    return { name: '', percentage: 50, level: '', icon: '', color: '#64ffda', order: 0, category: 'OTHER' };
  }

  openSkillForm(skill?: Skill): void {
    if (skill) {
      this.editingSkillId = skill.id;
      this.skillForm = { ...skill };
    } else {
      this.editingSkillId = null;
      this.skillForm = this.emptySkill();
    }
    this.showSkillForm = true;
  }

  saveSkill(): void {
    if (!this.skillForm.name) return;
    this.savingSkill = true;
    const obs = this.editingSkillId
      ? this.api.updateSkill(this.editingSkillId, this.skillForm)
      : this.api.createSkill(this.skillForm);
    obs.subscribe({
      next: () => { this.toast(this.editingSkillId ? 'Habilidad actualizada' : 'Habilidad creada', 'success'); this.showSkillForm = false; this.loadSkills(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
      complete: () => this.savingSkill = false,
    });
  }

  async deleteSkill(id: string): Promise<void> {
    if (!await this.confirm.confirm({ message: '¿Eliminar esta habilidad?' })) return;
    this.api.deleteSkill(id).subscribe({
      next: () => { this.toast('Habilidad eliminada', 'success'); this.loadSkills(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
    });
  }

  skillLevel(pct: number): string {
    if (pct >= 90) return 'Experto';
    if (pct >= 75) return 'Avanzado';
    if (pct >= 50) return 'Intermedio';
    if (pct >= 25) return 'Básico';
    return 'Aprendiz';
  }

  // ─── LANGUAGES ───────────────────────────────────────────
  private loadLanguages(): void {
    this.api.getLanguagesAll().subscribe({
      next: (list) => this.languages = list,
      complete: () => this.loading = false,
    });
  }

  private emptyLang(): any {
    return { name: '', level: 'Intermediate', percentage: 50, certification: '' };
  }

  openLangForm(lang?: Language): void {
    if (lang) {
      this.editingLangId = lang.id;
      this.langForm = { ...lang };
    } else {
      this.editingLangId = null;
      this.langForm = this.emptyLang();
    }
    this.showLangForm = true;
  }

  saveLang(): void {
    if (!this.langForm.name) return;
    this.savingLang = true;
    const obs = this.editingLangId
      ? this.api.updateLanguage(this.editingLangId, this.langForm)
      : this.api.createLanguage(this.langForm);
    obs.subscribe({
      next: () => { this.toast(this.editingLangId ? 'Idioma actualizado' : 'Idioma creado', 'success'); this.showLangForm = false; this.loadLanguages(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
      complete: () => this.savingLang = false,
    });
  }

  async deleteLang(id: string): Promise<void> {
    if (!await this.confirm.confirm({ message: '¿Eliminar este idioma?' })) return;
    this.api.deleteLanguage(id).subscribe({
      next: () => { this.toast('Idioma eliminado', 'success'); this.loadLanguages(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
    });
  }

  // ─── SOCIAL LINKS ────────────────────────────────────────
  private loadSocialLinks(): void {
    this.api.getSocialLinksAll().subscribe({
      next: (list) => this.socialLinks = list,
      complete: () => this.loading = false,
    });
  }

  private emptySocial(): any {
    return { platform: '', url: '', icon: 'bi-link-45deg', order: this.socialLinks.length + 1, isActive: true };
  }

  openSocialForm(link?: SocialLink): void {
    if (link) {
      this.editingSocialId = link.id;
      this.socialForm = { ...link };
    } else {
      this.editingSocialId = null;
      this.socialForm = this.emptySocial();
    }
    this.showSocialForm = true;
  }

  onPlatformChange(platform: string): void {
    const found = this.SOCIAL_PLATFORMS.find(p => p.name === platform);
    if (found) this.socialForm.icon = found.icon;
  }

  saveSocial(): void {
    if (!this.socialForm.url) return;
    this.savingSocial = true;
    const obs = this.editingSocialId
      ? this.api.updateSocialLink(this.editingSocialId, this.socialForm)
      : this.api.createSocialLink(this.socialForm);
    obs.subscribe({
      next: () => { this.toast(this.editingSocialId ? 'Red actualizada' : 'Red creada', 'success'); this.showSocialForm = false; this.loadSocialLinks(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
      complete: () => this.savingSocial = false,
    });
  }

  async deleteSocial(id: string): Promise<void> {
    if (!await this.confirm.confirm({ message: '¿Eliminar esta red social?' })) return;
    this.api.deleteSocialLink(id).subscribe({
      next: () => { this.toast('Red social eliminada', 'success'); this.loadSocialLinks(); },
      error: (e) => this.toast(e?.error?.error || 'Error', 'error'),
    });
  }

  // ─── UTILS ───────────────────────────────────────────────
  getUploadUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return this.api.getUploadUrl(path);
  }

  private toast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastId;
    this.toasts.push({ message, type, id });
    setTimeout(() => this.toasts = this.toasts.filter(t => t.id !== id), 3500);
  }
}
