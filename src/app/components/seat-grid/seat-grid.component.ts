import { Component, EventEmitter, Output } from '@angular/core';
import { getSeatState, Seat, SeatState } from '../../models/seat.model';
import {
  BookingResult,
  SeatBookingService,
} from '../../services/seat-booking.service';

@Component({
  selector: 'app-seat-grid',
  standalone: true,
  templateUrl: './seat-grid.component.html',
  styleUrl: './seat-grid.component.css',
})
export class SeatGridComponent {
  @Output() readonly message = new EventEmitter<string>();
  private lastActivatedSeat: number | null = null;
  private lastActivationTime = 0;
  private lastResult: BookingResult | null = null;

  constructor(readonly booking: SeatBookingService) {}

  stateOf(seat: Seat): SeatState {
    return getSeatState(seat);
  }

  cueFor(seat: Seat): string {
    const item = this.booking.legend.find(
      (legend) => legend.state === this.stateOf(seat),
    );
    if (!item) {
      throw new Error(
        `Missing legend entry for seat state "${this.stateOf(seat)}".`,
      );
    }
    return item.cue;
  }

  activateSeat(seatNo: number): void {
    const now = Date.now();
    const currentSeat = this.booking
      .seats()
      .find((seat) => seat.seatNo === seatNo);
    const repeatsBooking =
      this.lastResult === 'booked' && currentSeat?.bookedBy === 'ME';
    const repeatsCancellation =
      this.lastResult === 'cancelled' && currentSeat?.bookedBy === null;
    if (
      this.lastActivatedSeat === seatNo &&
      now - this.lastActivationTime < 350 &&
      (repeatsBooking || repeatsCancellation)
    ) {
      return;
    }

    this.lastActivatedSeat = seatNo;
    this.lastActivationTime = now;
    const result: BookingResult = this.booking.toggleSeat(seatNo);
    this.lastResult = result;
    if (result === 'unavailable') {
      this.message.emit('This seat is already taken.');
    }
  }
}
