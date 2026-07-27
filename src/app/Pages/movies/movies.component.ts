import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../services/movieservice.service';
import { Movie } from '../../models/movie';
import { ThemeService } from '../../services/theme.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})
export class MoviesComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading = false;
  error: string | null = null;
  isCompactMode = false;
  selectedMovie: Movie | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private lastDialogTriggerElement: HTMLElement | null = null;
  actionMenuForMovieId: number | null = null;
  currentLayout: 'columns' | 'rows' = 'columns';
  private layoutSubscription?: Subscription;

  editingId: number | null = null;
  editTitle = '';
  editDirector = '';
  editDescription = '';
  editReleaseYear: number | null = null;
  editGenre = '';
  editRating = '';
  editNotes = '';
  modalVisible = false;
  deleteTarget: Movie | null = null;

  constructor(
    private movieService: MovieService,
    private themeService: ThemeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const savedMode = localStorage.getItem('bnq_view_movies');
    this.isCompactMode = savedMode === 'compact';
    this.currentLayout = this.themeService.getLayout();
    this.loadMovies();
    
    this.layoutSubscription = this.themeService.layout$.subscribe(layout => {
      this.currentLayout = layout;
    });
  }

  ngOnDestroy(): void {
    this.layoutSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  loadMovies(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) { this.error = 'No user'; return; }
    this.isLoading = true;
    this.movieService.getMoviesByUser(Number(userId)).subscribe({
      next: (movies) => { 
        console.log('Movies loaded:', movies);
        this.movies = movies; 
        this.isLoading = false; 
      },
      error: (error) => { 
        console.error('Error loading movies:', error);
        this.error = 'Failed to load movies'; 
        this.isLoading = false; 
      }
    });
  }

  toggleCompactMode(): void {
    this.isCompactMode = !this.isCompactMode;
    localStorage.setItem('bnq_view_movies', this.isCompactMode ? 'compact' : 'normal');
  }

  editMovie(id: number): void {
    const m = this.movies.find(x => x.id === id); if (!m) return;
    this.editingId = id;
    this.editTitle = m.title; 
    this.editDirector = m.director; 
    this.editDescription = m.description;
    this.editReleaseYear = m.releaseYear || null;
    this.editGenre = m.genre || '';
    this.editRating = m.rating || '';
    this.editNotes = m.notes || '';
    this.openModal();
  }

  saveEditedMovie(): void {
    if (this.editingId === null) return;
    const updated: Movie = { 
      id: this.editingId, 
      title: this.editTitle.trim(), 
      director: this.editDirector.trim(), 
      description: this.editDescription.trim(),
      releaseYear: this.editReleaseYear ?? undefined,
      genre: this.editGenre || undefined,
      rating: this.editRating || undefined,
      notes: this.editNotes || undefined,
      userId: Number(localStorage.getItem('userId'))
    };
    this.movieService.updateMovie(this.editingId, updated).subscribe({
      next: (updatedMovie) => {
        this.movies = this.movies.map(m => m.id === this.editingId ? updatedMovie : m);
        this.toastService.success('Movie updated.');
        this.closeModal();
      }
    });
  }

  deleteMovie(id: number): void {
    this.movies = this.movies.filter(m => m.id !== id);
    this.movieService.deleteMovie(id).subscribe({
      next: () => this.toastService.success('Movie deleted.'),
      error: () => {
        this.toastService.error('Failed to delete movie.');
        this.loadMovies();
      }
    });
  }

  requestDelete(movie: Movie, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeActionMenu();
    this.lastDialogTriggerElement = document.activeElement as HTMLElement;
    this.deleteTarget = movie;
    setTimeout(() => this.focusFirstDialogControl('.confirm-modal .modal-content'));
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    const movieId = this.deleteTarget.id;
    this.deleteTarget = null;
    this.restoreDialogTriggerFocus();
    this.deleteMovie(movieId);
  }

  cancelDelete(): void {
    this.deleteTarget = null;
    this.restoreDialogTriggerFocus();
  }

  openModal(): void {
    this.lastDialogTriggerElement = document.activeElement as HTMLElement;
    this.modalVisible = true;
    setTimeout(() => this.focusFirstDialogControl('#modal .modal-content'));
  }

  closeModal(): void { 
    this.modalVisible = false; 
    this.editingId = null; 
    this.editTitle = '';
    this.editDirector = '';
    this.editDescription = '';
    this.editReleaseYear = null;
    this.editGenre = '';
    this.editRating = '';
    this.editNotes = '';
    this.restoreDialogTriggerFocus();
  }

  toggleActionMenu(movieId: number, event: Event): void {
    event.stopPropagation();
    this.actionMenuForMovieId = this.actionMenuForMovieId === movieId ? null : movieId;
  }

  closeActionMenu(): void {
    this.actionMenuForMovieId = null;
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  openMovieDetails(movie: Movie, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeActionMenu();
    if (this.selectedMovie?.id === movie.id) {
      this.closeMovieDetails();
      return;
    }
    this.lastFocusedElement = (event?.currentTarget as HTMLElement) || document.activeElement as HTMLElement;
    this.selectedMovie = movie;
    document.body.style.overflow = 'hidden';
  }

  closeMovieDetails(): void {
    this.selectedMovie = null;
    this.closeActionMenu();
    document.body.style.overflow = '';
    this.lastFocusedElement?.focus();
  }

  onModalKeydown(event: KeyboardEvent): void {
    this.trapFocusWithinModal(event);
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.selectedMovie) {
      this.closeMovieDetails();
      return;
    }
    if (this.modalVisible) {
      this.closeModal();
      return;
    }
    if (this.deleteTarget) {
      this.cancelDelete();
      return;
    }
    if (this.actionMenuForMovieId !== null) {
      this.closeActionMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.card-actions-menu')) {
      this.closeActionMenu();
    }
  }

  private focusFirstDialogControl(containerSelector: string): void {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const focusable = container.querySelector<HTMLElement>('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
  }

  private trapFocusWithinModal(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const target = event.target as HTMLElement | null;
    const container = target?.closest('.modal-content');
    if (!container) return;

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.hasAttribute('disabled'));
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const active = document.activeElement as HTMLElement;

    if (!event.shiftKey && active === last) {
      first.focus();
      event.preventDefault();
    } else if (event.shiftKey && active === first) {
      last.focus();
      event.preventDefault();
    }
  }

  private restoreDialogTriggerFocus(): void {
    if (!this.lastDialogTriggerElement) return;
    this.lastDialogTriggerElement.focus();
    this.lastDialogTriggerElement = null;
  }
}


