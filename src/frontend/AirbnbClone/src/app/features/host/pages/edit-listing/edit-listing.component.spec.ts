import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditListingComponent } from './edit-listing.component';

describe('EditListingComponent', () => {
  let component: EditListingComponent;
  let fixture: ComponentFixture<EditListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
