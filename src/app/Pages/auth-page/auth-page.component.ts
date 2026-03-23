import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LoginComponent } from '../../Users/login/login.component';
import { RegisterComponent } from '../../Users/register/register.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  mode: 'login' | 'register' = 'login';

  setMode(mode: 'login' | 'register'): void {
    this.mode = mode;
  }
}
