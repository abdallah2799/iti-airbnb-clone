import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ListingService } from 'src/app/core/services/listing.service';
import { WishlistService } from 'src/app/core/services/wishlist.service';
import { ListingDetailsDto, AmenityDto } from 'src/app/features/host/models/listing-details.model';
import { MapComponent } from 'src/app/shared/components/map/map.component';
import { ReviewListComponent } from '../components/review-list/review-list.component';
import { ToastrService } from 'ngx-toastr';
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
  Share,
  Heart,
  Medal,
  Grid,
  Sparkles,
  Check,
  type LucideIconData
} from 'lucide-angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    FormsModule,
    MapComponent,
    ReviewListComponent
  ],
  templateUrl: './listing-detail.component.html',
  styleUrls: ['./listing-detail.component.css']
})
export class ListingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private listingService = inject(ListingService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private location = inject(Location);
  private toastr = inject(ToastrService);

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
    Dumbbell, Waves, Coffee, Utensils,
    Share, Heart, Medal, Grid, Sparkles, Check
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

  // Wishlist Logic
  isFavorite = computed(() => {
    const listing = this.listing();
    return listing ? this.wishlistService.isInWishlist(listing.id) : false;
  });

  // Computed property for amenities with icons
  listingAmenities = computed(() => {
    const amenities = this.listing()?.amenities || [];
    return amenities.map(amenity => ({
      ...amenity,
      icon: this.getIconForAmenity(amenity.name)
    }));
  });

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
  getAverageRating(): number {
    const reviews = this.listing()?.reviews;
    if (!reviews || reviews.length === 0) return 0;

    const sum = reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  // Get rating for specific category (for demo purposes)
  getCategoryRating(category: string): number {
    const baseRating = this.getAverageRating();
    // Add some variation for demo
    const variation = (Math.random() - 0.5) * 0.8;
    return Math.max(3.5, Math.min(5, baseRating + variation));
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

  goBack() {
    this.location.back();
  }

  // Photo Methods
  nextPhoto() {
    const total = this.totalPhotos();
    if (total > 0) {
      this.currentPhotoIndex.update((index: number) => (index + 1) % total);
    }
  }

  previousPhoto() {
    const total = this.totalPhotos();
    if (total > 0) {
      this.currentPhotoIndex.update((index: number) =>
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
  }

  closePhotoModal() {
    this.isPhotoModalOpen.set(false);
  }

  toggleDescription() {
    this.isDescriptionExpanded.update((v: boolean) => !v);
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const listing = this.listing();
    if (!listing) return;

    if (this.isFavorite()) {
      this.wishlistService.removeFromWishlist(listing.id).subscribe();
    } else {
      this.wishlistService.addToWishlist(listing.id).subscribe();
    }
  }

  // Booking Methods
  onGuestsChange(event: any) {
    this.guests = event.target.value;
  }

  checkAvailability() {
    this.reserve();
  }

  // Price Helpers
  get cleaningFee(): number {
    return this.listing()?.cleaningFee ?? 50;
  }

  get serviceFee(): number {
    return this.listing()?.serviceFee ?? 40;
  }

  get nights(): number {
    if (!this.checkInDate || !this.checkOutDate) {
      return 1;
    }

    const start = new Date(this.checkInDate);
    const end = new Date(this.checkOutDate);

    // Calculate difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());
    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 1;
  }

  get nightsPrice(): number {
    const listing = this.listing();
    if (!listing) return 0;
    return listing.pricePerNight * this.nights;
  }

  get totalPrice(): number {
    const listing = this.listing();
    if (!listing) return 0;
    return this.nightsPrice + this.cleaningFee + this.serviceFee;
  }

  reserve() {
    if (!this.isLoggedIn()) {
      this.authService.openLoginModal();
      return;
    }

    if (!this.checkInDate || !this.checkOutDate) {
      this.toastr.warning('Please select check-in and check-out dates');
      return;
    }

    const start = new Date(this.checkInDate);
    const end = new Date(this.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Basic validation
    if (start < today) {
      this.toastr.error('Check-in date cannot be in the past');
      return;
    }

    if (end <= start) {
      this.toastr.error('Check-out date must be after check-in date');
      return;
    }

    // Check availability against booked dates
    if (!this.isDateRangeAvailable(start, end)) {
      this.toastr.error('These dates are already booked. Please select different dates.');
      return;
    }

    this.isBookingLoading.set(true);

    const request = {
      listingId: this.listing()!.id,
      startDate: this.checkInDate,
      endDate: this.checkOutDate,
      guests: this.guests,
      currency: 'usd', // Default currency
      successUrl: `${window.location.origin}/checkout/success`,
      cancelUrl: `${window.location.origin}/checkout/cancel`
    };

    this.paymentService.createCheckoutSession(request).subscribe({
      next: (response: any) => {
        window.location.href = response.sessionUrl;
      },
      error: (err: any) => {
        console.error('Error creating checkout session:', err);
        this.isBookingLoading.set(false);
        this.toastr.error('Failed to initiate checkout. Please try again.');
      }
    });
  }

  private isDateRangeAvailable(start: Date, end: Date): boolean {
    const bookedDates = this.listing()?.bookedDates;
    if (!bookedDates || bookedDates.length === 0) return true;

    // Check for overlaps
    for (const booking of bookedDates) {
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);

      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      if (start < bookingEnd && end > bookingStart) {
        return false;
      }
    }

    return true;
  }
}