import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Crown,
  Bell,
  User as UserIcon,
  LogOut,
  Sparkles,
  ShieldAlert,
  Hotel,
  CalendarCheck,
  ChevronDown,
  Layers,
  Check,
  Menu,
  X,
  Database,
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, logout, switchDemoUser, dbStatus } = useAuth();
  const { info, success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleRoleSwitch = async (role: UserRole) => {
    setRoleDropdownOpen(false);
    await switchDemoUser(role);
    success(`Switched persona to ${role.toUpperCase()}`, `Logged in as demo ${role}`);
    if (role === 'guest') navigate('/dashboard');
    else if (role === 'staff') navigate('/staff');
    else if (role === 'manager') navigate('/manager');
    else if (role === 'admin') navigate('/admin');
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-luxury text-2xl font-bold tracking-wider text-white">HOTEL<span className="text-amber-400">PRO</span></span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 -mt-1 font-medium">Grand Hospitality</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-amber-300 ${
              location.pathname === '/' ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            Destinations
          </Link>
          <Link
            to="/search"
            className={`text-sm font-medium transition-colors hover:text-amber-300 ${
              location.pathname.startsWith('/search') ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            Explore Hotels
          </Link>

          {user && (
            <>
              {user.role === 'guest' && (
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-amber-300 ${
                    location.pathname === '/dashboard' ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  My Stays
                </Link>
              )}
              {user.role === 'staff' && (
                <Link
                  to="/staff"
                  className={`text-sm font-medium transition-colors hover:text-amber-300 flex items-center gap-1.5 ${
                    location.pathname === '/staff' ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 text-amber-400" />
                  Staff Operations
                </Link>
              )}
              {user.role === 'manager' && (
                <Link
                  to="/manager"
                  className={`text-sm font-medium transition-colors hover:text-amber-300 flex items-center gap-1.5 ${
                    location.pathname === '/manager' ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  <Hotel className="w-4 h-4 text-amber-400" />
                  Hotel Management
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors hover:text-amber-300 flex items-center gap-1.5 ${
                    location.pathname === '/admin' ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Super Admin
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3">
          
          {/* Quick Demo Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 transition-colors shadow-sm"
              aria-label="Switch demo role persona"
              title="Quickly switch between all 4 test roles"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Role:</span>
              <span className="font-semibold uppercase tracking-wider text-white">
                {user ? user.role : 'Guest Mode'}
              </span>
              <ChevronDown className="w-3 h-3 text-amber-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Persona
                </div>
                {(['guest', 'staff', 'manager', 'admin'] as UserRole[]).map((r) => {
                  const isActive = user?.role === r;
                  const labelMap: Record<UserRole, { title: string; desc: string }> = {
                    guest: { title: 'Guest (Alexander)', desc: 'Bookings, invoices, guest requests' },
                    staff: { title: 'Staff (Elena)', desc: 'Check-in, checkout, housekeeping' },
                    manager: { title: 'Manager (Marcus)', desc: 'Rates, inventory, staff assignments' },
                    admin: { title: 'Super Admin (Sophia)', desc: 'Platform analytics, users & audit logs' },
                  };
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-start justify-between transition-colors ${
                        isActive ? 'bg-amber-950/30 text-amber-300 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{labelMap[r].title}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-amber-400 inline" />}
                        </div>
                        <p className="text-[10px] text-slate-400">{labelMap[r].desc}</p>
                      </div>
                    </button>
                  );
                })}
                <div className="px-3 pt-2 mt-1 border-t border-slate-800 text-[10px] text-amber-400/90 flex items-center gap-1">
                  <Database className="w-3 h-3 shrink-0" />
                  <span>{dbStatus?.mode || 'REST API Active'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown (When Logged In) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Notifications ({notifications.length})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-amber-400 hover:text-amber-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div key={n._id} className={`p-3 text-xs ${n.isRead ? 'opacity-70' : 'bg-slate-800/40'}`}>
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          <p className="text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400/40"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-slate-200 leading-tight">{user.name}</p>
                  <p className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                aria-label="Logout"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all font-sans"
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-amber-400"
          >
            Destinations
          </Link>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-amber-400"
          >
            Explore Hotels
          </Link>
          {user && (
            <>
              {user.role === 'guest' && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-slate-300 hover:text-amber-400"
                >
                  My Stays
                </Link>
              )}
              {user.role === 'staff' && (
                <Link
                  to="/staff"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-amber-400"
                >
                  Staff Operations
                </Link>
              )}
              {user.role === 'manager' && (
                <Link
                  to="/manager"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-amber-400"
                >
                  Hotel Management
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm text-amber-400"
                >
                  Super Admin
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
};
