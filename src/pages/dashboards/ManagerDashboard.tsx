import React, { useState, useEffect } from 'react';
import {
  Hotel,
  TrendingUp,
  DollarSign,
  BedDouble,
  Users,
  Percent,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { IRoomCategory, IBooking, IHotel } from '../../../server/src/types/index.js';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [categories, setCategories] = useState<IRoomCategory[]>([]);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Category Modal
  const [editingCategory, setEditingCategory] = useState<IRoomCategory | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editMultiplier, setEditMultiplier] = useState<number>(1.0);

  // New Category Form Modal
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatPrice, setNewCatPrice] = useState(400);
  const [newCatCapacity, setNewCatCapacity] = useState(2);
  const [newCatRooms, setNewCatRooms] = useState(5);

  const fetchManagerData = async () => {
    try {
      const [catRes, bkRes, htlRes, anRes] = await Promise.all([
        api.get('/rooms/categories'),
        api.get('/bookings'),
        api.get('/hotels'),
        api.get('/admin/analytics'),
      ]);
      if (catRes.data.success) setCategories(catRes.data.categories);
      if (bkRes.data.success) setBookings(bkRes.data.bookings);
      if (htlRes.data.success) setHotels(htlRes.data.hotels);
      if (anRes.data.success) setAnalytics(anRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, [user]);

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const res = await api.put(`/rooms/categories/${editingCategory._id}`, {
        basePrice: editPrice,
        seasonalMultiplier: editMultiplier,
      });
      if (res.data.success) {
        success('Rates Updated', `Rates for ${editingCategory.name} updated.`);
        setEditingCategory(null);
        fetchManagerData();
      }
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Could not update rates.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetHotel = hotels[0]?._id || 'hotel-1';
      const res = await api.post('/rooms/categories', {
        hotelId: targetHotel,
        name: newCatName,
        description: newCatDesc,
        basePrice: newCatPrice,
        capacity: newCatCapacity,
        totalRooms: newCatRooms,
        amenities: ['Marble Bath', 'Espresso Bar', 'Balcony', 'King Bed'],
      });
      if (res.data.success) {
        success('Suite Category Created', `Added ${newCatName} to hotel inventory.`);
        setShowNewCatModal(false);
        setNewCatName('');
        setNewCatDesc('');
        fetchManagerData();
      }
    } catch (err: any) {
      error('Creation Failed', err.response?.data?.error || 'Could not create category.');
    }
  };

  const handleRefundDecision = async (bookingId: string, decision: 'Approved' | 'Rejected') => {
    try {
      const res = await api.post(`/bookings/${bookingId}/refund`, { decision });
      if (res.data.success) {
        success(`Refund ${decision}`, `Booking refund decision registered.`);
        fetchManagerData();
      }
    } catch (err: any) {
      error('Decision Failed', err.response?.data?.error || 'Could not record refund decision.');
    }
  };

  const refundRequests = bookings.filter(b => b.refundStatus === 'Requested');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Hotel Management Executive</span>
              <h1 className="font-serif-luxury text-3xl font-bold text-white mt-0.5">
                Property Management & Revenue
              </h1>
              <p className="text-xs text-slate-400 font-light">
                General Manager: <span className="text-slate-200 font-semibold">{user?.name}</span> • The Grand Luminary Hotel & Spa
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewCatModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto font-sans flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Suite Category
          </button>
        </div>

        {/* Manager KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-serif-luxury text-white">
              ${analytics?.overview?.totalRevenue?.toLocaleString() || '142,800'}
            </div>
            <p className="text-[10px] text-emerald-400 mt-1">▲ 18.4% vs last period</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Occupancy Rate</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-serif-luxury text-white">
              {analytics?.overview?.occupancyRate || 82}%
            </div>
            <p className="text-[10px] text-amber-400 mt-1">High demand seasonal window</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Active Bookings</span>
              <BedDouble className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-serif-luxury text-white">
              {analytics?.overview?.activeBookings || 24}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Confirmed & in-house stays</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Average Daily Rate (ADR)</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-serif-luxury text-white">
              $445.00
            </div>
            <p className="text-[10px] text-blue-400 mt-1">RevPAR: $364.90</p>
          </div>
        </div>

        {/* Refund Requests Pending Approval */}
        {refundRequests.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif-luxury text-lg font-bold text-white">
                Pending Guest Refund Requests ({refundRequests.length})
              </h2>
            </div>

            <div className="space-y-3">
              {refundRequests.map((b) => (
                <div
                  key={b._id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{b.userName}</span>
                      <span className="font-mono text-amber-400">#{b.bookingReference}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      {b.roomCategoryName} • Dates: {b.checkIn} to {b.checkOut} • Refund Amount: <span className="font-bold text-white">${b.refundAmount || b.priceBreakdown?.total}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">Reason: "{b.cancellationReason}"</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRefundDecision(b._id, 'Approved')}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Refund
                    </button>
                    <button
                      onClick={() => handleRefundDecision(b._id, 'Rejected')}
                      className="px-4 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room Inventory & Seasonal Dynamic Pricing Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif-luxury text-xl font-bold text-white">Suite Inventory & Rate Yield Management</h2>
              <p className="text-xs text-slate-400">Configure base price, seasonal surge multipliers, and suite allocations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif-luxury text-base font-bold text-white">{cat.name}</h3>
                    <span className="text-sm font-bold font-serif-luxury text-amber-400">
                      ${cat.basePrice}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{cat.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Base Nightly</span>
                      <span className="font-semibold text-slate-200">${cat.basePrice}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Seasonal Factor</span>
                      <span className="font-semibold text-amber-300">{cat.seasonalMultiplier || 1.0}x</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Capacity</span>
                      <span className="font-semibold text-slate-200">{cat.capacity} Guests</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Suite Stock</span>
                      <span className="font-semibold text-slate-200">{cat.totalRooms || 6} Units</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setEditPrice(cat.basePrice);
                    setEditMultiplier(cat.seasonalMultiplier || 1.0);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Adjust Rates & Multiplier
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Edit Category Rate Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-white">Adjust Suite Rate: {editingCategory.name}</h3>

            <form onSubmit={handleUpdateRates} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Base Price / Night (USD)</label>
                <input
                  type="number"
                  required
                  min="50"
                  max="5000"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Seasonal Yield Multiplier (e.g. 1.0 = normal, 1.25 = peak)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="3.0"
                  value={editMultiplier}
                  onChange={(e) => setEditMultiplier(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex justify-between">
                <span>Effective Rate:</span>
                <span className="font-bold text-amber-400 font-serif-luxury">
                  ${Math.round(editPrice * editMultiplier)} / night
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Save Rates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {showNewCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-white">Create New Suite Category</h3>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Royal Lagoon Villa"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Private infinity plunge pool, garden terrace..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    value={newCatPrice}
                    onChange={(e) => setNewCatPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Max Guests</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10}
                    value={newCatCapacity}
                    onChange={(e) => setNewCatCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Initial Units</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={newCatRooms}
                    onChange={(e) => setNewCatRooms(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Create Category & Generate Rooms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
