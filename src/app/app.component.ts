import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from "./Pages/layout/layout.component";
import { BooksComponent } from "./Pages/books/books.component";
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'BnQ';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Initialize theme service on app start
    this.themeService.getTheme();
    this.themeService.getLayout();
  }
}
