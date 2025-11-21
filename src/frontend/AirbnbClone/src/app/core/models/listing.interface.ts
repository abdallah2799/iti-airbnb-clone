// interfaces/listing.interface.ts
export interface Listing {
  id: number;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  currency: string;
  propertyType: number;
  maxGuests: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  coverPhotoUrl: string;
  averageRating: number;
  reviewCount: number;
  hostName: string;
  isSuperHost: boolean;
    isFavorite?: boolean;
}

// Property type enum (you might need to map the numbers to strings)
export enum PropertyType {
  Apartment = 0,
  House = 1,
  Villa = 2,
  Studio = 3,
  Room = 4
}