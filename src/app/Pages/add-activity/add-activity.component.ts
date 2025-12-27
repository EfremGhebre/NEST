import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityService } from '../../services/activityservice.service';
import { Activity } from '../../models/activity';

@Component({
  selector: 'app-add-activity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-activity.component.html',
  styleUrls: ['./add-activity.component.scss']
})
export class AddActivityComponent implements OnInit {
  activityForm: FormGroup;
  loading = false;
  error: string | null = null;

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
    { value: 'planned', label: 'Planned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  constructor(
    private fb: FormBuilder,
    private activityService: ActivityService,
    private router: Router
  ) {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      date: ['', Validators.required],
      duration: [null],
      location: [''],
      status: ['planned', Validators.required],
      priority: ['medium', Validators.required],
      tags: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    this.activityForm.patchValue({ date: today });
  }

  onSubmit(): void {
    if (this.activityForm.valid) {
      this.loading = true;
      this.error = null;

      const formValue = this.activityForm.value;
      const userId = Number(localStorage.getItem('userId'));

      if (!userId) {
        this.error = 'User not authenticated';
        this.loading = false;
        return;
      }

      const activity: Activity = {
        userId: userId,
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        date: formValue.date,
        duration: formValue.duration ? Number(formValue.duration) : undefined,
        location: formValue.location || undefined,
        status: formValue.status,
        priority: formValue.priority,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : undefined,
        notes: formValue.notes || undefined
      };

      this.activityService.createActivity(activity).subscribe({
        next: (createdActivity) => {
          console.log('Activity created successfully:', createdActivity);
          this.router.navigate(['/layout/activities']);
        },
        error: (error) => {
          console.error('Error creating activity:', error);
          this.error = 'Failed to create activity. Please try again.';
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.activityForm.controls).forEach(key => {
      const control = this.activityForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/layout/activities']);
  }

  getFieldError(fieldName: string): string {
    const field = this.activityForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      category: 'Category',
      date: 'Date',
      status: 'Status',
      priority: 'Priority'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.activityForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
