import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [],
})
export class RegisterComponent {
  registerData: any = { name: '', email: '', password: '' };

  constructor(private router: Router, private authService: AuthService) {}

  register(): void {
    const { name, email, password } = this.registerData;

    // Input validation
    if (!name || !email || !password) {
      alert('All fields are required.');
      return;
    }

    if (!this.validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    this.authService.register(name, email, password).subscribe({
      next: (response: any) => {
        console.log('Registration Response:', response);
        alert('Registration successful! Redirecting to login...');
        this.router.navigate(['/login']); // Navigate to login page on success
      },
      error: (err: any) => {
        console.error('Registration Error:', err);

        // Handle specific error messages
        if (err.error && err.error.message === 'User already exists.' && err.status === 400) {
          alert('User already registered. Please use different credentials.');
        } else if (err.status === 500) {
          alert('Server error. Please try again later.');
        } else {
          alert(`Registration failed: ${err.error?.message || 'Unknown error occurred.'}`);
        }
      },
    });
  }

  // Helper method to validate email format
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
