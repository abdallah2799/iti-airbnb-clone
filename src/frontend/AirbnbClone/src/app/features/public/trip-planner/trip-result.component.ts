import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, MapPin, Calendar, DollarSign, Users, Clock, Star, Info } from 'lucide-angular';
import { TripSkeletonComponent } from './trip-skeleton.component';

// Type definitions
export interface TripResponse {
    trip_overview: {
        title: string;
        description: string;
        history: string;
        coordinates: { latitude: number; longitude: number };
    };
    estimated_costs: {
        transportation: number;
        food: number;
        accommodation: number | null;
    };
    itinerary: Array<{
        day: number;
        title: string;
        activities: string[];
    }>;
    lodging_recommendations: Array<{
        name: string;
        rating: number;
        review_count: number;
        price_per_night: number;
        image_url: string;
        coordinates: { latitude: number; longitude: number };
    }>;
}

@Component({
    selector: 'app-trip-result',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, TripSkeletonComponent],
    templateUrl: './trip-result.component.html',
    styleUrl: './trip-result.component.scss'
})
export class TripResultComponent {
    private router = inject(Router);

    // Lucide icons
    readonly MapPinIcon = MapPin;
    readonly CalendarIcon = Calendar;
    readonly DollarSignIcon = DollarSign;
    readonly UsersIcon = Users;
    readonly ClockIcon = Clock;
    readonly StarIcon = Star;
    readonly InfoIcon = Info;

    // UI State Signals
    isLoading = signal<boolean>(true);
    showFullDescription = signal<boolean>(false);
    showMobileMap = signal<boolean>(false);

    // Trip Data Signal
    tripData = signal<TripResponse | null>(null);

    // Computed values
    totalCost = computed(() => {
        const data = this.tripData();
        if (!data) return 0;

        const { transportation, food, accommodation } = data.estimated_costs;
        return transportation + food + (accommodation || 0);
    });

    tripDuration = computed(() => {
        const data = this.tripData();
        if (!data) return 0;
        return data.itinerary.length;
    });

    constructor() {
        // Check for navigation state data
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || history.state;

        if (state && state['tripData']) {
            // Use data from navigation state (from n8n webhook)
            this.loadTripData(state['tripData']);
        } else {
            // Fallback to mock data for direct navigation
            this.loadTripData();
        }
    }

    // Load trip data (from API response or mock)
    loadTripData(apiData?: any) {
        setTimeout(() => {
            if (apiData) {
                // Use data from n8n webhook response
                this.tripData.set(apiData as TripResponse);
            } else {
                // Use mock data for demonstration
                this.tripData.set(this.getMockData());
            }
            this.isLoading.set(false);
        }, 2000);
    }

    // Toggle description expansion
    toggleDescription() {
        this.showFullDescription.set(!this.showFullDescription());
    }

    // Toggle mobile map
    toggleMobileMap() {
        this.showMobileMap.set(!this.showMobileMap());
    }

    // Check if description is long enough to need truncation
    isDescriptionLong(): boolean {
        const description = this.tripData()?.trip_overview.description || '';
        return description.length > 200;
    }

    // Get truncated description
    getTruncatedDescription(): string {
        const description = this.tripData()?.trip_overview.description || '';
        if (!this.isDescriptionLong() || this.showFullDescription()) {
            return description;
        }
        return description.substring(0, 200) + '...';
    }

    // Format currency
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Generate star array for rating display
    getStarArray(rating: number): boolean[] {
        return Array(5).fill(false).map((_, index) => index < Math.floor(rating));
    }

