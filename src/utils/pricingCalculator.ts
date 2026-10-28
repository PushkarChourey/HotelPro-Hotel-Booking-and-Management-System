/**
 * Pricing calculation engine for HotelPro reservations
 */

export interface PricingOptions {
  basePricePerNight: number;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  numberOfRooms?: number;
  seasonalMultiplier?: number;
  taxRatePercent?: number; // e.g. 12 for 12%
  serviceFeeFlat?: number; // e.g. $25
  promoCode?: string;
}

export interface PriceBreakdown {
  nights: number;
  baseRatePerNight: number;
  numberOfRooms: number;
  roomSubtotal: number;
  taxes: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
}

export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  // Normalize to UTC midnight to avoid DST or timezone offset quirks
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((utcEnd - utcStart) / msPerDay);
  return Math.max(0, diffDays);
}

export function calculatePriceBreakdown(options: PricingOptions): PriceBreakdown {
  const {
    basePricePerNight,
    checkInDate,
    checkOutDate,
    numberOfRooms = 1,
    seasonalMultiplier = 1.0,
    taxRatePercent = 12,
    serviceFeeFlat = 25,
    promoCode = '',
  } = options;

  const nights = calculateNights(checkInDate, checkOutDate);
  const effectiveNights = Math.max(1, nights);
  const effectiveRooms = Math.max(1, numberOfRooms);

  const adjustedRate = Math.round(basePricePerNight * seasonalMultiplier * 100) / 100;
  const roomSubtotal = Math.round(adjustedRate * effectiveNights * effectiveRooms * 100) / 100;

  // Taxes on room subtotal
  const taxes = Math.round((roomSubtotal * (taxRatePercent / 100)) * 100) / 100;
  const serviceFee = serviceFeeFlat;

  // Promotional discounts
  let discount = 0;
  const cleanCode = promoCode.trim().toUpperCase();
  if (cleanCode === 'WELCOME10') {
    discount = Math.round(roomSubtotal * 0.10 * 100) / 100;
  } else if (cleanCode === 'LUXURY50') {
    discount = Math.min(50, roomSubtotal);
  } else if (cleanCode === 'SUMMER20') {
    discount = Math.round(roomSubtotal * 0.20 * 100) / 100;
  }

  const total = Math.max(0, Math.round((roomSubtotal + taxes + serviceFee - discount) * 100) / 100);

  return {
    nights: effectiveNights,
    baseRatePerNight: adjustedRate,
    numberOfRooms: effectiveRooms,
    roomSubtotal,
    taxes,
    serviceFee,
    discount,
    total,
    currency: 'USD',
  };
}
