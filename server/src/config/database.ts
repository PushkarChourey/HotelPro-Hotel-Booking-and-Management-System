import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  IUser,
  IHotel,
  IRoomCategory,
  IRoom,
  IBooking,
  IPayment,
  IReview,
  INotification,
  IServiceRequest,
  IHousekeepingTask,
  IAdminLog,
} from '../types/index.js';

let isMongoConnected = false;
let mongoConnectionError: string | null = null;

// Initial Seed Data with high quality luxury hospitality imagery and details
export const initialUsers: IUser[] = [
  {
    _id: 'user-guest-1',
    name: 'Alexander Wright',
    email: 'guest@hotelpro.com',
    passwordHash: bcrypt.hashSync('Guest@1234', 10),
    role: 'guest',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'user-staff-1',
    name: 'Elena Rostova',
    email: 'staff@hotelpro.com',
    passwordHash: bcrypt.hashSync('Staff@1234', 10),
    role: 'staff',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    assignedHotelId: 'hotel-1',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'user-manager-1',
    name: 'Marcus Sterling',
    email: 'manager@hotelpro.com',
    passwordHash: bcrypt.hashSync('Manager@1234', 10),
    role: 'manager',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    assignedHotelId: 'hotel-1',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'user-admin-1',
    name: 'Sophia Chen',
    email: 'admin@hotelpro.com',
    passwordHash: bcrypt.hashSync('Admin@1234', 10),
    role: 'admin',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
  },
];

export const initialHotels: IHotel[] = [
  {
    _id: 'hotel-1',
    name: 'The Grand Luminary Hotel & Spa',
    tagline: 'Timeless luxury facing the golden coastline and private marina',
    description: 'An architectural masterpiece offering sweeping ocean panoramas, Michelin-caliber gastronomy, heated infinity pools, and holistic thermal wellness sanctuaries.',
    address: '100 Ocean Avenue, Marina District',
    city: 'Miami Beach',
    country: 'United States',
    starRating: 5,
    featured: true,
    startingPrice: 380,
    ratingAverage: 4.9,
    reviewCount: 148,
    managerId: 'user-manager-1',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80',
    ],
    amenities: [
      'Private Oceanfront Beach',
      'Infinity Heated Pool',
      'Michelin Star Dining',
      'Full-Service Thermal Spa',
      '24/7 Butler & Concierge',
      'Valet Parking & EV Charging',
      'High-Speed Wi-Fi',
      'Fitness & Yoga Pavilion',
    ],
    policies: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Complimentary cancellation up to 48 hours prior to arrival',
      petPolicy: 'Discreet pet amenities welcome upon advance concierge notice',
    },
  },
  {
    _id: 'hotel-2',
    name: 'Alpine Crest Summit Sanctuary',
    tagline: 'Ski-in luxury chalet retreats with thermal outdoor whirlpools',
    description: 'Nestled on snow-dusted pine ridges, offering crackling hearth suites, panoramic mountain vistas, gourmet fondue lounges, and ski equipment concierge.',
    address: '4200 Peak Ridge Way',
    city: 'Aspen',
    country: 'United States',
    starRating: 5,
    featured: true,
    startingPrice: 450,
    ratingAverage: 4.95,
    reviewCount: 96,
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80',
    ],
    amenities: [
      'Ski-in / Ski-out Access',
      'Outdoor Thermal Onsen',
      'Fireplace in Every Suite',
      'Alpine Wine Cellar',
      'Heated Ski Gear Locker',
      'Spa Sauna & Steam Room',
      'High-Speed Wi-Fi',
    ],
    policies: {
      checkInTime: '16:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Full refund if cancelled 72 hours before arrival',
      petPolicy: 'Pet friendly with custom mountain dog packages',
    },
  },
  {
    _id: 'hotel-3',
    name: 'The Manhattan Pinnacle',
    tagline: 'Refined metropolitan sophistication overlooking Central Park',
    description: 'Skyline glass suites, art deco brass architecture, bespoke cocktail lounge, and seamless proximity to high fashion, Broadway theaters, and museums.',
    address: '768 5th Avenue, Midtown',
    city: 'New York',
    country: 'United States',
    starRating: 5,
    featured: true,
    startingPrice: 520,
    ratingAverage: 4.88,
    reviewCount: 214,
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
    ],
    amenities: [
      'Central Park Views',
      'Rooftop Champagne Bar',
      'Chauffeured Towncar Service',
      'Personal Fitness Trainer',
      '24/7 In-Room Dining',
      'High-Speed Wi-Fi',
    ],
    policies: {
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours prior to check-in',
      petPolicy: 'Small dogs welcome under 25 lbs',
    },
  },
  {
    _id: 'hotel-4',
    name: 'Kyoto Imperial Serenity Pavilion',
    tagline: 'Zen gardens, cedar baths, and centuries of graceful hospitality',
    description: 'Immerse in tranquility along historic bamboo groves. Features tatami tea pavilions, aromatic Hinoki cedar bathtubs, and multi-course kaiseki dining.',
    address: '15 Sagano Bamboo Path, Arashiyama',
    city: 'Kyoto',
    country: 'Japan',
    starRating: 5,
    featured: false,
    startingPrice: 390,
    ratingAverage: 4.96,
    reviewCount: 82,
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
    ],
    amenities: [
      'Private Hinoki Cedar Bath',
      'Zen Rock Garden Courtyard',
      'Traditional Kaiseki Dining',
      'Matcha Tea Ceremony',
      'Yukata & Kimono Fitting',
      'High-Speed Wi-Fi',
    ],
    policies: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation up to 5 days prior to check-in',
      petPolicy: 'Service animals only',
    },
  },
];

