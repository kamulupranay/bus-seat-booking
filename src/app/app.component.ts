import { Component, inject, OnDestroy, signal } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { BookingSummaryComponent } from './components/booking-summary/booking-summary.component';
import { SeatGridComponent } from './components/seat-grid/seat-grid.component';
import { SeatBookingService } from './services/seat-booking.service';
import { SeatOwner } from './models/seat.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DecimalPipe,
    UpperCasePipe,
    SeatGridComponent,
    BookingSummaryComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  readonly booking = inject(SeatBookingService);
  readonly hint = signal('');
  readonly seatUpdateMessage = signal('');
  private hintTimer: ReturnType<typeof setTimeout> | undefined;

  ngOnDestroy(): void {
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
    }
  }

  showHint(message: string): void {
    this.hint.set(message);
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
    }
    this.hintTimer = setTimeout(() => this.hint.set(''), 2400);
  }

  updateSeatFromForm(
    event: Event,
    seatNoValue: string,
    statusValue: string,
  ): void {
    event.preventDefault();
    this.seatUpdateMessage.set('');

    const seatNo = Number(seatNoValue);
    if (
      !Number.isInteger(seatNo) ||
      seatNo < 1 ||
      seatNo > this.booking.seats().length
    ) {
      this.seatUpdateMessage.set(
        `Enter a whole seat number from 1 to ${this.booking.seats().length}.`,
      );
      return;
    }

    let bookedBy: SeatOwner;
    switch (statusValue) {
      case 'FREE':
        bookedBy = null;
        break;
      case 'OTHER':
        bookedBy = 'OTHER';
        break;
      case 'ME':
        bookedBy = 'ME';
        break;
      default:
        this.seatUpdateMessage.set('Choose a valid seat status.');
        return;
    }

    const result = this.booking.updateSeatStatus(seatNo, bookedBy);
    if (result === 'full') {
      this.seatUpdateMessage.set(
        'Seat update blocked because the bus is at capacity.',
      );
      return;
    }
    if (result === 'invalid') {
      this.seatUpdateMessage.set('That seat number is not valid.');
      return;
    }
    if (result === 'unchanged') {
      this.seatUpdateMessage.set(`Seat ${seatNo} already has that status.`);
      return;
    }

    const statusLabel =
      bookedBy === null
        ? 'Available'
        : bookedBy === 'ME'
          ? 'Booked by you'
          : 'Booked by others';
    this.seatUpdateMessage.set(`Seat ${seatNo} updated: ${statusLabel}.`);
  }
}
