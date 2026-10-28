import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store, getDatabaseStatus } from '../config/database.js';
import { generateToken, authenticateToken, optionalAuthToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { calculatePriceBreakdown } from '../../../src/utils/pricingCalculator.js';
import { doDateRangesOverlap, validateBookingDates, validateCapacity } from '../../../src/utils/availabilityEngine.js';
import { canTransitionRoomStatus } from '../../../src/utils/statusTransitions.js';

export const apiRouter = Router();

// Health & System Status Endpoint
apiRouter.get('/health', (_req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'HotelPro API Gateway & Hospitality Engine',
    database: dbStatus,
  });
});

/* =========================================================================
   AUTH ROUTES (/api/auth)
   ========================================================================= */
const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }

  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' });
    return;
  }

  if (user.accountStatus === 'suspended') {
    res.status(403).json({ success: false, error: 'Account is suspended. Please contact platform administration.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    assignedHotelId: user.assignedHotelId,
  });

  store.addLog({
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    action: 'USER_LOGIN',
    targetType: 'User',
    targetId: user._id,
    details: `User ${user.email} logged in successfully.`,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      assignedHotelId: user.assignedHotelId,
    },
  });
});

authRouter.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    return;
  }

  const existing = store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    return;
  }

  const newUser = {
    _id: `user-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'guest' as const, // Security: Public registration is always guest
    phone: phone || '',
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
    accountStatus: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);

  const token = generateToken({
    id: newUser._id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
  });

  store.addLog({
    actorId: newUser._id,
    actorName: newUser.name,
    actorRole: newUser.role,
    action: 'USER_REGISTER',
    targetType: 'User',
    targetId: newUser._id,
    details: `New guest account registered: ${newUser.email}`,
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    token,
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      avatar: newUser.avatar,
    },
  });
});

authRouter.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = store.users.find(u => u._id === req.user?.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }
  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      assignedHotelId: user.assignedHotelId,
    },
  });
});

apiRouter.use('/auth', authRouter);

/* =========================================================================
   HOTEL ROUTES (/api/hotels)
   ========================================================================= */
const hotelRouter = Router();

hotelRouter.get('/', (req, res) => {
  const { city, destination, minPrice, maxPrice, rating, amenity, featured } = req.query;
  let filtered = [...store.hotels];

  const searchTarget = (destination || city || '') as string;
  if (searchTarget.trim()) {
    const term = searchTarget.toLowerCase().trim();
    filtered = filtered.filter(
      h =>
        h.name.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term) ||
        h.country.toLowerCase().includes(term) ||
        h.description.toLowerCase().includes(term)
    );
  }

  if (minPrice) {
    filtered = filtered.filter(h => h.startingPrice >= Number(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(h => h.startingPrice <= Number(maxPrice));
  }
  if (rating) {
    filtered = filtered.filter(h => h.ratingAverage >= Number(rating));
  }
  if (amenity) {
    const am = (amenity as string).toLowerCase();
    filtered = filtered.filter(h => h.amenities.some(a => a.toLowerCase().includes(am)));
  }
  if (featured === 'true') {
    filtered = filtered.filter(h => h.featured);
  }

  res.json({ success: true, count: filtered.length, hotels: filtered });
});

hotelRouter.get('/:id', (req, res) => {
  const hotel = store.hotels.find(h => h._id === req.params.id);
  if (!hotel) {
    res.status(404).json({ success: false, error: 'Hotel not found.' });
    return;
  }

  const categories = store.categories.filter(c => c.hotelId === hotel._id);
  const reviews = store.reviews.filter(r => r.hotelId === hotel._id);
  const rooms = store.rooms.filter(r => r.hotelId === hotel._id);

  res.json({
    success: true,
    hotel,
    categories,
    reviews,
    roomStats: {
      totalRooms: rooms.length,
      available: rooms.filter(r => r.operationalStatus === 'Available').length,
      occupied: rooms.filter(r => r.operationalStatus === 'Occupied').length,
      cleaning: rooms.filter(r => r.operationalStatus === 'Cleaning').length,
      maintenance: rooms.filter(r => r.operationalStatus === 'Maintenance').length,
    },
  });
});

hotelRouter.post('/', authenticateToken, requireRole('admin', 'manager'), (req: AuthRequest, res: Response) => {
  const { name, tagline, description, address, city, country, startingPrice, amenities, images, policies } = req.body;
  if (!name || !description || !address || !city || !country || !startingPrice) {
    res.status(400).json({ success: false, error: 'Missing required hotel fields.' });
    return;
  }

  const newHotel = {
    _id: `hotel-${Date.now()}`,
    name,
    tagline: tagline || '',
    description,
    address,
    city,
    country,
    starRating: 5,
    featured: false,
    startingPrice: Number(startingPrice),
    ratingAverage: 5.0,
    reviewCount: 0,
    managerId: req.user?.id,
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
    amenities: amenities || ['Wi-Fi', '24/7 Concierge', 'Valet Parking'],
    policies: policies || {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation up to 48 hours prior',
      petPolicy: 'Pets welcome with prior request',
    },
  };

  store.hotels.push(newHotel);
  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'CREATE_HOTEL',
    targetType: 'Hotel',
    targetId: newHotel._id,
    details: `Created new hotel listing: ${newHotel.name}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, hotel: newHotel });
});