export const initialCategories: IRoomCategory[] = [
  // Hotel 1 categories
  {
    _id: 'cat-1-1',
    hotelId: 'hotel-1',
    name: 'Deluxe Ocean King',
    description: 'Expansive private balcony with front-row azure ocean views, king pillowtop mattress, marble rainfall shower, and espresso bar.',
    bedType: '1 King Bed',
    capacity: 2,
    basePrice: 380,
    seasonalMultiplier: 1.0,
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=80',
    ],
    amenities: ['Oceanfront Balcony', 'King Size Bed', 'Rainfall Shower', 'Smart 65" TV', 'Nespresso Bar', 'Diptique Toiletries'],
    totalRooms: 6,
  },
  {
    _id: 'cat-1-2',
    hotelId: 'hotel-1',
    name: 'Executive Marina Suite',
    description: 'Separate formal living parlor, panoramic floor-to-ceiling glass, freestanding soaking tub, walk-in dressing wardrobe, and priority spa access.',
    bedType: '1 King Bed + 1 Sofa Sleeper',
    capacity: 4,
    basePrice: 560,
    seasonalMultiplier: 1.0,
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    ],
    amenities: ['Private Living Room', 'Marina Balcony', 'Freestanding Soaking Tub', 'Double Vanity', 'Wine Chiller', 'Complimentary Breakfast'],
    totalRooms: 4,
  },
  {
    _id: 'cat-1-3',
    hotelId: 'hotel-1',
    name: 'Presidential Penthouse Villa',
    description: 'Top-floor royal suite with private heated plunge pool, dedicated butler pantry, grand dining table, wraparound terrace, and private elevator.',
    bedType: '2 King Beds',
    capacity: 5,
    basePrice: 1200,
    seasonalMultiplier: 1.0,
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80',
    ],
    amenities: ['Private Rooftop Plunge Pool', 'Personal 24/7 Butler', 'Wraparound Terrace', 'Private Bar', 'Master Dressing Suite'],
    totalRooms: 2,
  },
  // Hotel 2 categories
  {
    _id: 'cat-2-1',
    hotelId: 'hotel-2',
    name: 'Alpine Timber Suite',
    description: 'Handcrafted timber beams, crackling stone fireplace, heated stone bathroom floors, and forest mountain views.',
    bedType: '1 King Bed',
    capacity: 2,
    basePrice: 450,
    seasonalMultiplier: 1.0,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
    ],
    amenities: ['Stone Fireplace', 'Heated Stone Flooring', 'Mountain Balcony', 'Plush Robes & Slippers', 'Ski Boot Dryers'],
    totalRooms: 6,
  },
  // Hotel 3 categories
  {
    _id: 'cat-3-1',
    hotelId: 'hotel-3',
    name: 'Manhattan Skyline King',
    description: 'High-floor panoramic vista of Central Park and skyline, custom Italian leather furnishings, marble bath, and acoustic soundproofing.',
    bedType: '1 King Bed',
    capacity: 2,
    basePrice: 520,
    seasonalMultiplier: 1.0,
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80',
    ],
    amenities: ['Skyline Park View', 'Acoustic Soundproofing', 'Italian Marble Bath', 'Smart Climate Control', 'Cocktail Trolley'],
    totalRooms: 8,
  },
  // Hotel 4 categories
  {
    _id: 'cat-4-1',
    hotelId: 'hotel-4',
    name: 'Tatami Garden Pavilion',
    description: 'Aromatic woven tatami mats, sliding shoji screens overlooking private moss gardens, and fragrant Hinoki cedar soaking tub.',
    bedType: 'Traditional Futon or Western King',
    capacity: 3,
    basePrice: 390,
    seasonalMultiplier: 1.0,
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=900&q=80',
    ],
    amenities: ['Private Moss Courtyard', 'Hinoki Cedar Tub', 'Matcha Set & Kettle', 'Organic Yukata Robes', 'Zen Garden View'],
    totalRooms: 5,
  },
];

