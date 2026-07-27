import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiaryService } from '../../services/diaryservice.service';
import { Diary } from '../../models/diary';
import { ThemeService } from '../../services/theme.service';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';

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
  selectedDiary: Diary | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private lastDialogTriggerElement: HTMLElement | null = null;
  actionMenuForDiaryId: number | null = null;
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
    private themeService: ThemeService,
    private toastService: ToastService
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
    document.body.style.overflow = '';
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
    this.openModal();
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
        this.toastService.success('Diary updated.');
        this.closeModal();
      }
    });
  }

  deleteDiary(id: number): void {
    this.diaries = this.diaries.filter(m => m.id !== id);
    this.diaryService.deleteDiary(id).subscribe({
      next: () => this.toastService.success('Diary deleted.'),
      error: () => {
        this.toastService.error('Failed to delete diary.');
        this.loadDiaries();
      }
    });
  }

  requestDelete(diary: Diary, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeActionMenu();
    this.lastDialogTriggerElement = document.activeElement as HTMLElement;
    this.deleteTarget = diary;
    setTimeout(() => this.focusFirstDialogControl('.confirm-modal .modal-content'));
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    const diaryId = this.deleteTarget.id;
    this.deleteTarget = null;
    this.restoreDialogTriggerFocus();
    this.deleteDiary(diaryId);
  }

  cancelDelete(): void {
    this.deleteTarget = null;
    this.restoreDialogTriggerFocus();
  }

  openModal(): void {
    this.lastDialogTriggerElement = document.activeElement as HTMLElement;
    this.modalVisible = true;
    setTimeout(() => this.focusFirstDialogControl('#modal .modal-content'));
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
    this.restoreDialogTriggerFocus();
  }

  toggleActionMenu(diaryId: number, event: Event): void {
    event.stopPropagation();
    this.actionMenuForDiaryId = this.actionMenuForDiaryId === diaryId ? null : diaryId;
  }

  closeActionMenu(): void {
    this.actionMenuForDiaryId = null;
  }

  truncateText(text: string, maxLength: number = 200): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  openDiaryDetails(diary: Diary, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeActionMenu();
    if (this.selectedDiary?.id === diary.id) {
      this.closeDiaryDetails();
      return;
    }
    this.lastFocusedElement = (event?.currentTarget as HTMLElement) || document.activeElement as HTMLElement;
    this.selectedDiary = diary;
    document.body.style.overflow = 'hidden';
  }

  closeDiaryDetails(): void {
    this.selectedDiary = null;
    this.closeActionMenu();
    document.body.style.overflow = '';
    this.lastFocusedElement?.focus();
  }

  onModalKeydown(event: KeyboardEvent): void {
    this.trapFocusWithinModal(event);
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.selectedDiary) {
      this.closeDiaryDetails();
      return;
    }
    if (this.modalVisible) {
      this.closeModal();
      return;
    }
    if (this.deleteTarget) {
      this.cancelDelete();
      return;
    }
    if (this.actionMenuForDiaryId !== null) {
      this.closeActionMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.card-actions-menu')) {
      this.closeActionMenu();
    }
  }

  private focusFirstDialogControl(containerSelector: string): void {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const focusable = container.querySelector<HTMLElement>('button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
  }

  private trapFocusWithinModal(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const target = event.target as HTMLElement | null;
    const container = target?.closest('.modal-content');
    if (!container) return;

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.hasAttribute('disabled'));
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const active = document.activeElement as HTMLElement;

    if (!event.shiftKey && active === last) {
      first.focus();
      event.preventDefault();
    } else if (event.shiftKey && active === first) {
      last.focus();
      event.preventDefault();
    }
  }

  private restoreDialogTriggerFocus(): void {
    if (!this.lastDialogTriggerElement) return;
    this.lastDialogTriggerElement.focus();
    this.lastDialogTriggerElement = null;
  }
}


