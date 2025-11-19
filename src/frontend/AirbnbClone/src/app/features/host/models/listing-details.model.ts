import { PropertyType, PrivacyType } from './listing.model'; // Import existing enums

export enum ListingStatus {
  Draft = 0,
  Published = 1,
  Inactive = 2,
  Suspended = 3,
}

export interface PhotoDto {
  id: number;
  url: string;
  isCover: boolean;
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
  photos: PhotoDto[];
}
