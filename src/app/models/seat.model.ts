export type SeatOwner = 'OTHER' | 'ME' | null;
export type SeatState = 'available' | 'taken' | 'mine';

export interface Seat {
  seatNo: number;
  bookedBy: SeatOwner;
  passengerId: string | null;
}

export interface SeatLegendItem {
  state: SeatState;
  label: string;
  cue: string;
}

export const SEAT_LEGEND: readonly SeatLegendItem[] = [
  { state: 'available', label: 'Available', cue: '+' },
  { state: 'taken', label: 'Booked by others', cue: '●' },
  { state: 'mine', label: 'Your seat', cue: '✓' }
];

export function getSeatState(seat: Seat): SeatState {
  if (seat.bookedBy === 'ME') {
    return 'mine';
  }
  return seat.bookedBy === 'OTHER' ? 'taken' : 'available';
}