export const initialRooms: IRoom[] = [
  // Hotel 1, Cat 1-1 (Deluxe Ocean King)
  { _id: 'room-101', hotelId: 'hotel-1', roomCategoryId: 'cat-1-1', roomNumber: '101', floor: 1, operationalStatus: 'Available' },
  { _id: 'room-102', hotelId: 'hotel-1', roomCategoryId: 'cat-1-1', roomNumber: '102', floor: 1, operationalStatus: 'Occupied', notes: 'Guest checking out today at 11:00 AM' },
  { _id: 'room-103', hotelId: 'hotel-1', roomCategoryId: 'cat-1-1', roomNumber: '103', floor: 1, operationalStatus: 'Cleaning', notes: 'Scheduled check-out turnover' },
  { _id: 'room-104', hotelId: 'hotel-1', roomCategoryId: 'cat-1-1', roomNumber: '104', floor: 1, operationalStatus: 'Available' },
  // Hotel 1, Cat 1-2 (Executive Marina Suite)
  { _id: 'room-201', hotelId: 'hotel-1', roomCategoryId: 'cat-1-2', roomNumber: '201', floor: 2, operationalStatus: 'Available' },
  { _id: 'room-202', hotelId: 'hotel-1', roomCategoryId: 'cat-1-2', roomNumber: '202', floor: 2, operationalStatus: 'Maintenance', notes: 'Balcony door seal adjustment' },
  { _id: 'room-203', hotelId: 'hotel-1', roomCategoryId: 'cat-1-2', roomNumber: '203', floor: 2, operationalStatus: 'Available' },
  // Hotel 1, Cat 1-3 (Penthouse)
  { _id: 'room-401', hotelId: 'hotel-1', roomCategoryId: 'cat-1-3', roomNumber: 'PH-1', floor: 4, operationalStatus: 'Available' },
  { _id: 'room-402', hotelId: 'hotel-1', roomCategoryId: 'cat-1-3', roomNumber: 'PH-2', floor: 4, operationalStatus: 'Available' },
  // Hotel 2
  { _id: 'room-a1', hotelId: 'hotel-2', roomCategoryId: 'cat-2-1', roomNumber: 'Summit-1', floor: 1, operationalStatus: 'Available' },
  { _id: 'room-a2', hotelId: 'hotel-2', roomCategoryId: 'cat-2-1', roomNumber: 'Summit-2', floor: 1, operationalStatus: 'Available' },
  // Hotel 3
  { _id: 'room-m1', hotelId: 'hotel-3', roomCategoryId: 'cat-3-1', roomNumber: 'Park-301', floor: 3, operationalStatus: 'Available' },
  // Hotel 4
  { _id: 'room-k1', hotelId: 'hotel-4', roomCategoryId: 'cat-4-1', roomNumber: 'Zen-101', floor: 1, operationalStatus: 'Available' },
];

