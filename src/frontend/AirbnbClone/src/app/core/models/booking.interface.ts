export enum BookingStatus {
    Pending = 0,
    Confirmed = 1,
    Cancelled = 2
}

export enum PaymentStatus {
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Refunded = 3,
    PartiallyRefunded = 4
}

export interface Booking {
    id: number;
    listingId: number;
    listingTitle: string;
    listingCoverPhoto?: string;
    startDate: string; // Date string
    endDate: string; // Date string
    guests: number;
    totalPrice: number;
    currency: string;
    status: BookingStatus;
    paymentStatus?: PaymentStatus;
    hostId: string;
    hostName: string;
    createdAt: string;
}

export interface CreateBookingRequest {
    listingId: number;
    startDate: string;
    endDate: string;
    guests: number;
}
