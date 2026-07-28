import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserProfile } from '../../models/user-profile';
import { UserSubscription } from '../../models/user-subscription';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userId: number | null = null;
  profile: UserProfile | null = null;
  editableProfile: UserProfile | null = null;
  subscription: UserSubscription | null = null;
  editableSubscription: Partial<UserSubscription> = this.getEmptySubscription();

  isLoading = true;
  isEditingProfile = false;
  isSavingProfile = false;
  isEditingSubscription = false;
  isSavingSubscription = false;
  isDeletingAccount = false;
  showDeleteConfirm = false;
  deleteConfirmText = '';
  readonly deleteConfirmationPhrase = 'Permanently delete my account';
  errorMessage = '';
  successMessage = '';
  private lastDialogTriggerElement: HTMLElement | null = null;

  ngOnInit(): void {
    const rawUserId = localStorage.getItem('userId');
    this.userId = rawUserId ? Number(rawUserId) : null;
    if (!this.userId) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadData();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  loadData(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.getProfile(this.userId).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.editableProfile = { ...profile };
        this.authService.getSubscription(this.userId as number).subscribe({
          next: (subscription) => {
            this.subscription = subscription;
            this.editableSubscription = subscription ? { ...subscription } : this.getEmptySubscription();
            this.isLoading = false;
          },
          error: (err) => {
            this.errorMessage = err.message || 'Failed to load subscription.';
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load profile.';
        this.isLoading = false;
      }
    });
  }

  startEditProfile(): void {
    if (!this.profile) return;
    this.isEditingProfile = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.editableProfile = { ...this.profile };
  }

  cancelEditProfile(): void {
    this.isEditingProfile = false;
    this.errorMessage = '';
    if (this.profile) {
      this.editableProfile = { ...this.profile };
    }
  }

  saveProfile(): void {
    if (!this.userId || !this.editableProfile) return;
    if (!this.editableProfile.username?.trim() || !this.editableProfile.email?.trim()) {
      this.errorMessage = 'Username and email are required.';
      return;
    }

    this.isSavingProfile = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.updateProfile(this.userId, {
      username: this.editableProfile.username.trim(),
      firstName: this.editableProfile.firstName?.trim() || '',
      lastName: this.editableProfile.lastName?.trim() || '',
      email: this.editableProfile.email.trim()
    }).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.editableProfile = { ...profile };
        this.isEditingProfile = false;
        this.isSavingProfile = false;
        this.successMessage = 'Profile updated successfully.';
        this.toastService.success('Profile updated.');
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to update profile.';
        this.isSavingProfile = false;
      }
    });
  }

  startEditSubscription(): void {
    this.isEditingSubscription = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.editableSubscription = this.subscription ? { ...this.subscription } : this.getEmptySubscription();
  }

  cancelEditSubscription(): void {
    this.isEditingSubscription = false;
    this.errorMessage = '';
    this.editableSubscription = this.subscription ? { ...this.subscription } : this.getEmptySubscription();
  }

  saveSubscription(): void {
    if (!this.userId) return;
    if (!this.editableSubscription.planName?.trim() || !this.editableSubscription.status?.trim() || !this.editableSubscription.startDate) {
      this.errorMessage = 'Plan name, status, and start date are required.';
      return;
    }

    this.isSavingSubscription = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.saveSubscription(this.userId, {
      planName: this.editableSubscription.planName.trim(),
      status: this.editableSubscription.status.trim(),
      startDate: this.editableSubscription.startDate,
      renewalDate: this.editableSubscription.renewalDate || null,
      monthlyCost: this.editableSubscription.monthlyCost ?? null,
      billingCycle: this.editableSubscription.billingCycle || null,
      notes: this.editableSubscription.notes || null
    }).subscribe({
      next: (subscription) => {
        this.subscription = subscription;
        this.editableSubscription = { ...subscription };
        this.isEditingSubscription = false;
        this.isSavingSubscription = false;
        this.successMessage = 'Subscription saved successfully.';
        this.toastService.success('Plan details saved.');
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to save subscription.';
        this.isSavingSubscription = false;
      }
    });
  }

  deleteSubscription(): void {
    if (!this.userId) return;
    this.isSavingSubscription = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.deleteSubscription(this.userId).subscribe({
      next: () => {
        this.subscription = null;
        this.editableSubscription = this.getEmptySubscription();
        this.isEditingSubscription = false;
        this.isSavingSubscription = false;
        this.successMessage = 'Subscription removed successfully.';
        this.toastService.success('Plan details removed.');
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to remove subscription.';
        this.isSavingSubscription = false;
      }
    });
  }

  confirmDeleteAccount(): void {
    this.lastDialogTriggerElement = document.activeElement as HTMLElement;
    this.showDeleteConfirm = true;
    this.deleteConfirmText = '';
    this.errorMessage = '';
    this.successMessage = '';
    setTimeout(() => {
      const field = document.querySelector('#deleteConfirmInput') as HTMLElement | null;
      field?.focus();
    });
  }

  cancelDeleteAccount(): void {
    this.showDeleteConfirm = false;
    this.restoreDialogTriggerFocus();
  }

  deleteAccount(): void {
    if (!this.userId) return;
    if (this.deleteConfirmText.trim() !== this.deleteConfirmationPhrase) {
      this.errorMessage = 'Type the exact confirmation phrase before deleting your account.';
      return;
    }
    this.isDeletingAccount = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.deleteAccount(this.userId).subscribe({
      next: () => {
        this.toastService.info('Account deleted.');
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to delete account.';
        this.isDeletingAccount = false;
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.showDeleteConfirm && !this.isDeletingAccount) {
      this.cancelDeleteAccount();
    }
  }

  onModalKeydown(event: KeyboardEvent): void {
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

  private getEmptySubscription(): Partial<UserSubscription> {
    return {
      planName: '',
      status: '',
      startDate: '',
      renewalDate: '',
      monthlyCost: null,
      billingCycle: '',
      notes: ''
    };
  }

  private restoreDialogTriggerFocus(): void {
    if (!this.lastDialogTriggerElement) return;
    this.lastDialogTriggerElement.focus();
    this.lastDialogTriggerElement = null;
  }
}
