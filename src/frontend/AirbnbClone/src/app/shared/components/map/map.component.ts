import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full bg-gray-200 rounded-xl overflow-hidden relative z-0">
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

  private map: L.Map | undefined;

  ngAfterViewInit() {
    if (this.lat && this.lng) {
      this.initMap();
    }
  }

  private initMap() {
    try {
      // Initialize Leaflet map with OpenStreetMap tiles
      this.map = L.map(this.mapContainer.nativeElement).setView(
        [this.lat!, this.lng!],
        this.zoom!
      );

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this.map);

      // Fix for default marker icon
      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Add marker at the specified location
      L.marker([this.lat!, this.lng!], { icon: defaultIcon }).addTo(this.map);

    } catch (error) {
      console.error('Error loading Leaflet map:', error);
    }
  }
}