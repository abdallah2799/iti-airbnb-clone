import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostReservationsComponent } from './host-reservations.component';

describe('HostReservationsComponent', () => {
  let component: HostReservationsComponent;
  let fixture: ComponentFixture<HostReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