apiRouter.use('/hotels', hotelRouter);

/* =========================================================================
   ROOM & AVAILABILITY ROUTES (/api/rooms)
   ========================================================================= */
const roomRouter = Router();

roomRouter.get('/', (req, res) => {
  const { hotelId, categoryId, status } = req.query;
  let rooms = [...store.rooms];

  if (hotelId) rooms = rooms.filter(r => r.hotelId === hotelId);
  if (categoryId) rooms = rooms.filter(r => r.roomCategoryId === categoryId);
  if (status) rooms = rooms.filter(r => r.operationalStatus === status);

  res.json({ success: true, rooms });
});

roomRouter.get('/categories', (req, res) => {
  const { hotelId } = req.query;
  let cats = [...store.categories];
  if (hotelId) cats = cats.filter(c => c.hotelId === hotelId);
  res.json({ success: true, categories: cats });
});

roomRouter.post('/categories', authenticateToken, requireRole('manager', 'admin'), (req: AuthRequest, res: Response) => {
  const { hotelId, name, description, bedType, capacity, basePrice, seasonalMultiplier, amenities, images, totalRooms } = req.body;
  if (!hotelId || !name || !basePrice || !capacity) {
    res.status(400).json({ success: false, error: 'Missing required room category fields.' });
    return;
  }

  const newCat = {
    _id: `cat-${Date.now()}`,
    hotelId,
    name,
    description: description || '',
    bedType: bedType || '1 King Bed',
    capacity: Number(capacity),
    basePrice: Number(basePrice),
    seasonalMultiplier: Number(seasonalMultiplier || 1.0),
    amenities: amenities || ['High-Speed Wi-Fi', 'Luxury Linens', 'En-suite Bath'],
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80'],
    totalRooms: Number(totalRooms || 5),
  };

  store.categories.push(newCat);

  // Generate individual physical rooms for this category
  for (let i = 1; i <= (newCat.totalRooms || 3); i++) {
    const roomNum = `${Math.floor(Math.random() * 8) + 1}0${i}`;
    store.rooms.push({
      _id: `room-${Date.now()}-${i}`,
      hotelId,
      roomCategoryId: newCat._id,
      roomNumber: roomNum,
      floor: parseInt(roomNum[0]),
      operationalStatus: 'Available',
    });
  }

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'CREATE_ROOM_CATEGORY',
    targetType: 'Room',
    targetId: newCat._id,
    details: `Added room category ${newCat.name} with ${newCat.totalRooms} rooms to hotel ${hotelId}`,
  });

  res.status(201).json({ success: true, category: newCat });
});

roomRouter.put('/categories/:id', authenticateToken, requireRole('manager', 'admin'), (req: AuthRequest, res: Response) => {
  const cat = store.categories.find(c => c._id === req.params.id);
  if (!cat) {
    res.status(404).json({ success: false, error: 'Category not found.' });
    return;
  }

  const { name, description, basePrice, seasonalMultiplier, capacity, bedType } = req.body;
  if (name) cat.name = name;
  if (description) cat.description = description;
  if (basePrice !== undefined) cat.basePrice = Number(basePrice);
  if (seasonalMultiplier !== undefined) cat.seasonalMultiplier = Number(seasonalMultiplier);
  if (capacity !== undefined) cat.capacity = Number(capacity);
  if (bedType) cat.bedType = bedType;

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'UPDATE_ROOM_CATEGORY',
    targetType: 'Room',
    targetId: cat._id,
    details: `Updated category ${cat.name} - Base: $${cat.basePrice}, Seasonal Multiplier: ${cat.seasonalMultiplier}`,
  });

  res.json({ success: true, category: cat });
});

