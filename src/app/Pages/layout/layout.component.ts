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
  currentLayout: 'columns' | 'rows' = 'columns';
  private themeSubscription?: Subscription;
  private layoutSubscription?: Subscription;

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getTheme();
    this.currentLayout = this.themeService.getLayout();
    
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    
    this.layoutSubscription = this.themeService.layout$.subscribe(layout => {
      this.currentLayout = layout;
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.layoutSubscription?.unsubscribe();
  }

  navigateTo(route: string): void {
    this.router.navigate([`/layout/${route}`]);
    this.isNavbarCollapsed = false;
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
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleLayout(): void {
    this.themeService.toggleLayout();
  }
}
