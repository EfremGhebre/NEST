import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  private messageId = 0;

  readonly messages$ = this.messagesSubject.asObservable();

  success(text: string, durationMs: number = 3200): void {
    this.enqueue({ text, variant: 'success', durationMs });
  }

  error(text: string, durationMs: number = 4200): void {
    this.enqueue({ text, variant: 'error', durationMs });
  }

  info(text: string, durationMs: number = 3200): void {
    this.enqueue({ text, variant: 'info', durationMs });
  }

  dismiss(id: number): void {
    const next = this.messagesSubject.value.filter(message => message.id !== id);
    this.messagesSubject.next(next);
  }

  private enqueue(input: Omit<ToastMessage, 'id'>): void {
    const message: ToastMessage = {
      id: ++this.messageId,
      ...input
    };
    this.messagesSubject.next([...this.messagesSubject.value, message]);
    window.setTimeout(() => this.dismiss(message.id), message.durationMs);
  }
}
