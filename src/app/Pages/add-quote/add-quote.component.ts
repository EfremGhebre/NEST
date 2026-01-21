import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { Quote } from '../../models/quote';

@Component({
  selector: 'app-add-quote',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-quote.component.html',
  styleUrls: ['./add-quote.component.scss']
})
export class AddQuoteComponent {
  title = '';
  author = '';
  description = '';
  source = '';
  category = '';
  date = '';
  tags = '';
  notes = '';
  loading = false;
  error: string | null = null;

  categories = [
    'Inspirational',
    'Motivational',
    'Philosophical',
    'Humorous',
    'Life Lessons',
    'Success',
    'Love',
    'Other'
  ];

  constructor(
    private quoteService: QuoteserviceService,
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
      this.error = 'Title, author, and quote text are required.';
      return;
    }

    this.loading = true;
    this.error = null;

    const quote: Quote = {
      id: 0,
      title: this.title.trim(),
      author: this.author.trim(),
      description: this.description.trim(),
      source: this.source.trim() || undefined,
      category: this.category || undefined,
      date: this.date || undefined,
      tags: this.tags.trim() ? this.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      notes: this.notes.trim() || undefined,
      userId: Number(userId)
    };

    this.quoteService.addQuote(quote).subscribe({
      next: () => {
        this.router.navigate(['/layout/quotes']);
      },
      error: () => {
        this.error = 'Failed to add quote. Please try again.';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/layout/quotes']);
  }
}