    // Mock data for demonstration
    getMockData(): TripResponse {
        return {
            trip_overview: {
                title: 'Romantic Getaway to Paris',
                description: 'Experience the magic of Paris with this carefully curated 7-day itinerary. From the iconic Eiffel Tower to charming cafés in Montmartre, discover the City of Light\'s most romantic spots. Indulge in world-class cuisine, explore magnificent museums, and stroll along the Seine at sunset. This trip combines cultural immersion with leisurely exploration, perfect for couples seeking an unforgettable European adventure.',
                history: 'Paris, originally a Roman city called Lutetia, became the capital of France in 987 AD. The Eiffel Tower, now the city\'s most iconic landmark, was initially criticized by Parisians when built for the 1889 World\'s Fair and was almost demolished in 1909.',
                coordinates: { latitude: 48.8566, longitude: 2.3522 }
            },
            estimated_costs: {
                transportation: 450,
                food: 840,
                accommodation: 1400
            },
            itinerary: [
                {
                    day: 1,
                    title: 'Arrival & Eiffel Tower',
                    activities: [
                        'Check into hotel in the Marais district',
                        'Lunch at a traditional French bistro',
                        'Visit the Eiffel Tower and Trocadéro Gardens',
                        'Seine River cruise at sunset',
                        'Dinner in the Latin Quarter'
                    ]
                },
                {
                    day: 2,
                    title: 'Louvre & Historic Paris',
                    activities: [
                        'Morning visit to the Louvre Museum',
                        'Explore the Tuileries Garden',
                        'Lunch at Café Marly',
                        'Walk through the Palais Royal',
                        'Evening stroll along the Champs-Élysées'
                    ]
                },
                {
                    day: 3,
                    title: 'Montmartre & Sacré-Cœur',
                    activities: [
                        'Breakfast at a local patisserie',
                        'Explore the artistic Montmartre neighborhood',
                        'Visit Sacré-Cœur Basilica',
                        'Lunch at a traditional crêperie',
                        'Browse art galleries and vintage shops',
                        'Dinner with a view of the city'
                    ]
                },
                {
                    day: 4,
                    title: 'Versailles Day Trip',
                    activities: [
                        'Train to Versailles',
                        'Tour the Palace of Versailles',
                        'Explore the magnificent gardens',
                        'Lunch at a garden café',
                        'Return to Paris for evening at leisure'
                    ]
                },
                {
                    day: 5,
                    title: 'Museums & Culture',
                    activities: [
                        'Visit Musée d\'Orsay',
                        'Lunch in Saint-Germain-des-Prés',
                        'Explore the Rodin Museum and gardens',
                        'Coffee at Les Deux Magots',
                        'Evening jazz club experience'
                    ]
                },
                {
                    day: 6,
                    title: 'Shopping & Cuisine',
                    activities: [
                        'Morning at the Marché Bastille',
                        'Cooking class: French pastries',
                        'Lunch at your cooking class',
                        'Shopping on Rue de Rivoli',
                        'Farewell dinner at a Michelin-starred restaurant'
                    ]
                },
                {
                    day: 7,
                    title: 'Departure Day',
                    activities: [
                        'Leisurely breakfast at hotel',
                        'Last-minute souvenir shopping',
                        'Visit a local bookshop',
                        'Transfer to airport'
                    ]
                }
            ],
            lodging_recommendations: [
                {
                    name: 'Hotel Le Marais Boutique',
                    rating: 4.8,
                    review_count: 342,
                    price_per_night: 185,
                    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
                    coordinates: { latitude: 48.8566, longitude: 2.3522 }
                },
                {
                    name: 'Parisian Charm Apartment',
                    rating: 4.9,
                    review_count: 156,
                    price_per_night: 210,
                    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                    coordinates: { latitude: 48.8606, longitude: 2.3376 }
                },
                {
                    name: 'Luxury Seine View Suite',
                    rating: 4.7,
                    review_count: 289,
                    price_per_night: 295,
                    image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
                    coordinates: { latitude: 48.8584, longitude: 2.2945 }
                },
                {
                    name: 'Cozy Montmartre Studio',
                    rating: 4.6,
                    review_count: 198,
                    price_per_night: 145,
                    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
                    coordinates: { latitude: 48.8867, longitude: 2.3431 }
                }
            ]
        };
    }
}
