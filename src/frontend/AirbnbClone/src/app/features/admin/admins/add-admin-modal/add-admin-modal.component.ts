import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { LucideAngularModule, X, Eye, EyeOff } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-add-admin-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './add-admin-modal.component.html',
    styleUrl: './add-admin-modal.component.css'
})
export class AddAdminModalComponent {
    @Output() close = new EventEmitter<void>();
    @Output() adminCreated = new EventEmitter<void>();

    adminForm: FormGroup;
    isSubmitting = false;
    showPassword = false;
    readonly icons = { X, Eye, EyeOff };

    private fb = inject(FormBuilder);
    private adminService = inject(AdminService);
    private toastr = inject(ToastrService);

    constructor() {
        this.adminForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
            ]]
        });
    }

    onClose() {
        this.close.emit();
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    onSubmit() {
        if (this.adminForm.invalid) {
            this.adminForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        this.adminService.createAdmin(this.adminForm.value).subscribe({
            next: (result) => {
                this.toastr.success(`Admin "${result.fullName}" created successfully`, 'Success');
                this.adminCreated.emit();
                this.isSubmitting = false;
            },
            error: (err) => {
                console.error('Error creating admin:', err);
                this.toastr.error(err.message || 'Failed to create admin', 'Error');
                this.isSubmitting = false;
            }
        });
    }

    get f() {
        return this.adminForm.controls;
    }
}
