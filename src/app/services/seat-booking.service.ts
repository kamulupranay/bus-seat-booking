import { Injectable, computed, signal } from '@angular/core';
import {
  getSeatState,
  SEAT_LEGEND,
  Seat,
  SeatLegendItem,
} from '../models/seat.model';

export type BookingResult = 'booked' | 'cancelled' | 'unavailable' | 'full';
export type SeatUpdateResult = 'updated' | 'unchanged' | 'invalid' | 'full';
export type OccupancyZone = 'green' | 'yellow' | 'red';

const STORAGE_KEY = 'wayfare-my-seat-numbers';
const PASSENGER_ID_STORAGE_KEY = 'wayfare-passenger-id';
const OTHER_BOOKINGS = [3, 7, 8, 12, 15, 19, 22, 26, 30, 31, 34];

@Injectable({
  providedIn: 'root',
})
export class SeatBookingService {
  readonly passengerId = signal(this.loadPassengerId());
  private readonly seatState = signal<Seat[]>(this.createInitialSeats());
  readonly seats = this.seatState.asReadonly();
  readonly legend: readonly SeatLegendItem[] = SEAT_LEGEND;
  readonly bookedCount = computed(
    () => this.seatState().filter((seat) => seat.bookedBy !== null).length,
  );
  readonly mySeats = computed(() =>
    this.seatState().filter((seat) => seat.bookedBy === 'ME'),
  );
  readonly occupancyPercent = computed(
    () => (this.bookedCount() / this.seatState().length) * 100,
  );
  readonly occupancyZone = computed<OccupancyZone>(() => {
    const percent = this.occupancyPercent();
    if (percent <= 60) {
      return 'green';
    }
    return percent <= 90 ? 'yellow' : 'red';
  });
  readonly fullMessageVisible = signal(false);

  setPassengerId(passengerId: string): void {
    const normalizedPassengerId = passengerId.trim();
    this.passengerId.set(normalizedPassengerId);
    this.seatState.update((seats) =>
      seats.map((seat) =>
        seat.bookedBy === 'ME'
          ? { ...seat, passengerId: normalizedPassengerId }
          : seat,
      ),
    );
    this.persistPassengerId();
    this.persistMySeats();
  }

  toggleSeat(seatNo: number): BookingResult {
    const seat = this.seatState().find((item) => item.seatNo === seatNo);
    if (!seat) {
      return 'unavailable';
    }

    if (seat.bookedBy === 'ME') {
      this.updateSeat(seatNo, null);
      this.fullMessageVisible.set(false);
      return 'cancelled';
    }

    if (seat.bookedBy === 'OTHER') {
      return 'unavailable';
    }

    if (this.bookedCount() >= this.seatState().length - 1) {
      this.fullMessageVisible.set(true);
      return 'full';
    }

    this.updateSeat(seatNo, 'ME');
    this.fullMessageVisible.set(false);
    return 'booked';
  }

  updateSeatStatus(
    seatNo: number,
    bookedBy: Seat['bookedBy'],
  ): SeatUpdateResult {
    if (
      !Number.isInteger(seatNo) ||
      seatNo < 1 ||
      seatNo > this.seatState().length
    ) {
      return 'invalid';
    }

    const seat = this.seatState().find((item) => item.seatNo === seatNo);
    if (!seat) {
      return 'invalid';
    }

    if (seat.bookedBy === bookedBy) {
      return 'unchanged';
    }

    if (
      seat.bookedBy === null &&
      bookedBy !== null &&
      this.bookedCount() >= this.seatState().length - 1
    ) {
      this.fullMessageVisible.set(true);
      return 'full';
    }

    this.updateSeat(seatNo, bookedBy);
    this.fullMessageVisible.set(false);
    return 'updated';
  }

  cancelSeat(seatNo: number): void {
    const seat = this.seatState().find((item) => item.seatNo === seatNo);
    if (seat?.bookedBy === 'ME') {
      this.updateSeat(seatNo, null);
      this.fullMessageVisible.set(false);
    }
  }

  clearMySeats(): void {
    this.seatState.update((seats) =>
      seats.map((seat) =>
        seat.bookedBy === 'ME'
          ? { ...seat, bookedBy: null, passengerId: null }
          : seat,
      ),
    );
    this.fullMessageVisible.set(false);
    this.persistMySeats();
  }

  dismissFullMessage(): void {
    this.fullMessageVisible.set(false);
  }

  private createInitialSeats(): Seat[] {
    const seats = Array.from(
      { length: 40 },
      (_, index): Seat => ({
        seatNo: index + 1,
        bookedBy: OTHER_BOOKINGS.includes(index + 1) ? 'OTHER' : null,
        passengerId: null,
      }),
    );

    const savedValue = localStorage.getItem(STORAGE_KEY);
    if (!savedValue) {
      return seats;
    }

    let savedSeatNumbers: unknown;
    try {
      savedSeatNumbers = JSON.parse(savedValue);
    } catch (error) {
      console.error('Unable to restore saved seat selections.', error);
      return seats;
    }

    if (!Array.isArray(savedSeatNumbers)) {
      console.error(
        'Saved seat selections are invalid; starting with the mock bookings.',
      );
      return seats;
    }

    for (const seatNo of savedSeatNumbers) {
      if (typeof seatNo !== 'number' || !Number.isInteger(seatNo)) {
        console.error('A saved seat number was invalid and has been ignored.');
        continue;
      }

      const seat = seats.find((item) => item.seatNo === seatNo);
      if (seat?.bookedBy === null) {
        seat.bookedBy = 'ME';
        seat.passengerId = this.passengerId();
      }
    }

    return seats;
  }

  private updateSeat(seatNo: number, bookedBy: Seat['bookedBy']): void {
    this.seatState.update((seats) =>
      seats.map((seat) =>
        seat.seatNo === seatNo
          ? {
              ...seat,
              bookedBy,
              passengerId: bookedBy === 'ME' ? this.passengerId() : null,
            }
          : seat,
      ),
    );
    this.persistMySeats();
  }

  private loadPassengerId(): string {
    return localStorage.getItem(PASSENGER_ID_STORAGE_KEY) ?? 'USR-1042';
  }

  private persistPassengerId(): void {
    try {
      localStorage.setItem(PASSENGER_ID_STORAGE_KEY, this.passengerId());
    } catch (error) {
      console.error('Unable to save the passenger ID in this browser.', error);
    }
  }

  private persistMySeats(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.mySeats().map((seat) => seat.seatNo)),
      );
    } catch (error) {
      console.error('Unable to save seat selections in this browser.', error);
    }
  }
}
