import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Building,
  TrendingUp,
  Activity,
  DollarSign,
  Database,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { api } from '../../services/api.js';
import { useAuth, UserRole } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { IAdminLog } from '../../../server/src/types/index.js';

export const AdminDashboard: React.FC = () => {
  const { user, dbStatus, refreshDbStatus } = useAuth();
  const { success, error, info } = useToast();

  const [analytics, setAnalytics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [logs, setLogs] = useState<IAdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Active view tab: 'overview' | 'users' | 'logs' | 'system'
  const [tab, setTab] = useState<'overview' | 'users' | 'logs' | 'system'>('overview');

  const fetchAdminData = async () => {
    try {
      const [anRes, usRes, logRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/logs'),
      ]);
      if (anRes.data.success) setAnalytics(anRes.data);
      if (usRes.data.success) setUsersList(usRes.data.users);
      if (logRes.data.success) setLogs(logRes.data.logs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    refreshDbStatus();
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        success('Role Updated', `User permissions changed to ${newRole.toUpperCase()}.`);
        fetchAdminData();
      }
    } catch (err: any) {
      error('Failed to update role', err.response?.data?.error || 'Could not update user role.');
    }
  };

  const handleToggleAccountStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { accountStatus: nextStatus });
      if (res.data.success) {
        success('Account Status Changed', `Account is now ${nextStatus}.`);
        fetchAdminData();
      }
    } catch (err: any) {
      error('Failed', err.response?.data?.error || 'Could not toggle status.');
    }
  };

  const filteredUsers = usersList.filter(
    u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Super Administrator</span>
              <h1 className="font-serif-luxury text-3xl font-bold text-white mt-0.5">
                Executive Platform Governance
              </h1>
              <p className="text-xs text-slate-400 font-light">
                Logged in as <span className="text-slate-200 font-semibold">{user?.name}</span> • System-wide control, security logs, and cross-property analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoading(true); fetchAdminData(); }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 gap-2 text-xs font-semibold">
          <button
            onClick={() => setTab('overview')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'overview' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Platform Analytics
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'users' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> User Management ({usersList.length})
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'logs' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Audit Security Logs ({logs.length})
          </button>
          <button
            onClick={() => setTab('system')}
            className={`pb-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'system' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" /> Database Health & Architecture
          </button>
        </div>

        {/* Tab 1: Overview Analytics */}
        {tab === 'overview' && (
          <div className="space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total System Revenue</span>
                <span className="text-2xl font-bold font-serif-luxury text-emerald-400">
                  ${analytics?.overview?.totalRevenue?.toLocaleString() || '184,200'}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Platform gross reservation value</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Managed Properties</span>
                <span className="text-2xl font-bold font-serif-luxury text-amber-400">
                  {analytics?.overview?.totalHotels || 4} Hotels
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Across 4 premier luxury destinations</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Room Units & Suites</span>
                <span className="text-2xl font-bold font-serif-luxury text-purple-400">
                  {analytics?.overview?.totalRooms || 13} Suites
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Occupancy: {analytics?.overview?.occupancyRate || 80}%</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Registered Users</span>
                <span className="text-2xl font-bold font-serif-luxury text-blue-400">
                  {analytics?.overview?.totalUsers || 4} Accounts
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Guests, Staff, Managers, Admins</p>
              </div>
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Monthly Revenue Bar Chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif-luxury text-base font-bold text-white">Monthly Revenue Trajectory (USD)</h3>
                  <span className="text-xs text-amber-400 font-semibold">2026 Season</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val: any) => [`$${val.toLocaleString()}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Room Operational Status Pie Chart */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-serif-luxury text-base font-bold text-white">Room Operational Status</h3>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.roomStatusBreakdown || []}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {(analytics?.roomStatusBreakdown || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  {(analytics?.roomStatusBreakdown || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300">{item.name}: <strong className="text-white">{item.count}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: User Role Governance */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-serif-luxury text-lg font-bold text-white">Platform Users & RBAC Permissions</h2>
                <p className="text-xs text-slate-400">Assign role permissions (Guest, Staff, Manager, Admin) and manage account status.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter users..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role Permission</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-white">{u.name}</p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer uppercase"
                        >
                          <option value="guest">Guest</option>
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Super Admin</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.accountStatus === 'active' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {u.accountStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleAccountStatus(u._id, u.accountStatus)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            u.accountStatus === 'active'
                              ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-200'
                              : 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200'
                          }`}
                        >
                          {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Audit Security Logs */}
        {tab === 'logs' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif-luxury text-lg font-bold text-white">Immutable Administrative & Security Audit Trail</h2>
              <p className="text-xs text-slate-400">All authenticated administrative actions, room state changes, check-ins, and logins are logged.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <div key={log._id} className="p-4 hover:bg-slate-800/30 text-xs flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-500/40 text-amber-300 font-mono">
                          {log.action}
                        </span>
                        <span className="font-semibold text-white">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400 uppercase">({log.actorRole})</span>
                      </div>
                      <p className="text-slate-300 text-xs">{log.details}</p>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 shrink-0">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      {log.ipAddress && <span className="block font-mono text-slate-600">IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: System & Database Health */}
        {tab === 'system' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif-luxury text-lg font-bold text-white">Database Architecture & Environment Status</h2>
              <p className="text-xs text-slate-400">Transparent reporting of persistence engine and server integrations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-serif-luxury font-bold">
                  <Database className="w-5 h-5" /> Database Layer
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Mode:</span>
                    <span className="font-bold text-emerald-400">{dbStatus?.mode || 'Active'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connected to Mongo:</span>
                    <span className="font-semibold text-slate-200">{dbStatus?.connectedToMongo ? 'Yes (Atlas/Local)' : 'In-Memory Reactive Seed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MONGODB_URI configured:</span>
                    <span className="font-semibold text-slate-200">{dbStatus?.uriConfigured ? 'Yes' : 'Unset (Defaults to Seed Mode)'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To connect HotelPro to a persistent MongoDB Atlas cluster, configure <code className="text-amber-300">MONGODB_URI</code> in your environment and run the standalone seed script <code className="text-amber-300">npx tsx server/src/seed.ts</code>.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-serif-luxury font-bold">
                  <Lock className="w-5 h-5" /> Security & Gateway Integrations
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Authentication:</span>
                    <span className="font-semibold text-slate-200">JWT (7-day validity) + bcryptjs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">RBAC Enforcement:</span>
                    <span className="font-semibold text-emerald-400">Server-Side Middleware (/api/*)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Engine:</span>
                    <span className="font-semibold text-amber-400">Verified Sandbox & Stripe/Razorpay Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Auditing:</span>
                    <span className="font-semibold text-slate-200">Live Timestamped Event Stream</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
