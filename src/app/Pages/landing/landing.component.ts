import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hasUserId = !!localStorage.getItem('userId');
    if (this.authService.isAuthenticated() && hasUserId) {
      this.router.navigate(['/dashboard']);
    }
  }

  scrollToContent(): void {
    document
      .getElementById('landing-content')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
