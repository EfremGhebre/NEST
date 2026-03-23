import { Routes } from '@angular/router';
import { BooksComponent } from './Pages/books/books.component';
import { QuotesComponent } from './Pages/quotes/quotes.component';
import { DashboardComponent } from './Pages/dashboard/dashboard.component';
import { MoviesComponent } from './Pages/movies/movies.component';
import { DiariesComponent } from './Pages/diaries/diaries.component';
import { ActivitiesComponent } from './Pages/activities/activities.component';
import { AddActivityComponent } from './Pages/add-activity/add-activity.component';
import { AddBookComponent } from './Pages/add-book/add-book.component';
import { AddQuoteComponent } from './Pages/add-quote/add-quote.component';
import { AddMovieComponent } from './Pages/add-movie/add-movie.component';
import { AddDiaryComponent } from './Pages/add-diary/add-diary.component';
import { AuthGuard } from './auth/auth.guard';
import { LayoutComponent } from './Pages/layout/layout.component';
import { LandingComponent } from './Pages/landing/landing.component';
import { AuthPageComponent } from './Pages/auth-page/auth-page.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth', component: AuthPageComponent },
  { path: 'login', redirectTo: 'auth' },
  { path: 'register', redirectTo: 'auth' },
  { path: 'dashboard', redirectTo: 'layout/dashboard' },
  { path: 'layout', component: LayoutComponent, canActivate: [AuthGuard],
      children: [
        { path: '', component: DashboardComponent },
        { path: 'dashboard', component: DashboardComponent },
        { path: 'books', component: BooksComponent },
        { path: 'books-new', component: AddBookComponent },
        { path: 'quotes', component: QuotesComponent },
        { path: 'quotes-new', component: AddQuoteComponent },
        { path: 'movies', component: MoviesComponent },
        { path: 'movies-new', component: AddMovieComponent },
        { path: 'diaries', component: DiariesComponent },
        { path: 'diaries-new', component: AddDiaryComponent },
        { path: 'activities', component: ActivitiesComponent },
        { path: 'activities-new', component: AddActivityComponent },
        { path: 'add-activity', component: AddActivityComponent },
      ],
    },
  { path: '**', redirectTo: '' },
];
