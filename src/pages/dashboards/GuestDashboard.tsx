import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Bell,
  Coffee,
  Plus,
  Building,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { InvoiceModal } from '../../components/booking/InvoiceModal.js';
import { IBooking, IServiceRequest } from '../../../server/src/types/index.js';

export const GuestDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [services, setServices] = useState<IServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<IBooking | null>(null);

  // Service Request Modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServiceBooking, setSelectedServiceBooking] = useState<IBooking | null>(null);
  const [serviceType, setServiceType] = useState<'Room Cleaning' | 'Extra Towels/Linens' | 'Wake-up Call' | 'Room Service Dining'>('Extra Towels/Linens');
  const [serviceNotes, setServiceNotes] = useState('');
  const [submittingService, setSubmittingService] = useState(false);

  const fetchGuestData = async () => {
    try {
      const [bkRes, srvRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/services'),
      ]);
      if (bkRes.data.success) setBookings(bkRes.data.bookings);
      if (srvRes.data.success) setServices(srvRes.data.services);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuestData();
  }, [user]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you wish to cancel this reservation? Refund will be initiated per hotel policy.')) {
      return;
    }

    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`, {
        reason: 'Guest requested cancellation through dashboard',
      });
      if (res.data.success) {
        success('Reservation Cancelled', 'Refund request has been submitted to hotel manager.');
        fetchGuestData();
      }
    } catch (err: any) {
      error('Cancellation Failed', err.response?.data?.error || 'Could not cancel booking.');
    }
  };

  const handleCreateServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceBooking) return;

    setSubmittingService(true);
    try {
      const res = await api.post('/services', {
        hotelId: selectedServiceBooking.hotelId,
        roomId: selectedServiceBooking.roomId || 'room-102',
        roomNumber: selectedServiceBooking.roomNumber || '102',
        serviceType,
        notes: serviceNotes,
        priority: 'Normal',
      });
      if (res.data.success) {
        success('Concierge Request Sent', 'Our hotel team has been notified.');
        setShowServiceModal(false);
        setServiceNotes('');
        fetchGuestData();
      }
    } catch (err: any) {
      error('Request Failed', err.response?.data?.error || 'Could not submit request.');
    } finally {
      setSubmittingService(false);
    }
  };

  const upcomingStays = bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked-In');
  const pastStays = bookings.filter(b => b.bookingStatus === 'Checked-Out' || b.bookingStatus === 'Cancelled');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Guest Portal</span>
              <h1 className="font-serif-luxury text-3xl font-bold text-white mt-0.5">
                Welcome, {user?.name}
              </h1>
              <p className="text-xs text-slate-400 font-light">
                Manage your confirmed reservations, concierge service requests, and printable receipts.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/search')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto font-sans"
          >
            Book New Stay
          </button>
        </div>

        {/* Active & Upcoming Stays */}
        <div className="space-y-4">
          <h2 className="font-serif-luxury text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Active & Upcoming Reservations ({upcomingStays.length})
          </h2>

          {loading ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse text-center text-xs text-slate-500">
              Loading your reservations...
            </div>
          ) : upcomingStays.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <Building className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-serif-luxury text-base font-bold text-white">No Upcoming Reservations</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ready to escape to an oceanfront retreat or mountain summit? Explore our luxury hotel portfolio.
              </p>
              <button
                onClick={() => navigate('/search')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Explore Destinations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingStays.map((b) => (
                <div
                  key={b._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                        #{b.bookingReference}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.bookingStatus === 'Checked-In'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </div>

                    <h3 className="font-serif-luxury text-lg font-bold text-white">{b.hotelName}</h3>
                    <p className="text-xs text-amber-300/90 font-medium mt-0.5">{b.roomCategoryName}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      <span className="font-semibold text-slate-300">Stay Dates:</span> {b.checkIn} to {b.checkOut} ({b.priceBreakdown?.nights} Nights)
                    </p>
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Assigned Suite:</span> Room {b.roomNumber || 'Ready upon arrival'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedInvoiceBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        Invoice
                      </button>

                      <button
                        onClick={() => { setSelectedServiceBooking(b); setShowServiceModal(true); }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-colors flex items-center gap-1.5"
                      >
                        <Coffee className="w-3.5 h-3.5" />
                        Request Concierge
                      </button>
                    </div>

                    {b.bookingStatus === 'Confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-semibold"
                      >
                        Cancel Stay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Concierge Service Requests */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="font-serif-luxury text-lg font-bold text-white flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-400" /> My In-Stay Concierge Service Requests
          </h2>

          {services.length === 0 ? (
            <p className="text-xs text-slate-500">No active service requests. You can request dining, linens, or cleaning during your stay above.</p>
          ) : (
            <div className="space-y-3">
              {services.map((srv) => (
                <div key={srv._id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{srv.serviceType}</span>
                      <span className="text-[10px] text-slate-400">(Room {srv.roomNumber})</span>
                    </div>
                    {srv.notes && <p className="text-slate-400 text-[11px] mt-0.5">{srv.notes}</p>}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    srv.status === 'Completed'
                      ? 'bg-emerald-950 text-emerald-300'
                      : srv.status === 'In-Progress'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {srv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Stays & Invoices */}
        <div className="space-y-4">
          <h2 className="font-serif-luxury text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Past Reservations & Receipts ({pastStays.length})
          </h2>

          {pastStays.length === 0 ? (
            <p className="text-xs text-slate-500">No previous stay history recorded.</p>
          ) : (
            <div className="space-y-3">
              {pastStays.map((b) => (
                <div
                  key={b._id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-serif-luxury">{b.hotelName}</span>
                      <span className="font-mono text-amber-400 text-[11px]">#{b.bookingReference}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      {b.roomCategoryName} • {b.checkIn} to {b.checkOut} • Total: ${b.priceBreakdown?.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.bookingStatus === 'Cancelled' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {b.bookingStatus}
                    </span>
                    <button
                      onClick={() => setSelectedInvoiceBooking(b)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Service Request Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-white">Request Concierge / Service</h3>
            <p className="text-xs text-slate-400">
              For stay at {selectedServiceBooking?.hotelName} (Room {selectedServiceBooking?.roomNumber || 'Assigned'})
            </p>

            <form onSubmit={handleCreateServiceRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e: any) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Extra Towels/Linens">Extra Towels & Fresh Bedding</option>
                  <option value="Room Cleaning">Express Daily Room Cleaning</option>
                  <option value="Room Service Dining">Room Service Dining & Ice</option>
                  <option value="Wake-up Call">Personal Concierge Wake-up Call</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Instructions</label>
                <textarea
                  rows={3}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="e.g. Please bring extra mineral water and extra bath sheets..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingService}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {submittingService ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        booking={selectedInvoiceBooking}
        isOpen={Boolean(selectedInvoiceBooking)}
        onClose={() => setSelectedInvoiceBooking(null)}
      />
    </div>
  );
};
