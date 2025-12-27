import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'bnq_theme';
  private readonly LAYOUT_KEY = 'bnq_layout';
  
  private currentTheme = new BehaviorSubject<'light' | 'dark'>('light');
  private currentLayout = new BehaviorSubject<'columns' | 'rows'>('columns');
  
  public theme$ = this.currentTheme.asObservable();
  public layout$ = this.currentLayout.asObservable();

  constructor() {
    // Load saved preferences
    const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark' | null;
    const savedLayout = localStorage.getItem(this.LAYOUT_KEY) as 'columns' | 'rows' | null;
    
    if (savedTheme) {
      this.setTheme(savedTheme, false);
    } else {
      this.setTheme('light', false);
    }
    
    if (savedLayout) {
      this.setLayout(savedLayout, false);
    } else {
      this.setLayout('columns', false);
    }
  }

  setTheme(theme: 'light' | 'dark', save: boolean = true): void {
    this.currentTheme.next(theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    if (save) {
      localStorage.setItem(this.THEME_KEY, theme);
    }
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getTheme(): 'light' | 'dark' {
    return this.currentTheme.value;
  }

  setLayout(layout: 'columns' | 'rows', save: boolean = true): void {
    this.currentLayout.next(layout);
    document.body.setAttribute('data-layout', layout);
    if (save) {
      localStorage.setItem(this.LAYOUT_KEY, layout);
    }
  }

  toggleLayout(): void {
    const newLayout = this.currentLayout.value === 'columns' ? 'rows' : 'columns';
    this.setLayout(newLayout);
  }

  getLayout(): 'columns' | 'rows' {
    return this.currentLayout.value;
  }
}

