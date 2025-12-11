import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService, ConfirmationConfig } from '../../../core/services/confirmation-dialog.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, AlertTriangle, HelpCircle, Info, XCircle } from 'lucide-angular';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="config" 
         class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="onCancel()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
           (click)="$event.stopPropagation()">
        <!-- Header with Icon -->
        <div class="p-6 pb-4">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                 [ngClass]="{
                   'bg-yellow-100': config.icon === 'warning',
                   'bg-blue-100': config.icon === 'question' || config.icon === 'info',
                   'bg-red-100': config.icon === 'error'
                 }">
              <lucide-icon *ngIf="config.icon === 'warning'" [img]="icons.AlertTriangle" 
                           class="w-6 h-6 text-yellow-600"></lucide-icon>
              <lucide-icon *ngIf="config.icon === 'question'" [img]="icons.HelpCircle" 
                           class="w-6 h-6 text-blue-600"></lucide-icon>
              <lucide-icon *ngIf="config.icon === 'info'" [img]="icons.Info" 
                           class="w-6 h-6 text-blue-600"></lucide-icon>
              <lucide-icon *ngIf="config.icon === 'error'" [img]="icons.XCircle" 
                           class="w-6 h-6 text-red-600"></lucide-icon>
            </div>

            <!-- Content -->
            <div class="flex-1 pt-1">
              <h3 class="text-lg font-bold text-gray-900 mb-2">{{ config.title }}</h3>
              <p class="text-sm text-gray-600 leading-relaxed">{{ config.message }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 pb-6 flex gap-3 justify-end">
          <button (click)="onCancel()"
                  class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
            {{ config.cancelText }}
          </button>
          <button (click)="onConfirm()"
                  class="px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors shadow-sm"
                  [ngClass]="{
                    'bg-blue-600 hover:bg-blue-700': config.confirmColor === 'primary',
                    'bg-red-600 hover:bg-red-700': config.confirmColor === 'danger',
                    'bg-orange-600 hover:bg-orange-700': config.confirmColor === 'warning'
                  }">
            {{ config.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  config: ConfirmationConfig | null = null;
  private subscription?: Subscription;

  readonly icons = { AlertTriangle, HelpCircle, Info, XCircle };

  constructor(private dialogService: ConfirmationDialogService) { }

  ngOnInit() {
    this.subscription = this.dialogService.dialog$.subscribe(config => {
      this.config = config;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  onConfirm() {
    this.dialogService.respond(true);
  }

  onCancel() {
    this.dialogService.respond(false);
  }
}
