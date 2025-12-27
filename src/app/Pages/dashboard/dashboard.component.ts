import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BookService } from '../../services/bookservice.service';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { MovieService } from '../../services/movieservice.service';
import { DiaryService } from '../../services/diaryservice.service';
import { ActivityService } from '../../services/activityservice.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: any = null;
  stats = {
    totalBooks: 0,
    totalQuotes: 0,
    totalMovies: 0,
    totalDiaries: 0,
    totalActivities: 0,
    recentActivity: 0
  };

  quickActions = [
    {
      title: 'Add New Book',
      description: 'Add a new book to your collection',
      icon: 'bi-book',
      route: 'books',
      color: 'primary'
    },
    {
      title: 'Add New Quote',
      description: 'Save an inspiring quote',
      icon: 'bi-quote',
      route: 'quotes',
      color: 'success'
    },
    {
      title: 'Add New Movie',
      description: 'Add a new movie to your collection',
      icon: 'bi-film',
      route: 'movies',
      color: 'info'
    },
    {
      title: 'Add New Diary',
      description: 'Write a new diary entry',
      icon: 'bi-journal-text',
      route: 'diaries',
      color: 'warning'
    },
    {
      title: 'Add New Activity',
      description: 'Create a new activity to track',
      icon: 'bi-activity',
      route: 'add-activity',
      color: 'info'
    }
  ];

  recentItems = [
    {
      type: 'book',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      date: '2 days ago'
    },
    {
      type: 'quote',
      title: 'Be yourself; everyone else is already taken.',
      author: 'Oscar Wilde',
      date: '1 day ago'
    }
  ];

  constructor(
    private router: Router,
    private bookService: BookService,
    private quoteService: QuoteserviceService,
    private movieService: MovieService,
    private diaryService: DiaryService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadStats();
  }

  loadUserData(): void {
    const userName = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.user = {
        name: this.capitalizeName(userName || 'Friend'),
        id: userId
      };
    }
  }

  loadStats(): void {
    const userIdStr = localStorage.getItem('userId');
    const userId = userIdStr ? Number(userIdStr) : null;
    if (!userId) {
      this.stats = { totalBooks: 0, totalQuotes: 0, totalMovies: 0, totalDiaries: 0, totalActivities: 0, recentActivity: 0 };
      return;
    }

    forkJoin({
      books: this.bookService.getBooksByUser(userId),
      quotes: this.quoteService.getQuotesByUser(userId),
      movies: this.movieService.getMoviesByUser(userId),
      diaries: this.diaryService.getDiariesByUser(userId),
      activities: this.activityService.getActivitiesByUser(userId)
    }).subscribe({
      next: ({ books, quotes, movies, diaries, activities }) => {
        this.stats.totalBooks = books.length;
        this.stats.totalQuotes = quotes.length;
        this.stats.totalMovies = movies.length;
        this.stats.totalDiaries = diaries.length;
        this.stats.totalActivities = activities.length;
        // simple recent activity metric across all items
        this.stats.recentActivity = Math.min(books.length + quotes.length + movies.length + diaries.length + activities.length, 10);
      },
      error: () => {
        this.stats = { totalBooks: 0, totalQuotes: 0, totalMovies: 0, totalDiaries: 0, totalActivities: 0, recentActivity: 0 };
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate(['/layout', route]);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    const base = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    return `${base}, ${this.user?.name || 'Friend'}`;
  }

  private capitalizeName(name: string): string {
    if (!name) return name;
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
