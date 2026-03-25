import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
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
  private readonly mobileBreakpoint = 768;
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
    document.body.style.overflow = '';
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
    this.syncMobileScrollLock();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  closeNavbarMenu(): void {
    this.isNavbarCollapsed = false;
    this.closeDropdown();
    this.syncMobileScrollLock();
  }

  goToAuth(): void {
    this.closeNavbarMenu();
    this.router.navigate(['/auth']);
  }

  goToDashboard(): void {
    this.closeNavbarMenu();
    this.router.navigate(['/dashboard']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.closeNavbarMenu();
  }

  scrollToContent(): void {
    this.closeNavbarMenu();
    document
      .getElementById('landing-content')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openQuickAction(): void {
    this.closeNavbarMenu();
    this.router.navigate(['/auth']);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= this.mobileBreakpoint && this.isNavbarCollapsed) {
      this.closeNavbarMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeDropdown();
    }
  }

  private syncMobileScrollLock(): void {
    const shouldLock = this.isNavbarCollapsed && window.innerWidth < this.mobileBreakpoint;
    document.body.style.overflow = shouldLock ? 'hidden' : '';
  }
}
