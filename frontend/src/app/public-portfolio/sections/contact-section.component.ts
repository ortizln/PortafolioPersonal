import { Component, Input, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Profile, SocialLink } from '../../core/models';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  template: `
    <section id="contact" class="contact-section" aria-label="Contacto">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Contacto</span>
          <h2 class="section-title">Hablemos</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>

        <div class="contact-grid">
          <div class="contact-info" data-aos="fade-right">
            <h3 class="contact-heading">Trabajemos juntos</h3>
            <p class="contact-text">
              Siempre estoy abierto a nuevas oportunidades, colaboraciones y proyectos interesantes.
              ¡No dudes en contactarme!
            </p>

            <div class="contact-details">
              <div class="contact-item" *ngIf="profile?.email">
                <div class="contact-item-icon" aria-hidden="true">
                  <i class="bi bi-envelope-fill" aria-hidden="true"></i>
                </div>
                <div class="contact-item-text">
                  <span class="contact-item-label">Correo</span>
                  <a [href]="'mailto:' + profile!.email" class="contact-item-value">{{ profile!.email }}</a>
                </div>
              </div>

              <div class="contact-item" *ngIf="profile?.phone">
                <div class="contact-item-icon" aria-hidden="true">
                  <i class="bi bi-telephone-fill" aria-hidden="true"></i>
                </div>
                <div class="contact-item-text">
                  <span class="contact-item-label">Teléfono</span>
                  <span class="contact-item-value">{{ profile!.phone }}</span>
                </div>
              </div>

              <div class="contact-item" *ngIf="profile?.location">
                <div class="contact-item-icon" aria-hidden="true">
                  <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
                </div>
                <div class="contact-item-text">
                  <span class="contact-item-label">Ubicación</span>
                  <span class="contact-item-value">{{ profile!.location }}</span>
                </div>
              </div>
            </div>

            <div class="contact-socials" aria-label="Redes sociales">
              <a
                *ngFor="let link of socialLinks"
                [href]="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-social-link"
                [attr.aria-label]="'Visitar perfil de ' + link.platform"
              >
                <i class="bi" [ngClass]="getSocialIcon(link.platform)" aria-hidden="true"></i>
              </a>
            </div>
          </div>

          <div class="contact-form-wrapper" data-aos="fade-left">
            <div class="success-message" *ngIf="submitted" role="alert" aria-live="polite">
              <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
              <h3>¡Mensaje Enviado!</h3>
              <p>Gracias por contactarme. Te responderé pronto.</p>
              <button class="btn-secondary" (click)="submitted = false">Enviar Otro</button>
            </div>

            <form
              *ngIf="!submitted"
              #contactForm="ngForm"
              (ngSubmit)="onSubmit(contactForm)"
              class="contact-form"
              novalidate
            >
              <div class="form-group">
                <label class="form-label" for="name">Nombre</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  class="form-input"
                  [(ngModel)]="formData.name"
                  required
                  minlength="2"
                  #name="ngModel"
                  placeholder="Tu nombre"
                  [attr.aria-invalid]="name.invalid && name.touched"
                  [attr.aria-describedby]="(name.invalid && name.touched) ? 'name-error' : null"
                />
                <span class="form-error" *ngIf="name.invalid && name.touched" id="name-error" role="alert">
                  Ingresa tu nombre
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="email">Correo</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  class="form-input"
                  [(ngModel)]="formData.email"
                  required
                  email
                  #email="ngModel"
                  placeholder="tu@correo.com"
                  [attr.aria-invalid]="email.invalid && email.touched"
                  [attr.aria-describedby]="(email.invalid && email.touched) ? 'email-error' : null"
                />
                <span class="form-error" *ngIf="email.invalid && email.touched" id="email-error" role="alert">
                  Ingresa un correo válido
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="subject">Asunto</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  class="form-input"
                  [(ngModel)]="formData.subject"
                  required
                  minlength="3"
                  #subject="ngModel"
                  placeholder="¿De qué trata?"
                  [attr.aria-invalid]="subject.invalid && subject.touched"
                  [attr.aria-describedby]="(subject.invalid && subject.touched) ? 'subject-error' : null"
                />
                <span class="form-error" *ngIf="subject.invalid && subject.touched" id="subject-error" role="alert">
                  Ingresa un asunto
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="message">Mensaje</label>
                <textarea
                  id="message"
                  name="message"
                  class="form-input form-textarea"
                  rows="5"
                  [(ngModel)]="formData.message"
                  required
                  minlength="10"
                  #message="ngModel"
                  placeholder="Tu mensaje..."
                  [attr.aria-invalid]="message.invalid && message.touched"
                  [attr.aria-describedby]="(message.invalid && message.touched) ? 'message-error' : null"
                ></textarea>
                <span class="form-error" *ngIf="message.invalid && message.touched" id="message-error" role="alert">
                  El mensaje debe tener al menos 10 caracteres
                </span>
              </div>

              <button
                type="submit"
                class="btn-primary"
                [disabled]="contactForm.invalid || sending"
                [attr.aria-busy]="sending"
              >
                <span *ngIf="!sending">
                  <i class="bi bi-send-fill" aria-hidden="true"></i> Enviar Mensaje
                </span>
                <span *ngIf="sending">
                  <i class="bi bi-hourglass-split" aria-hidden="true"></i> Enviando...
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./contact-section.component.scss'],
})
export class ContactSectionComponent {
  private api = inject(ApiService);

  @Input() profile: Profile | null = null;
  @Input() socialLinks: SocialLink[] = [];

  formData = { name: '', email: '', subject: '', message: '' };
  submitted = false;
  sending = false;

  getSocialIcon(platform: string): string {
    const map: Record<string, string> = {
      github: 'bi-github',
      linkedin: 'bi-linkedin',
      twitter: 'bi-twitter-x',
      'x-twitter': 'bi-twitter-x',
      youtube: 'bi-youtube',
      instagram: 'bi-instagram',
      facebook: 'bi-facebook',
      twitch: 'bi-twitch',
      discord: 'bi-discord',
      email: 'bi-envelope-fill',
      website: 'bi-globe2',
      medium: 'bi-medium',
      dev: 'bi-code-slash',
      stackoverflow: 'bi-stack-overflow',
      telegram: 'bi-telegram',
      whatsapp: 'bi-whatsapp',
    };
    return map[platform.toLowerCase()] || 'bi-link-45deg';
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;
    this.sending = true;

    this.api.createContactMessage(this.formData).subscribe({
      next: () => {
        this.submitted = true;
        this.sending = false;
        this.formData = { name: '', email: '', subject: '', message: '' };
        form.resetForm();
      },
      error: () => {
        this.submitted = true;
        this.sending = false;
      },
    });
  }
}
