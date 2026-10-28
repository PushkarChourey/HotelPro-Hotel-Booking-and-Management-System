import mongoose, { Schema } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['guest', 'staff', 'manager', 'admin'], default: 'guest' },
  phone: { type: String },
  avatar: { type: String },
  assignedHotelId: { type: Schema.Types.ObjectId, ref: 'Hotel' },
  accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

// Hotel Schema
const HotelSchema = new Schema({
  name: { type: String, required: true, index: true },
  tagline: { type: String },
  description: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  country: { type: String, required: true },
  starRating: { type: Number, default: 5 },
  featured: { type: Boolean, default: false },
  images: [{ type: String }],
  amenities: [{ type: String }],
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  policies: {
    checkInTime: { type: String, default: '15:00' },
    checkOutTime: { type: String, default: '11:00' },
    cancellationPolicy: { type: String, default: 'Free cancellation up to 48 hours before check-in' },
    petPolicy: { type: String, default: 'Pet friendly with prior notice' },
  },
  startingPrice: { type: Number, required: true },
  ratingAverage: { type: Number, default: 4.8 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

// RoomCategory Schema
const RoomCategorySchema = new Schema({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  bedType: { type: String, default: 'King Bed' },
  capacity: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  seasonalMultiplier: { type: Number, default: 1.0 },
  images: [{ type: String }],
  amenities: [{ type: String }],
  totalRooms: { type: Number, default: 10 },
}, { timestamps: true });

// Room Schema
const RoomSchema = new Schema({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomCategoryId: { type: Schema.Types.ObjectId, ref: 'RoomCategory', required: true, index: true },
  roomNumber: { type: String, required: true },
  floor: { type: Number, default: 1 },
  operationalStatus: { 
    type: String, 
    enum: ['Available', 'Occupied', 'Cleaning', 'Maintenance'], 
    default: 'Available',
    index: true 
  },
  notes: { type: String },
}, { timestamps: true });

// Booking Schema
const BookingSchema = new Schema({
  bookingReference: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userPhone: { type: String },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  hotelName: { type: String, required: true },
  roomCategoryId: { type: Schema.Types.ObjectId, ref: 'RoomCategory', required: true },
  roomCategoryName: { type: String, required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  checkIn: { type: Date, required: true, index: true },
  checkOut: { type: Date, required: true, index: true },
  guests: { type: Number, required: true },
  numberOfRooms: { type: Number, default: 1 },
  specialRequests: { type: String },
  priceBreakdown: {
    nights: Number,
    baseRatePerNight: Number,
    roomSubtotal: Number,
    taxes: Number,
    serviceFee: Number,
    discount: Number,
    total: Number,
    currency: { type: String, default: 'USD' },
  },
  bookingStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'],
    default: 'Confirmed',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded', 'Failed'],
    default: 'Paid',
    index: true,
  },
  paymentId: { type: String },
  paymentMethod: { type: String, default: 'Card' },
  cancellationReason: { type: String },
  refundRequested: { type: Boolean, default: false },
  refundStatus: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected', 'Refunded'], default: 'None' },
  refundAmount: { type: Number, default: 0 },
  checkInTimestamp: { type: Date },
  checkOutTimestamp: { type: Date },
}, { timestamps: true });

// Payment Schema
const PaymentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  bookingReference: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  provider: { type: String, enum: ['Stripe', 'Razorpay', 'Demo-Gateway'], default: 'Demo-Gateway' },
  providerOrderId: { type: String },
  providerPaymentId: { type: String },
  status: { type: String, enum: ['Initiated', 'Captured', 'Failed', 'Refunded'], default: 'Captured' },
  cardLast4: { type: String },
  isDemo: { type: Boolean, default: true },
}, { timestamps: true });

// Review Schema
const ReviewSchema = new Schema({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: { type: String, required: true },
  comment: { type: String, required: true },
}, { timestamps: true });

// Housekeeping Task Schema
const HousekeepingTaskSchema = new Schema({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  taskType: { 
    type: String, 
    enum: ['Check-out Turnover', 'Daily Refresh', 'Deep Clean', 'Inspection'], 
    default: 'Check-out Turnover' 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In-Progress', 'Inspected', 'Completed'], 
    default: 'Pending', 
    index: true 
  },
  priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
  assignedToStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedStaffName: { type: String },
  notes: { type: String },
  completedAt: { type: Date },
}, { timestamps: true });

// Service Request Schema
const ServiceRequestSchema = new Schema({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  guestName: { type: String, required: true },
  serviceType: { type: String, required: true },
  priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
  status: { type: String, enum: ['Pending', 'In-Progress', 'Completed', 'Cancelled'], default: 'Pending' },
  notes: { type: String },
  assignedToStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedStaffName: { type: String },
}, { timestamps: true });

// Admin Log Schema
const AdminLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String },
  details: { type: String, required: true },
  ipAddress: { type: String },
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const HotelModel = mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema);
export const RoomCategoryModel = mongoose.models.RoomCategory || mongoose.model('RoomCategory', RoomCategorySchema);
export const RoomModel = mongoose.models.Room || mongoose.model('Room', RoomSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export const HousekeepingTaskModel = mongoose.models.HousekeepingTask || mongoose.model('HousekeepingTask', HousekeepingTaskSchema);
export const ServiceRequestModel = mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', ServiceRequestSchema);
export const AdminLogModel = mongoose.models.AdminLog || mongoose.model('AdminLog', AdminLogSchema);
