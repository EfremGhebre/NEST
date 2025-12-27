import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: []
})
export class LoginComponent {

  loginData:any = { name: '', password: '' };

  constructor(private router: Router, private authService: AuthService) {}

  login(): void {
    const { name, password } = this.loginData;

    //Simple validation
    if (!name || !password) {
      alert('All fields are required.');
      return;
    }
    this.authService.login(name, password).subscribe({
      next: () => {
        // Navigate to dashboard after successful login
        this.router.navigate(['/layout']);
      },
      error: (err: any) => {
        console.error('Login error:', err);
        alert(err.message || 'Invalid credentials. Please try again.');
      },
    });
  }
}
