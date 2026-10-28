import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Sparkles,
  ArrowUpDown,
  Filter,
  Check,
  Building,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { IHotel } from '../../server/src/types/index.js';

export const HotelSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const destinationParam = searchParams.get('destination') || '';
  const checkInParam = searchParams.get('checkIn') || '';
  const checkOutParam = searchParams.get('checkOut') || '';
  const guestsParam = searchParams.get('guests') || '2';

  const [destination, setDestination] = useState(destinationParam);
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedAmenity, setSelectedAmenity] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');

  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFilteredHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (destination.trim()) params.set('destination', destination.trim());
      if (maxPrice < 1500) params.set('maxPrice', String(maxPrice));
      if (minRating > 0) params.set('rating', String(minRating));
      if (selectedAmenity) params.set('amenity', selectedAmenity);

      const res = await api.get(`/hotels?${params.toString()}`);
      if (res.data.success) {
        let list = res.data.hotels as IHotel[];
        // Client-side sorting
        if (sortBy === 'price-low') {
          list.sort((a, b) => a.startingPrice - b.startingPrice);
        } else if (sortBy === 'price-high') {
          list.sort((a, b) => b.startingPrice - a.startingPrice);
        } else if (sortBy === 'rating') {
          list.sort((a, b) => b.ratingAverage - a.ratingAverage);
        }
        setHotels(list);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredHotels();
  }, [destination, maxPrice, minRating, selectedAmenity, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredHotels();
  };

  const resetFilters = () => {
    setDestination('');
    setMaxPrice(1500);
    setMinRating(0);
    setSelectedAmenity('');
    setSortBy('recommended');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Hotel Directory</span>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white mt-1">
              {destination ? `Hotels in "${destination}"` : 'Discover Luxury Destinations'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Showing {hotels.length} verified five-star hotel residences & sanctuaries
            </p>
          </div>

          {/* Quick Sort Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="recommended">Recommended & Curated</option>
              <option value="price-low">Starting Price: Low to High</option>
              <option value="price-high">Starting Price: High to Low</option>
              <option value="rating">Highest Guest Rating</option>
            </select>
          </div>
        </div>

        {/* Layout Grid: Filters Sidebar + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl h-fit sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif-luxury text-sm font-bold text-white uppercase tracking-wider">Filter Results</h3>
              </div>
              <button
                onClick={resetFilters}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Keyword / Destination */}
            <form onSubmit={handleSearchSubmit}>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Search City or Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Miami, Aspen..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </form>

            {/* Price Range Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-slate-300">Max Starting Rate</span>
                <span className="text-amber-400 font-bold">${maxPrice}/night</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>$200</span>
                <span>$1,500+</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Minimum Rating</label>
              <div className="flex gap-2">
                {[0, 4.5, 4.8, 4.9].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMinRating(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      minRating === val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {val === 0 ? 'All' : `${val}★`}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Signature Amenities</label>
              <div className="space-y-2">
                {['Pool', 'Spa', 'Beach', 'Dining', 'Wi-Fi', 'Fireplace'].map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenity === amenity}
                      onChange={() => setSelectedAmenity(selectedAmenity === amenity ? '' : amenity)}
                      className="rounded accent-amber-500 bg-slate-950 border-slate-700"
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Hotel Listings */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <Building className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-serif-luxury text-lg font-bold text-white">No Hotels Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No properties matched your current filter selections. Try clearing your filters or widening your price range.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              hotels.map((hotel) => (
                <div
                  key={hotel._id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-amber-500/40 transition-all flex flex-col md:flex-row group shadow-xl"
                >
                  {/* Photo */}
                  <div className="md:w-72 h-56 md:h-auto relative overflow-hidden shrink-0">
                    <img
                      src={hotel.images[0]}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                      ★ {hotel.ratingAverage}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{hotel.city}, {hotel.country}</span>
                      </div>
                      <h3
                        onClick={() => navigate(`/hotels/${hotel._id}`)}
                        className="font-serif-luxury text-xl font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        {hotel.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {hotel.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {hotel.amenities.slice(0, 4).map((a, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 font-semibold block">Starting from</span>
                        <span className="text-xl font-bold font-serif-luxury text-amber-400">
                          ${hotel.startingPrice}{' '}
                          <span className="text-xs font-normal text-slate-400 font-sans">/ night</span>
                        </span>
                      </div>

                      <button
                        onClick={() => navigate(`/hotels/${hotel._id}?checkIn=${checkInParam}&checkOut=${checkOutParam}&guests=${guestsParam}`)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto font-sans"
                      >
                        View Suites & Reserve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
