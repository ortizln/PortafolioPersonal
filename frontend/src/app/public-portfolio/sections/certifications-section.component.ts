import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Certification } from '../../core/models';

@Component({
  selector: 'app-certifications-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  template: `
    <section id="certifications" class="certifications-section">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Certifications</span>
          <h2 class="section-title">Licenses & Certifications</h2>
          <div class="section-divider"></div>
        </div>

        <div class="cert-grid">
          <div
            class="cert-card"
            *ngFor="let cert of certifications; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 80"
          >
            <div class="cert-card-header">
              <div class="cert-icon">
                <i class="bi bi-patch-check-fill"></i>
              </div>
              <div class="cert-info">
                <h3 class="cert-name">{{ cert.name }}</h3>
                <span class="cert-issuer">{{ cert.issuer }}</span>
              </div>
            </div>

            <div class="cert-meta">
              <span class="cert-date">
                <i class="bi bi-calendar-check"></i>
                Issued {{ cert.issueDate | date:'MMM yyyy' }}
              </span>
              <span *ngIf="!cert.doesNotExpire && cert.expirationDate" class="cert-expiry">
                <i class="bi bi-clock"></i>
                Expires {{ cert.expirationDate | date:'MMM yyyy' }}
              </span>
              <span *ngIf="cert.doesNotExpire" class="cert-no-expiry">
                <i class="bi bi-infinity"></i> No Expiry
              </span>
            </div>

            <p class="cert-description" *ngIf="cert.description">{{ cert.description }}</p>

            <div class="cert-actions">
              <a
                *ngIf="cert.credentialUrl"
                [href]="cert.credentialUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="cert-link"
              >
                <i class="bi bi-box-arrow-up-right"></i> Show Credential
              </a>
              <a
                *ngFor="let file of cert.files"
                [href]="file.fileUrl"
                target="_blank"
                class="cert-download"
              >
                <i class="bi bi-file-pdf"></i> {{ file.fileName }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./certifications-section.component.scss'],
})
export class CertificationsSectionComponent {
  @Input() certifications: Certification[] = [];
}
