import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit, OnDestroy {
  isNavbarCollapsed = false;
  isDropdownOpen = false;
  isLoggedIn = false;
  currentTheme: 'light' | 'dark' = 'light';
  private themeSubscription?: Subscription;

  readonly quickActions = [
    { title: 'Add New Book', description: 'Add a new book to your collection', icon: 'bi bi-book', color: 'primary' },
    { title: 'Add New Quote', description: 'Save an inspiring quote', icon: 'bi bi-quote', color: 'success' },
    { title: 'Add New Movie', description: 'Add a new movie to your collection', icon: 'bi bi-film', color: 'info' },
    { title: 'Add New Diary', description: 'Write a new diary entry', icon: 'bi bi-journal-text', color: 'warning' },
    { title: 'Add New Activity', description: 'Create a new activity to track', icon: 'bi bi-activity', color: 'teal' },
  ];

  readonly recentItems = [
    { title: 'Morning reflection', type: 'book', author: 'Personal note', date: 'Today' },
    { title: 'Favorite quote', type: 'quote', author: 'Maya Angelou', date: 'Yesterday' },
    { title: 'Weekend plans', type: 'book', author: 'Activities list', date: '2 days ago' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    const hasUserId = !!localStorage.getItem('userId');
    this.isLoggedIn = this.authService.isAuthenticated() && hasUserId;
    if (this.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    }

    this.currentTheme = this.themeService.getTheme();
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  goToAuth(): void {
    this.router.navigate(['/auth']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  scrollToContent(): void {
    document
      .getElementById('landing-content')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openQuickAction(): void {
    this.router.navigate(['/auth']);
  }
}
