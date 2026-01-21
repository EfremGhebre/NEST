import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { Quote } from '../../models/quote';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.scss'],
  providers: []
})
export class QuotesComponent implements OnInit, OnDestroy {
  quotes: Quote[] = [];
  isLoading = false;
  error: string | null = null;

  editingQuoteId: number | null = null;
  editTitle = '';
  editAuthor = '';
  editDescription = '';
  editSource = '';
  editCategory = '';
  editDate = '';
  editTags = '';
  editNotes = '';
  modalVisible = false;
  deleteTarget: Quote | null = null;
  isCompactMode = false;
  expandedQuotes = new Set<number>();
  currentLayout: 'columns' | 'rows' = 'columns';
  private layoutSubscription?: Subscription;

  constructor(
    private quoteService: QuoteserviceService, 
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Restore preferred view mode
    const savedMode = localStorage.getItem('bnq_view_quotes');
    this.isCompactMode = savedMode === 'compact';
    this.currentLayout = this.themeService.getLayout();
    this.loadUserQuotes();
    
    this.layoutSubscription = this.themeService.layout$.subscribe(layout => {
      this.currentLayout = layout;
    });
  }

  ngOnDestroy(): void {
    this.layoutSubscription?.unsubscribe();
  }

  loadUserQuotes(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.error = 'No user found. Please login again.';
      this.router.navigate(['/login']);
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.quoteService.getQuotesByUser(Number(userId)).subscribe({
      next: (quotes) => {
        console.log('Quotes loaded:', quotes);
        // Parse tags from JSON string to array if needed (server now handles this, but keep as fallback)
        this.quotes = quotes.map(quote => {
          if (quote.tags && typeof quote.tags === 'string') {
            const tagsString: string = quote.tags;
            try {
              quote.tags = JSON.parse(tagsString);
            } catch (e) {
              quote.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }
          }
          return quote;
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.error = `Failed to load quotes. Server response: ${error.status} ${error.statusText}`;
        this.isLoading = false;
        if (error.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          this.router.navigate(['/login']);
        }
      }
    });
  }


  editQuote(id: number): void {
    const quoteToEdit = this.quotes.find((q) => q.id === id);
    if (!quoteToEdit) return;
    this.editTitle = quoteToEdit.title;
    this.editAuthor = quoteToEdit.author;
    this.editDescription = quoteToEdit.description;
    this.editSource = quoteToEdit.source || '';
    this.editCategory = quoteToEdit.category || '';
    this.editDate = quoteToEdit.date || '';
    this.editTags = quoteToEdit.tags ? (Array.isArray(quoteToEdit.tags) ? quoteToEdit.tags.join(', ') : quoteToEdit.tags) : '';
    this.editNotes = quoteToEdit.notes || '';
    this.editingQuoteId = id;
    this.openModal();
  }

  saveEditedQuote(): void {
    if (this.editingQuoteId === null) return;
    const updated: Quote = {
      id: this.editingQuoteId,
      title: this.editTitle.trim(),
      author: this.editAuthor.trim(),
      description: this.editDescription.trim(),
      source: this.editSource || undefined,
      category: this.editCategory || undefined,
      date: this.editDate || undefined,
      tags: this.editTags.trim() ? this.editTags.split(',').map(tag => tag.trim()) : undefined,
      notes: this.editNotes || undefined,
      userId: Number(localStorage.getItem('userId'))
    };
    this.quoteService.updateQuote(this.editingQuoteId, updated).subscribe({
      next: (updatedQuote) => {
        // Server now handles tag parsing, but keep this as fallback
        if (updatedQuote.tags && typeof updatedQuote.tags === 'string') {
          const tagsString: string = updatedQuote.tags;
          try {
            updatedQuote.tags = JSON.parse(tagsString);
          } catch (e) {
            updatedQuote.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
          }
        }
        this.quotes = this.quotes.map((q) => (q.id === this.editingQuoteId ? updatedQuote : q));
        this.closeModal();
      },
      error: () => alert('Failed to update quote.')
    });
  }

  deleteQuote(id: number): void {
    this.quotes = this.quotes.filter((q) => q.id !== id);
    this.quoteService.deleteQuote(id).subscribe({
      error: () => this.loadUserQuotes()
    });
  }

  requestDelete(quote: Quote, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.deleteTarget = quote;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    const quoteId = this.deleteTarget.id;
    this.deleteTarget = null;
    this.deleteQuote(quoteId);
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  openModal(): void { this.modalVisible = true; }
  closeModal(): void {
    this.modalVisible = false;
    this.editingQuoteId = null;
    this.editTitle = '';
    this.editAuthor = '';
    this.editDescription = '';
    this.editSource = '';
    this.editCategory = '';
    this.editDate = '';
    this.editTags = '';
    this.editNotes = '';
  }

  toggleCompactMode(): void {
    this.isCompactMode = !this.isCompactMode;
    localStorage.setItem('bnq_view_quotes', this.isCompactMode ? 'compact' : 'normal');
  }

  toggleQuoteExpansion(quoteId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedQuotes.has(quoteId)) {
      this.expandedQuotes.delete(quoteId);
    } else {
      this.expandedQuotes.add(quoteId);
    }
  }

  isQuoteExpanded(quoteId: number): boolean {
    return this.expandedQuotes.has(quoteId);
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
