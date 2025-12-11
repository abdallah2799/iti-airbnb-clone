import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationConfig {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'danger' | 'warning';
    icon?: 'warning' | 'question' | 'info' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmationDialogService {
    private dialogSubject = new Subject<ConfirmationConfig | null>();
    private responseSubject = new Subject<boolean>();

    dialog$ = this.dialogSubject.asObservable();
    response$ = this.responseSubject.asObservable();

    confirm(config: ConfirmationConfig): Observable<boolean> {
        this.dialogSubject.next({
            ...config,
            confirmText: config.confirmText || 'Confirm',
            cancelText: config.cancelText || 'Cancel',
            confirmColor: config.confirmColor || 'primary',
            icon: config.icon || 'question'
        });

        return new Observable(observer => {
            const sub = this.response$.subscribe(result => {
                observer.next(result);
                observer.complete();
                sub.unsubscribe();
            });
        });
    }

    respond(confirmed: boolean) {
        this.responseSubject.next(confirmed);
        this.dialogSubject.next(null);
    }

    close() {
        this.dialogSubject.next(null);
    }
}
