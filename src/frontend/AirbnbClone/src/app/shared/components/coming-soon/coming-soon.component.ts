import { Component, OnInit } from '@angular/core';
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
    title: string = 'Coming Soon';
    message: string = "We're working hard to bring you this feature. Stay tuned!";

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.data.subscribe(data => {
            if (data['title']) {
                this.title = data['title'];
            }
            if (data['message']) {
                this.message = data['message'];
            }
        });
    }
}