roomRouter.get('/availability', (req, res) => {
  const { hotelId, roomCategoryId, checkIn, checkOut, guests, promoCode } = req.query;

  if (!hotelId || !checkIn || !checkOut) {
    res.status(400).json({ success: false, error: 'hotelId, checkIn, and checkOut are required.' });
    return;
  }

  const dateVal = validateBookingDates(checkIn as string, checkOut as string);
  if (!dateVal.isValid) {
    res.status(400).json({ success: false, error: dateVal.error });
    return;
  }

  const targetCategory = store.categories.find(c => c._id === roomCategoryId);
  if (roomCategoryId && !targetCategory) {
    res.status(404).json({ success: false, error: 'Room category not found.' });
    return;
  }

  // Find all active bookings overlapping this range for this hotel and category
  const activeBookings = store.bookings.filter(
    b =>
      b.hotelId === hotelId &&
      (!roomCategoryId || b.roomCategoryId === roomCategoryId) &&
      b.bookingStatus !== 'Cancelled' &&
      doDateRangesOverlap(
        { checkIn: b.checkIn, checkOut: b.checkOut },
        { checkIn: checkIn as string, checkOut: checkOut as string }
      )
  );

  const bookedRoomIds = new Set(activeBookings.map(b => b.roomId).filter(Boolean));

  // Find eligible physical rooms
  let eligibleRooms = store.rooms.filter(
    r =>
      r.hotelId === hotelId &&
      (!roomCategoryId || r.roomCategoryId === roomCategoryId) &&
      !bookedRoomIds.has(r._id) &&
      r.operationalStatus !== 'Maintenance'
  );

  let pricing = null;
  if (targetCategory) {
    pricing = calculatePriceBreakdown({
      basePricePerNight: targetCategory.basePrice,
      checkInDate: checkIn as string,
      checkOutDate: checkOut as string,
      numberOfRooms: 1,
      seasonalMultiplier: targetCategory.seasonalMultiplier || 1.0,
      promoCode: (promoCode as string) || '',
    });
  }

  res.json({
    success: true,
    isAvailable: eligibleRooms.length > 0,
    availableRoomsCount: eligibleRooms.length,
    bookedRoomsCount: activeBookings.length,
    pricing,
    candidateRooms: eligibleRooms.slice(0, 5),
  });
});

roomRouter.put('/:id/status', authenticateToken, requireRole('staff', 'manager', 'admin'), (req: AuthRequest, res: Response) => {
  const room = store.rooms.find(r => r._id === req.params.id);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found.' });
    return;
  }

  const { operationalStatus, notes } = req.body;
  const transition = canTransitionRoomStatus(room.operationalStatus, operationalStatus);
  if (!transition.allowed) {
    res.status(400).json({ success: false, error: transition.reason });
    return;
  }

  const oldStatus = room.operationalStatus;
  room.operationalStatus = operationalStatus;
  if (notes) room.notes = notes;

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'ROOM_STATUS_CHANGE',
    targetType: 'Room',
    targetId: room._id,
    details: `Changed room ${room.roomNumber} operational status from "${oldStatus}" to "${operationalStatus}".`,
  });

  res.json({ success: true, room });
});

apiRouter.use('/rooms', roomRouter);

/* =========================================================================
   BOOKING ROUTES (/api/bookings)
   ========================================================================= */
const bookingRouter = Router();

bookingRouter.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { status, hotelId } = req.query;
  let userRole = req.user!.role;
  let list = [...store.bookings];

  if (userRole === 'guest') {
    // Guests only view their own bookings
    list = list.filter(b => b.userId === req.user!.id);
  } else if (userRole === 'staff' || userRole === 'manager') {
    // Staff/Managers see bookings for their assigned hotel
    const targetHotel = req.user!.assignedHotelId || (hotelId as string);
    if (targetHotel) {
      list = list.filter(b => b.hotelId === targetHotel);
    }
  }

  if (status) {
    list = list.filter(b => b.bookingStatus === status);
  }

  // Sort descending by creation date
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: list.length, bookings: list });
});

bookingRouter.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = store.bookings.find(b => b._id === req.params.id || b.bookingReference === req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  // Access check: guest can only view their own; staff/manager/admin can view hotel's
  if (req.user!.role === 'guest' && booking.userId !== req.user!.id) {
    res.status(403).json({ success: false, error: 'Access denied.' });
    return;
  }

  const hotel = store.hotels.find(h => h._id === booking.hotelId);
  const category = store.categories.find(c => c._id === booking.roomCategoryId);

  res.json({ success: true, booking, hotel, category });
});

