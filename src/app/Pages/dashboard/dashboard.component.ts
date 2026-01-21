import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BookService } from '../../services/bookservice.service';
import { QuoteserviceService } from '../../services/quoteservice.service';
import { MovieService } from '../../services/movieservice.service';
import { DiaryService } from '../../services/diaryservice.service';
import { ActivityService } from '../../services/activityservice.service';
import { Book } from '../../models/book';
import { Quote } from '../../models/quote';
import { Movie } from '../../models/movie';
import { Diary } from '../../models/diary';
import { Activity } from '../../models/activity';

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
      route: 'books-new',
      color: 'primary'
    },
    {
      title: 'Add New Quote',
      description: 'Save an inspiring quote',
      icon: 'bi-quote',
      route: 'quotes-new',
      color: 'success'
    },
    {
      title: 'Add New Movie',
      description: 'Add a new movie to your collection',
      icon: 'bi-film',
      route: 'movies-new',
      color: 'info'
    },
    {
      title: 'Add New Diary',
      description: 'Write a new diary entry',
      icon: 'bi-journal-text',
      route: 'diaries-new',
      color: 'warning'
    },
    {
      title: 'Add New Activity',
      description: 'Create a new activity to track',
      icon: 'bi-activity',
      route: 'activities-new',
      color: 'info'
    }
  ];

  inspirationalQuotes = [
    {
      text: 'The more that you read, the more things you will know. The more that you learn, the more places you will go.',
      author: 'Dr. Seuss'
    },
    {
      text: 'Success is the sum of small efforts, repeated day in and day out.',
      author: 'Robert Collier'
    },
    {
      text: 'The future depends on what you do today.',
      author: 'Mahatma Gandhi'
    },
    {
      text: 'Well done is better than well said.',
      author: 'Benjamin Franklin'
    },
    {
      text: 'Do something today that your future self will thank you for.',
      author: 'Sean Patrick Flanery'
    },
    {
      text: 'The secret of getting ahead is getting started.',
      author: 'Mark Twain'
    },
    {
      text: 'It always seems impossible until it is done.',
      author: 'Nelson Mandela'
    },
    {
      text: 'Start where you are. Use what you have. Do what you can.',
      author: 'Arthur Ashe'
    },
    {
      text: 'If you can dream it, you can do it.',
      author: 'Walt Disney'
    },
    {
      text: 'Believe you can and you are halfway there.',
      author: 'Theodore Roosevelt'
    },
    {
      text: 'Do not watch the clock; do what it does. Keep going.',
      author: 'Sam Levenson'
    },
    {
      text: 'A year from now you may wish you had started today.',
      author: 'Karen Lamb'
    },
    {
      text: 'The best way to get started is to quit talking and begin doing.',
      author: 'Walt Disney'
    },
    {
      text: 'Quality is not an act, it is a habit.',
      author: 'Aristotle'
    },
    {
      text: 'Action is the foundational key to all success.',
      author: 'Pablo Picasso'
    },
    {
      text: 'Your time is limited, so do not waste it living someone else’s life.',
      author: 'Steve Jobs'
    },
    {
      text: 'Dream big and dare to fail.',
      author: 'Norman Vaughan'
    },
    {
      text: 'If opportunity does not knock, build a door.',
      author: 'Milton Berle'
    },
    {
      text: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs'
    },
    {
      text: 'The harder you work for something, the greater you will feel when you achieve it.',
      author: 'Anonymous'
    },
    {
      text: 'Don’t let yesterday take up too much of today.',
      author: 'Will Rogers'
    },
    {
      text: 'The future belongs to those who believe in the beauty of their dreams.',
      author: 'Eleanor Roosevelt'
    },
    {
      text: 'Little by little, one travels far.',
      author: 'J. R. R. Tolkien'
    },
    {
      text: 'Everything you can imagine is real.',
      author: 'Pablo Picasso'
    },
    {
      text: 'Turn your wounds into wisdom.',
      author: 'Oprah Winfrey'
    },
    {
      text: 'Courage is grace under pressure.',
      author: 'Ernest Hemingway'
    },
    {
      text: 'What we think, we become.',
      author: 'Buddha'
    },
    {
      text: 'Happiness depends upon ourselves.',
      author: 'Aristotle'
    },
    {
      text: 'You miss 100% of the shots you do not take.',
      author: 'Wayne Gretzky'
    },
    {
      text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
      author: 'Winston Churchill'
    }
  ];

  currentInspiration = this.inspirationalQuotes[0];

  recentItems: RecentItem[] = [];

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
    this.pickRandomInspiration();
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
        this.recentItems = this.buildRecentItems(books, quotes, movies, diaries, activities);
      },
      error: () => {
        this.stats = { totalBooks: 0, totalQuotes: 0, totalMovies: 0, totalDiaries: 0, totalActivities: 0, recentActivity: 0 };
        this.recentItems = [];
      }
    });
  }

  navigateTo(action: { route: string; queryParams?: Record<string, string> }): void {
    this.router.navigate(['/layout', action.route], {
      queryParams: action.queryParams
    });
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

  private pickRandomInspiration(): void {
    const index = Math.floor(Math.random() * this.inspirationalQuotes.length);
    this.currentInspiration = this.inspirationalQuotes[index];
  }

  private buildRecentItems(
    books: Book[],
    quotes: Quote[],
    movies: Movie[],
    diaries: Diary[],
    activities: Activity[]
  ): RecentItem[] {
    const items: RecentItem[] = [];

    quotes.forEach(quote => {
      const timestamp = this.coerceDate(quote.date);
      if (!timestamp) return;
      items.push({
        type: 'quote',
        title: quote.title,
        author: quote.author || 'Unknown',
        date: this.formatRelativeDate(timestamp),
        timestamp
      });
    });

    diaries.forEach(diary => {
      const timestamp = this.coerceDate(diary.createdAt || diary.date);
      if (!timestamp) return;
      items.push({
        type: 'diary',
        title: diary.title,
        author: diary.mood ? `Mood: ${diary.mood}` : 'Diary entry',
        date: this.formatRelativeDate(timestamp),
        timestamp
      });
    });

    activities.forEach(activity => {
      const timestamp = this.coerceDate(activity.createdAt || activity.date);
      if (!timestamp) return;
      items.push({
        type: 'activity',
        title: activity.title,
        author: activity.category || 'Activity',
        date: this.formatRelativeDate(timestamp),
        timestamp
      });
    });

    books.forEach(book => {
      const timestamp = this.coerceDate((book as { createdAt?: string; date?: string }).createdAt || (book as { createdAt?: string; date?: string }).date);
      if (!timestamp) return;
      items.push({
        type: 'book',
        title: book.title,
        author: book.author || 'Unknown',
        date: this.formatRelativeDate(timestamp),
        timestamp
      });
    });

    movies.forEach(movie => {
      const timestamp = this.coerceDate((movie as { createdAt?: string; date?: string }).createdAt || (movie as { createdAt?: string; date?: string }).date);
      if (!timestamp) return;
      items.push({
        type: 'movie',
        title: movie.title,
        author: movie.director || 'Unknown',
        date: this.formatRelativeDate(timestamp),
        timestamp
      });
    });

    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }

  private coerceDate(value?: string | null): number | null {
    if (!value) return null;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  private formatRelativeDate(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return new Date(timestamp).toLocaleDateString();
  }
}

interface RecentItem {
  type: 'book' | 'quote' | 'movie' | 'diary' | 'activity';
  title: string;
  author: string;
  date: string;
  timestamp: number;
}
