import { BookingStatus } from './booking.interface';
export { BookingStatus };

// Enums
export enum ListingStatus {
  Draft = 0,
  Published = 1,
  Unlisted = 2,
  Suspended = 3,
  UnderReview = 4
}

// DTOs
export interface AdminDashboardDto {
  totalUsers: number;
  totalSuspendedUsers: number;
  totalActiveUsers: number;
  totalConfirmedUsers: number;
  totalUnconfirmedUsers: number;

  totalBookings: number;
  totalPendingBookings: number;
  totalConfirmedBookings: number;
  totalCancelledBookings: number;

  totalListings: number;
  totalDraftListings: number;
  totalPublishedListings: number;
  totalInactiveListings: number;
  totalSuspendedListings: number;
  totalUnderReviewListings: number;
  unverifiedListingsCount: number;

  monthlyNewUsers: number[];
  monthlyNewListings: number[];
  monthlyNewBookings: number[];

  recentBookings: RecentBookingDto[];
  recentListings: RecentListingDto[];
}

export interface RecentBookingDto {
  id: string;
  guestName: string;
  listingTitle: string;
  bookingDate: string; // DateTime
  status: string;
}

export interface RecentListingDto {
  id: string;
  title: string;
  hostName: string;
  createdAt: string; // DateTime
  status: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  createdAt: string; // DateTime
  lastLoginAt?: string; // DateTime
  isConfirmed: boolean;
  isSuspended: boolean;
  hostSince?: string; // DateTime
}

export interface AdminListingDto {
  id: number;
  title: string;
  description: string;
  pricePerNight: number;
  city: string;
  country: string;
  status: ListingStatus;
  createdAt: string; // DateTime
  updatedAt?: string; // DateTime
  hostId: string;
  hostFullName: string;
  hostEmail: string;
  imageUrls: string[];
}

export interface AdminBookingDto {
  id: number;
  startDate: string; // DateTime
  endDate: string; // DateTime
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string; // DateTime
  cancelledAt?: string; // DateTime
  guestId: string;
  guestEmail: string;
  guestFullName: string;
  listingId: number;
  listingTitle: string;
  hostId: string;
  hostEmail: string;
  hostFullName: string;
}

export interface AdminReviewDto {
  id: number;
  content: string;
  rating: number;
  authorName: string;
  authorId: string;
  listingTitle: string;
  datePosted: string; // DateTime
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UpdateListingStatusDto {
  status: ListingStatus;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
}