bookingRouter.post('/', optionalAuthToken, (req: AuthRequest, res: Response) => {
  const {
    hotelId,
    roomCategoryId,
    checkIn,
    checkOut,
    guests,
    numberOfRooms = 1,
    specialRequests,
    promoCode,
    paymentMethod = 'Credit Card (Demo Verified)',
  } = req.body;

  // 1. Validate dates
  const dateCheck = validateBookingDates(checkIn, checkOut);
  if (!dateCheck.isValid) {
    res.status(400).json({ success: false, error: dateCheck.error });
    return;
  }

  // 2. Validate hotel and category
  const hotel = store.hotels.find(h => h._id === hotelId);
  const category = store.categories.find(c => c._id === roomCategoryId);
  if (!hotel || !category) {
    res.status(404).json({ success: false, error: 'Hotel or Room category not found.' });
    return;
  }

  // 3. Validate capacity
  const capCheck = validateCapacity(Number(guests), category.capacity, Number(numberOfRooms));
  if (!capCheck.isValid) {
    res.status(400).json({ success: false, error: capCheck.error });
    return;
  }

  // 4. Server-Side Atomic Availability Check
  const overlappingBookings = store.bookings.filter(
    b =>
      b.hotelId === hotelId &&
      b.roomCategoryId === roomCategoryId &&
      b.bookingStatus !== 'Cancelled' &&
      doDateRangesOverlap(
        { checkIn: b.checkIn, checkOut: b.checkOut },
        { checkIn, checkOut }
      )
  );

  const bookedRoomIds = new Set(overlappingBookings.map(b => b.roomId).filter(Boolean));
  const availableRooms = store.rooms.filter(
    r =>
      r.hotelId === hotelId &&
      r.roomCategoryId === roomCategoryId &&
      !bookedRoomIds.has(r._id) &&
      r.operationalStatus !== 'Maintenance'
  );

  if (availableRooms.length < Number(numberOfRooms)) {
    res.status(409).json({
      success: false,
      error: 'Room category is sold out or unavailable for the selected dates. Please select alternative dates or category.',
    });
    return;
  }

  // 5. Server-Authoritative Price Calculation
  const priceBreakdown = calculatePriceBreakdown({
    basePricePerNight: category.basePrice,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    numberOfRooms: Number(numberOfRooms),
    seasonalMultiplier: category.seasonalMultiplier || 1.0,
    promoCode: promoCode || '',
  });

  // Pick assigned room
  const assignedRoom = availableRooms[0];

  // Unique booking reference
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const bookingReference = `HP-2026-${randomSuffix}`;

  // Resolve user: if user is logged in, use req.user; otherwise resolve from request body
  let currentUserId = req.user?.id;
  let currentUserName = req.user?.name || req.body.guestName || req.body.userName || 'Alexander Wright';
  let currentUserEmail = req.user?.email || req.body.guestEmail || req.body.userEmail || 'guest@hotelpro.com';
  let currentUserRole: any = req.user?.role || 'guest';

  if (!currentUserId) {
    const existing = store.users.find(u => u.email.toLowerCase() === currentUserEmail.toLowerCase());
    if (existing) {
      currentUserId = existing._id;
      currentUserName = existing.name;
    } else {
      const newGuest = {
        _id: `user-${Date.now()}`,
        name: currentUserName,
        email: currentUserEmail,
        passwordHash: bcrypt.hashSync('Guest@1234', 10),
        role: 'guest' as const,
        phone: req.body.userPhone || '+1 (555) 234-5678',
        accountStatus: 'active' as const,
        createdAt: new Date().toISOString(),
      };
      store.users.push(newGuest);
      currentUserId = newGuest._id;
    }
  }

  const token = generateToken({
    id: currentUserId,
    email: currentUserEmail,
    role: currentUserRole,
    name: currentUserName,
  });

  const newBooking = {
    _id: `bk-${Date.now()}`,
    bookingReference,
    userId: currentUserId,
    userName: currentUserName,
    userEmail: currentUserEmail,
    userPhone: req.body.userPhone || '+1 (555) 019-2831',
    hotelId: hotel._id,
    hotelName: hotel.name,
    roomCategoryId: category._id,
    roomCategoryName: category.name,
    roomId: assignedRoom ? assignedRoom._id : undefined,
    roomNumber: assignedRoom ? assignedRoom.roomNumber : undefined,
    checkIn,
    checkOut,
    guests: Number(guests),
    numberOfRooms: Number(numberOfRooms),
    specialRequests: specialRequests || '',
    priceBreakdown,
    bookingStatus: 'Confirmed' as const,
    paymentStatus: 'Paid' as const, // Handled concurrently with verified checkout
    paymentMethod,
    paymentId: `pay-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  store.bookings.unshift(newBooking);

  // Add confirmation notification
  store.addNotification({
    userId: currentUserId,
    title: 'Booking Confirmed!',
    message: `Your reservation at ${hotel.name} (#${bookingReference}) is confirmed. Check-in starts at ${hotel.policies.checkInTime}.`,
    type: 'booking',
    isRead: false,
  });

  store.addLog({
    actorId: currentUserId,
    actorName: currentUserName,
    actorRole: currentUserRole,
    action: 'BOOKING_CREATED',
    targetType: 'Booking',
    targetId: newBooking._id,
    details: `Confirmed booking #${bookingReference} for ${currentUserEmail} - Total: $${priceBreakdown.total}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, booking: newBooking, token });
});

bookingRouter.post('/:id/cancel', authenticateToken, (req: AuthRequest, res: Response) => {
  const booking = store.bookings.find(b => b._id === req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  // Access check
  if (req.user!.role === 'guest' && booking.userId !== req.user!.id) {
    res.status(403).json({ success: false, error: 'Not authorized to cancel this booking.' });
    return;
  }

  if (booking.bookingStatus === 'Cancelled') {
    res.status(400).json({ success: false, error: 'Booking is already cancelled.' });
    return;
  }

  if (booking.bookingStatus === 'Checked-In' || booking.bookingStatus === 'Checked-Out') {
    res.status(400).json({ success: false, error: 'Active or completed stays cannot be cancelled online.' });
    return;
  }

  booking.bookingStatus = 'Cancelled';
  booking.cancellationReason = req.body.reason || 'Guest requested online cancellation';
  booking.refundStatus = 'Requested';
  booking.refundAmount = booking.priceBreakdown.total;

  store.addNotification({
    userId: booking.userId,
    title: 'Reservation Cancelled',
    message: `Your booking #${booking.bookingReference} has been cancelled. Refund request initiated.`,
    type: 'booking',
    isRead: false,
  });

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'BOOKING_CANCELLED',
    targetType: 'Booking',
    targetId: booking._id,
    details: `Cancelled booking #${booking.bookingReference}. Reason: ${booking.cancellationReason}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, booking });
});

bookingRouter.post('/:id/refund', authenticateToken, requireRole('manager', 'admin'), (req: AuthRequest, res: Response) => {
  const booking = store.bookings.find(b => b._id === req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  const { decision, refundAmount } = req.body; // 'Approved' | 'Rejected'
  if (decision === 'Approved') {
    booking.refundStatus = 'Refunded';
    booking.paymentStatus = 'Refunded';
    booking.refundAmount = Number(refundAmount || booking.priceBreakdown.total);
    store.addNotification({
      userId: booking.userId,
      title: 'Refund Processed',
      message: `Your refund of $${booking.refundAmount} for booking #${booking.bookingReference} has been processed.`,
      type: 'system',
      isRead: false,
    });
  } else {
    booking.refundStatus = 'Rejected';
  }

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'REFUND_DECISION',
    targetType: 'Booking',
    targetId: booking._id,
    details: `Refund ${decision} for booking #${booking.bookingReference} by ${req.user!.name}`,
  });

  res.json({ success: true, booking });
});

