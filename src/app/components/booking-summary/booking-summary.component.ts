import { Component } from '@angular/core';
import { SeatBookingService } from '../../services/seat-booking.service';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  templateUrl: './booking-summary.component.html',
  styleUrl: './booking-summary.component.css'
})
export class BookingSummaryComponent {
  constructor(readonly booking: SeatBookingService) {}

  updatePassengerId(value: string): void {
    this.booking.setPassengerId(value);
  }
}
