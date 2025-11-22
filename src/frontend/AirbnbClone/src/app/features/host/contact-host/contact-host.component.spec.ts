import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactHostComponent } from './contact-host.component';

describe('ContactHostComponent', () => {
  let component: ContactHostComponent;
  let fixture: ComponentFixture<ContactHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
