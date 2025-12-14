import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, XCircle } from 'lucide-angular';

@Component({
  selector: 'app-payment-error',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './payment-error.component.html'
})
export class PaymentErrorComponent {

  readonly icons = {
    XCircle
  };

  constructor() { }
}
