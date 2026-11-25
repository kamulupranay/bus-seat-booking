import { TestBed } from '@angular/core/testing';
import { BookingSummaryComponent } from './booking-summary.component';
import { SeatBookingService } from '../../services/seat-booking.service';

describe('BookingSummaryComponent', () => {
  let booking: SeatBookingService;

  beforeEach(async () => {
    localStorage.removeItem('wayfare-my-seat-numbers');
    localStorage.removeItem('wayfare-passenger-id');
    await TestBed.configureTestingModule({
      imports: [BookingSummaryComponent],
    }).compileComponents();
    booking = TestBed.inject(SeatBookingService);
  });

  it('updates the shared passenger ID and displays it with selected seats', () => {
    const fixture = TestBed.createComponent(BookingSummaryComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const passengerIdInput = element.querySelector<HTMLInputElement>('.passenger-id-input');
    expect(passengerIdInput?.value).toBe('USR-1042');

    if (!passengerIdInput) {
      throw new Error('Passenger ID input was not rendered.');
    }

    passengerIdInput.value = 'PAX-2048';
    passengerIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    booking.toggleSeat(1);
    fixture.detectChanges();

    expect(booking.passengerId()).toBe('PAX-2048');
    expect(booking.seats().find(seat => seat.seatNo === 1)?.passengerId).toBe('PAX-2048');
    expect(element.querySelector('.selected-seat')?.textContent).toContain('Passenger PAX-2048');
    expect(localStorage.getItem('wayfare-passenger-id')).toBe('PAX-2048');

    const restoredBooking = new SeatBookingService();
    expect(restoredBooking.passengerId()).toBe('PAX-2048');
    expect(restoredBooking.seats().find(seat => seat.seatNo === 1)?.passengerId).toBe('PAX-2048');
  });

  it('updates passenger details for existing seats when the ID changes', () => {
    const fixture = TestBed.createComponent(BookingSummaryComponent);
    booking.toggleSeat(1);
    booking.toggleSeat(2);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.passenger-id-input');
    expect(input).not.toBeNull();
    if (!input) {
      throw new Error('Passenger ID input was not rendered.');
    }

    input.value = 'PAX-9001';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(booking.mySeats().every(seat => seat.passengerId === 'PAX-9001')).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Passenger PAX-9001');
  });

  it('clears all selected seats from the summary action', () => {
    const fixture = TestBed.createComponent(BookingSummaryComponent);
    booking.toggleSeat(1);
    booking.toggleSeat(2);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.clear-all')?.click();
    fixture.detectChanges();

    expect(booking.mySeats()).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).querySelector('.empty-selection')).not.toBeNull();
  });
});
