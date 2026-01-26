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
  }

  navigateTo(route: string): void {
    this.router.navigate([`/layout/${route}`]);
    this.closeNavbarMenu();
  }

  toggleNavbar() {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
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
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeDropdown();
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    this.closeNavbarMenu();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.closeNavbarMenu();
  }
}
