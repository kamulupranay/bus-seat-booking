import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SeatBookingService } from './services/seat-booking.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('wayfare-my-seat-numbers');
    localStorage.removeItem('wayfare-passenger-id');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('renders the seat-selection screen and initial occupancy', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const booking = TestBed.inject(SeatBookingService);
    const legendLabels = Array.from(compiled.querySelectorAll('.legend-item'), item =>
      item.textContent?.replace(/\s+/g, ' ').trim()
    );

    expect(compiled.querySelector('h1')?.textContent).toContain('Choose your seat');
    expect(compiled.querySelector('.card-heading h2')?.textContent).toContain('Select your seats');
    expect(compiled.querySelector('.occupancy-percent')?.textContent).toContain('27.5%');
    expect(compiled.querySelectorAll('.seat').length).toBe(40);
    expect(compiled.querySelector('.legend-note')?.textContent).toContain('Green = available · Grey = booked');
    expect(legendLabels).toEqual(booking.legend.map(item => `${item.cue} ${item.label}`));
    for (const item of booking.legend) {
      expect(compiled.querySelector(`.swatch-${item.state}`)?.textContent?.trim()).toBe(item.cue);
    }
    expect(getComputedStyle(compiled.querySelector('.seat-available') as HTMLElement).backgroundColor).toBe('rgb(234, 246, 240)');
    expect(getComputedStyle(compiled.querySelector('.seat-taken') as HTMLElement).backgroundImage).toContain('linear-gradient');
  });

  it('uses the legend model for the visible cue in each seat state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const booking = TestBed.inject(SeatBookingService);
    const availableSeat = booking.seats().find(seat => seat.bookedBy === null);
    expect(availableSeat).toBeDefined();
    if (availableSeat) {
      booking.toggleSeat(availableSeat.seatNo);
    }

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    for (const item of booking.legend) {
      const cue = compiled.querySelector(`.seat-${item.state} .seat-cue`);
      expect(cue).not.toBeNull();
      expect(cue?.textContent?.trim()).toBe(item.cue);
    }
  });

  it('updates the grid and selection summary from the shared booking state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.seat-available')?.click();
    fixture.detectChanges();

    expect(TestBed.inject(SeatBookingService).mySeats().length).toBe(1);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.seat-mine').length).toBe(1);
    expect(getComputedStyle(element.querySelector('.seat-mine') as HTMLElement).backgroundColor).toBe('rgb(29, 154, 119)');
    expect((fixture.nativeElement as HTMLElement).querySelector('.selected-seat')).not.toBeNull();
  });

  it('lets the selection summary cancel a seat and clear all seats', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('.seat-available')?.click();
    fixture.detectChanges();
    expect(TestBed.inject(SeatBookingService).mySeats().length).toBe(1);
    expect(element.querySelector('.selected-seat')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('.remove-seat')?.click();
    fixture.detectChanges();
    expect(TestBed.inject(SeatBookingService).mySeats().length).toBe(0);

    element.querySelector<HTMLButtonElement>('.seat-available')?.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.clear-all')?.click();
    fixture.detectChanges();
    expect(TestBed.inject(SeatBookingService).mySeats().length).toBe(0);
  });

  it('updates the seat grid, summary, and occupancy from entered seat data', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const seatNumber = element.querySelector<HTMLInputElement>('#seat-number-input');
    const seatStatus = element.querySelector<HTMLSelectElement>('#seat-status-input');
    const form = element.querySelector<HTMLFormElement>('.seat-editor-form');
    expect(seatNumber).not.toBeNull();
    expect(seatStatus).not.toBeNull();
    expect(form).not.toBeNull();

    if (!seatNumber || !seatStatus || !form) {
      return;
    }

    seatNumber.value = '1';
    seatStatus.value = 'OTHER';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('.seat-taken[aria-label^="Seat 1,"]')).not.toBeNull();
    expect(element.querySelector('.occupancy-percent')?.textContent).toContain('30.0%');

    seatNumber.value = '2';
    seatStatus.value = 'ME';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('.seat-mine[aria-label^="Seat 2,"]')).not.toBeNull();
    expect(element.querySelector('.selected-seat-label')?.textContent).toContain('02');
    expect(TestBed.inject(SeatBookingService).bookedCount()).toBe(13);

    seatNumber.value = '1';
    seatStatus.value = 'FREE';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('.seat-available[aria-label^="Seat 1,"]')).not.toBeNull();
    expect(TestBed.inject(SeatBookingService).bookedCount()).toBe(12);
  });

  it('shows a dismissible full-bus banner and allows the final seat after cancellation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const booking = TestBed.inject(SeatBookingService);
    const element = fixture.nativeElement as HTMLElement;

    while (booking.bookedCount() < 39) {
      const availableSeat = booking.seats().find(seat => seat.bookedBy === null);
      expect(availableSeat).toBeDefined();
      if (availableSeat) {
        expect(booking.toggleSeat(availableSeat.seatNo)).toBe('booked');
      }
    }

    fixture.detectChanges();
    const finalSeatNo = booking.seats().find(seat => seat.bookedBy === null)?.seatNo;
    expect(finalSeatNo).toBeDefined();
    const finalSeatSelector = `.seat-available[aria-label="Seat ${finalSeatNo}, available"]`;

    element.querySelector<HTMLButtonElement>(finalSeatSelector)?.click();
    fixture.detectChanges();
    expect(booking.bookedCount()).toBe(39);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'This bus is full. Please book a seat on an alternative bus.'
    );

    element.querySelector<HTMLButtonElement>('.banner-close')?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')).toBeNull();

    element.querySelector<HTMLButtonElement>('.remove-seat')?.click();
    fixture.detectChanges();
    expect(booking.bookedCount()).toBe(38);
    element.querySelector<HTMLButtonElement>(finalSeatSelector)?.click();
    fixture.detectChanges();
    expect(booking.bookedCount()).toBe(39);
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('keeps a rapid double-click on one seat as a single booking', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const freeSeat = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.seat-available');
    expect(freeSeat).not.toBeNull();

    freeSeat?.click();
    freeSeat?.click();
    fixture.detectChanges();
    expect(TestBed.inject(SeatBookingService).mySeats().length).toBe(1);

    tick(350);
    freeSeat?.click();
    fixture.detectChanges();
    expect(TestBed.inject(SeatBookingService).mySeats().length).toBe(0);
  }));
});
