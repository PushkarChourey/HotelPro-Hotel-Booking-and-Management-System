import React from 'react';
import { Crown, ShieldCheck, CreditCard, Sparkles, Phone, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const Footer: React.FC = () => {
  const { dbStatus } = useAuth();

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-300 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <span className="font-serif-luxury text-xl font-bold tracking-wider text-white">HOTEL<span className="text-amber-400">PRO</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The premier luxury hospitality reservation and property management enterprise. Built for guests seeking sanctuary and hoteliers delivering operational excellence.
            </p>
            <div className="pt-2 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Role-Based Security
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                Stripe & Razorpay Ready
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                MERN Stack Architecture
              </span>
            </div>
          </div>

          {/* Luxury Destinations */}
          <div>
            <h4 className="font-serif-luxury text-white text-xs font-semibold uppercase tracking-widest mb-4">Destinations</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="/search?destination=Miami" className="hover:text-amber-300 transition-colors">Miami Beach Oceanfront</a></li>
              <li><a href="/search?destination=Aspen" className="hover:text-amber-300 transition-colors">Aspen Summit Chalets</a></li>
              <li><a href="/search?destination=New+York" className="hover:text-amber-300 transition-colors">New York Central Park</a></li>
              <li><a href="/search?destination=Kyoto" className="hover:text-amber-300 transition-colors">Kyoto Arashiyama Sanctuary</a></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-serif-luxury text-white text-xs font-semibold uppercase tracking-widest mb-4">Enterprise Portals</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="/dashboard" className="hover:text-amber-300 transition-colors">Guest Concierge & Stays</a></li>
              <li><a href="/staff" className="hover:text-amber-300 transition-colors">Staff Check-in & Housekeeping</a></li>
              <li><a href="/manager" className="hover:text-amber-300 transition-colors">Manager Revenue & Inventory</a></li>
              <li><a href="/admin" className="hover:text-amber-300 transition-colors">Super Admin & Audit Logs</a></li>
            </ul>
          </div>

          {/* Contact & Status */}
          <div>
            <h4 className="font-serif-luxury text-white text-xs font-semibold uppercase tracking-widest mb-4">Concierge Desk</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+1 (800) 555-LUXE</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>concierge@hotelpro.com</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>One Grand Plaza, New York, NY</span>
              </li>
            </ul>
            <div className="mt-4 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
              <span className="text-slate-400 block font-medium">Database Connection:</span>
              <span className="text-emerald-400 font-semibold">{dbStatus?.mode || 'Active'}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 HotelPro Inc. Academic Portfolio Project. Designed with React, Node.js, Express, and MongoDB.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300">Privacy Policy</span>
            <span className="hover:text-slate-300">Booking Terms</span>
            <span className="hover:text-slate-300">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
