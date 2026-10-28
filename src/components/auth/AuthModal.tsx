import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register, switchDemoUser } = useAuth();
  const { success, error } = useToast();

  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    if (tab === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        success('Welcome back', 'You have successfully signed in.');
        onClose();
      } else {
        setFormError(res.error || 'Failed to sign in.');
      }
    } else {
      const res = await register(name, email, password, phone);
      setLoading(false);
      if (res.success) {
        success('Account created', 'Welcome to HotelPro luxury hospitality.');
        onClose();
      } else {
        setFormError(res.error || 'Failed to create account.');
      }
    }
  };

  const handleDemoFill = async (role: 'guest' | 'staff' | 'manager' | 'admin') => {
    await switchDemoUser(role);
    success(`Signed in as Demo ${role.toUpperCase()}`, 'Welcome to HotelPro.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="font-serif-luxury text-2xl font-bold text-white tracking-wide">
            {tab === 'login' ? 'Sign In to HotelPro' : 'Create Guest Account'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'login'
              ? 'Access your private reservations, concierge services, and invoices'
              : 'Join to reserve curated rooms and enjoy personalized hospitality'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('login'); setFormError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setFormError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alexander Wright"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. guest@hotelpro.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all font-sans disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Fast Login Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] text-center font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Demo Persona Sign In
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoFill('guest')}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <span className="block text-[11px] font-semibold text-amber-300">Guest</span>
              <span className="block text-[9px] text-slate-400 truncate">Alexander Wright</span>
            </button>
            <button
              onClick={() => handleDemoFill('staff')}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <span className="block text-[11px] font-semibold text-amber-300">Hotel Staff</span>
              <span className="block text-[9px] text-slate-400 truncate">Elena Rostova</span>
            </button>
            <button
              onClick={() => handleDemoFill('manager')}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <span className="block text-[11px] font-semibold text-amber-300">Hotel Manager</span>
              <span className="block text-[9px] text-slate-400 truncate">Marcus Sterling</span>
            </button>
            <button
              onClick={() => handleDemoFill('admin')}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
            >
              <span className="block text-[11px] font-semibold text-amber-300">Super Admin</span>
              <span className="block text-[9px] text-slate-400 truncate">Sophia Chen</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
