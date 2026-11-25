/// <reference types="jasmine" />

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SeatGridComponent } from './seat-grid.component';
import { SeatBookingService } from '../../services/seat-booking.service';

describe('SeatGridComponent', () => {
  let booking: SeatBookingService;
  let fixture: ComponentFixture<SeatGridComponent>;

  beforeEach(async () => {
    localStorage.removeItem('wayfare-my-seat-numbers');
    localStorage.removeItem('wayfare-passenger-id');
    await TestBed.configureTestingModule({
      imports: [SeatGridComponent],
    }).compileComponents();
    booking = TestBed.inject(SeatBookingService);
    fixture = TestBed.createComponent(SeatGridComponent);
    fixture.detectChanges();
  });

  it('renders 40 seats with cues from the shared legend model', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.seat').length).toBe(40);

    for (const item of booking.legend) {
      expect(element.querySelector(`.swatch-${item.state}`)?.textContent?.trim()).toBe(item.cue);
      if (item.state === 'mine') {
        booking.toggleSeat(1);
        fixture.detectChanges();
      }
      expect(element.querySelector(`.seat-${item.state} .seat-cue`)?.textContent?.trim()).toBe(item.cue);
    }
  });

  it('books an available seat and emits a hint for another passenger’s seat', () => {
    let message = '';
    fixture.componentInstance.message.subscribe(value => message = value);
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('.seat-available')?.click();
    fixture.detectChanges();
    expect(booking.mySeats().length).toBe(1);
    expect(booking.mySeats()[0].passengerId).toBe('USR-1042');

    element.querySelector<HTMLButtonElement>('.seat-taken')?.click();
    expect(message).toBe('This seat is already taken.');
    expect(booking.mySeats().length).toBe(1);
  });

  it('guards a rapid double-click but allows a later cancellation', fakeAsync(() => {
    const element = fixture.nativeElement as HTMLElement;
    const freeSeat = element.querySelector<HTMLButtonElement>('.seat-available');
    expect(freeSeat).not.toBeNull();

    freeSeat?.click();
    freeSeat?.click();
    fixture.detectChanges();
    expect(booking.mySeats().length).toBe(1);

    tick(350);
    freeSeat?.click();
    fixture.detectChanges();
    expect(booking.mySeats().length).toBe(0);
  }));
});
