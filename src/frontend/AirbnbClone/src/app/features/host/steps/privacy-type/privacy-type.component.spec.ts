import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyTypeComponent } from './privacy-type.component';

describe('PrivacyTypeComponent', () => {
  let component: PrivacyTypeComponent;
  let fixture: ComponentFixture<PrivacyTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivacyTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
