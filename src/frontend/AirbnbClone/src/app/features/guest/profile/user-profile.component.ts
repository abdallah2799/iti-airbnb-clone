import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profile, UpdateProfileRequest, UserProfileService } from '../../../core/services/user-profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChangePasswordRequest } from '../../../core/models/auth.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  private profileService = inject(UserProfileService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  profile: Profile | null = null;
  activeTab: 'edit' | 'security' = 'edit';
  loading = false;
  isEditing = false;

  // Form data
  profileForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: ''
  };

  // Password Form
  passwordForm: ChangePasswordRequest = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.resetForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.toastr.error('Failed to load profile');
        this.loading = false;
      }
    });
  }

  // Start editing
  startEditing() {
    this.isEditing = true;
    this.resetForm();
  }

  // Cancel editing
  cancelEditing() {
    this.isEditing = false;
    this.resetForm();
  }

  updateProfile() {
    if (!this.profile) return;

    this.loading = true;
    const updateData: UpdateProfileRequest = {
      fullName: this.profileForm.fullName || null,
      email: this.profileForm.email,
      phoneNumber: this.profileForm.phoneNumber || null,
      bio: this.profileForm.bio || null
    };

    this.profileService.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.isEditing = false;
        this.loading = false;
        this.toastr.success('Profile updated successfully');
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.toastr.error('Failed to update profile');
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profileService.updateProfilePicture(file).subscribe({
        next: (response) => {
          if (this.profile) {
            this.profile.profilePictureUrl = response.profilePictureUrl;
            this.toastr.success('Profile picture updated');
          }
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          this.toastr.error('Failed to upload profile picture. Please check configuration.');
        }
      });
    }
  }

  resetForm() {
    if (this.profile) {
      this.profileForm = {
        fullName: this.profile.fullName || '',
        email: this.profile.email || '',
        phoneNumber: this.profile.phoneNumber || '',
        bio: this.profile.bio || ''
      };
    }
  }

  changePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastr.error('Passwords do not match');
      return;
    }

    this.loading = true;
    this.authService.changePassword(this.passwordForm).subscribe({
      next: (response) => {
        this.toastr.success('Password changed successfully');
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.toastr.error(error.error?.message || 'Failed to change password');
        this.loading = false;
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = 'https://a0.muscache.com/defaults/user_pic-225x225.png';
  }

  setActiveTab(tab: 'edit' | 'security') {
    this.activeTab = tab;
  }

  getTabClass(tab: string): string {
    const baseClass = 'w-full text-left px-4 py-3 rounded-lg transition-colors font-medium flex items-center cursor-pointer';
    return this.activeTab === tab
      ? `${baseClass} bg-blue-50 text-blue-700 border border-blue-200`
      : `${baseClass} text-gray-700 hover:bg-gray-50`;
  }

  getSubmitButtonClass(): string {
    const baseClass = 'px-6 py-2 rounded-lg transition-colors font-medium flex items-center';
    const isDisabled = !this.isFormDirty();

    return isDisabled
      ? `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`
      : `${baseClass} bg-[#FF385C] text-white hover:bg-[#e02e4a]`;
  }

  isFormDirty(): boolean {
    if (!this.profile) return false;

    return this.profileForm.fullName !== (this.profile.fullName || '') ||
      this.profileForm.email !== (this.profile.email || '') ||
      this.profileForm.phoneNumber !== (this.profile.phoneNumber || '') ||
      this.profileForm.bio !== (this.profile.bio || '');
  }
}