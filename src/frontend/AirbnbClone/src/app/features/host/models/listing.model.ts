// Matches Core.Enums.PropertyType
export enum PropertyType {
  Apartment = 0,
  House = 1,
  Villa = 2,
  Cabin = 3,
  Room = 4,
}

// Matches Core.Enums.PrivacyType
export enum PrivacyType {
  EntirePlace = 0,
  Room = 1,
  SharedRoom = 2,
}

export interface Amenity {
  id: number;
  name: string;
  icon: string; // e.g. "wifi", "tv"
  category: string; // "Essentials", "Safety", etc.
}

// Matches Application.DTOs.HostListings.CreateListingDto
export interface CreateListingDto {
  id?: number;
  title: string;
  description: string;
  pricePerNight: number;
  address: string;
  city: string;
  country: string;
  maxGuests: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  propertyType: PropertyType | null; // Nullable for the UI state
  privacyType: PrivacyType | null;
  cleaningFee?: number;
  minimumNights?: number;
  instantBooking: boolean;
  photoFiles?: File[];
  latitude?: number;
  longitude?: number;
  amenityIds: number[];
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  pricePerNight?: number;
  address?: string;
  city?: string;
  country?: string;
  maxGuests?: number;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  propertyType?: PropertyType;
  privacyType?: PrivacyType;
  instantBooking?: boolean;
  amenityIds?: number[];
  latitude?: number;
  longitude?: number;
  cleaningFee?: number;
  minimumNights?: number;
}
