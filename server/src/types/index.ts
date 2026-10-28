export type UserRole = 'guest' | 'staff' | 'manager' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  assignedHotelId?: string;
  accountStatus: 'active' | 'suspended';
  createdAt: string;
}

export interface IHotel {
  _id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  country: string;
  starRating: number;
  featured: boolean;
  images: string[];
  amenities: string[];
  managerId?: string;
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    petPolicy: string;
  };
  startingPrice: number;
  ratingAverage: number;
  reviewCount: number;
}

export interface IRoomCategory {
  _id: string;
  hotelId: string;
  name: string;
  description: string;
  bedType: string;
  capacity: number;
  basePrice: number;
  seasonalMultiplier: number;
  images: string[];
  amenities: string[];
  totalRooms: number;
}

export interface IRoom {
  _id: string;
  hotelId: string;
  roomCategoryId: string;
  roomNumber: string;
  floor: number;
  operationalStatus: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
  notes?: string;
}

export interface IBooking {
  _id: string;
  bookingReference: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  hotelId: string;
  hotelName: string;
  roomCategoryId: string;
  roomCategoryName: string;
  roomId?: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  numberOfRooms: number;
  specialRequests?: string;
  priceBreakdown: {
    nights: number;
    baseRatePerNight: number;
    roomSubtotal: number;
    taxes: number;
    serviceFee: number;
    discount: number;
    total: number;
    currency: string;
  };
  bookingStatus: 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
  paymentId?: string;
  paymentMethod?: string;
  cancellationReason?: string;
  refundRequested?: boolean;
  refundStatus?: 'None' | 'Requested' | 'Approved' | 'Rejected' | 'Refunded';
  refundAmount?: number;
  checkInTimestamp?: string;
  checkOutTimestamp?: string;
  createdAt: string;
}

export interface IPayment {
  _id: string;
  bookingId: string;
  bookingReference: string;
  userId: string;
  amount: number;
  currency: string;
  provider: 'Stripe' | 'Razorpay' | 'Demo-Gateway';
  providerOrderId: string;
  providerPaymentId: string;
  status: 'Initiated' | 'Captured' | 'Failed' | 'Refunded';
  cardLast4?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface IReview {
  _id: string;
  hotelId: string;
  bookingId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string; // or 'all' or 'staff-hotelId'
  title: string;
  message: string;
  type: 'booking' | 'checkin' | 'housekeeping' | 'service' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface IServiceRequest {
  _id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  guestId: string;
  guestName: string;
  serviceType: 'Room Cleaning' | 'Extra Towels/Linens' | 'Wake-up Call' | 'Room Service Dining' | 'Maintenance' | 'Luggage Assistance';
  priority: 'Normal' | 'High' | 'Urgent';
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  assignedToStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
}

export interface IHousekeepingTask {
  _id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  taskType: 'Check-out Turnover' | 'Daily Refresh' | 'Deep Clean' | 'Inspection';
  status: 'Pending' | 'In-Progress' | 'Inspected' | 'Completed';
  priority: 'Normal' | 'High' | 'Urgent';
  assignedToStaffId?: string;
  assignedStaffName?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface IAdminLog {
  _id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'User' | 'Hotel' | 'Room' | 'Booking' | 'Payment' | 'Housekeeping' | 'System';
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}
