import { PropertyType, PrivacyType } from './listing.model';

export enum ListingStatus {
  Draft = 0,
  Published = 1,
  Inactive = 2,
  Suspended = 3,
  UnderReview = 4,
}

export interface PhotoDto {
  id: number;
  url: string;
  isCover: boolean;
}

export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Cancelled = 2,
  Completed = 3,
}

export interface GuestDto {
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  createdAt: Date;
}

export interface ListingBookingDto {
  id: number;
  startDate: string;
  endDate: string;
  guest: GuestDto;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  listingTitle: string;
  listingId: number;
  listingImageUrl?: string;
}

export interface ReviewDto {
  id: number;
  rating: number;
  comment: string;
  datePosted: string;
  guest: GuestDto;
}

export interface ListingDetailsDto {
  id: number;
  title: string;
  description: string;
  pricePerNight: number;
  address: string;
  city: string;
  country: string;
  maxGuests: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  propertyType: PropertyType;
  privacyType: PrivacyType;
  status: ListingStatus;
  latitude?: number;
  longitude?: number;
  instantBooking: boolean;
  host: HostInfoDto;
  photos: PhotoDto[];
  bookings: ListingBookingDto[];
  reviews: ReviewDto[];
  amenities?: AmenityDto[];
  checkInTime?: string;
  checkOutTime?: string;
  houseRules?: string[];
}
export interface HostInfoDto {
  id: string;
  fullName: string;
  profilePictureUrl?: string;
  bio?: string;
  responseRate?: number;
  responseTimeMinutes?: number;
  hostSince?: Date;
  governmentIdVerified: boolean;
  isSuperhost?: boolean;
}

export interface AmenityDto {
  id: number;
  name: string;
  icon?: string;
  category: string;
}

export interface ReviewSummaryDto {
  id: number;
  rating: number;
  comment: string;
  datePosted: Date;
  guestName: string;
  guestProfilePicture?: string;
}
