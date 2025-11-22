import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-listing-intro',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './listing-intro.component.html',
  styleUrl: './listing-intro.component.css',
})
export class ListingIntroComponent {
  constructor(private router: Router) {}

  onGetStarted() {
    this.router.navigate(['/hosting/structure']);
  }
}
