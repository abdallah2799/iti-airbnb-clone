import { GuestDto } from "src/app/features/host/models/listing-details.model";

export interface ReviewDto {
    id: number;
    rating: number;
    cleanlinessRating?: number;
    accuracyRating?: number;
    communicationRating?: number;
    locationRating?: number;
    checkInRating?: number;
    valueRating?: number;
    comment: string;
    datePosted: string;
    guestId: string;
    guest?: GuestDto;
    listingId: number;
    bookingId: number;
}

export interface CreateReviewDto {
    bookingId: number;
    listingId: number;
    rating: number;
    cleanlinessRating: number;
    accuracyRating: number;
    communicationRating: number;
    locationRating: number;
    checkInRating: number;
    valueRating: number;
    comment: string;
}

export interface ListingReviewsDto {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: { [key: number]: number };
    reviews: ReviewDto[];
}
