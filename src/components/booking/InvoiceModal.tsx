import React from 'react';
import { X, Printer, Crown, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { IBooking } from '../../../server/src/types/index.js';

interface InvoiceModalProps {
  booking: IBooking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, isOpen, onClose }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const pb = booking.priceBreakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="font-serif-luxury font-bold text-sm tracking-wider">HOTELPRO OFFICIAL INVOICE</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div id="printable-invoice" className="p-8 sm:p-10 overflow-y-auto bg-white flex-1 font-sans">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-600" />
                <h2 className="font-serif-luxury text-2xl font-bold tracking-wider text-slate-900">HOTEL<span className="text-amber-600">PRO</span></h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Luxury Hospitality Reservation Services</p>
              <p className="text-xs text-slate-500">Concierge Desk: +1 (800) 555-LUXE</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider mb-2">
                {booking.paymentStatus === 'Paid' ? 'PAID & CONFIRMED' : booking.paymentStatus}
              </span>
              <p className="text-xs font-semibold text-slate-800">Invoice: #{booking.bookingReference}</p>
              <p className="text-xs text-slate-500">Date: {new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Hotel & Guest Information */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">PROPERTY DETAILS</p>
              <p className="text-sm font-bold text-slate-900">{booking.hotelName}</p>
              <p className="text-slate-600 mt-0.5">Assigned Room: {booking.roomNumber || 'Pre-Allocated'}</p>
              <p className="text-slate-600">Category: {booking.roomCategoryName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">BILLED TO GUEST</p>
              <p className="text-sm font-bold text-slate-900">{booking.userName}</p>
              <p className="text-slate-600 mt-0.5">Email: {booking.userEmail}</p>
              <p className="text-slate-600">Phone: {booking.userPhone || 'N/A'}</p>
            </div>
          </div>

          {/* Stay Dates Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">CHECK-IN</span>
              <span className="text-xs font-semibold text-slate-800">{booking.checkIn} (From 15:00)</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">CHECK-OUT</span>
              <span className="text-xs font-semibold text-slate-800">{booking.checkOut} (Until 11:00)</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">DURATION</span>
              <span className="text-xs font-semibold text-slate-800">{pb?.nights || 1} Nights / {booking.guests} Guests</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-center">Rate / Night</th>
                  <th className="py-2.5 px-4 text-center">Nights</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {booking.roomCategoryName} Accommodation
                    <span className="block text-[10px] text-slate-500">Includes complimentary Wi-Fi & spa access</span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">${pb?.baseRatePerNight.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center text-slate-600">{pb?.nights}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">${pb?.roomSubtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2.5 px-4 text-slate-600">State & Municipal Hospitality Tax (12%)</td>
                  <td className="py-2.5 px-4 text-right text-slate-700">${pb?.taxes.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2.5 px-4 text-slate-600">Resort & Concierge Wellness Amenities Fee</td>
                  <td className="py-2.5 px-4 text-right text-slate-700">${pb?.serviceFee.toFixed(2)}</td>
                </tr>
                {(pb?.discount || 0) > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/50">
                    <td colSpan={3} className="py-2.5 px-4 font-semibold">Promotional Voucher Discount</td>
                    <td className="py-2.5 px-4 text-right font-semibold">-${pb?.discount.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-sm text-slate-900">
                  <td colSpan={3} className="py-3.5 px-4">Total Paid (USD)</td>
                  <td className="py-3.5 px-4 text-right text-amber-700 text-base font-serif-luxury">${pb?.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment & Verification footer */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-slate-800">Verified Payment Transaction</p>
                <p className="text-[11px] text-slate-400">Payment Method: {booking.paymentMethod || 'Authorized Card'} • Reference: #{booking.bookingReference}</p>
              </div>
            </div>
            <div className="text-right text-[11px]">
              <p className="font-semibold text-slate-700">Thank you for choosing HotelPro.</p>
              <p className="text-slate-400">Please present this receipt upon arrival at front desk.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
