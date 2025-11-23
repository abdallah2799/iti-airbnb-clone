import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListingCreationService } from '../../services/listing-creation.service';
import { AiAssistantService, DescriptionRequest } from '../../../../core/services/ai-assistant.service'; // Import this
import { PropertyType } from '../../../../core/models/listing.interface';

@Component({
  selector: 'app-description',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './description.component.html',
})
export class DescriptionComponent {
public listingService = inject(ListingCreationService);
  private aiService = inject(AiAssistantService);
  private router = inject(Router);

  // State for AI UI
  isGenerating = false;
  generatedOptions: string[] = [];
  currentOptionIndex = 0;

  // Initialize description from the service state
  description = this.listingService.listingData().description || '';

  generateWithAi() {
    const data = this.listingService.listingData();

    // 1. Validate: Ensure we have enough info to write a description
    if (!data.title || !data.city) {
      alert('Please enter a Title and City in the previous steps before using AI.');
      return;
    }

    this.isGenerating = true;

    // 2. Map "CreateListingDto" -> "DescriptionRequest"
    
    // Convert Enum ID (0, 1) to String ("Apartment", "House")
    // We use the indexing trick PropertyType[value] to get the name
    const typeString = data.propertyType !== null && data.propertyType !== undefined 
      ? PropertyType[data.propertyType] 
      : 'Apartment';

    // Combine City & Country for a better location context
    const fullLocation = `${data.city}, ${data.country}`;

    // 🚨 Note: Your CreateListingDto doesn't have 'amenities'. 
    // If you track them elsewhere in the service, access them here. 
    // For now, we send an empty array.
    const requestPayload: DescriptionRequest = {
      title: data.title,
      location: fullLocation,
      propertyType: typeString, 
      amenities: [] // Replace with this.listingService.amenities() if available
    };

    // 3. Call the API
    this.aiService.generateDescriptions(requestPayload).subscribe({
      next: (res) => {
        this.generatedOptions = res.generatedDescriptions;
        this.currentOptionIndex = 0;
        this.isGenerating = false;
      },
      error: (err) => {
        console.error('AI Error:', err);
        this.isGenerating = false;
      }
    });
  }

  nextOption() {
    if (this.generatedOptions.length > 0) {
      this.currentOptionIndex = (this.currentOptionIndex + 1) % this.generatedOptions.length;
    }
  }

  useOption() {
    this.description = this.generatedOptions[this.currentOptionIndex];
    this.generatedOptions = []; // Close the AI card
  }

  onSaveExit() {
    this.listingService.updateListing({ description: this.description });
    this.listingService.saveAndExit();
  }

  onNext() {
    if (this.description?.trim()) {
      this.listingService.updateListing({ description: this.description });
      this.router.navigate(['/hosting/photos']);
    }
  }
}
