import { Injectable, Injector, ApplicationRef, createComponent } from '@angular/core';
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal.component';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary';
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private appRef: ApplicationRef, private injector: Injector) {}

  confirm(options: ConfirmOptions): Promise<boolean> {
    const componentRef = createComponent(ConfirmModalComponent, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector,
    });

    const instance = componentRef.instance;
    instance.title = options.title ?? 'Confirm';
    instance.message = options.message;
    instance.confirmText = options.confirmText ?? 'Delete';
    instance.cancelText = options.cancelText ?? 'Cancel';
    instance.type = options.type ?? 'danger';

    document.body.appendChild(componentRef.location.nativeElement);
    this.appRef.attachView(componentRef.hostView);

    return new Promise((resolve) => {
      instance.confirmed.subscribe((result: boolean) => {
        resolve(result);
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        componentRef.location.nativeElement.remove();
      });
    });
  }
}
