import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../services/bookservice.service';
import { Book } from '../../models/book';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [],
  templateUrl: './books.component.html',
  styleUrl: './books.component.scss',
})
export class BooksComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  userId: number | null = null;  // Use null initially and after logout. Important to type as nullable and to use Number(localStorage.getItem('userId'))
  expandedBooks = new Set<number>();
  currentLayout: 'columns' | 'rows' = 'columns';
  private layoutSubscription?: Subscription;

  editingBookId: number | null = null;
  editTitle: string = '';
  editAuthor: string = '';
  editDescription: string = '';
  editPublicationYear: number | null = null;
  editGenre: string = '';
  editRating: string = '';
  editPages: number | null = null;
  editStatus: string = '';
  editTags: string = '';
  editNotes: string = '';
  modalVisible: boolean = false;
  deleteTarget: Book | null = null;
  private storageKey = 'books';

  // Add loading state
  isLoading: boolean = false;
  error: string | null = null;
  isCompactMode: boolean = false;

  constructor(
    private bookService: BookService, 
    private router: Router,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    // Restore preferred view mode
    const savedMode = localStorage.getItem('bnq_view_books');
    this.isCompactMode = savedMode === 'compact';
    this.currentLayout = this.themeService.getLayout();
    this.loadUserBooks();
    
    this.layoutSubscription = this.themeService.layout$.subscribe(layout => {
      this.currentLayout = layout;
    });

  }

  ngOnDestroy(): void {
    this.layoutSubscription?.unsubscribe();
  }

  getAllBooks(): void {
    this.isLoading = true;
    this.error = null;
    this.bookService.getAllBooks().subscribe({  
      next: (books) => {
        // Server now handles tag parsing, but keep this as fallback for backwards compatibility
        this.books = books.map(book => {
          if (book.tags && typeof book.tags === 'string') {
            const tagsString: string = book.tags;
            try {
              book.tags = JSON.parse(tagsString);
            } catch (e) {
              // If parsing fails, treat as comma-separated string
              book.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }
          }
          return book;
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading all books:', error);
        this.error = 'Failed to load books. Please try again.';
        this.isLoading = false;
      }
    });
  }
  loadUserBooks(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.error = 'No user found. Please login again.';
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.bookService.getBooksByUser(Number(userId)).subscribe({
      next: (books) => {
        console.log('Books loaded:', books);
        // Parse tags from JSON string to array if needed
        this.books = books.map(book => {
          if (book.tags && typeof book.tags === 'string') {
            const tagsString: string = book.tags;
            try {
              book.tags = JSON.parse(tagsString);
            } catch (e) {
              // If parsing fails, treat as comma-separated string
              book.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }
          }
          return book;
        });
        this.isLoading = false;
      },
      error: (error) => {
        // Enhanced error logging
        console.error('Error loading books:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url
        });
        
        this.error = `Failed to load books. Server response: ${error.status} ${error.statusText}`;
        this.isLoading = false;
        
        if (error.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  deleteBook(id: number): void {
    // Optimistically update the UI
    this.books = this.books.filter((book) => book.id !== id);

    // Call the backend
    this.bookService.deleteBook(id).subscribe({
      next: () => {
        console.log('Book deleted successfully.');
        // Optionally, refresh the books list: this.getBooksByUser();
      },
      error: (error) => {
        console.error('Error deleting book:', error);
        // Revert the UI change if the deletion fails
        this.loadUserBooks(); // Refresh the list
      }
    });
  }

  requestDelete(book: Book, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.deleteTarget = book;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    const bookId = this.deleteTarget.id;
    this.deleteTarget = null;
    this.deleteBook(bookId);
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }


  editBook(id: number): void {
    const bookToEdit = this.books.find((book) => book.id === id);
    if (bookToEdit) {
      this.editTitle = bookToEdit.title;
      this.editAuthor = bookToEdit.author;
      this.editDescription = bookToEdit.description;
      this.editPublicationYear = bookToEdit.publicationYear || null;
      this.editGenre = bookToEdit.genre || '';
      this.editRating = bookToEdit.rating || '';
      this.editPages = bookToEdit.pages || null;
      this.editStatus = bookToEdit.status || '';
      this.editTags = bookToEdit.tags ? (Array.isArray(bookToEdit.tags) ? bookToEdit.tags.join(', ') : bookToEdit.tags) : '';
      this.editNotes = bookToEdit.notes || '';
      this.editingBookId = id;
      this.openModal();
    }
  }

  saveEditedBook(): void {
    if (this.editTitle.trim() && this.editingBookId !== null) {
      const updatedBook: Book = {
        id: this.editingBookId,
        title: this.editTitle.trim(),
        author: this.editAuthor.trim(),
        description: this.editDescription.trim(),
        publicationYear: this.editPublicationYear || undefined,
        genre: this.editGenre || undefined,
        rating: this.editRating || undefined,
        pages: this.editPages || undefined,
        status: this.editStatus || undefined,
        tags: this.editTags.trim() ? this.editTags.split(',').map(tag => tag.trim()) : undefined,
        notes: this.editNotes || undefined,
        userId: Number(localStorage.getItem('userId'))
      };

      this.bookService.updateBook(this.editingBookId, updatedBook).subscribe({
        next: (updatedBookResponse) => {
          // Server now handles tag parsing, but keep this as fallback
          if (updatedBookResponse.tags && typeof updatedBookResponse.tags === 'string') {
            const tagsString: string = updatedBookResponse.tags;
            try {
              updatedBookResponse.tags = JSON.parse(tagsString);
            } catch (e) {
              updatedBookResponse.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }
          }
          this.books = this.books.map((book) =>
            book.id === this.editingBookId ? updatedBookResponse : book
          );
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating book:', error);
        }
      });
    }
  }

  openModal(): void {
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.editingBookId = null;
    this.editTitle = '';
    this.editAuthor = '';
    this.editDescription = '';
    this.editPublicationYear = null;
    this.editGenre = '';
    this.editRating = '';
    this.editPages = null;
    this.editStatus = '';
    this.editTags = '';
    this.editNotes = '';
  }

  private loadBooks(): void {
    const storedBooks = localStorage.getItem(this.storageKey);
    this.books = storedBooks ? JSON.parse(storedBooks) : [];
  }

  private saveBooks(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.books));
  }

  toggleCompactMode(): void {
    this.isCompactMode = !this.isCompactMode;
    localStorage.setItem('bnq_view_books', this.isCompactMode ? 'compact' : 'normal');
  }

  toggleBookExpansion(bookId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedBooks.has(bookId)) {
      this.expandedBooks.delete(bookId);
    } else {
      this.expandedBooks.add(bookId);
    }
  }

  isBookExpanded(bookId: number): boolean {
    return this.expandedBooks.has(bookId);
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}