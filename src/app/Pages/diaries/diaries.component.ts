import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiaryService } from '../../services/diaryservice.service';
import { Diary } from '../../models/diary';
import { ThemeService } from '../../services/theme.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-diaries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './diaries.component.html',
  styleUrls: ['./diaries.component.scss']
})
export class DiariesComponent implements OnInit, OnDestroy {
  diaries: Diary[] = [];
  isLoading = false;
  error: string | null = null;
  isCompactMode = false;
  expandedDiaries = new Set<number>();
  currentLayout: 'columns' | 'rows' = 'columns';
  private layoutSubscription?: Subscription;

  editingId: number | null = null;
  editTitle = '';
  editBody = '';
  editDate = '';
  editMood = '';
  editWeather = '';
  editLocation = '';
  editTags = '';
  editPrivateNotes = '';
  modalVisible = false;
  deleteTarget: Diary | null = null;

  constructor(
    private diaryService: DiaryService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    const savedMode = localStorage.getItem('bnq_view_diaries');
    this.isCompactMode = savedMode === 'compact';
    this.currentLayout = this.themeService.getLayout();
    this.loadDiaries();
    
    this.layoutSubscription = this.themeService.layout$.subscribe(layout => {
      this.currentLayout = layout;
    });
  }

  ngOnDestroy(): void {
    this.layoutSubscription?.unsubscribe();
  }

  loadDiaries(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) { this.error = 'No user'; return; }
    this.isLoading = true;
    this.diaryService.getDiariesByUser(Number(userId)).subscribe({
      next: (rows) => { 
        console.log('Diaries loaded:', rows);
        // Parse tags from JSON string to array if needed (server now handles this, but keep as fallback)
        this.diaries = rows.map(diary => {
          if (diary.tags && typeof diary.tags === 'string') {
            const tagsString: string = diary.tags;
            try {
              diary.tags = JSON.parse(tagsString);
            } catch (e) {
              diary.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            }
          }
          return diary;
        });
        this.isLoading = false; 
      },
      error: (error) => { 
        console.error('Error loading diaries:', error);
        this.error = 'Failed to load diaries'; 
        this.isLoading = false; 
      }
    });
  }

  toggleCompactMode(): void {
    this.isCompactMode = !this.isCompactMode;
    localStorage.setItem('bnq_view_diaries', this.isCompactMode ? 'compact' : 'normal');
  }

  editDiary(id: number): void {
    const d = this.diaries.find(x => x.id === id); if (!d) return;
    this.editingId = id;
    this.editTitle = d.title; 
    this.editBody = d.body;
    this.editDate = d.date || (d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '');
    this.editMood = d.mood || '';
    this.editWeather = d.weather || '';
    this.editLocation = d.location || '';
    this.editTags = d.tags ? (Array.isArray(d.tags) ? d.tags.join(', ') : d.tags) : '';
    this.editPrivateNotes = d.privateNotes || '';
    this.modalVisible = true;
  }

  saveEditedDiary(): void {
    if (this.editingId === null) return;
    const updated: Diary = { 
      id: this.editingId, 
      title: this.editTitle.trim(), 
      body: this.editBody.trim(),
      date: this.editDate || undefined,
      mood: this.editMood || undefined,
      weather: this.editWeather || undefined,
      location: this.editLocation || undefined,
      tags: this.editTags.trim() ? this.editTags.split(',').map(tag => tag.trim()) : undefined,
      privateNotes: this.editPrivateNotes || undefined,
      userId: Number(localStorage.getItem('userId'))
    };
    this.diaryService.updateDiary(this.editingId, updated).subscribe({
      next: (updatedDiary) => {
        // Server now handles tag parsing, but keep this as fallback
        if (updatedDiary.tags && typeof updatedDiary.tags === 'string') {
          const tagsString: string = updatedDiary.tags;
          try {
            updatedDiary.tags = JSON.parse(tagsString);
          } catch (e) {
            updatedDiary.tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
          }
        }
        this.diaries = this.diaries.map(m => m.id === this.editingId ? updatedDiary : m);
        this.closeModal();
      }
    });
  }

  deleteDiary(id: number): void {
    this.diaries = this.diaries.filter(m => m.id !== id);
    this.diaryService.deleteDiary(id).subscribe({ error: () => this.loadDiaries() });
  }

  requestDelete(diary: Diary, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.deleteTarget = diary;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    const diaryId = this.deleteTarget.id;
    this.deleteTarget = null;
    this.deleteDiary(diaryId);
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  closeModal(): void { 
    this.modalVisible = false; 
    this.editingId = null; 
    this.editTitle = '';
    this.editBody = '';
    this.editDate = '';
    this.editMood = '';
    this.editWeather = '';
    this.editLocation = '';
    this.editTags = '';
    this.editPrivateNotes = '';
  }

  toggleDiaryExpansion(diaryId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedDiaries.has(diaryId)) {
      this.expandedDiaries.delete(diaryId);
    } else {
      this.expandedDiaries.add(diaryId);
    }
  }

  isDiaryExpanded(diaryId: number): boolean {
    return this.expandedDiaries.has(diaryId);
  }

  truncateText(text: string, maxLength: number = 200): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}


