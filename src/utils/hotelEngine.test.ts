import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNights, calculatePriceBreakdown } from './pricingCalculator.js';
import { doDateRangesOverlap, validateBookingDates, validateCapacity } from './availabilityEngine.js';
import { canTransitionRoomStatus } from './statusTransitions.js';
import { canCheckInGuest, canManageInventory, canAccessAdminLogs } from './rbacRules.js';

test('calculateNights correctly counts nights across calendar dates', () => {
  const nights1 = calculateNights('2026-11-01', '2026-11-04');
  assert.equal(nights1, 3);

  const nightsSameDay = calculateNights('2026-11-01', '2026-11-01');
  assert.equal(nightsSameDay, 0);

  const nightsMonthCross = calculateNights('2026-10-30', '2026-11-02');
  assert.equal(nightsMonthCross, 3);
});

test('calculatePriceBreakdown correctly computes base, taxes, service fee, and promo discount', () => {
  const breakdown = calculatePriceBreakdown({
    basePricePerNight: 200,
    checkInDate: '2026-12-10',
    checkOutDate: '2026-12-13', // 3 nights
    numberOfRooms: 1,
    seasonalMultiplier: 1.0,
    taxRatePercent: 12,
    serviceFeeFlat: 25,
    promoCode: 'WELCOME10', // 10% off room subtotal
  });

  // Room subtotal: 3 * 200 = 600
  assert.equal(breakdown.nights, 3);
  assert.equal(breakdown.roomSubtotal, 600);
  // Taxes: 12% of 600 = 72
  assert.equal(breakdown.taxes, 72);
  // Service fee: 25
  assert.equal(breakdown.serviceFee, 25);
  // Discount: 10% of 600 = 60
  assert.equal(breakdown.discount, 60);
  // Total: 600 + 72 + 25 - 60 = 637
  assert.equal(breakdown.total, 637);
});

test('doDateRangesOverlap detects true overlaps and respects checkout-day handoffs', () => {
  // Existing booking: Nov 10 to Nov 15
  const existing = { checkIn: '2026-11-10', checkOut: '2026-11-15' };

  // Case 1: Overlapping inside: Nov 11 to Nov 13
  assert.equal(doDateRangesOverlap(existing, { checkIn: '2026-11-11', checkOut: '2026-11-13' }), true);

  // Case 2: Overlapping starting earlier: Nov 08 to Nov 12
  assert.equal(doDateRangesOverlap(existing, { checkIn: '2026-11-08', checkOut: '2026-11-12' }), true);

  // Case 3: Overlapping ending later: Nov 14 to Nov 18
  assert.equal(doDateRangesOverlap(existing, { checkIn: '2026-11-14', checkOut: '2026-11-18' }), true);

  // Case 4: Adjacent handoff (New checkin is on same day as existing checkout): Nov 15 to Nov 18
  assert.equal(doDateRangesOverlap(existing, { checkIn: '2026-11-15', checkOut: '2026-11-18' }), false);

  // Case 5: Adjacent handoff (New checkout is on same day as existing checkin): Nov 05 to Nov 10
  assert.equal(doDateRangesOverlap(existing, { checkIn: '2026-11-05', checkOut: '2026-11-10' }), false);

  // Case 6: Completely before: Nov 01 to Nov 05
  assert.equal(doDateRangesOverlap(existing, { checkIn: '2026-11-01', checkOut: '2026-11-05' }), false);
});

test('validateBookingDates enforces valid checkin and checkout order', () => {
  const invalidOrder = validateBookingDates('2026-11-20', '2026-11-18');
  assert.equal(invalidOrder.isValid, false);

  const pastDate = validateBookingDates('2020-01-01', '2020-01-05');
  assert.equal(pastDate.isValid, false);

  const futureValid = validateBookingDates('2026-12-01', '2026-12-05');
  assert.equal(futureValid.isValid, true);
});

test('validateCapacity verifies guest limits', () => {
  // 1 room with capacity 2 -> fits 2 guests
  const valid = validateCapacity(2, 2, 1);
  assert.equal(valid.isValid, true);

  // 1 room with capacity 2 -> rejects 3 guests
  const overCapacity = validateCapacity(3, 2, 1);
  assert.equal(overCapacity.isValid, false);

  // 2 rooms with capacity 2 -> fits 4 guests
  const twoRooms = validateCapacity(4, 2, 2);
  assert.equal(twoRooms.isValid, true);
});

test('canTransitionRoomStatus enforces state machine', () => {
  // Available -> Occupied is allowed
  assert.equal(canTransitionRoomStatus('Available', 'Occupied').allowed, true);

  // Occupied -> Available directly is NOT allowed (must go to Cleaning first)
  assert.equal(canTransitionRoomStatus('Occupied', 'Available').allowed, false);

  // Occupied -> Cleaning is allowed (on checkout)
  assert.equal(canTransitionRoomStatus('Occupied', 'Cleaning').allowed, true);

  // Cleaning -> Available is allowed
  assert.equal(canTransitionRoomStatus('Cleaning', 'Available').allowed, true);
});

test('rbacRules correctly identifies authorized roles', () => {
  assert.equal(canCheckInGuest('guest'), false);
  assert.equal(canCheckInGuest('staff'), true);
  assert.equal(canCheckInGuest('manager'), true);

  assert.equal(canManageInventory('staff'), false);
  assert.equal(canManageInventory('manager'), true);

  assert.equal(canAccessAdminLogs('manager'), false);
  assert.equal(canAccessAdminLogs('admin'), true);
});
