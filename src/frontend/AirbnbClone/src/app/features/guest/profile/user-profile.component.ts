import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profile, UpdateProfileRequest, UserProfileService } from '../../../core/services/user-profile.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  private profileService = inject(UserProfileService);

  profile: Profile | null = null;
  activeTab: 'edit' | 'security' = 'edit';
  loading = false;
  isEditing = false; // New flag to control edit mode

  // Form data
  profileForm = {
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: ''
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
        this.loading = false;
      }
    });
  }

  // Start editing
  startEditing() {
    this.isEditing = true;
    this.resetForm(); // Populate form with current data
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
        this.isEditing = false; // Exit edit mode after successful update
        this.loading = false;
        // Show success message
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.loading = false;
        // Show error message
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
          }
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
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
    // Implement change password flow
    console.log('Change password clicked');
  }

  getTabClass(tab: string): string {
    const baseClass = 'w-full text-left px-4 py-3 rounded-lg transition-colors font-medium flex items-center';
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