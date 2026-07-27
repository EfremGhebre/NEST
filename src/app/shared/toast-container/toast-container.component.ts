import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="toast-stack" aria-live="polite" aria-atomic="false">
      <article
        *ngFor="let message of toastService.messages$ | async"
        class="toast-item"
        [class.success]="message.variant === 'success'"
        [class.error]="message.variant === 'error'"
        [class.info]="message.variant === 'info'"
        role="status"
      >
        <p>{{ message.text }}</p>
        <button
          type="button"
          class="dismiss"
          (click)="toastService.dismiss(message.id)"
          aria-label="Dismiss notification"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </article>
    </section>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      right: 1rem;
      top: 1rem;
      z-index: 1400;
      display: grid;
      gap: 0.5rem;
      width: min(360px, calc(100vw - 2rem));
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background: var(--color-surface);
      color: var(--color-text-primary);
      box-shadow: 0 10px 24px rgba(20, 20, 30, 0.16);
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
      padding: 0.6rem 0.65rem 0.6rem 0.75rem;
    }

    .toast-item.success {
      border-color: color-mix(in srgb, var(--color-success) 45%, var(--color-border));
    }

    .toast-item.error {
      border-color: color-mix(in srgb, var(--color-danger) 45%, var(--color-border));
    }

    .toast-item.info {
      border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
    }

    .toast-item p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.4;
      flex: 1;
    }

    .dismiss {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-surface-secondary);
      color: var(--color-text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .dismiss:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }

    @media (max-width: 767px) {
      .toast-stack {
        right: 0.75rem;
        left: 0.75rem;
        width: auto;
      }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
