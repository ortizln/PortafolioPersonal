import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-wrapper">
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-brand">
            <span class="brand-icon">&lt;/&gt;</span>
            <span class="brand-name">DevPanel</span>
          </div>
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./auth-layout.component.scss'],
})
export class AuthLayoutComponent {}
