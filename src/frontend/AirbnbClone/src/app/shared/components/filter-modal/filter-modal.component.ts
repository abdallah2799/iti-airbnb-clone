import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterCriteria } from 'src/app/core/models/filter-criteria.interface';

@Component({
    selector: 'app-filter-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './filter-modal.component.html',
    styleUrls: ['./filter-modal.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class FilterModalComponent {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();
    @Output() apply = new EventEmitter<FilterCriteria>();

    // Filter state
    priceMin?: number;
    priceMax?: number;
    selectedPropertyTypes: string[] = [];
    selectedAmenities: string[] = [];

    // Available options
    propertyTypes = [
        { id: 'entire', label: 'Entire place', description: 'Guests have the whole place to themselves' },
        { id: 'private', label: 'Private room', description: 'Guests have their own room in a shared space' }
    ];

    amenities = [
        { id: 'wifi', label: 'Wifi', icon: '📶' },
        { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
        { id: 'washer', label: 'Washer', icon: '🧺' },
        { id: 'airConditioning', label: 'Air conditioning', icon: '❄️' },
        { id: 'pool', label: 'Pool', icon: '🏊' },
        { id: 'parking', label: 'Free parking', icon: '🅿️' }
    ];

    togglePropertyType(typeId: string): void {
        const index = this.selectedPropertyTypes.indexOf(typeId);
        if (index > -1) {
            this.selectedPropertyTypes.splice(index, 1);
        } else {
            this.selectedPropertyTypes.push(typeId);
        }
    }

    toggleAmenity(amenityId: string): void {
        const index = this.selectedAmenities.indexOf(amenityId);
        if (index > -1) {
            this.selectedAmenities.splice(index, 1);
        } else {
            this.selectedAmenities.push(amenityId);
        }
    }

    isPropertyTypeSelected(typeId: string): boolean {
        return this.selectedPropertyTypes.includes(typeId);
    }

    isAmenitySelected(amenityId: string): boolean {
        return this.selectedAmenities.includes(amenityId);
    }

    onClose(): void {
        this.close.emit();
    }

    onClearAll(): void {
        this.priceMin = undefined;
        this.priceMax = undefined;
        this.selectedPropertyTypes = [];
        this.selectedAmenities = [];
    }

    onApply(): void {
        const criteria: FilterCriteria = {
            priceMin: this.priceMin,
            priceMax: this.priceMax,
            propertyTypes: this.selectedPropertyTypes.length > 0 ? this.selectedPropertyTypes : undefined,
            amenities: this.selectedAmenities.length > 0 ? this.selectedAmenities : undefined
        };
        this.apply.emit(criteria);
        this.close.emit();
    }

    getActiveFilterCount(): number {
        let count = 0;
        if (this.priceMin !== undefined || this.priceMax !== undefined) count++;
        if (this.selectedPropertyTypes.length > 0) count++;
        if (this.selectedAmenities.length > 0) count++;
        return count;
    }
}
