/**
 * Availability checking and date range overlap logic for HotelPro
 */

export interface DateRange {
  checkIn: string | Date;
  checkOut: string | Date;
}

export interface AvailabilityValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Standard hospitality overlap check:
 * A booking overlaps if: bookingStart < newEnd && bookingEnd > newStart
 * Notice that if bookingEnd == newStart (Checkout today at 11am, new Checkin at 3pm), this is NOT an overlap!
 */
export function doDateRangesOverlap(rangeA: DateRange, rangeB: DateRange): boolean {
  const startA = new Date(rangeA.checkIn).getTime();
  const endA = new Date(rangeA.checkOut).getTime();
  const startB = new Date(rangeB.checkIn).getTime();
  const endB = new Date(rangeB.checkOut).getTime();

  return startA < endB && endA > startB;
}

/**
 * Validate that booking request dates are sound
 */
export function validateBookingDates(checkIn: string | Date, checkOut: string | Date): AvailabilityValidation {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid check-in or check-out date format.' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDateOnly = new Date(start);
  startDateOnly.setHours(0, 0, 0, 0);

  if (startDateOnly.getTime() < today.getTime()) {
    return { isValid: false, error: 'Check-in date cannot be in the past.' };
  }

  if (end.getTime() <= start.getTime()) {
    return { isValid: false, error: 'Check-out date must be after check-in date.' };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.round((end.getTime() - start.getTime()) / msPerDay);
  if (nights > 30) {
    return { isValid: false, error: 'Maximum continuous stay is 30 nights. Please contact manager for extended stays.' };
  }

  return { isValid: true };
}

/**
 * Check if room capacity is sufficient for number of guests
 */
export function validateCapacity(guestCount: number, roomCapacity: number, numberOfRooms: number = 1): AvailabilityValidation {
  if (guestCount <= 0) {
    return { isValid: false, error: 'Guest count must be at least 1.' };
  }

  const totalCapacity = roomCapacity * Math.max(1, numberOfRooms);
  if (guestCount > totalCapacity) {
    return {
      isValid: false,
      error: `Selected room capacity (${totalCapacity} guests max) cannot accommodate ${guestCount} guests.`,
    };
  }

  return { isValid: true };
}
