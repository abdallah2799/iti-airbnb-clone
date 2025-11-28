import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './nav-item.component.html',
  styleUrl: './nav-item.component.css',
})
export class NavItemComponent {
  @Input() icon: string = '';
  @Input() label: string = '';
  @Input() badge?: string;
  @Input() active: boolean = false;
  @Output() onClick = new EventEmitter<void>();

  handleClick() {
    this.onClick.emit();
  }

  getIconClass() {
    switch (this.icon) {
      case 'home': return 'home';
      case 'lightbulb': return 'lightbulb';
      case 'bell': return 'bell';
      default: return 'home';
    }
  }
}
