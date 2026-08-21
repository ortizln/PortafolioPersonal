import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Directive({ selector: '[appHasPermission]', standalone: true })
export class HasPermissionDirective implements OnInit, OnDestroy {
  private sub?: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private authService: AuthService,
  ) {}

  @Input() appHasPermission: string | string[] = '';

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(() => this.evaluate());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private evaluate() {
    this.vcr.clear();
    const perm = this.appHasPermission;
    const granted =
      typeof perm === 'string'
        ? this.authService.hasPermission(perm)
        : this.authService.hasAnyPermission(perm);

    if (granted) {
      this.vcr.createEmbeddedView(this.templateRef);
    }
  }
}
