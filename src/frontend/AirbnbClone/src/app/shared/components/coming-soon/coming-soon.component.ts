import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-coming-soon',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './coming-soon.component.html',
    styles: []
})
export class ComingSoonComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    
    title: string = 'Coming Soon';
    message: string = "We're working hard to bring you this feature. Stay tuned!";

    ngOnInit() {
        this.route.data.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(data => {
            if (data['title']) {
                this.title = data['title'];
            }
            if (data['message']) {
                this.message = data['message'];
            }
        });
    }
}
