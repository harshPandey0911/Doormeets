import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../../../services/api';
import { FiMapPin, FiPhone, FiStar, FiLayers, FiAlertOctagon, FiUser, FiNavigation } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red icon for offline vendors
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom green icon for online vendors
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper to compute distance between two coords using Haversine formula (in km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const VendorsZone = () => {
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([22.7196, 75.8577]); // Default Indore
  const [zoom, setZoom] = useState(12);

  // Dynamic coverage configuration
  const [coverageRadius, setCoverageRadius] = useState(12); // Defaults to 12km now

  // Layer control states
  const [showVendorRadius, setShowVendorRadius] = useState(true);
  const [showBookings, setShowBookings] = useState(true);
  const [showShortageZones, setShowShortageZones] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorsRes, bookingsRes] = await Promise.all([
        api.get('/admin/vendors'),
        api.get('/admin/users/bookings?limit=1000')
      ]);

      if (vendorsRes.data.success) {
        setVendors(vendorsRes.data.vendors || vendorsRes.data.data || []);
      }
      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || bookingsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch zone data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors with coordinates
  const mapVendors = vendors.filter(v => {
    const lat = v.location?.lat || v.address?.lat || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[1] : null);
    const lng = v.location?.lng || v.address?.lng || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[0] : null);
    return lat && lng;
  });

  // Filter bookings with coordinates
  const mapBookings = bookings.filter(b => b.address?.lat && b.address?.lng);

  // Online vendors for calculating coverage
  const onlineVendors = mapVendors.filter(v => v.isOnline);

  // Determine shortage zones: Bookings that have NO online vendors within coverageRadius
  const shortageBookings = mapBookings.filter(booking => {
    const bLat = parseFloat(booking.address.lat);
    const bLng = parseFloat(booking.address.lng);
    
    // Check distance to all online vendors
    const nearbyOnlineVendors = onlineVendors.filter(vendor => {
      const vLat = parseFloat(vendor.location?.lat || vendor.address?.lat || vendor.geoLocation?.coordinates[1]);
      const vLng = parseFloat(vendor.location?.lng || vendor.address?.lng || vendor.geoLocation?.coordinates[0]);
      return getDistance(bLat, bLng, vLat, vLng) <= coverageRadius; // Dynamic radius in km
    });

    return nearbyOnlineVendors.length === 0;
  });

  return (
    <div className="space-y-6">
      {/* Header section with Stats widgets */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendor's Zone</h1>
          <p className="text-slate-500 text-sm mt-1">Live Map Feed, Coverage Radii, and Booking Shortage Visualizer</p>
        </div>
        
        {/* Dynamic Interactive Stats Badges */}
        <div className="flex flex-wrap gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Online:</span>
            <span className="font-extrabold">{onlineVendors.length}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-2 flex items-center gap-2 text-slate-700">
            <FiMapPin className="text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Vendors:</span>
            <span className="font-extrabold">{mapVendors.length}</span>
          </div>
          <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <FiLayers className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Bookings Loaded:</span>
            <span className="font-extrabold">{mapBookings.length}</span>
          </div>
          <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <FiAlertOctagon className="text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Shortage Hotspots:</span>
            <span className="font-extrabold">{shortageBookings.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Box Dashboard Panel */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-5 h-fit">
          <div className="border-b pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FiLayers className="text-blue-500" /> Map Visual Controls
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggle overlays to analyze demand gaps.</p>
          </div>

          <div className="space-y-4">
            {/* Toggle Vendor coverage radius */}
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-700">{coverageRadius}km Coverage Radius</p>
                  <p className="text-[10px] text-slate-400">Green circular vendor reach</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={showVendorRadius} 
                onChange={e => setShowVendorRadius(e.target.checked)} 
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            {/* Toggle Bookings display */}
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500/25 border border-amber-500 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-700">Booking Demand Points</p>
                  <p className="text-[10px] text-slate-400">Amber dots representing customer bookings</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={showBookings} 
                onChange={e => setShowBookings(e.target.checked)} 
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            {/* Toggle Shortage zones */}
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-rose-500/25 border border-rose-500 border-dashed flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-rose-700">Shortage Hotspots</p>
                  <p className="text-[10px] text-slate-400">Red warning zones (Bookings with 0 active vendors)</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={showShortageZones} 
                onChange={e => setShowShortageZones(e.target.checked)} 
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Dynamic Radius Selector */}
          <div className="space-y-2 border-t pt-3.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <label>Configure Coverage Limit</label>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-extrabold text-[10px]">{coverageRadius} km</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="30" 
              value={coverageRadius} 
              onChange={e => setCoverageRadius(parseInt(e.target.value) || 12)}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
              <span>1 km</span>
              <span>15 km</span>
              <span>30 km</span>
            </div>
          </div>

          {/* Quick analysis legends */}
          <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100 text-xs text-slate-600 font-semibold">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demand Guide</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Online Vendor (Available)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span>Offline Vendor (Unavailable)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Booking Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-100 border border-red-500 border-dashed shrink-0" />
              <span>Blank Zone (High Demand, No Vendors)</span>
            </div>
          </div>
        </div>

        {/* Map Container Panel */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-150 overflow-hidden">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
                <p className="text-slate-400 text-sm font-semibold">Loading live map feeds...</p>
              </div>
            </div>
          ) : (
            <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-200">
              <MapContainer 
                center={center} 
                zoom={zoom} 
                style={{ height: '100%', width: '100%', zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 1. RENDER VENDORS & RANGES */}
                {mapVendors.map((vendor) => {
                  const lat = parseFloat(vendor.location?.lat || vendor.address?.lat || vendor.geoLocation?.coordinates[1]);
                  const lng = parseFloat(vendor.location?.lng || vendor.address?.lng || vendor.geoLocation?.coordinates[0]);

                  return (
                    <React.Fragment key={vendor._id}>
                      {/* Vendor Location Marker */}
                      <Marker 
                        position={[lat, lng]}
                        icon={vendor.isOnline ? greenIcon : redIcon}
                        zIndexOffset={vendor.isOnline ? 1000 : 0}
                      >
                        <Popup className="vendor-popup">
                          <div className="p-1 min-w-[200px]">
                            <div className="flex items-center gap-3 mb-2 border-b pb-2">
                              {vendor.profilePhoto ? (
                                <img src={vendor.profilePhoto} alt={vendor.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                  {vendor.name?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-slate-800 m-0 leading-tight">{vendor.businessName || vendor.name}</h3>
                                <p className="text-xs text-slate-500 m-0">{vendor.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <FiPhone className="text-slate-400" /> {vendor.phone}
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <FiStar className="text-yellow-400" /> {vendor.rating || 'N/A'} Rating
                              </div>
                              <div className="flex items-start gap-2 text-slate-600 mt-2">
                                <FiMapPin className="text-slate-400 mt-1 shrink-0" />
                                <span className="text-xs">{vendor.address?.addressLine1}, {vendor.address?.city}</span>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Coverage Circle around the Vendor */}
                      {showVendorRadius && (
                        <Circle
                          center={[lat, lng]}
                          radius={coverageRadius * 1000} // Dynamic in meters
                          pathOptions={{
                            color: vendor.isOnline ? '#22c55e' : '#94a3b8',
                            fillColor: vendor.isOnline ? '#22c55e' : '#cbd5e1',
                            fillOpacity: vendor.isOnline ? 0.08 : 0.03,
                            weight: vendor.isOnline ? 1.5 : 1,
                            dashArray: vendor.isOnline ? undefined : '5, 5'
                          }}
                        >
                          <Tooltip sticky>
                            <span className="text-xs font-semibold">
                              {vendor.businessName || vendor.name} ({coverageRadius}km Range)
                            </span>
                          </Tooltip>
                        </Circle>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* 2. RENDER BOOKINGS DEMAND DOTS */}
                {showBookings && mapBookings.map((booking) => {
                  const bLat = parseFloat(booking.address.lat);
                  const bLng = parseFloat(booking.address.lng);

                  return (
                    <Circle
                      key={booking._id}
                      center={[bLat, bLng]}
                      radius={150} // 150m radius dot
                      pathOptions={{
                        color: '#f59e0b',
                        fillColor: '#f59e0b',
                        fillOpacity: 0.8,
                        weight: 1
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 space-y-1 font-semibold text-slate-800">
                          <p className="text-blue-600 font-extrabold">Booking #{booking.bookingNumber}</p>
                          <p className="flex items-center gap-1"><FiUser className="text-slate-400" /> User: {booking.userId?.name || 'N/A'}</p>
                          <p className="flex items-center gap-1"><FiNavigation className="text-slate-400" /> Service: {booking.serviceName}</p>
                          <p className="flex items-center gap-1"><FiMapPin className="text-slate-400" /> City: {booking.address?.city}</p>
                          <p className="text-emerald-600">Status: {booking.status}</p>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

                {/* 3. RENDER DEMAND SHORTAGE / BLANK ZONES */}
                {showShortageZones && shortageBookings.map((booking) => {
                  const bLat = parseFloat(booking.address.lat);
                  const bLng = parseFloat(booking.address.lng);

                  return (
                    <Circle
                      key={`shortage-${booking._id}`}
                      center={[bLat, bLng]}
                      radius={3000} // Highlight shortage zone within 3km around booking
                      pathOptions={{
                        color: '#ef4444',
                        fillColor: '#ef4444',
                        fillOpacity: 0.12,
                        weight: 2,
                        dashArray: '5, 8'
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 text-red-700 font-extrabold max-w-[220px] space-y-1">
                          <p className="text-rose-600 font-black flex items-center gap-1">
                            <FiAlertOctagon /> BLANK ZONE (VENDOR SHORTAGE)
                          </p>
                          <p className="font-semibold text-slate-600">
                            There are 0 Online Vendors within {coverageRadius}km of this Booking location.
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            Booking Number: #{booking.bookingNumber}
                          </p>
                        </div>
                      </Popup>
                      <Tooltip permanent direction="top" className="shortage-tooltip">
                        <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1 py-0.5 rounded shadow">
                          ⚠️ Shortage Spot
                        </span>
                      </Tooltip>
                    </Circle>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorsZone;
