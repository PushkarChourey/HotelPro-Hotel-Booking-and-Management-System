import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Star,
  ShieldCheck,
  Check,
  Calendar,
  Users,
  Sparkles,
  BedDouble,
  Clock,
  Heart,
  MessageSquare,
  AlertCircle,
  Building,
  CreditCard,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { IHotel, IRoomCategory, IReview } from '../../server/src/types/index.js';
import { calculatePriceBreakdown } from '../utils/pricingCalculator.js';
import { validateBookingDates, validateCapacity } from '../utils/availabilityEngine.js';

export const HotelDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [hotel, setHotel] = useState<IHotel | null>(null);
  const [categories, setCategories] = useState<IRoomCategory[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [roomStats, setRoomStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Booking Widget State
  const defaultCheckIn = searchParams.get('checkIn') || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  })();

  const defaultCheckOut = searchParams.get('checkOut') || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  })();

  const [checkIn, setCheckIn] = useState<string>(defaultCheckIn);
  const [checkOut, setCheckOut] = useState<string>(defaultCheckOut);
  const [guests, setGuests] = useState<number>(Number(searchParams.get('guests')) || 2);
  const [selectedCategory, setSelectedCategory] = useState<IRoomCategory | null>(null);
  const [promoCode, setPromoCode] = useState<string>('WELCOME10');
  const [availabilityChecking, setAvailabilityChecking] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');

  // Review Form State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const res = await api.get(`/hotels/${id}`);
        if (res.data.success) {
          setHotel(res.data.hotel);
          setCategories(res.data.categories);
          setReviews(res.data.reviews);
          setRoomStats(res.data.roomStats);
          if (res.data.categories.length > 0) {
            setSelectedCategory(res.data.categories[0]);
          }
        }
      } catch (err) {
        error('Error loading hotel', 'Could not load hotel information.');
      } finally {
        setLoading(false);
      }
    };
    fetchHotelDetails();
  }, [id]);

  // Live availability recheck
  useEffect(() => {
    if (!hotel || !selectedCategory) return;

    const checkAvailability = async () => {
      setAvailabilityChecking(true);
      try {
        const res = await api.get('/rooms/availability', {
          params: {
            hotelId: hotel._id,
            roomCategoryId: selectedCategory._id,
            checkIn,
            checkOut,
            guests,
            promoCode,
          },
        });
        if (res.data.success) {
          setIsAvailable(res.data.isAvailable);
          setAvailabilityMessage(
            res.data.isAvailable
              ? `${res.data.availableRoomsCount} suites available for your selected dates`
              : 'Category is sold out for these dates. Please adjust dates or choose another suite.'
          );
        }
      } catch (err: any) {
        setIsAvailable(false);
        setAvailabilityMessage(err.response?.data?.error || 'Dates unavailable');
      } finally {
        setAvailabilityChecking(false);
      }
    };

    checkAvailability();
  }, [hotel, selectedCategory, checkIn, checkOut, guests, promoCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading Hotel Sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-center text-slate-300">
        <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-serif-luxury">Hotel Not Found</h2>
        <button onClick={() => navigate('/search')} className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
          Return to Search
        </button>
      </div>
    );
  }

  const priceBreakdown = selectedCategory
    ? calculatePriceBreakdown({
        basePricePerNight: selectedCategory.basePrice,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfRooms: 1,
        seasonalMultiplier: selectedCategory.seasonalMultiplier || 1.0,
        promoCode,
      })
    : null;

  const handleProceedToCheckout = () => {
    if (!selectedCategory) {
      error('Please select a suite', 'Choose one of the room categories to proceed.');
      return;
    }

    const dateVal = validateBookingDates(checkIn, checkOut);
    if (!dateVal.isValid) {
      error('Invalid dates', dateVal.error);
      return;
    }

    const capVal = validateCapacity(guests, selectedCategory.capacity);
    if (!capVal.isValid) {
      error('Capacity Exceeded', capVal.error);
      return;
    }

    if (!isAvailable) {
      error('Sold Out', 'This suite is not available for the selected dates.');
      return;
    }

    // Navigate to checkout with state
    navigate('/checkout', {
      state: {
        hotel,
        category: selectedCategory,
        checkIn,
        checkOut,
        guests,
        numberOfRooms: 1,
        priceBreakdown,
        promoCode,
      },
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      error('Sign in required', 'Please sign in to share your stay experience.');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        hotelId: hotel._id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      if (res.data.success) {
        success('Review Submitted', 'Thank you for sharing your feedback.');
        setReviews([res.data.review, ...reviews]);
        setReviewTitle('');
        setReviewComment('');
      }
    } catch (err: any) {
      error('Submission Failed', err.response?.data?.error || 'Could not post review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <MapPin className="w-4 h-4" />
              <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
            </div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white tracking-wide">
              {hotel.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-light italic">
              "{hotel.tagline}"
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-lg justify-end">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{hotel.ratingAverage}</span>
              </div>
              <span className="text-[11px] text-slate-400">{hotel.reviewCount} verified guest reviews</span>
            </div>
          </div>
        </div>

        {/* Photography Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 h-96 sm:h-[460px] rounded-2xl overflow-hidden relative shadow-2xl">
            <img
              src={hotel.images[activeImageIndex] || hotel.images[0]}
              alt={hotel.name}
              className="w-full h-full object-cover transition-all duration-700"
            />
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-semibold text-white">
              Photo {activeImageIndex + 1} of {hotel.images.length}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-[460px]">
            {hotel.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-28 sm:w-32 lg:w-full h-24 sm:h-28 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                  activeImageIndex === idx ? 'border-amber-400 scale-[0.98]' : 'border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content & Reservation Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column: Description, Amenities, Suites & Reviews */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Overview */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-serif-luxury text-xl font-bold text-white">Resort Sanctuary Overview</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                {hotel.description}
              </p>

              {/* Policies */}
              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-amber-400">CHECK-IN</span>
                  <span className="text-slate-300 font-semibold">{hotel.policies.checkInTime}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-amber-400">CHECK-OUT</span>
                  <span className="text-slate-300 font-semibold">{hotel.policies.checkOutTime}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-amber-400">CANCELLATION</span>
                  <span className="text-slate-300 font-semibold text-[11px]">{hotel.policies.cancellationPolicy}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-amber-400">PET POLICY</span>
                  <span className="text-slate-300 font-semibold text-[11px]">{hotel.policies.petPolicy}</span>
                </div>
              </div>
            </div>

            {/* Signature Amenities */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-serif-luxury text-xl font-bold text-white">Signature Amenities & Services</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Room Categories */}
            <div className="space-y-6">
              <h2 className="font-serif-luxury text-2xl font-bold text-white">Curated Suites & Penthouses</h2>
              <div className="space-y-4">
                {categories.map((cat) => {
                  const isSelected = selectedCategory?._id === cat._id;
                  return (
                    <div
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row gap-6 ${
                        isSelected
                          ? 'bg-amber-950/20 border-amber-500/60 shadow-xl shadow-amber-900/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-full md:w-56 h-44 rounded-xl overflow-hidden shrink-0 relative">
                        <img
                          src={cat.images[0] || hotel.images[0]}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 shadow">
                            Active Selection
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-serif-luxury text-lg font-bold text-white">{cat.name}</h3>
                            <span className="text-lg font-bold text-amber-400 font-serif-luxury">
                              ${cat.basePrice} <span className="text-xs font-normal text-slate-400 font-sans">/ night</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cat.description}</p>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <BedDouble className="w-3.5 h-3.5 text-amber-400" /> {cat.bedType}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <Users className="w-3.5 h-3.5 text-amber-400" /> Up to {cat.capacity} Guests
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {cat.amenities.map((a, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300 border border-slate-800">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Free cancellation up to 48 hours</span>
                          <button
                            type="button"
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select Suite'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Guest Reviews Section */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif-luxury text-xl font-bold text-white">Verified Guest Reviews</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real testimonials from completed guest stays</p>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-bold text-white">{hotel.ratingAverage}</span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No reviews yet. Be the first to share your experience!</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">
                            {r.userName[0]}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200">{r.userName}</span>
                            <span className="text-[10px] text-slate-500 block">Verified Stay</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-white">{r.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <h3 className="font-serif-luxury text-sm font-bold text-white mb-2">Leave a Verified Stay Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Review headline (e.g. Unforgettable beachfront hospitality)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />

                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe the rooms, dining, staff hospitality, and overall experience..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Post Guest Review'}
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Reservation Engine Widget */}
          <div className="lg:col-span-1 sticky top-28 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              
              <div className="flex items-baseline justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-2xl font-bold font-serif-luxury text-amber-400">
                    ${selectedCategory?.basePrice || hotel.startingPrice}
                  </span>
                  <span className="text-xs text-slate-400 font-sans"> / night</span>
                </div>
                <div className="text-xs text-slate-400">
                  ★ {hotel.ratingAverage} ({hotel.reviewCount})
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="p-2 border-r border-slate-800">
                  <label className="block text-[10px] uppercase font-bold text-amber-400 mb-0.5">CHECK-IN</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="p-2">
                  <label className="block text-[10px] uppercase font-bold text-amber-400 mb-0.5">CHECK-OUT</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Guest Count */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1">GUESTS</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value={1} className="bg-slate-900">1 Guest</option>
                  <option value={2} className="bg-slate-900">2 Guests</option>
                  <option value={3} className="bg-slate-900">3 Guests</option>
                  <option value={4} className="bg-slate-900">4 Guests</option>
                  <option value={5} className="bg-slate-900">5 Guests</option>
                </select>
              </div>

              {/* Promotional Voucher Input */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">PROMOTIONAL VOUCHER</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 uppercase"
                  />
                </div>
              </div>

              {/* Availability Notice */}
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                isAvailable ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200' : 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
              }`}>
                {isAvailable ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span className="text-[11px] leading-tight">
                  {availabilityChecking ? 'Validating real-time availability...' : availabilityMessage}
                </span>
              </div>

              {/* Live Price Breakdown */}
              {priceBreakdown && (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>${priceBreakdown.baseRatePerNight} x {priceBreakdown.nights} nights</span>
                    <span>${priceBreakdown.roomSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Hospitality Taxes (12%)</span>
                    <span>${priceBreakdown.taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Resort Amenities Fee</span>
                    <span>${priceBreakdown.serviceFee.toFixed(2)}</span>
                  </div>
                  {priceBreakdown.discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Voucher Discount</span>
                      <span>-${priceBreakdown.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                    <span>Estimated Total</span>
                    <span className="text-amber-400 text-base font-serif-luxury">${priceBreakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={!isAvailable || availabilityChecking}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all font-sans disabled:opacity-50"
              >
                Proceed to Reservation & Payment
              </button>

              <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Guaranteed Instant Confirmation & Verified Sandbox
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
