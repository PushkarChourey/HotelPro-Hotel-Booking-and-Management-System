import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Star,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Coffee,
  Waves,
  HeartHandshake,
  Check,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { IHotel } from '../../server/src/types/index.js';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { info, success } = useToast();

  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [featuredHotels, setFeaturedHotels] = useState<IHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPromo, setCopiedPromo] = useState(false);

  useEffect(() => {
    // Set default dates: check-in 2 days from today, check-out 5 days from today
    const d1 = new Date();
    d1.setDate(d1.getDate() + 2);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 5);

    setCheckIn(d1.toISOString().split('T')[0]);
    setCheckOut(d2.toISOString().split('T')[0]);

    const fetchHotels = async () => {
      try {
        const res = await api.get('/hotels?featured=true');
        if (res.data.success) {
          setFeaturedHotels(res.data.hotels);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('destination', destination.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);

    navigate(`/search?${params.toString()}`);
  };

  const copyPromo = () => {
    navigator.clipboard.writeText('WELCOME10');
    setCopiedPromo(true);
    success('Coupon Copied!', 'Use WELCOME10 at checkout for 10% off your booking.');
    setTimeout(() => setCopiedPromo(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Hero Section with High-End Hospitality Ambience */}
      <section className="relative min-h-[640px] flex items-center justify-center pt-8 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80"
            alt="Luxury Resort Horizon"
            className="w-full h-full object-cover object-center filter brightness-[0.38] scale-105 transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Curated Luxury Sanctuaries & Resorts
          </div>

          <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Where Exceptional Living Meets <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
              Timeless Hospitality
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-light">
            Indulge in private coastline retreats, snow-dusted alpine chalets, and metropolitan penthouses. Experience five-star concierge, Michelin dining, and effortless reservations.
          </p>

          {/* Luxury Search Engine Bar */}
          <div className="pt-4 max-w-4xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left"
            >
              {/* Destination */}
              <div className="p-2 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-amber-400" /> Destination / Hotel
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Miami, Aspen, New York"
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Check-In */}
              <div className="p-2 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-amber-400" /> Check-in Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>

              {/* Check-Out */}
              <div className="p-2 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-amber-400" /> Check-out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                />
              </div>

              {/* Guests & Submit Button */}
              <div className="flex gap-2">
                <div className="flex-1 p-2 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-amber-400" /> Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="1" className="bg-slate-900">1 Guest</option>
                    <option value="2" className="bg-slate-900">2 Guests</option>
                    <option value="3" className="bg-slate-900">3 Guests</option>
                    <option value="4" className="bg-slate-900">4 Guests</option>
                    <option value="5" className="bg-slate-900">5+ Guests</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-luxury text-sm font-bold text-white mb-1">5-Star Standards</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Independently vetted luxury properties meeting international excellence benchmarks.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-luxury text-sm font-bold text-white mb-1">Direct Rate Guarantee</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Transparent pricing with zero hidden check-in fees or unverified surcharges.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-luxury text-sm font-bold text-white mb-1">Dedicated Concierge</h4>
                <p className="text-xs text-slate-400 leading-relaxed">24/7 personal hospitality coordination, airport pickups, and priority dining reservations.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Waves className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-luxury text-sm font-bold text-white mb-1">Flexible Cancellation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Complimentary date modifications and refunds on eligible reservations up to 48 hours prior.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Exclusive Portfolio</span>
            <h2 className="font-serif-luxury text-3xl font-bold text-white mt-1">Featured Sanctuary Residences</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">Hand-selected iconic hotels and private villas designed for unforgettable stays.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <span>View All Destinations</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map((hotel) => (
              <div
                key={hotel._id}
                onClick={() => navigate(`/hotels/${hotel._id}`)}
                className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col hover:-translate-y-1"
              >
                {/* Hotel Image with Badges */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                      ★ {hotel.ratingAverage} ({hotel.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                      From ${hotel.startingPrice} <span className="font-normal text-[10px]">/ night</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{hotel.city}, {hotel.country}</span>
                    </div>
                    <h3 className="font-serif-luxury text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {hotel.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>{hotel.amenities.slice(0, 2).join(' • ')}</span>
                    </div>
                    <span className="text-xs font-semibold text-amber-400 group-hover:underline flex items-center gap-1">
                      Explore Suites <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Special Promotional Offer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 w-full">
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border border-amber-500/30 p-8 sm:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-left">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
              Seasonal Exclusive Promotion
            </span>
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
              Complimentary 10% Welcome Privilege
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Experience grand suite accommodations with our introductory privilege. Apply promotional voucher at reservation checkout for immediate savings across all properties.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-amber-300 tracking-wider">WELCOME10</span>
              <button
                onClick={copyPromo}
                className="p-1 rounded text-amber-400 hover:text-white transition-colors"
                title="Copy promo code"
                aria-label="Copy promotional coupon"
              >
                {copiedPromo ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              Browse Stays
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
