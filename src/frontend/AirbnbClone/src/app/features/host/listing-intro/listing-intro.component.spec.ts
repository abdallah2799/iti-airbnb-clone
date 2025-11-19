import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListingIntroComponent } from './listing-intro.component';

describe('ListingIntroComponent', () => {
  let component: ListingIntroComponent;
  let fixture: ComponentFixture<ListingIntroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingIntroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListingIntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