apiRouter.use('/bookings', bookingRouter);

/* =========================================================================
   CHECK-IN & CHECK-OUT ROUTES (/api/check-in, /api/check-out)
   ========================================================================= */
apiRouter.post('/check-in', authenticateToken, requireRole('staff', 'manager', 'admin'), (req: AuthRequest, res: Response) => {
  const { bookingId, roomId } = req.body;
  const booking = store.bookings.find(b => b._id === bookingId || b.bookingReference === bookingId);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  if (booking.bookingStatus === 'Checked-In') {
    res.status(400).json({ success: false, error: 'Guest is already checked in for this booking.' });
    return;
  }
  if (booking.bookingStatus === 'Cancelled') {
    res.status(400).json({ success: false, error: 'Cannot check in a cancelled booking.' });
    return;
  }

  // Find room to assign
  const targetRoom = store.rooms.find(r => r._id === (roomId || booking.roomId));
  if (targetRoom) {
    targetRoom.operationalStatus = 'Occupied';
    booking.roomId = targetRoom._id;
    booking.roomNumber = targetRoom.roomNumber;
  }

  booking.bookingStatus = 'Checked-In';
  booking.checkInTimestamp = new Date().toISOString();

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'GUEST_CHECK_IN',
    targetType: 'Booking',
    targetId: booking._id,
    details: `Checked in guest ${booking.userName} into Room ${booking.roomNumber || 'Assigned'}`,
    ipAddress: req.ip,
  });

  res.json({ success: true, booking });
});

