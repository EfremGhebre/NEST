import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookService } from '../../services/bookservice.service';
import { Book } from '../../models/book';

@Component({
  selector: 'app-add-book',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-book.component.html',
  styleUrls: ['./add-book.component.scss']
})
export class AddBookComponent {
  title = '';
  author = '';
  description = '';
  publicationYear: number | null = null;
  genre = '';
  rating = '';
  pages: number | null = null;
  status = '';
  tags = '';
  notes = '';
  loading = false;
  error: string | null = null;

  genres = [
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Fantasy',
    'Biography',
    'History',
    'Self-Help',
    'Business',
    'Other'
  ];

  statuses = ['Want to Read', 'Currently Reading', 'Read', 'DNF'];
  ratings = ['1', '2', '3', '4', '5'];

  constructor(
    private bookService: BookService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.loading) return;
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.title.trim() || !this.author.trim() || !this.description.trim()) {
      this.error = 'Title, author, and description are required.';
      return;
    }

    this.loading = true;
    this.error = null;

    const book: Book = {
      id: 0,
      title: this.title.trim(),
      author: this.author.trim(),
      description: this.description.trim(),
      publicationYear: this.publicationYear ?? undefined,
      genre: this.genre || undefined,
      rating: this.rating || undefined,
      pages: this.pages ?? undefined,
      status: this.status || undefined,
      tags: this.tags.trim() ? this.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      notes: this.notes.trim() || undefined,
      userId: Number(userId)
    };

    this.bookService.addBook(book).subscribe({
      next: () => {
        this.router.navigate(['/layout/books']);
      },
      error: () => {
        this.error = 'Failed to add book. Please try again.';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/layout/books']);
  }
}

