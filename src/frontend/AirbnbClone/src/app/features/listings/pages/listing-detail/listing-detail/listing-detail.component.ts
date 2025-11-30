import { Component, inject, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ListingService } from '../../../services/listing.service';
import { ListingDetailsDto, AmenityDto } from '../../../../host/models/listing-details.model';
import { ContactHostComponent } from '../../../../host/contact-host/contact-host.component';
import {
  LucideAngularModule,
  MapPin,
  Home,
  Users,
  Bed,
  Bath,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Calendar,
  Shield,
  Flag,
  AlertCircle,
  Wifi,
  Tv,
  ParkingCircle,
  AirVent,
  Dumbbell,
  Waves,
  Coffee,
  Utensils,
  type LucideIconData
} from 'lucide-angular';
import { AuthService } from '../../../../../core/services/auth.service';
import { PaymentService } from '../../../../../core/services/payment.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    ContactHostComponent,
    FormsModule
  ],
  templateUrl: './listing-detail.component.html',
  styleUrls: ['./listing-detail.component.css']
})
export class ListingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private listingService = inject(ListingService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);

  @ViewChild(ContactHostComponent) contactHostComponent!: ContactHostComponent;

  listing = signal<ListingDetailsDto | null>(null);
  isLoading = signal<boolean>(true);
  currentPhotoIndex = signal<number>(0);
  isLoggedIn = signal<boolean>(false);
  isDescriptionExpanded = signal<boolean>(false);
  isPhotoModalOpen = signal<boolean>(false);
  showContactHostModal = signal<boolean>(false);

  // Form properties (not signals, for ngModel binding)
  checkInDate: string = '';
  checkOutDate: string = '';
  guests: number = 1;

  isBookingLoading = signal<boolean>(false);

  // Icons
  readonly icons = {
    MapPin, Home, Users, Bed, Bath, Star,
    ChevronLeft, ChevronRight, X, Clock,
    Calendar, Shield, Flag, AlertCircle,
    Wifi, Tv, ParkingCircle, AirVent,
    Dumbbell, Waves, Coffee, Utensils
  };

  // Icon mapping for amenities
  private amenityIconMap: { [key: string]: LucideIconData } = {
    'wifi': Wifi,
    'tv': Tv,
    'kitchen': Utensils,
    'parking': ParkingCircle,
    'air conditioning': AirVent,
    'ac': AirVent,
    'gym': Dumbbell,
    'pool': Waves,
    'coffee': Coffee,
    'coffee maker': Coffee,
  };

  reviewCategories = ['Cleanliness', 'Accuracy', 'Communication', 'Location', 'Check-in', 'Value'];

  // Computed properties
  currentPhoto = computed(() => {
    const photos = this.listing()?.photos;
    const index = this.currentPhotoIndex();
    return photos && photos.length > 0 ? photos[index] : null;
  });

  totalPhotos = computed(() => this.listing()?.photos?.length || 0);

  hasPhotos = computed(() => (this.listing()?.photos?.length || 0) > 0);

  shouldShowReadMore = computed(() => {
    const description = this.listing()?.description || '';
    return description.length > 300;
  });

  // Computed property for amenities with icons
  listingAmenities = computed(() => {
    const amenities = this.listing()?.amenities || [];
    return amenities.map(amenity => ({
      ...amenity,
      icon: this.getIconForAmenity(amenity.name)
    }));
  });

  get currentListing() {
    return this.listing();
  }

  ngOnInit() {
    // Check if user is logged in
    this.isLoggedIn.set(this.authService.isAuthenticated());

    // Get listing ID from URL
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadListing(id);
    } else {
      this.router.navigate(['/']);
    }
  }

  loadListing(id: number) {
    this.isLoading.set(true);
    this.listingService.getListingById(id).subscribe({
      next: (data) => {
        this.listing.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading listing:', err);
        this.isLoading.set(false);
        this.router.navigate(['/']);
      }
    });
  }

  // Get icon for amenity based on name
  private getIconForAmenity(amenityName: string): LucideIconData {
    const lowerName = amenityName.toLowerCase();

    // Check if there's a direct match
    for (const [key, icon] of Object.entries(this.amenityIconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }

    // Default icon
    return Home;
  }

  // Calculate average rating from reviews
  getAverageRating(): string {
    const reviews = this.listing()?.reviews;
    if (!reviews || reviews.length === 0) return '0.0';

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;
    return average.toFixed(1);
  }

  // Get rating for specific category (for demo purposes)
  getCategoryRating(category: string): string {
    const baseRating = parseFloat(this.getAverageRating());
    // Add some variation for demo
    const variation = (Math.random() - 0.5) * 0.8;
    return Math.max(3.5, Math.min(5, baseRating + variation)).toFixed(1);
  }

  // Check if host is superhost (demo logic)
  isSuperhost(): boolean {
    const host = this.listing()?.host;
    if (!host) return false;

    // Demo logic: consider hosts with response rate > 90% as superhosts
    return host.responseRate ? host.responseRate > 90 : false;
  }

  // Contact Host Methods
  openContactHost() {
    this.showContactHostModal.set(true);
    setTimeout(() => {
      const contactElement = document.querySelector('app-contact-host');
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  // Photo Methods
  nextPhoto() {
    const total = this.totalPhotos();
    if (total > 0) {
      this.currentPhotoIndex.update(index => (index + 1) % total);
    }
  }

  previousPhoto() {
    const total = this.totalPhotos();
    if (total > 0) {
      this.currentPhotoIndex.update(index =>
        index === 0 ? total - 1 : index - 1
      );
    }
  }

  goToPhoto(index: number) {
    this.currentPhotoIndex.set(index);
  }

  openPhotoModal(index: number = 0) {
    this.currentPhotoIndex.set(index);
    this.isPhotoModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closePhotoModal() {
    this.isPhotoModalOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleDescription() {
    this.isDescriptionExpanded.update(expanded => !expanded);
  }

  getPropertyTypeLabel(type: number): string {
    const types: { [key: number]: string } = {
      0: 'Apartment',
      1: 'House',
      2: 'Villa',
      3: 'Cabin',
      4: 'Room'
    };
    return types[type] || 'Property';
  }

  goBack() {
    this.router.navigate(['/']);
  }

  async checkAvailability() {
    if (!this.isLoggedIn()) {
      this.navigateToLogin();
      return;
    }

    if (!this.checkInDate || !this.checkOutDate) {
      alert('Please select check-in and check-out dates');
      return;
    }

    const listing = this.listing();
    if (!listing) return;

    this.isBookingLoading.set(true);

    const request = {
      listingId: listing.id,
      startDate: this.checkInDate,
      endDate: this.checkOutDate,
      guests: this.guests,
      currency: listing.currency,
      successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/listings/${listing.id}`
    };

    this.paymentService.createCheckoutSession(request).subscribe({
      next: (response) => {
        window.location.href = response.sessionUrl;
      },
      error: (err) => {
        console.error('Error creating checkout session:', err);
        alert('Failed to initiate booking. Please try again.');
        this.isBookingLoading.set(false);
      }
    });
  }
}