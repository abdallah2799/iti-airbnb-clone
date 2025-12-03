import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './payment-success.component.html'
})
export class PaymentSuccessComponent implements OnInit {

  readonly icons = {
    CheckCircle
  };

  constructor() { }

  ngOnInit(): void { }
}
