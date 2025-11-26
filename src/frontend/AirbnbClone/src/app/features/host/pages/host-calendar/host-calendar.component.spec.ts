import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostCalendarComponent } from './host-calendar.component';

describe('HostCalendarComponent', () => {
  let component: HostCalendarComponent;
  let fixture: ComponentFixture<HostCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
