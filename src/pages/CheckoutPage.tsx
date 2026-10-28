import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  MessageSquare,
  Lock,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { InvoiceModal } from '../components/booking/InvoiceModal.js';
import { IBooking } from '../../server/src/types/index.js';

export const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const state = location.state || {};
  const { hotel, category, checkIn, checkOut, guests, numberOfRooms, priceBreakdown, promoCode } = state;

  const [guestName, setGuestName] = useState(user?.name || 'Alexander Wright');
  const [guestEmail, setGuestEmail] = useState(user?.email || 'guest@hotelpro.com');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment form state
  const [paymentProvider, setPaymentProvider] = useState<'demo' | 'card'>('demo');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [submitting, setSubmitting] = useState(false);

  // Confirmed booking state & modal
  const [confirmedBooking, setConfirmedBooking] = useState<IBooking | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  if (!hotel || !category) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-center text-slate-300">
        <div className="space-y-4">
          <Building className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-xl font-bold font-serif-luxury">No Active Reservation Selection</h2>
          <p className="text-xs text-slate-400">Please choose a hotel and room suite from our directory first.</p>
          <button
            onClick={() => navigate('/search')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Explore Hotels
          </button>
        </div>
      </div>
    );
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Submit reservation to server with atomic validation
      const bookingRes = await api.post('/bookings', {
        hotelId: hotel._id,
        roomCategoryId: category._id,
        checkIn,
        checkOut,
        guests,
        numberOfRooms: numberOfRooms || 1,
        specialRequests,
        promoCode,
        guestName,
        guestEmail,
        userPhone: guestPhone,
        paymentMethod: paymentProvider === 'demo' ? 'Visa •••• 4242 (Demo Sandbox)' : 'Credit Card',
      });

      if (bookingRes.data.success) {
        if (bookingRes.data.token) {
          localStorage.setItem('hotelpro_token', bookingRes.data.token);
        }
        const bk = bookingRes.data.booking;
        setConfirmedBooking(bk);

        // 2. Record payment capture
        await api.post('/payments/verify', {
          bookingId: bk._id,
          bookingReference: bk.bookingReference,
          amount: bk.priceBreakdown.total,
          provider: 'Demo-Gateway',
          cardLast4: '4242',
        });

        success('Booking Confirmed!', `Reference #${bk.bookingReference} has been verified.`);
      }
    } catch (err: any) {
      error('Reservation Failed', err.response?.data?.error || 'Could not complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  // If already confirmed, render success screen
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 border border-emerald-500/40 text-emerald-300">
              Payment Captured & Suite Reserved
            </span>
            <h1 className="font-serif-luxury text-3xl font-bold text-white mt-3">
              Reservation Confirmed
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              A confirmation email has been dispatched to <span className="text-slate-200">{guestEmail}</span>.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs text-slate-400">Booking Reference</span>
              <span className="text-base font-bold font-mono text-amber-400 tracking-wider">
                {confirmedBooking.bookingReference}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Hotel Residence</span>
              <span className="text-slate-200 font-semibold">{confirmedBooking.hotelName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Suite</span>
              <span className="text-slate-200 font-semibold">{confirmedBooking.roomCategoryName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Stay Dates</span>
              <span className="text-slate-200 font-semibold">{checkIn} to {checkOut} ({priceBreakdown.nights} Nights)</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-3">
              <span className="text-slate-400">Total Charged (USD)</span>
              <span className="text-base font-bold font-serif-luxury text-white">${confirmedBooking.priceBreakdown.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              View Printable Official Invoice
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
            >
              Go to My Reservations
            </button>
          </div>
        </div>

        <InvoiceModal
          booking={confirmedBooking}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Hotel Details</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-semibold text-amber-400">Checkout & Payment</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span>Confirmation</span>
        </div>

        <h1 className="font-serif-luxury text-3xl font-bold text-white">Complete Your Reservation</h1>

        <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left 2 Cols: Guest Info & Payment Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Guest Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-serif-luxury text-lg font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" /> Primary Guest Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Arrival Time</label>
                  <select className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer">
                    <option>Standard Check-in (15:00 - 18:00)</option>
                    <option>Evening Arrival (18:00 - 21:00)</option>
                    <option>Late Night Arrival (After 21:00)</option>
                    <option>Early Arrival Request (Subject to room availability)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Special Preferences / Requests</label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. High floor preference, airport towncar pickup, feather-free bedding..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Payment Gateway Sandbox */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif-luxury text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Secure Payment Authorization
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 border border-amber-500/40 text-amber-300">
                  DEMO VERIFIED MODE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sandbox Environment Active</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Card details are validated against standard Luhn checks and test tokens. No real financial charge will occur. When live Stripe or Razorpay credentials are configured in <code className="text-amber-300">.env</code>, live orders will be initialized automatically.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    defaultValue={guestName}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Expiration (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">CVV / Security Code</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all font-sans disabled:opacity-50 mt-4"
              >
                {submitting ? 'Securing Suite & Verifying...' : `Authorize & Confirm Booking ($${priceBreakdown.total.toFixed(2)})`}
              </button>
            </div>

          </div>

          {/* Right Col: Booking Summary */}
          <div className="lg:col-span-1 space-y-4 sticky top-28">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              <h3 className="font-serif-luxury text-base font-bold text-white border-b border-slate-800 pb-3">
                Reservation Summary
              </h3>

              <div className="flex gap-3">
                <img
                  src={category.images[0] || hotel.images[0]}
                  alt={category.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div>
                  <h4 className="font-serif-luxury text-sm font-bold text-white leading-snug">{hotel.name}</h4>
                  <p className="text-xs text-amber-400 mt-0.5">{category.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{hotel.city}, {hotel.country}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Check-in:</span>
                  <span className="text-slate-200 font-semibold">{checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Check-out:</span>
                  <span className="text-slate-200 font-semibold">{checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guests & Duration:</span>
                  <span className="text-slate-200 font-semibold">{guests} Guests • {priceBreakdown.nights} Nights</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Room Charge</span>
                  <span>${priceBreakdown.roomSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxes (12%)</span>
                  <span>${priceBreakdown.taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Resort Fee</span>
                  <span>${priceBreakdown.serviceFee.toFixed(2)}</span>
                </div>
                {priceBreakdown.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Promo Discount ({promoCode})</span>
                    <span>-${priceBreakdown.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-3">
                  <span>Total Amount</span>
                  <span className="text-amber-400 font-serif-luxury">${priceBreakdown.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center leading-relaxed">
                By clicking Authorize & Confirm, you agree to HotelPro’s guest occupancy terms and hotel check-in policies.
              </div>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
