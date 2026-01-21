import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MovieService } from '../../services/movieservice.service';
import { Movie } from '../../models/movie';

@Component({
  selector: 'app-add-movie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-movie.component.html',
  styleUrls: ['./add-movie.component.scss']
})
export class AddMovieComponent {
  title = '';
  director = '';
  description = '';
  releaseYear: number | null = null;
  genre = '';
  rating = '';
  notes = '';
  loading = false;
  error: string | null = null;

  genres = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Sci-Fi',
    'Thriller',
    'Romance',
    'Documentary',
    'Other'
  ];

  ratings = ['1', '2', '3', '4', '5'];

  constructor(
    private movieService: MovieService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.loading) return;
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.title.trim() || !this.director.trim() || !this.description.trim()) {
      this.error = 'Title, director, and description are required.';
      return;
    }

    this.loading = true;
    this.error = null;

    const movie: Movie = {
      id: 0,
      title: this.title.trim(),
      director: this.director.trim(),
      description: this.description.trim(),
      releaseYear: this.releaseYear ?? undefined,
      genre: this.genre || undefined,
      rating: this.rating || undefined,
      notes: this.notes.trim() || undefined,
      userId: Number(userId)
    };

    this.movieService.addMovie(movie).subscribe({
      next: () => {
        this.router.navigate(['/layout/movies']);
      },
      error: () => {
        this.error = 'Failed to add movie. Please try again.';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/layout/movies']);
  }
}

