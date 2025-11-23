import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmenitiesComponent } from './amenities.component';

describe('AmenitiesComponent', () => {
  let component: AmenitiesComponent;
  let fixture: ComponentFixture<AmenitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmenitiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmenitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
