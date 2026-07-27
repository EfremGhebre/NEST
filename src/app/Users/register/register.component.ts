import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [],
})
export class RegisterComponent {
  registerData: any = { name: '', email: '', password: '' };
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  register(): void {
    const { name, email, password } = this.registerData;
    this.errorMessage = '';
    this.successMessage = '';

    if (!name || !email || !password) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    if (!this.validateEmail(email)) {
      this.errorMessage = 'Enter a valid email address.';
      return;
    }
    this.isSubmitting = true;

    this.authService.register(name, email, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Account created. Redirecting to your dashboard...';
        this.toastService.success('Account created successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        if (err.error && err.error.message === 'User already exists.' && err.status === 400) {
          this.errorMessage = 'Username or email is already registered.';
        } else {
          this.errorMessage = `Registration failed: ${err.error?.message || 'Unknown error occurred.'}`;
        }
        this.toastService.error(this.errorMessage);
      },
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  // Helper method to validate email format
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
