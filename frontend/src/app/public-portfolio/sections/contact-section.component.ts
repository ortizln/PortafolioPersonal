import { Component, Input, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Profile, SocialLink } from '../../core/models';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-contact-section',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <section id="contact" class="contact-section">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Contact</span>
          <h2 class="section-title">Get In Touch</h2>
          <div class="section-divider"></div>
        </div>

        <div class="contact-grid">
          <div class="contact-info" data-aos="fade-right">
            <h3 class="contact-heading">Let's work together</h3>
            <p class="contact-text">
              I'm always open to new opportunities, collaborations, and interesting projects.
              Feel free to reach out!
            </p>

            <div class="contact-details">
              <div class="contact-item" *ngIf="profile?.email">
                <div class="contact-item-icon">
                  <i class="bi bi-envelope-fill"></i>
                </div>
                <div class="contact-item-text">
                  <span class="contact-item-label">Email</span>
                  <a [href]="'mailto:' + profile!.email" class="contact-item-value">{{ profile!.email }}</a>
                </div>
              </div>

              <div class="contact-item" *ngIf="profile?.phone">
                <div class="contact-item-icon">
                  <i class="bi bi-telephone-fill"></i>
                </div>
                <div class="contact-item-text">
                  <span class="contact-item-label">Phone</span>
                  <span class="contact-item-value">{{ profile!.phone }}</span>
                </div>
              </div>

              <div class="contact-item" *ngIf="profile?.location">
                <div class="contact-item-icon">
                  <i class="bi bi-geo-alt-fill"></i>
                </div>
                <div class="contact-item-text">
                  <span class="contact-item-label">Location</span>
                  <span class="contact-item-value">{{ profile!.location }}</span>
                </div>
              </div>
            </div>

            <div class="contact-socials">
              <a
                *ngFor="let link of socialLinks"
                [href]="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-social-link"
                [attr.aria-label]="link.platform"
              >
                <i class="bi" [ngClass]="getSocialIcon(link.platform)"></i>
              </a>
            </div>
          </div>

          <div class="contact-form-wrapper" data-aos="fade-left">
            <div class="success-message" *ngIf="submitted">
              <i class="bi bi-check-circle-fill"></i>
              <h3>Message Sent!</h3>
              <p>Thank you for reaching out. I'll get back to you soon.</p>
              <button class="btn-secondary" (click)="submitted = false">Send Another</button>
            </div>

            <form
              *ngIf="!submitted"
              #contactForm="ngForm"
              (ngSubmit)="onSubmit(contactForm)"
              class="contact-form"
            >
              <div class="form-group">
                <label class="form-label" for="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  class="form-input"
                  [(ngModel)]="formData.name"
                  required
                  minlength="2"
                  #name="ngModel"
                  placeholder="Your name"
                />
                <span class="form-error" *ngIf="name.invalid && name.touched">
                  Please enter your name
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  class="form-input"
                  [(ngModel)]="formData.email"
                  required
                  email
                  #email="ngModel"
                  placeholder="your@email.com"
                />
                <span class="form-error" *ngIf="email.invalid && email.touched">
                  Please enter a valid email
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="subject">Subject</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  class="form-input"
                  [(ngModel)]="formData.subject"
                  required
                  minlength="3"
                  #subject="ngModel"
                  placeholder="What's this about?"
                />
                <span class="form-error" *ngIf="subject.invalid && subject.touched">
                  Please enter a subject
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  class="form-input form-textarea"
                  rows="5"
                  [(ngModel)]="formData.message"
                  required
                  minlength="10"
                  #message="ngModel"
                  placeholder="Your message..."
                ></textarea>
                <span class="form-error" *ngIf="message.invalid && message.touched">
                  Message must be at least 10 characters
                </span>
              </div>

              <button
                type="submit"
                class="btn-primary"
                [disabled]="contactForm.invalid || sending"
              >
                <span *ngIf="!sending">
                  <i class="bi bi-send-fill"></i> Send Message
                </span>
                <span *ngIf="sending">
                  <i class="bi bi-hourglass-split"></i> Sending...
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
