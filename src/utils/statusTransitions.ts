/**
 * Room Operational Status & Housekeeping State Machine
 */

export type RoomOperationalStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
export type HousekeepingStatus = 'Pending' | 'In-Progress' | 'Inspected' | 'Completed';
export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';

const VALID_ROOM_TRANSITIONS: Record<RoomOperationalStatus, RoomOperationalStatus[]> = {
  Available: ['Occupied', 'Cleaning', 'Maintenance'],
  Occupied: ['Cleaning', 'Maintenance'], // On check-out -> moves to Cleaning
  Cleaning: ['Available', 'Maintenance'], // Once cleaned/inspected -> Available
  Maintenance: ['Cleaning', 'Available'], // Once repaired -> Cleaning or Available
};

export function canTransitionRoomStatus(
  currentStatus: RoomOperationalStatus,
  targetStatus: RoomOperationalStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowedTargets = VALID_ROOM_TRANSITIONS[currentStatus];
  if (!allowedTargets || !allowedTargets.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Direct status transition from "${currentStatus}" to "${targetStatus}" is not permitted.`,
    };
  }

  return { allowed: true };
}

export function getNextHousekeepingState(current: HousekeepingStatus): HousekeepingStatus | null {
  switch (current) {
    case 'Pending':
      return 'In-Progress';
    case 'In-Progress':
      return 'Inspected';
    case 'Inspected':
      return 'Completed';
    default:
      return null;
  }
}
