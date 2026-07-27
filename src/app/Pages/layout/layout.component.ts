import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { BookService } from '../../services/bookservice.service';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { MovieService } from '../../services/movieservice.service';
import { DiaryService } from '../../services/diaryservice.service';
import { ActivityService } from '../../services/activityservice.service';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  mobileNavOpen = false;
  accountMenuOpen = false;
  currentTheme: 'light' | 'dark' = 'light';
  searchQuery = '';
  searchOpen = false;
  searchLoading = false;
  highlightedResultIndex = -1;
  userDisplayName = 'User';
  userInitials = 'U';
  searchResults: SearchResult[] = [];
  private readonly mobileBreakpoint = 768;
  private themeSubscription?: Subscription;
  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;

  readonly primaryNav = [
    { label: 'Home', route: 'dashboard', icon: 'bi-house' }
  ];

  readonly collectionsNav = [
    { label: 'Books', route: 'books', icon: 'bi-book', tintClass: 'collection-books' },
    { label: 'Quotes', route: 'quotes', icon: 'bi-chat-quote', tintClass: 'collection-quotes' },
    { label: 'Movies', route: 'movies', icon: 'bi-film', tintClass: 'collection-movies' },
    { label: 'Diaries', route: 'diaries', icon: 'bi-journal-richtext', tintClass: 'collection-diaries' },
    { label: 'Activities', route: 'activities', icon: 'bi-activity', tintClass: 'collection-activities' }
  ];

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private authService: AuthService,
    private bookService: BookService,
    private quoteService: QuoteserviceService,
    private movieService: MovieService,
    private diaryService: DiaryService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getTheme();
    this.setUserIdentity();
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }
    document.body.style.overflow = '';
  }

  navigateTo(route: string): void {
    this.router.navigate([`/layout/${route}`]);
    this.closeAllMenus();
  }

  isRouteActive(route: string): boolean {
    return (this.router.url || '').includes(`/layout/${route}`);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
    this.syncMobileScrollLock();
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
    this.syncMobileScrollLock();
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  closeAccountMenu(): void {
    this.accountMenuOpen = false;
  }

  closeAllMenus(): void {
    this.closeMobileNav();
    this.closeAccountMenu();
    this.closeSearch();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchQuery = value;
    this.highlightedResultIndex = -1;

    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }

    if (value.length < 2) {
      this.searchResults = [];
      this.searchOpen = false;
      this.searchLoading = false;
      return;
    }

    this.searchLoading = true;
    this.searchOpen = true;
    this.searchDebounceId = setTimeout(() => this.runSearch(value.toLowerCase()), 220);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (!this.searchOpen || this.searchResults.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedResultIndex = Math.min(this.highlightedResultIndex + 1, this.searchResults.length - 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedResultIndex = Math.max(this.highlightedResultIndex - 1, 0);
      return;
    }
    if (event.key === 'Enter' && this.highlightedResultIndex >= 0) {
      event.preventDefault();
      this.selectSearchResult(this.searchResults[this.highlightedResultIndex]);
      return;
    }
    if (event.key === 'Escape') {
      this.closeSearch();
    }
  }

  selectSearchResult(result: SearchResult): void {
    this.router.navigate([`/layout/${result.route}`]);
    this.searchQuery = '';
    this.searchResults = [];
    this.closeAllMenus();
  }

  closeSearch(): void {
    this.searchOpen = false;
    this.searchLoading = false;
    this.highlightedResultIndex = -1;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.closeSearch();
  }

  openProfile(): void {
    this.navigateTo('profile');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu-wrap')) {
      this.closeAccountMenu();
    }
    if (!target.closest('.global-search')) {
      this.closeSearch();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.closeAccountMenu();
    this.closeSearch();
    this.closeMobileNav();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= this.mobileBreakpoint && this.mobileNavOpen) {
      this.closeMobileNav();
    }
  }

  logout(): void {
    this.closeAllMenus();
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.closeAccountMenu();
  }

  private runSearch(query: string): void {
    const userId = Number(localStorage.getItem('userId'));
    const collectionMatches: SearchResult[] = this.collectionsNav
      .filter(item => item.label.toLowerCase().includes(query))
      .map(item => ({
        type: 'collection',
        title: item.label,
        subtitle: 'Collection',
        route: item.route,
        icon: item.icon
      }));

    if (!userId) {
      this.searchResults = collectionMatches;
      this.searchLoading = false;
      return;
    }

    forkJoin({
      books: this.bookService.getBooksByUser(userId).pipe(catchError(() => of([]))),
      quotes: this.quoteService.getQuotesByUser(userId).pipe(catchError(() => of([]))),
      movies: this.movieService.getMoviesByUser(userId).pipe(catchError(() => of([]))),
      diaries: this.diaryService.getDiariesByUser(userId).pipe(catchError(() => of([]))),
      activities: this.activityService.getActivitiesByUser(userId).pipe(catchError(() => of([])))
    }).subscribe(({ books, quotes, movies, diaries, activities }) => {
      const noteResults: SearchResult[] = [];

      books.forEach(book => {
        if (this.matchesSearch(query, [book.title, book.author, book.description])) {
          noteResults.push({ type: 'note', title: book.title, subtitle: 'Book note', route: 'books', icon: 'bi-book' });
        }
      });
      quotes.forEach(quote => {
        if (this.matchesSearch(query, [quote.title, quote.author, quote.description])) {
          noteResults.push({ type: 'note', title: quote.title, subtitle: 'Quote note', route: 'quotes', icon: 'bi-chat-quote' });
        }
      });
      movies.forEach(movie => {
        if (this.matchesSearch(query, [movie.title, movie.director, movie.description])) {
          noteResults.push({ type: 'note', title: movie.title, subtitle: 'Movie note', route: 'movies', icon: 'bi-film' });
        }
      });
      diaries.forEach(diary => {
        if (this.matchesSearch(query, [diary.title, diary.body, diary.location])) {
          noteResults.push({ type: 'note', title: diary.title, subtitle: 'Diary note', route: 'diaries', icon: 'bi-journal-richtext' });
        }
      });
      activities.forEach(activity => {
        if (this.matchesSearch(query, [activity.title, activity.description, activity.category])) {
          noteResults.push({ type: 'note', title: activity.title, subtitle: 'Activity note', route: 'activities', icon: 'bi-activity' });
        }
      });

      this.searchResults = [...collectionMatches, ...noteResults].slice(0, 12);
      this.searchLoading = false;
    });
  }

  private matchesSearch(query: string, fields: Array<string | null | undefined>): boolean {
    return fields.some(field => String(field || '').toLowerCase().includes(query));
  }

  private setUserIdentity(): void {
    const storedName = localStorage.getItem('userName') || 'User';
    this.userDisplayName = storedName;
    const parts = storedName.split(' ').filter(Boolean);
    this.userInitials = parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || 'U';
  }

  private syncMobileScrollLock(): void {
    const shouldLock = this.mobileNavOpen && window.innerWidth < this.mobileBreakpoint;
    document.body.style.overflow = shouldLock ? 'hidden' : '';
  }
}

interface SearchResult {
  type: 'collection' | 'note';
  title: string;
  subtitle: string;
  route: string;
  icon: string;
}
