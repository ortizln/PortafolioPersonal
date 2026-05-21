import { Component, Output, EventEmitter } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  @Output() confirmed = new EventEmitter<boolean>();

  title = 'Confirm';
  message = 'Are you sure?';
  confirmText = 'Delete';
  cancelText = 'Cancel';
  type: 'danger' | 'primary' = 'danger';

  onConfirm(): void {
    this.confirmed.emit(true);
  }

  onCancel(): void {
    this.confirmed.emit(false);
  }

  onBackdropClick(): void {
    this.confirmed.emit(false);
  }
}