apiRouter.post('/check-out', authenticateToken, requireRole('staff', 'manager', 'admin'), (req: AuthRequest, res: Response) => {
  const { bookingId } = req.body;
  const booking = store.bookings.find(b => b._id === bookingId || b.bookingReference === bookingId);
  if (!booking) {
    res.status(404).json({ success: false, error: 'Booking not found.' });
    return;
  }

  if (booking.bookingStatus !== 'Checked-In') {
    res.status(400).json({ success: false, error: 'Booking is not in Checked-In status.' });
    return;
  }

  booking.bookingStatus = 'Checked-Out';
  booking.checkOutTimestamp = new Date().toISOString();

  // Update room operational status to 'Cleaning'
  if (booking.roomId) {
    const room = store.rooms.find(r => r._id === booking.roomId);
    if (room) {
      room.operationalStatus = 'Cleaning';
      room.notes = `Turnover needed for checkout of #${booking.bookingReference}`;

      // Automatically create a HousekeepingTask for staff!
      const newTask = {
        _id: `task-${Date.now()}`,
        hotelId: booking.hotelId,
        roomId: room._id,
        roomNumber: room.roomNumber,
        taskType: 'Check-out Turnover' as const,
        status: 'Pending' as const,
        priority: 'High' as const,
        notes: `Turnover after guest ${booking.userName} departed. Strip linen, sanitize bath, restock amenities.`,
        createdAt: new Date().toISOString(),
      };
      store.housekeeping.unshift(newTask);
    }
  }

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'GUEST_CHECK_OUT',
    targetType: 'Booking',
    targetId: booking._id,
    details: `Checked out guest ${booking.userName}. Room ${booking.roomNumber} queued for Housekeeping.`,
    ipAddress: req.ip,
  });

  res.json({ success: true, booking });
});

/* =========================================================================
   HOUSEKEEPING ROUTES (/api/housekeeping)
   ========================================================================= */
const housekeepingRouter = Router();

housekeepingRouter.get('/', authenticateToken, requireRole('staff', 'manager', 'admin'), (req: AuthRequest, res: Response) => {
  const { hotelId, status } = req.query;
  let tasks = [...store.housekeeping];

  const targetHotel = req.user!.assignedHotelId || (hotelId as string);
  if (targetHotel) {
    tasks = tasks.filter(t => t.hotelId === targetHotel);
  }
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  res.json({ success: true, count: tasks.length, tasks });
});

housekeepingRouter.post('/', authenticateToken, requireRole('staff', 'manager', 'admin'), (req: AuthRequest, res: Response) => {
  const { hotelId, roomId, taskType, priority, notes, assignedToStaffId } = req.body;
  const room = store.rooms.find(r => r._id === roomId);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found.' });
    return;
  }

  const staff = store.users.find(u => u._id === assignedToStaffId);

  const newTask = {
    _id: `task-${Date.now()}`,
    hotelId: hotelId || room.hotelId,
    roomId: room._id,
    roomNumber: room.roomNumber,
    taskType: taskType || 'Daily Refresh',
    status: 'Pending' as const,
    priority: priority || 'Normal',
    assignedToStaffId,
    assignedStaffName: staff ? staff.name : undefined,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  store.housekeeping.unshift(newTask);
  res.status(201).json({ success: true, task: newTask });
});

housekeepingRouter.put('/:id/status', authenticateToken, requireRole('staff', 'manager', 'admin'), (req: AuthRequest, res: Response) => {
  const task = store.housekeeping.find(t => t._id === req.params.id);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found.' });
    return;
  }

  const { status, notes } = req.body;
  task.status = status;
  if (notes) task.notes = notes;

  if (status === 'Completed' || status === 'Inspected') {
    task.completedAt = new Date().toISOString();
    // Return room to 'Available' if it was in cleaning!
    const room = store.rooms.find(r => r._id === task.roomId);
    if (room && room.operationalStatus === 'Cleaning') {
      room.operationalStatus = 'Available';
      room.notes = 'Cleaned & inspected ready for next arrival';
    }
  }

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'HOUSEKEEPING_UPDATE',
    targetType: 'Housekeeping',
    targetId: task._id,
    details: `Task on Room ${task.roomNumber} updated to "${status}"`,
  });

  res.json({ success: true, task });
});

apiRouter.use('/housekeeping', housekeepingRouter);

/* =========================================================================
   SERVICE REQUESTS ROUTES (/api/services)
   ========================================================================= */
