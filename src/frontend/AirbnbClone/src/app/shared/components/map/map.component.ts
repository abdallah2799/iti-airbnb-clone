import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full bg-gray-200 rounded-xl overflow-hidden relative">
      <div #mapContainer class="w-full h-full"></div>
      
      <!-- Fallback if lat/lng missing -->
      <div *ngIf="!lat || !lng" class="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
         Map data unavailable
      </div>
    </div>
  `
})
export class MapComponent implements AfterViewInit {
  @Input() lat?: number;
  @Input() lng?: number;
  @Input() zoom?: number = 13;

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map: any | undefined;

  ngAfterViewInit() {
    if (this.lat && this.lng) {
      this.initMap();
    }
  }

  private async initMap() {
    try {
      // Dynamic import to handle the functional API from @googlemaps/js-api-loader v2+
      const { importLibrary, setOptions } = await import('@googlemaps/js-api-loader');

      // Set the API Key
      // Casting to any to avoid potential type mismatches with the library version
      const options: any = {
        apiKey: (environment as any).googleMapsKey || 'YOUR_API_KEY',
        version: 'weekly',
      };
      setOptions(options);

      // Load the libraries
      const { Map } = await importLibrary('maps') as any;
      const { Marker } = await importLibrary('marker') as any;

      const mapOptions: any = {
        center: { lat: this.lat!, lng: this.lng! },
        zoom: this.zoom,
        mapId: 'DEMO_MAP_ID',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);

      new Marker({
        position: { lat: this.lat!, lng: this.lng! },
        map: this.map,
      });

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  }
}