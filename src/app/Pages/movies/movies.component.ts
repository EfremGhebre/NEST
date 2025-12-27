import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../services/movieservice.service';
import { Movie } from '../../models/movie';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})
export class MoviesComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading = false;
  error: string | null = null;
  showAddForm = false;
  isCompactMode = false;
  expandedMovies = new Set<number>();
  currentLayout: 'columns' | 'rows' = 'columns';
  private layoutSubscription?: Subscription;

  newTitle = '';
  newDirector = '';
  newDescription = '';
  newReleaseYear: number | null = null;
  newGenre = '';
  newRating = '';
  newNotes = '';

  editingId: number | null = null;
  editTitle = '';
  editDirector = '';
  editDescription = '';
  editReleaseYear: number | null = null;
  editGenre = '';
  editRating = '';
  editNotes = '';
  modalVisible = false;

  constructor(
    private movieService: MovieService,
    private themeService: ThemeService
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

  toggleAddForm(): void { this.showAddForm = !this.showAddForm; }
  toggleCompactMode(): void {
    this.isCompactMode = !this.isCompactMode;
    localStorage.setItem('bnq_view_movies', this.isCompactMode ? 'compact' : 'normal');
  }

  addMovie(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    // Validate required fields
    if (!this.newTitle.trim()) {
      alert('Please enter a movie title');
      return;
    }
    if (!this.newDirector.trim()) {
      alert('Please enter the director name');
      return;
    }
    if (!this.newDescription.trim()) {
      alert('Please enter a movie description');
      return;
    }
    const movie: Movie = { 
      id: 0, 
      title: this.newTitle.trim(), 
      director: this.newDirector.trim(), 
      description: this.newDescription.trim(),
      releaseYear: this.newReleaseYear ?? undefined,
      genre: this.newGenre || undefined,
      rating: this.newRating || undefined,
      notes: this.newNotes || undefined,
      userId: Number(userId) 
    };
    console.log('Adding movie with data:', movie);
    this.movieService.addMovie(movie).subscribe({
      next: (m) => {
        console.log('Movie added successfully:', m);
        this.movies.unshift(m);
        this.newTitle = '';
        this.newDirector = '';
        this.newDescription = '';
        this.newReleaseYear = null;
        this.newGenre = '';
        this.newRating = '';
        this.newNotes = '';
        this.showAddForm = false;
      }
    });
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
    this.modalVisible = true;
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
        this.closeModal();
      }
    });
  }

  deleteMovie(id: number): void {
    this.movies = this.movies.filter(m => m.id !== id);
    this.movieService.deleteMovie(id).subscribe({ error: () => this.loadMovies() });
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
  }

  toggleMovieExpansion(movieId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedMovies.has(movieId)) {
      this.expandedMovies.delete(movieId);
    } else {
      this.expandedMovies.add(movieId);
    }
  }

  isMovieExpanded(movieId: number): boolean {
    return this.expandedMovies.has(movieId);
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}