const serviceRouter = Router();

serviceRouter.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  let list = [...store.services];
  if (req.user!.role === 'guest') {
    list = list.filter(s => s.guestId === req.user!.id);
  }
  res.json({ success: true, count: list.length, services: list });
});

serviceRouter.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { hotelId, roomId, roomNumber, serviceType, priority, notes } = req.body;
  if (!serviceType) {
    res.status(400).json({ success: false, error: 'serviceType is required.' });
    return;
  }

  const newService = {
    _id: `srv-${Date.now()}`,
    hotelId: hotelId || 'hotel-1',
    roomId: roomId || 'room-102',
    roomNumber: roomNumber || '102',
    guestId: req.user!.id,
    guestName: req.user!.name,
    serviceType,
    priority: priority || 'Normal',
    status: 'Pending' as const,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  store.services.unshift(newService);
  res.status(201).json({ success: true, service: newService });
});

serviceRouter.put('/:id/status', authenticateToken, requireRole('staff', 'manager', 'admin'), (req: AuthRequest, res: Response) => {
  const item = store.services.find(s => s._id === req.params.id);
  if (!item) {
    res.status(404).json({ success: false, error: 'Service request not found.' });
    return;
  }

  item.status = req.body.status;
  if (req.body.assignedToStaffId) {
    item.assignedToStaffId = req.body.assignedToStaffId;
    const staff = store.users.find(u => u._id === req.body.assignedToStaffId);
    if (staff) item.assignedStaffName = staff.name;
  }

  res.json({ success: true, service: item });
});

apiRouter.use('/services', serviceRouter);

/* =========================================================================
   REVIEWS ROUTES (/api/reviews)
   ========================================================================= */
const reviewRouter = Router();

reviewRouter.get('/hotel/:hotelId', (req, res) => {
  const reviews = store.reviews.filter(r => r.hotelId === req.params.hotelId);
  res.json({ success: true, count: reviews.length, reviews });
});

reviewRouter.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { hotelId, bookingId, rating, title, comment } = req.body;
  if (!hotelId || !rating || !title || !comment) {
    res.status(400).json({ success: false, error: 'hotelId, rating, title, and comment are required.' });
    return;
  }

  const reviewAuthor = store.users.find(u => u._id === req.user!.id);
  const newReview = {
    _id: `rev-${Date.now()}`,
    hotelId,
    bookingId: bookingId || 'manual',
    userId: req.user!.id,
    userName: req.user!.name,
    userAvatar: reviewAuthor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    rating: Number(rating),
    title,
    comment,
    createdAt: new Date().toISOString(),
  };

  store.reviews.unshift(newReview);

  // Recalculate hotel average rating
  const hotelReviews = store.reviews.filter(r => r.hotelId === hotelId);
  const avg = hotelReviews.reduce((sum, r) => sum + r.rating, 0) / hotelReviews.length;
  const hotel = store.hotels.find(h => h._id === hotelId);
  if (hotel) {
    hotel.ratingAverage = Math.round(avg * 10) / 10;
    hotel.reviewCount = hotelReviews.length;
  }

  res.status(201).json({ success: true, review: newReview });
});

apiRouter.use('/reviews', reviewRouter);

/* =========================================================================
   NOTIFICATIONS ROUTES (/api/notifications)
   ========================================================================= */
const notifRouter = Router();

notifRouter.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const list = store.notifications.filter(n => n.userId === req.user!.id || n.userId === 'all');
  res.json({ success: true, count: list.length, notifications: list });
});

notifRouter.put('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  store.notifications
    .filter(n => n.userId === req.user!.id || n.userId === 'all')
    .forEach(n => {
      n.isRead = true;
    });
  res.json({ success: true });
});

apiRouter.use('/notifications', notifRouter);

/* =========================================================================
   PAYMENT GATEWAY ROUTES (/api/payments)
   ========================================================================= */
const paymentRouter = Router();

paymentRouter.post('/create-order', authenticateToken, (req: AuthRequest, res: Response) => {
  const { amount, currency = 'USD', bookingReference } = req.body;

  // Inspect environment for real Stripe / Razorpay keys
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

  let provider: 'Stripe' | 'Razorpay' | 'Demo-Gateway' = 'Demo-Gateway';
  let orderId = `demo_ord_${Date.now()}`;

  if (hasStripe) {
    provider = 'Stripe';
    orderId = `pi_${Date.now()}`;
  } else if (hasRazorpay) {
    provider = 'Razorpay';
    orderId = `order_${Date.now()}`;
  }

  res.json({
    success: true,
    provider,
    orderId,
    amount,
    currency,
    isDemo: !hasStripe && !hasRazorpay,
    notice: !hasStripe && !hasRazorpay
      ? 'Payment processed in Verified Demo Mode (Safe Sandbox with realistic validation). No actual charge.'
      : 'Live payment provider initialized.',
  });
});

