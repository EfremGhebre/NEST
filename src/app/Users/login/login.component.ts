import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: []
})
export class LoginComponent {
  loginData:any = { name: '', password: '' };
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  login(): void {
    const { name, password } = this.loginData;

    this.errorMessage = '';
    if (!name || !password) {
      this.errorMessage = 'Enter your username or email and password.';
      return;
    }
    this.isSubmitting = true;

    this.authService.login(name, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Signed in successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.errorMessage = err.message || 'Invalid username, email, or password.';
        this.toastService.error(this.errorMessage);
      },
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