export const initialBookings: IBooking[] = [
  {
    _id: 'bk-1001',
    bookingReference: 'HP-2026-94812',
    userId: 'user-guest-1',
    userName: 'Alexander Wright',
    userEmail: 'guest@hotelpro.com',
    userPhone: '+1 (555) 234-5678',
    hotelId: 'hotel-1',
    hotelName: 'The Grand Luminary Hotel & Spa',
    roomCategoryId: 'cat-1-1',
    roomCategoryName: 'Deluxe Ocean King',
    roomId: 'room-102',
    roomNumber: '102',
    checkIn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0], // 2 days ago
    checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // tomorrow
    guests: 2,
    numberOfRooms: 1,
    specialRequests: 'High floor preference with extra goose down pillows',
    priceBreakdown: {
      nights: 3,
      baseRatePerNight: 380,
      roomSubtotal: 1140,
      taxes: 136.8,
      serviceFee: 25,
      discount: 0,
      total: 1301.8,
      currency: 'USD',
    },
    bookingStatus: 'Checked-In',
    paymentStatus: 'Paid',
    paymentMethod: 'Visa •••• 4242',
    paymentId: 'pay-demo-1',
    checkInTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    _id: 'bk-1002',
    bookingReference: 'HP-2026-88123',
    userId: 'user-guest-1',
    userName: 'Alexander Wright',
    userEmail: 'guest@hotelpro.com',
    userPhone: '+1 (555) 234-5678',
    hotelId: 'hotel-1',
    hotelName: 'The Grand Luminary Hotel & Spa',
    roomCategoryId: 'cat-1-2',
    roomCategoryName: 'Executive Marina Suite',
    roomId: 'room-201',
    roomNumber: '201',
    checkIn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
    guests: 3,
    numberOfRooms: 1,
    specialRequests: 'Anniversary celebration champagne setup',
    priceBreakdown: {
      nights: 4,
      baseRatePerNight: 560,
      roomSubtotal: 2240,
      taxes: 268.8,
      serviceFee: 25,
      discount: 224, // WELCOME10 applied
      total: 2309.8,
      currency: 'USD',
    },
    bookingStatus: 'Confirmed',
    paymentStatus: 'Paid',
    paymentMethod: 'Mastercard •••• 5555',
    paymentId: 'pay-demo-2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const initialReviews: IReview[] = [
  {
    _id: 'rev-1',
    hotelId: 'hotel-1',
    bookingId: 'bk-1000',
    userId: 'user-guest-1',
    userName: 'Alexander Wright',
    rating: 5,
    title: 'Flawless oceanfront getaway with five-star service',
    comment: 'The butler concierge anticipated every desire, the view from Room 101 was breathtaking at sunset, and the spa infinity pool was sheer relaxation.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    _id: 'rev-2',
    hotelId: 'hotel-1',
    bookingId: 'bk-999',
    userId: 'user-guest-2',
    userName: 'Eleanor Vance',
    rating: 5,
    title: 'Exceptional dining and impeccable cleanliness',
    comment: 'The Michelin tasting menu was world-class. Housekeeping refreshed our suite twice daily without ever disturbing us.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
  },
];

