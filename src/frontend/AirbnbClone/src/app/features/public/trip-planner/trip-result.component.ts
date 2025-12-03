import { Component, signal, computed, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, MapPin, Calendar, DollarSign, Users, Clock, Star, Info } from 'lucide-angular';
import { TripSkeletonComponent } from './trip-skeleton.component';
import * as L from 'leaflet';

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
export class TripResultComponent implements AfterViewInit {
    private router = inject(Router);
    private http = inject(HttpClient);

    @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
    @ViewChild('mobileMapContainer', { static: false }) mobileMapContainer!: ElementRef;

    private map: L.Map | null = null;
    private mobileMap: L.Map | null = null;

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
            // Use data from navigation state (already generated)
            this.loadTripData(state['tripData']);
        } else if (state && state['searchCriteria']) {
            // Generate trip from search criteria
            this.generateTrip(state['searchCriteria']);
        } else {
            // Fallback to mock data for direct navigation
            this.loadTripData();
        }
    }

    // Generate trip using n8n webhook
    generateTrip(criteria: any) {
        this.isLoading.set(true);
        const webhookUrl = 'https://abdullah-ragab.app.n8n.cloud/webhook/plan-trip';

        this.http.post(webhookUrl, criteria).subscribe({
            next: (response) => {
                this.loadTripData(response);
            },
            error: (error) => {
                console.error('Error generating trip:', error);
                // Fallback to mock data on error for demo purposes
                this.loadTripData();
            }
        });
    }

    // Load trip data (from API response or mock)
    loadTripData(apiData?: any) {
        if (apiData) {
            // Use data from n8n webhook response
            this.tripData.set(apiData as TripResponse);
            this.isLoading.set(false);
            // Initialize map after data is loaded
            setTimeout(() => this.initializeMap(), 100);
        } else {
            // Use mock data for demonstration (simulate delay)
            setTimeout(() => {
                this.tripData.set(this.getMockData());
                this.isLoading.set(false);
                // Initialize map after data is loaded
                setTimeout(() => this.initializeMap(), 100);
            }, 2000);
        }
    }

    ngAfterViewInit() {
        // Map will be initialized after data loads
    }

    // Initialize Leaflet map
    initializeMap() {
        const data = this.tripData();
        if (!data || !this.mapContainer) return;

        try {
            // Initialize main map
            const coords = data.trip_overview.coordinates;
            this.map = L.map(this.mapContainer.nativeElement).setView(
                [coords.latitude, coords.longitude],
                12
            );

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);

            // Add city marker with enhanced design
            const cityIcon = L.divIcon({
                className: 'custom-city-marker',
                html: `<div class="city-marker-container">
                        <div class="city-marker-pin">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF385C">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </div>
                        <div class="city-marker-label">${data.trip_overview.title.split(' ').slice(-1)[0]}</div>
                      </div>`,
                iconSize: [80, 60],
                iconAnchor: [40, 50]
            });

            L.marker([coords.latitude, coords.longitude], { icon: cityIcon })
                .addTo(this.map)
                .bindPopup(`
                    <div class="city-popup">
                        <h3>${data.trip_overview.title}</h3>
                        <p>${data.trip_overview.description.substring(0, 100)}...</p>
                    </div>
                `);

            // Add hotel markers with names
            data.lodging_recommendations.forEach(hotel => {
                const hotelIcon = L.divIcon({
                    className: 'custom-hotel-marker',
                    html: `<div class="hotel-marker-container">
                            <div class="hotel-marker-card">
                              <div class="hotel-marker-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                                  <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V6H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
                                </svg>
                              </div>
                              <div class="hotel-marker-name">${hotel.name}</div>
                              <div class="hotel-marker-price">$${hotel.price_per_night}/nt</div>
                            </div>
                            <div class="hotel-marker-arrow"></div>
                          </div>`,
                    iconSize: [160, 70],
                    iconAnchor: [80, 75]
                });

                L.marker(
                    [hotel.coordinates.latitude, hotel.coordinates.longitude],
                    { icon: hotelIcon }
                )
                    .addTo(this.map!)
                    .bindPopup(`
                        <div class="hotel-popup">
                            <h4>${hotel.name}</h4>
                            <div class="popup-rating">⭐ ${hotel.rating} <span>(${hotel.review_count} reviews)</span></div>
                            <div class="popup-price">$${hotel.price_per_night} <span>per night</span></div>
                        </div>
                    `);
            });

            // Fit bounds to show all markers
            const bounds = L.latLngBounds([
                [coords.latitude, coords.longitude],
                ...data.lodging_recommendations.map(h => [h.coordinates.latitude, h.coordinates.longitude] as [number, number])
            ]);
            this.map.fitBounds(bounds, { padding: [50, 50] });

        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    // Initialize mobile map when overlay opens
    initializeMobileMap() {
        const data = this.tripData();
        if (!data || !this.mobileMapContainer || this.mobileMap) return;

        setTimeout(() => {
            try {
                const coords = data.trip_overview.coordinates;
                this.mobileMap = L.map(this.mobileMapContainer.nativeElement).setView(
                    [coords.latitude, coords.longitude],
                    12
                );

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(this.mobileMap);

                // Add same markers as desktop map
                const cityIcon = L.divIcon({
                    className: 'custom-city-marker',
                    html: `<div class="city-marker-container">
                            <div class="city-marker-pin">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF385C">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                            </div>
                            <div class="city-marker-label">${data.trip_overview.title.split(' ').slice(-1)[0]}</div>
                          </div>`,
                    iconSize: [80, 60],
                    iconAnchor: [40, 50]
                });

                L.marker([coords.latitude, coords.longitude], { icon: cityIcon })
                    .addTo(this.mobileMap)
                    .bindPopup(`
                        <div class="city-popup">
                            <h3>${data.trip_overview.title}</h3>
                            <p>${data.trip_overview.description.substring(0, 100)}...</p>
                        </div>
                    `);

                data.lodging_recommendations.forEach(hotel => {
                    const hotelIcon = L.divIcon({
                        className: 'custom-hotel-marker',
                        html: `<div class="hotel-marker-container">
                                <div class="hotel-marker-card">
                                  <div class="hotel-marker-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                                      <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V6H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
                                    </svg>
                                  </div>
                                  <div class="hotel-marker-name">${hotel.name}</div>
                                  <div class="hotel-marker-price">$${hotel.price_per_night}/nt</div>
                                </div>
                                <div class="hotel-marker-arrow"></div>
                              </div>`,
                        iconSize: [160, 70],
                        iconAnchor: [80, 75]
                    });

                    L.marker(
                        [hotel.coordinates.latitude, hotel.coordinates.longitude],
                        { icon: hotelIcon }
                    )
                        .addTo(this.mobileMap!)
                        .bindPopup(`
                            <div class="hotel-popup">
                                <h4>${hotel.name}</h4>
                                <div class="popup-rating">⭐ ${hotel.rating} <span>(${hotel.review_count} reviews)</span></div>
                                <div class="popup-price">$${hotel.price_per_night} <span>per night</span></div>
                            </div>
                        `);
                });

                const bounds = L.latLngBounds([
                    [coords.latitude, coords.longitude],
                    ...data.lodging_recommendations.map(h => [h.coordinates.latitude, h.coordinates.longitude] as [number, number])
                ]);
                this.mobileMap.fitBounds(bounds, { padding: [50, 50] });

            } catch (error) {
                console.error('Error initializing mobile map:', error);
            }
        }, 100);
    }

    // Toggle description expansion
    toggleDescription() {
        this.showFullDescription.set(!this.showFullDescription());
    }

    // Toggle mobile map
    toggleMobileMap() {
        this.showMobileMap.set(!this.showMobileMap());
        if (this.showMobileMap()) {
            this.initializeMobileMap();
        }
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
