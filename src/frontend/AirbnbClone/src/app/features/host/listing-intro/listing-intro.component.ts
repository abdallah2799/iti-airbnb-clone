import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ListingCreationService } from '../services/listing-creation.service';

@Component({
  selector: 'app-listing-intro',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './listing-intro.component.html',
  styleUrl: './listing-intro.component.css',
})
export class ListingIntroComponent implements OnInit {
  private router = inject(Router);
  private listingService = inject(ListingCreationService); // Inject Service

  ngOnInit() {
    this.listingService.reset();
  }

  onGetStarted() {
    this.router.navigate(['/hosting/structure']);
  }
}
