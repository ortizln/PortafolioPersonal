import { Component, Input } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { Certification } from '../../core/models';
import { UploadUrlPipe } from '../../shared/upload-url.pipe';

@Component({
  selector: 'app-certifications-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, UploadUrlPipe],
  template: `
    <section id="certifications" class="certifications-section" aria-label="Certificaciones">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <span class="section-subtitle">Certificaciones</span>
          <h2 class="section-title">Licencias y Certificaciones</h2>
          <div class="section-divider" aria-hidden="true"></div>
        </div>

        <div class="cert-grid">
          <div
            class="cert-card"
            *ngFor="let cert of certifications; let i = index"
            data-aos="fade-up"
            [attr.data-aos-delay]="i * 80"
          >
            <img
              *ngIf="cert.imageUrl"
              [src]="cert.imageUrl | uploadUrl"
              [alt]="'Certificado: ' + cert.name + ' - ' + cert.issuingOrganization"
              class="cert-image"
            />
            <div class="cert-card-header">
              <div class="cert-icon" aria-hidden="true">
                <i class="bi bi-patch-check-fill" aria-hidden="true"></i>
              </div>
              <div class="cert-info">
                <h3 class="cert-name">{{ cert.name }}</h3>
                <span class="cert-issuer">{{ cert.issuingOrganization }}</span>
              </div>
            </div>

            <div class="cert-meta">
              <span class="cert-date">
                <i class="bi bi-calendar-check" aria-hidden="true"></i>
                Expedido {{ cert.issueDate | date:'MMM yyyy' }}
              </span>
              <span *ngIf="cert.expiryDate" class="cert-expiry">
                <i class="bi bi-clock" aria-hidden="true"></i>
                Vence {{ cert.expiryDate | date:'MMM yyyy' }}
              </span>
              <span *ngIf="!cert.expiryDate" class="cert-no-expiry">
                <i class="bi bi-infinity" aria-hidden="true"></i> Sin vencimiento
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
                [attr.aria-label]="'Ver credencial de ' + cert.name"
              >
                <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> Ver Credencial
              </a>
              <a
                *ngFor="let file of cert.files"
                [href]="file.path | uploadUrl"
                target="_blank"
                class="cert-download"
                [attr.aria-label]="'Descargar ' + file.filename"
              >
                <i class="bi bi-file-pdf" aria-hidden="true"></i> {{ file.filename }}
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
