import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  activeTab = 'popular';
  
  selectTab(tab: string) {
    this.activeTab = tab;
    // Add logic to load different destinations based on tab
  }
  
  showMore() {
    // Add logic to show more destinations
  }
}
