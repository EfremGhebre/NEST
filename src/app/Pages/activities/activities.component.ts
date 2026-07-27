import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivityService } from '../../services/activityservice.service';
import { Activity } from '../../models/activity';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss']
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  filteredActivities: Activity[] = [];
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Modal properties
  modalVisible = false;
  editingActivityId: number | null = null;
  editTitle: string = '';
  editDescription: string = '';
  editCategory: string = '';
  editDate: string = '';
  editDuration: number | null = null;
  editLocation: string = '';
  editStatus: string = '';
  editPriority: string = '';
  editTags: string = '';
  editNotes: string = '';
  deleteTarget: Activity | null = null;
  
  // Filter options
  selectedCategory = 'all';
  selectedStatus = 'all';
  selectedPriority = 'all';
  searchTerm = '';
  selectedActivity: Activity | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private lastDialogTriggerElement: HTMLElement | null = null;
  actionMenuForActivityId: number | null = null;
  currentLayout: 'columns' | 'rows' = 'columns';
  private layoutSubscription?: Subscription;
  
  categories = [
    'Work',
    'Personal',
    'Health',
    'Education',
    'Hobby',
    'Social',
    'Travel',
    'Other'
  ];

  statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'planned', label: 'Planned' }
  ];

  priorities = [
    { value: 'all', label: 'All Priority' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  constructor(
    private activityService: ActivityService,
    private router: Router,
    private themeService: ThemeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentLayout = this.themeService.getLayout();
    this.loadActivities();
    
    this.layoutSubscription = this.themeService.layout$.subscribe(layout => {
      this.currentLayout = layout;
    });
  }

  ngOnDestroy(): void {
    this.layoutSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  loadActivities(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.activityService.getActivitiesByUser(userId).subscribe({
      next: (activities) => {
        this.activities = activities;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.error = 'Failed to load activities';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredActivities = this.activities.filter(activity => {
      const matchesCategory = this.selectedCategory === 'all' || activity.category === this.selectedCategory;
      const matchesStatus = this.selectedStatus === 'all' || activity.status === this.selectedStatus;
      const matchesPriority = this.selectedPriority === 'all' || activity.priority === this.selectedPriority;
      const matchesSearch = this.searchTerm === '' || 
        activity.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (activity.tags && activity.tags.some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase())));

      return matchesCategory && matchesStatus && matchesPriority && matchesSearch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }


  editActivity(activity: Activity): void {
    this.editingActivityId = activity.id!;
    this.editTitle = activity.title;
    this.editDescription = activity.description;
    this.editCategory = activity.category;
    this.editDate = activity.date;
    this.editDuration = activity.duration || null;
    this.editLocation = activity.location || '';
    this.editStatus = activity.status;
    this.editPriority = activity.priority;
    this.editTags = activity.tags ? (Array.isArray(activity.tags) ? activity.tags.join(', ') : activity.tags) : '';
    this.editNotes = activity.notes || '';
    this.openModal();
  }

  deleteActivity(activity: Activity): void {
    this.activityService.deleteActivity(activity.id!).subscribe({
      next: () => {
        this.successMessage = 'Activity deleted.';
        this.toastService.success('Activity deleted.');
        this.loadActivities();
      },
      error: (error) => {
        console.error('Error deleting activity:', error);
        this.error = 'Failed to delete activity.';
        this.toastService.error(this.error);
      }
    });
  }

  requestDelete(activity: Activity, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeActionMenu();
    this.lastDialogTriggerElement = document.activeElement as HTMLElement;
    this.deleteTarget = activity;
    setTimeout(() => this.focusFirstDialogControl('.confirm-modal .modal-content'));
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    const target = this.deleteTarget;
    this.deleteTarget = null;
    this.restoreDialogTriggerFocus();
    this.deleteActivity(target);
  }

  cancelDelete(): void {
    this.deleteTarget = null;
    this.restoreDialogTriggerFocus();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-in-progress';
      case 'planned': return 'status-planned';
      default: return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDuration(duration?: number): string {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  saveEditedActivity(): void {
    if (!this.editTitle.trim() || !this.editDescription.trim() || !this.editCategory || !this.editDate) {
      this.error = 'Please fill in all required fields.';
      this.toastService.error(this.error);
      return;
    }

    if (this.editingActivityId !== null) {
      const updatedActivity: Activity = {
        id: this.editingActivityId,
        title: this.editTitle.trim(),
        description: this.editDescription.trim(),
        category: this.editCategory,
        date: this.editDate,
        duration: this.editDuration || undefined,
        location: this.editLocation.trim() || undefined,
        status: this.editStatus as 'completed' | 'in-progress' | 'planned',
        priority: this.editPriority as 'low' | 'medium' | 'high',
        tags: this.editTags.trim() ? this.editTags.split(',').map(tag => tag.trim()) : undefined,
        notes: this.editNotes.trim() || undefined,
        userId: Number(localStorage.getItem('userId'))
      };

      this.activityService.updateActivity(this.editingActivityId, updatedActivity).subscribe({
        next: (activity) => {
          const index = this.activities.findIndex(a => a.id === activity.id);
          if (index !== -1) {
            this.activities[index] = activity;
            this.applyFilters();
          }
          this.successMessage = 'Changes saved.';
          this.toastService.success('Activity updated.');
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating activity:', error);
          this.error = 'Failed to update activity.';
          this.toastService.error(this.error);
        }
      });
    }
  }

  openModal(): void {
    this.lastDialogTriggerElement = document.activeElement as HTMLElement;
    this.modalVisible = true;
    setTimeout(() => this.focusFirstDialogControl('#modal .modal-content'));
  }

  closeModal(): void {
    this.modalVisible = false;
    this.editingActivityId = null;
    this.editTitle = '';
    this.editDescription = '';
    this.editCategory = '';
    this.editDate = '';
    this.editDuration = null;
    this.editLocation = '';
    this.editStatus = '';
    this.editPriority = '';
    this.editTags = '';
    this.editNotes = '';
    this.restoreDialogTriggerFocus();
  }

  toggleActionMenu(activityId: number | undefined, event: Event): void {
    if (!activityId) return;
    event.stopPropagation();
    this.actionMenuForActivityId = this.actionMenuForActivityId === activityId ? null : activityId;
  }

  closeActionMenu(): void {
    this.actionMenuForActivityId = null;
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  openActivityDetails(activity: Activity, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeActionMenu();
    if (this.selectedActivity?.id === activity.id) {
      this.closeActivityDetails();
      return;
    }
    this.lastFocusedElement = (event?.currentTarget as HTMLElement) || document.activeElement as HTMLElement;
    this.selectedActivity = activity;
    document.body.style.overflow = 'hidden';
  }

  closeActivityDetails(): void {
    this.selectedActivity = null;
    this.closeActionMenu();
    document.body.style.overflow = '';
    this.lastFocusedElement?.focus();
  }

  onModalKeydown(event: KeyboardEvent): void {
    this.trapFocusWithinModal(event);
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.selectedActivity) {
      this.closeActivityDetails();
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
    if (this.actionMenuForActivityId !== null) {
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
