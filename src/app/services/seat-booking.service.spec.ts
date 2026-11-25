import { TestBed } from '@angular/core/testing';
import { SeatBookingService } from './seat-booking.service';

describe('SeatBookingService', () => {
  let booking: SeatBookingService;

  beforeEach(() => {
    localStorage.removeItem('wayfare-my-seat-numbers');
    localStorage.removeItem('wayfare-passenger-id');
    TestBed.configureTestingModule({});
    booking = TestBed.inject(SeatBookingService);
  });

  function bookNextFreeSeat(): number {
    const seat = booking.seats().find(item => item.bookedBy === null);
    if (!seat) {
      throw new Error('Expected an available seat.');
    }
    booking.toggleSeat(seat.seatNo);
    return seat.seatNo;
  }

  it('derives the exact 60% and 90% boundaries consistently', () => {
    expect(booking.bookedCount()).toBe(11);

    while (booking.bookedCount() < 24) {
      bookNextFreeSeat();
    }
    expect(booking.occupancyPercent()).toBe(60);
    expect(booking.occupancyZone()).toBe('green');

    bookNextFreeSeat();
    expect(booking.occupancyPercent()).toBe(62.5);
    expect(booking.occupancyZone()).toBe('yellow');

    while (booking.bookedCount() < 36) {
      bookNextFreeSeat();
    }
    expect(booking.occupancyPercent()).toBe(90);
    expect(booking.occupancyZone()).toBe('yellow');

    bookNextFreeSeat();
    expect(booking.occupancyZone()).toBe('red');
  });

  it('blocks the fortieth seat, then allows a booking after cancellation', () => {
    const bookedSeats: number[] = [];
    while (booking.bookedCount() < 39) {
      bookedSeats.push(bookNextFreeSeat());
    }

    const finalFreeSeat = booking.seats().find(seat => seat.bookedBy === null);
    if (!finalFreeSeat) {
      throw new Error('Expected one free seat at 39 bookings.');
    }
    expect(booking.toggleSeat(finalFreeSeat.seatNo)).toBe('full');
    expect(booking.bookedCount()).toBe(39);
    expect(booking.fullMessageVisible()).toBeTrue();

    booking.cancelSeat(bookedSeats[0]);
    expect(booking.fullMessageVisible()).toBeFalse();
    expect(booking.toggleSeat(finalFreeSeat.seatNo)).toBe('booked');
    expect(booking.bookedCount()).toBe(39);
  });

  it('updates entered seat statuses and respects the 39-seat capacity limit', () => {
    expect(booking.updateSeatStatus(1, 'OTHER')).toBe('updated');
    expect(booking.seats().find(seat => seat.seatNo === 1)?.bookedBy).toBe('OTHER');
    expect(booking.bookedCount()).toBe(12);
    expect(booking.updateSeatStatus(41, 'ME')).toBe('invalid');

    while (booking.bookedCount() < 39) {
      bookNextFreeSeat();
    }

    const finalFreeSeat = booking.seats().find(seat => seat.bookedBy === null);
    if (!finalFreeSeat) {
      throw new Error('Expected one free seat at 39 bookings.');
    }
    expect(booking.updateSeatStatus(finalFreeSeat.seatNo, 'ME')).toBe('full');
    expect(booking.bookedCount()).toBe(39);
    expect(booking.fullMessageVisible()).toBeTrue();
  });

  it('guards repeated clicks and persists the current user selection', () => {
    const seat = booking.seats().find(item => item.bookedBy === null);
    if (!seat) {
      throw new Error('Expected an available seat.');
    }

    expect(booking.toggleSeat(seat.seatNo)).toBe('booked');
    expect(booking.toggleSeat(seat.seatNo)).toBe('cancelled');
    expect(booking.toggleSeat(seat.seatNo)).toBe('booked');
    expect(booking.mySeats().filter(item => item.seatNo === seat.seatNo).length).toBe(1);
    expect(JSON.parse(localStorage.getItem('wayfare-my-seat-numbers') ?? '[]')).toEqual([seat.seatNo]);

    const restoredBooking = new SeatBookingService();
    expect(restoredBooking.mySeats().map(item => item.seatNo)).toEqual([seat.seatNo]);
    expect(restoredBooking.bookedCount()).toBe(12);
  });
});