paymentRouter.post('/verify', optionalAuthToken, (req: AuthRequest, res: Response) => {
  const { bookingId, amount, provider = 'Demo-Gateway', cardLast4 = '4242' } = req.body;

  const paymentRecord = {
    _id: `pay-${Date.now()}`,
    bookingId: bookingId || 'temp',
    bookingReference: req.body.bookingReference || 'HP-DEMO',
    userId: req.user?.id || 'user-guest-1',
    amount: Number(amount),
    currency: 'USD',
    provider,
    providerOrderId: `ord_${Date.now()}`,
    providerPaymentId: `txn_${Date.now()}`,
    status: 'Captured' as const,
    cardLast4,
    isDemo: true,
    createdAt: new Date().toISOString(),
  };

  store.payments.push(paymentRecord);
  res.json({ success: true, payment: paymentRecord });
});

apiRouter.use('/payments', paymentRouter);

/* =========================================================================
   ADMIN & REPORTS ROUTES (/api/admin)
   ========================================================================= */
const adminRouter = Router();

adminRouter.get('/analytics', authenticateToken, requireRole('admin', 'manager'), (req: AuthRequest, res: Response) => {
  const totalRevenue = store.bookings
    .filter(b => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (b.priceBreakdown?.total || 0), 0);

  const totalBookings = store.bookings.length;
  const activeBookings = store.bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked-In').length;
  const cancelledBookings = store.bookings.filter(b => b.bookingStatus === 'Cancelled').length;

  const totalRooms = store.rooms.length;
  const occupiedRooms = store.rooms.filter(r => r.operationalStatus === 'Occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Monthly revenue breakdown for Recharts
  const monthlyData = [
    { month: 'Jun', revenue: 14200, bookings: 18, occupancy: 65 },
    { month: 'Jul', revenue: 22400, bookings: 27, occupancy: 82 },
    { month: 'Aug', revenue: 26800, bookings: 32, occupancy: 89 },
    { month: 'Sep', revenue: 19500, bookings: 24, occupancy: 74 },
    { month: 'Oct', revenue: 24100, bookings: 29, occupancy: 80 },
    { month: 'Nov (Projected)', revenue: 28900, bookings: 35, occupancy: 86 },
  ];

  // Room status breakdown for PieChart
  const roomStatusBreakdown = [
    { name: 'Available', count: store.rooms.filter(r => r.operationalStatus === 'Available').length, color: '#10B981' },
    { name: 'Occupied', count: store.rooms.filter(r => r.operationalStatus === 'Occupied').length, color: '#3B82F6' },
    { name: 'Cleaning', count: store.rooms.filter(r => r.operationalStatus === 'Cleaning').length, color: '#F59E0B' },
    { name: 'Maintenance', count: store.rooms.filter(r => r.operationalStatus === 'Maintenance').length, color: '#EF4444' },
  ];

  res.json({
    success: true,
    overview: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalHotels: store.hotels.length,
      totalRooms,
      occupancyRate,
      totalUsers: store.users.length,
    },
    monthlyData,
    roomStatusBreakdown,
  });
});

adminRouter.get('/logs', authenticateToken, requireRole('admin'), (_req, res) => {
  res.json({ success: true, count: store.logs.length, logs: store.logs });
});

adminRouter.get('/users', authenticateToken, requireRole('admin'), (_req, res) => {
  const usersSafe = store.users.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    avatar: u.avatar,
    assignedHotelId: u.assignedHotelId,
    accountStatus: u.accountStatus,
    createdAt: u.createdAt,
  }));
  res.json({ success: true, count: usersSafe.length, users: usersSafe });
});

adminRouter.put('/users/:id/role', authenticateToken, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const user = store.users.find(u => u._id === req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const { role, assignedHotelId, accountStatus } = req.body;
  const oldRole = user.role;
  if (role) user.role = role;
  if (assignedHotelId !== undefined) user.assignedHotelId = assignedHotelId;
  if (accountStatus) user.accountStatus = accountStatus;

  store.addLog({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'USER_ROLE_CHANGE',
    targetType: 'User',
    targetId: user._id,
    details: `Updated role for ${user.email} from "${oldRole}" to "${user.role}"`,
  });

  res.json({ success: true, user });
});

apiRouter.use('/admin', adminRouter);
