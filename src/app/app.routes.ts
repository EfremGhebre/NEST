import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './Users/login/login.component';
import { RegisterComponent } from './Users/register/register.component';
import { BooksComponent } from './Pages/books/books.component';
import { QuotesComponent } from './Pages/quotes/quotes.component';
import { DashboardComponent } from './Pages/dashboard/dashboard.component';
import { MoviesComponent } from './Pages/movies/movies.component';
import { DiariesComponent } from './Pages/diaries/diaries.component';
import { ActivitiesComponent } from './Pages/activities/activities.component';
import { AuthGuard } from './auth/auth.guard';
import { LayoutComponent } from './Pages/layout/layout.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'layout', component: LayoutComponent, canActivate: [AuthGuard],
      children: [
        { path: '', component: DashboardComponent },
        { path: 'dashboard', component: DashboardComponent },
        { path: 'books', component: BooksComponent },
        { path: 'quotes', component: QuotesComponent },
        { path: 'movies', component: MoviesComponent },
        { path: 'diaries', component: DiariesComponent },
        { path: 'activities', component: ActivitiesComponent },
      ],
    },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
