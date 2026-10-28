import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Brush,
  Coffee,
  Check,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { IBooking, IHousekeepingTask, IServiceRequest, IRoom } from '../../../server/src/types/index.js';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [tasks, setTasks] = useState<IHousekeepingTask[]>([]);
  const [services, setServices] = useState<IServiceRequest[]>([]);
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab filter: 'arrivals' | 'departures' | 'housekeeping' | 'services' | 'rooms'
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'housekeeping' | 'services' | 'rooms'>('arrivals');

  const fetchStaffData = async () => {
    try {
      const [bkRes, hkRes, srvRes, rmRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/housekeeping'),
        api.get('/services'),
        api.get('/rooms'),
      ]);
      if (bkRes.data.success) setBookings(bkRes.data.bookings);
      if (hkRes.data.success) setTasks(bkRes.data.success ? hkRes.data.tasks : []);
      if (srvRes.data.success) setServices(srvRes.data.services);
      if (rmRes.data.success) setRooms(rmRes.data.rooms);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [user]);

  // Handle Guest Check-in
  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await api.post('/check-in', { bookingId });
      if (res.data.success) {
        success('Check-in Complete', `Guest ${res.data.booking.userName} checked into Room ${res.data.booking.roomNumber}.`);
        fetchStaffData();
      }
    } catch (err: any) {
      error('Check-in Failed', err.response?.data?.error || 'Unable to check in guest.');
    }
  };

  // Handle Guest Check-out (triggers housekeeping task automatically!)
  const handleCheckOut = async (bookingId: string) => {
    try {
      const res = await api.post('/check-out', { bookingId });
      if (res.data.success) {
        success('Check-out Recorded', `Guest departure processed. Room has been queued for Housekeeping.`);
        fetchStaffData();
      }
    } catch (err: any) {
      error('Check-out Failed', err.response?.data?.error || 'Unable to check out guest.');
    }
  };

  // Update Housekeeping Task Status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await api.put(`/housekeeping/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        success('Task Updated', `Housekeeping status set to ${newStatus}.`);
        fetchStaffData();
      }
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Unable to update task.');
    }
  };

  // Update Service Request Status
  const handleUpdateServiceStatus = async (serviceId: string, newStatus: string) => {
    try {
      const res = await api.put(`/services/${serviceId}/status`, { status: newStatus });
      if (res.data.success) {
        success('Service Updated', `Request marked as ${newStatus}.`);
        fetchStaffData();
      }
    } catch (err: any) {
      error('Update Failed', err.response?.data?.error || 'Unable to update service.');
    }
  };

  // Update Room Operational Status
  const handleUpdateRoomStatus = async (roomId: string, newStatus: string) => {
    try {
      const res = await api.put(`/rooms/${roomId}/status`, { operationalStatus: newStatus });
      if (res.data.success) {
        success('Room Status Changed', `Room status set to ${newStatus}.`);
        fetchStaffData();
      }
    } catch (err: any) {
      error('Status Change Denied', err.response?.data?.error || 'Invalid transition.');
    }
  };

  const pendingArrivals = bookings.filter(b => b.bookingStatus === 'Confirmed');
  const activeOccupants = bookings.filter(b => b.bookingStatus === 'Checked-In');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Front Desk & Operations Desk</span>
              <h1 className="font-serif-luxury text-3xl font-bold text-white mt-0.5">
                Staff Operations Portal
              </h1>
              <p className="text-xs text-slate-400 font-light">
                Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> • Property: The Grand Luminary Hotel & Spa
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Arrivals</span>
              <span className="text-sm font-bold text-amber-400">{pendingArrivals.length}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">In-House</span>
              <span className="text-sm font-bold text-purple-400">{activeOccupants.length}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Cleaning</span>
              <span className="text-sm font-bold text-amber-400">{tasks.filter(t => t.status !== 'Completed').length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('arrivals')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'arrivals' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Arrivals Check-In ({pendingArrivals.length})
          </button>

          <button
            onClick={() => setActiveTab('departures')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'departures' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Active Stays & Check-Out ({activeOccupants.length})
          </button>

          <button
            onClick={() => setActiveTab('housekeeping')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'housekeeping' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Brush className="w-4 h-4" />
            Housekeeping Tasks ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'services' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" />
            Guest Service Requests ({services.length})
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'rooms' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Room Inventory Status ({rooms.length})
          </button>
        </div>

        {/* Tab 1: Arrivals Check-in */}
        {activeTab === 'arrivals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif-luxury text-lg font-bold text-white">Pending Guest Arrivals</h2>
              <span className="text-xs text-slate-400">Validate reservation, check government ID, and issue keycard</span>
            </div>

            {pendingArrivals.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
                No pending arrivals for today. All guests checked in.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingArrivals.map((b) => (
                  <div
                    key={b._id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{b.userName}</span>
                        <span className="font-mono text-amber-400 text-xs font-semibold">#{b.bookingReference}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          {b.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {b.roomCategoryName} • Assigned: <span className="text-white font-semibold">Room {b.roomNumber || 'Pre-allocated'}</span> • {b.guests} Guests
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dates: {b.checkIn} to {b.checkOut} • Contact: {b.userPhone || b.userEmail}
                      </p>
                      {b.specialRequests && (
                        <p className="text-[11px] text-amber-300/90 mt-1 italic">
                          Special Request: "{b.specialRequests}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleCheckIn(b._id)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 font-sans"
                    >
                      Check-In Guest & Issue Keys
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Departures Check-out */}
        {activeTab === 'departures' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif-luxury text-lg font-bold text-white">Currently In-House Occupants</h2>
              <span className="text-xs text-slate-400">Process checkout and automatically generate turnover cleaning task</span>
            </div>

            {activeOccupants.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
                No active in-house guests at this moment.
              </div>
            ) : (
              <div className="space-y-3">
                {activeOccupants.map((b) => (
                  <div
                    key={b._id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{b.userName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                          Room {b.roomNumber}
                        </span>
                        <span className="font-mono text-slate-400 text-xs">#{b.bookingReference}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {b.roomCategoryName} • Scheduled Departure: <span className="text-white font-semibold">{b.checkOut}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Checked in at: {b.checkInTimestamp ? new Date(b.checkInTimestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCheckOut(b._id)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:border-rose-500/40 border border-slate-700 text-white hover:text-rose-200 font-bold text-xs transition-all shrink-0 font-sans"
                    >
                      Process Check-Out & Queue Cleaning
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Housekeeping Tasks */}
        {activeTab === 'housekeeping' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif-luxury text-lg font-bold text-white">Housekeeping Workflow Board</h2>
              <span className="text-xs text-slate-400">Completing task automatically returns room to Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div key={task._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-base font-bold text-white font-serif-luxury">
                        Room {task.roomNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        task.status === 'Completed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : task.status === 'In-Progress'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : task.status === 'Inspected'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-amber-400 mt-1">{task.taskType}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{task.notes}</p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Priority: <span className="font-semibold text-slate-300">{task.priority}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex gap-2">
                    {task.status === 'Pending' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task._id, 'In-Progress')}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        Start Cleaning
                      </button>
                    )}
                    {task.status === 'In-Progress' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task._id, 'Inspected')}
                        className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-xs"
                      >
                        Pass Inspection
                      </button>
                    )}
                    {(task.status === 'In-Progress' || task.status === 'Inspected') && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task._id, 'Completed')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                      >
                        Complete & Release Room
                      </button>
                    )}
                    {task.status === 'Completed' && (
                      <span className="text-[11px] text-emerald-400 font-medium py-1">Room Ready for Next Guest</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Service Requests */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <h2 className="font-serif-luxury text-lg font-bold text-white">Active Guest Service Tickets</h2>
            <div className="space-y-3">
              {services.map((srv) => (
                <div key={srv._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{srv.serviceType}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-semibold text-[10px]">
                        Room {srv.roomNumber} ({srv.guestName})
                      </span>
                    </div>
                    {srv.notes && <p className="text-slate-400 mt-1">{srv.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {srv.status !== 'Completed' ? (
                      <button
                        onClick={() => handleUpdateServiceStatus(srv._id, 'Completed')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                      >
                        Fulfill & Complete
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px]">
                        Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Room Status State Machine */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif-luxury text-lg font-bold text-white">Room Operational Status</h2>
              <span className="text-xs text-slate-400">Governed by state transition validations</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <div key={room._id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-serif-luxury text-lg font-bold text-white">Room {room.roomNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      room.operationalStatus === 'Available'
                        ? 'bg-emerald-950 text-emerald-300'
                        : room.operationalStatus === 'Occupied'
                        ? 'bg-blue-950 text-blue-300'
                        : room.operationalStatus === 'Cleaning'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-rose-950 text-rose-300'
                    }`}>
                      {room.operationalStatus}
                    </span>
                  </div>

                  {room.notes && <p className="text-[11px] text-slate-400 truncate">{room.notes}</p>}

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Change Status</label>
                    <select
                      value={room.operationalStatus}
                      onChange={(e) => handleUpdateRoomStatus(room._id, e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