export const initialHousekeeping: IHousekeepingTask[] = [
  {
    _id: 'task-1',
    hotelId: 'hotel-1',
    roomId: 'room-103',
    roomNumber: '103',
    taskType: 'Check-out Turnover',
    status: 'In-Progress',
    priority: 'High',
    assignedToStaffId: 'user-staff-1',
    assignedStaffName: 'Elena Rostova',
    notes: 'Prioritize fresh linen change and replenishment of Diptyque amenities for 3:00 PM check-in.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    _id: 'task-2',
    hotelId: 'hotel-1',
    roomId: 'room-202',
    roomNumber: '202',
    taskType: 'Inspection',
    status: 'Pending',
    priority: 'Normal',
    assignedToStaffId: 'user-staff-1',
    assignedStaffName: 'Elena Rostova',
    notes: 'Verify climate control and minibar restock after maintenance visit.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export const initialServices: IServiceRequest[] = [
  {
    _id: 'srv-1',
    hotelId: 'hotel-1',
    roomId: 'room-102',
    roomNumber: '102',
    guestId: 'user-guest-1',
    guestName: 'Alexander Wright',
    serviceType: 'Extra Towels/Linens',
    priority: 'High',
    status: 'In-Progress',
    notes: 'Please bring 2 extra bath sheets and iced sparkling water.',
    assignedToStaffId: 'user-staff-1',
    assignedStaffName: 'Elena Rostova',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

export const initialLogs: IAdminLog[] = [
  {
    _id: 'log-1',
    actorId: 'user-admin-1',
    actorName: 'Sophia Chen',
    actorRole: 'admin',
    action: 'SYSTEM_BOOTSTRAP',
    targetType: 'System',
    details: 'HotelPro enterprise platform initialized with initial hotels and security roles.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    _id: 'log-2',
    actorId: 'user-staff-1',
    actorName: 'Elena Rostova',
    actorRole: 'staff',
    action: 'GUEST_CHECK_IN',
    targetType: 'Booking',
    targetId: 'bk-1001',
    details: 'Verified guest credentials and issued electronic keycard for Room 102.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// Reactive in-process store for zero-latency preview and full MERN API serving
class HotelProDataStore {
  users: IUser[] = [...initialUsers];
  hotels: IHotel[] = [...initialHotels];
  categories: IRoomCategory[] = [...initialCategories];
  rooms: IRoom[] = [...initialRooms];
  bookings: IBooking[] = [...initialBookings];
  payments: IPayment[] = [];
  reviews: IReview[] = [...initialReviews];
  housekeeping: IHousekeepingTask[] = [...initialHousekeeping];
  services: IServiceRequest[] = [...initialServices];
  notifications: INotification[] = [];
  logs: IAdminLog[] = [...initialLogs];

  addLog(entry: Omit<IAdminLog, '_id' | 'timestamp'>) {
    const log: IAdminLog = {
      ...entry,
      _id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(log);
    if (this.logs.length > 200) this.logs.pop();
  }

  addNotification(entry: Omit<INotification, '_id' | 'createdAt'>) {
    const notif: INotification = {
      ...entry,
      _id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
  }
}

export const store = new HotelProDataStore();

/**
 * Connect to MongoDB if MONGODB_URI is provided.
 */
export async function initDatabase(): Promise<{ mode: 'mongodb' | 'memory-seed'; error?: string }> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    isMongoConnected = false;
    return { mode: 'memory-seed' };
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    mongoConnectionError = null;
    return { mode: 'mongodb' };
  } catch (err: any) {
    isMongoConnected = false;
    mongoConnectionError = err?.message || 'Failed to connect to MongoDB URI';
    return { mode: 'memory-seed', error: mongoConnectionError || undefined };
  }
}

export function getDatabaseStatus() {
  return {
    connectedToMongo: isMongoConnected,
    mode: isMongoConnected ? 'MongoDB Atlas / External Database' : 'Development In-Memory Seed Store (Live REST API)',
    uriConfigured: Boolean(process.env.MONGODB_URI),
    mongoError: mongoConnectionError,
    counts: {
      hotels: store.hotels.length,
      rooms: store.rooms.length,
      bookings: store.bookings.length,
      users: store.users.length,
      reviews: store.reviews.length,
      housekeeping: store.housekeeping.length,
    },
  };
}
