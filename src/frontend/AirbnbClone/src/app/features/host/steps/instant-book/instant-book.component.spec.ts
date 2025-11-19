import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstantBookComponent } from './instant-book.component';

describe('InstantBookComponent', () => {
  let component: InstantBookComponent;
  let fixture: ComponentFixture<InstantBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantBookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstantBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
