import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivityService } from '../../services/activityservice.service';
import { Activity } from '../../models/activity';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

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
  
  // Add form properties
  showAddForm = false;
  newTitle = '';
  newDescription = '';
  newCategory = '';
  newDate = '';
  newDuration: number | null = null;
  newLocation = '';
  newStatus = '';
  newPriority = '';
  newTags = '';
  newNotes = '';

  // Filter options
  selectedCategory = 'all';
  selectedStatus = 'all';
  selectedPriority = 'all';
  searchTerm = '';
  expandedActivities = new Set<number>();
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
    private themeService: ThemeService
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

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
  }

  addActivity(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    if (!(this.newTitle.trim() && this.newDescription.trim() && this.newCategory && this.newDate && this.newStatus && this.newPriority)) {
      alert('Please fill in all required fields');
      return;
    }
    const newActivity: Activity = {
      id: 0,
      title: this.newTitle.trim(),
      description: this.newDescription.trim(),
      category: this.newCategory,
      date: this.newDate,
      duration: this.newDuration || undefined,
      location: this.newLocation || undefined,
      status: this.newStatus as 'completed' | 'in-progress' | 'planned',
      priority: this.newPriority as 'low' | 'medium' | 'high',
      tags: this.newTags.trim() ? this.newTags.split(',').map(tag => tag.trim()) : undefined,
      notes: this.newNotes || undefined,
      userId: Number(userId)
    };
    this.activityService.createActivity(newActivity).subscribe({
      next: (activity) => {
        this.activities = [activity, ...this.activities];
        this.applyFilters();
        this.newTitle = '';
        this.newDescription = '';
        this.newCategory = '';
        this.newDate = '';
        this.newDuration = null;
        this.newLocation = '';
        this.newStatus = '';
        this.newPriority = '';
        this.newTags = '';
        this.newNotes = '';
        this.showAddForm = false;
      },
      error: (error) => {
        console.error('Error adding activity:', error);
        alert('Failed to add activity. Please try again.');
      }
    });
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
    this.modalVisible = true;
  }

  deleteActivity(activity: Activity): void {
    if (confirm(`Are you sure you want to delete "${activity.title}"?`)) {
      this.activityService.deleteActivity(activity.id!).subscribe({
        next: () => {
          this.loadActivities();
        },
        error: (error) => {
          console.error('Error deleting activity:', error);
          alert('Failed to delete activity');
        }
      });
    }
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
      alert('Please fill in all required fields');
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
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating activity:', error);
          alert('Failed to update activity');
        }
      });
    }
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
  }

  toggleActivityExpansion(activityId: number | undefined, event?: Event): void {
    if (!activityId) return;
    if (event) {
      event.stopPropagation();
    }
    if (this.expandedActivities.has(activityId)) {
      this.expandedActivities.delete(activityId);
    } else {
      this.expandedActivities.add(activityId);
    }
  }

  isActivityExpanded(activityId: number | undefined): boolean {
    if (!activityId) return false;
    return this.expandedActivities.has(activityId);
  }

  truncateText(text: string, maxLength: number = 150): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}
