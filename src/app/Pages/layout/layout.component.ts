import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  isNavbarCollapsed = false;
  isDropdownOpen = false;
  currentTheme: 'light' | 'dark' = 'light';
  private readonly mobileBreakpoint = 768;
  private themeSubscription?: Subscription;

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getTheme();
    
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  navigateTo(route: string): void {
    this.router.navigate([`/layout/${route}`]);
    this.closeNavbarMenu();
  }

  toggleNavbar() {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
    this.syncMobileScrollLock();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  closeNavbarMenu() {
    this.isNavbarCollapsed = false;
    this.closeDropdown();
    this.syncMobileScrollLock();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeDropdown();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (window.innerWidth >= this.mobileBreakpoint && this.isNavbarCollapsed) {
      this.closeNavbarMenu();
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    this.closeNavbarMenu();
    this.router.navigate(['/']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.closeNavbarMenu();
  }

  private syncMobileScrollLock(): void {
    const shouldLock = this.isNavbarCollapsed && window.innerWidth < this.mobileBreakpoint;
    document.body.style.overflow = shouldLock ? 'hidden' : '';
  }
}
