import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiaryService } from '../../services/diaryservice.service';
import { Diary } from '../../models/diary';

@Component({
  selector: 'app-add-diary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-diary.component.html',
  styleUrls: ['./add-diary.component.scss']
})
export class AddDiaryComponent {
  title = '';
  body = '';
  date = '';
  mood = '';
  weather = '';
  location = '';
  tags = '';
  privateNotes = '';
  loading = false;
  error: string | null = null;

  moods = [
    'Happy',
    'Sad',
    'Calm',
    'Angry',
    'Anxious',
    'Thoughtful',
    'Tired',
    'Excited',
    'Melancholy',
    'Content'
  ];

  weathers = [
    'Sunny',
    'Partly Cloudy',
    'Cloudy',
    'Rainy',
    'Stormy',
    'Snowy',
    'Clear'
  ];

  constructor(
    private diaryService: DiaryService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.loading) return;
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.title.trim() || !this.body.trim()) {
      this.error = 'Title and entry are required.';
      return;
    }

    this.loading = true;
    this.error = null;

    const diary: Diary = {
      id: 0,
      title: this.title.trim(),
      body: this.body.trim(),
      date: this.date || undefined,
      mood: this.mood || undefined,
      weather: this.weather || undefined,
      location: this.location.trim() || undefined,
      tags: this.tags.trim() ? this.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      privateNotes: this.privateNotes.trim() || undefined,
      userId: Number(userId),
      createdAt: new Date().toISOString()
    };

    this.diaryService.addDiary(diary).subscribe({
      next: () => {
        this.router.navigate(['/layout/diaries']);
      },
      error: () => {
        this.error = 'Failed to add diary entry. Please try again.';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/layout/diaries']);
  }
}

