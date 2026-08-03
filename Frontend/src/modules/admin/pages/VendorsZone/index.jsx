import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../../../services/api';
import { FiMapPin, FiPhone, FiStar, FiLayers, FiTrash2, FiPlus, FiX, FiCheck, FiSearch, FiCornerDownLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

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

// Map click event handler component
const MapClickHandler = ({ enabled, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

// Component to capture map ref for external flyTo
const MapRefSetter = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

const VendorsZone = () => {
  const [vendors, setVendors] = useState([]);
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);

  // Zone Creator States
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]); // [[lat, lng], [lat, lng], ...]
  const [newZoneName, setNewZoneName] = useState('');
  const [savingZone, setSavingZone] = useState(false);

  // Search Location States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const searchTimerRef = useRef(null);

  // Debounced search location using Nominatim API
  const handleSearchLocation = (query) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
        const data = await response.json();
        setSearchResults(data || []);
      } catch (error) {
        console.error('Location search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (mapInstance) {
      mapInstance.flyTo([lat, lon], 14, { animate: true, duration: 1.5 });
    }
    setSearchQuery(result.display_name.split(',')[0]);
    setSearchResults([]);
  };

  useEffect(() => {
    fetchData();
    fetchZones();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const vendorsRes = await api.get('/admin/vendors');
      if (vendorsRes.data.success) {
        setVendors(vendorsRes.data.vendors || vendorsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch zone data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await api.get('/admin/zones');
      if (res.data.success) {
        setZones(res.data.zones || []);
      }
    } catch (error) {
      console.error('Failed to fetch service zones:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Add click coordinate to active drawing list
  const handleMapClick = (lat, lng) => {
    setDrawnPoints(prev => [...prev, [lat, lng]]);
  };

  // Save new polygon zone to server
  const handleSaveZone = async () => {
    if (!newZoneName.trim()) {
      toast.error('Please enter a zone name');
      return;
    }
    if (drawnPoints.length < 3) {
      toast.error('A zone must have at least 3 points');
      return;
    }

    setSavingZone(true);
    try {
      // GeoJSON standard is [longitude, latitude]
      const geoJsonCoordinates = [
        ...drawnPoints.map(p => [p[1], p[0]]),
        [drawnPoints[0][1], drawnPoints[0][0]] // close polygon
      ];

      const response = await api.post('/admin/zones', {
        name: newZoneName,
        coordinates: [geoJsonCoordinates]
      });

      if (response.data.success) {
        toast.success('Service zone saved successfully');
        setNewZoneName('');
        setDrawnPoints([]);
        setIsDrawing(false);
        fetchZones();
      } else {
        toast.error(response.data.message || 'Failed to save zone');
      }
    } catch (error) {
      console.error('Save zone error:', error);
      toast.error(error.response?.data?.message || 'Failed to save zone');
    } finally {
      setSavingZone(false);
    }
  };

  // Toggle zone active status
  const handleToggleZoneStatus = async (id, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await api.put(`/admin/zones/${id}`, {
        isActive: !currentStatus
      });
      if (response.data.success) {
        toast.success(`Zone ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchZones();
        if (selectedZone && selectedZone._id === id) {
          setSelectedZone(prev => ({ ...prev, isActive: !currentStatus }));
        }
      }
    } catch (error) {
      console.error('Toggle zone status error:', error);
      toast.error('Failed to update zone status');
    }
  };

  // Delete service zone
  const handleDeleteZone = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this zone?')) return;
    try {
      const response = await api.delete(`/admin/zones/${id}`);
      if (response.data.success) {
        toast.success('Zone deleted');
        if (selectedZone && selectedZone._id === id) {
          setSelectedZone(null);
        }
        fetchZones();
      }
    } catch (error) {
      console.error('Delete zone error:', error);
      toast.error('Failed to delete zone');
    }
  };

  // Filter vendors with coordinates
  const mapVendors = vendors.filter(v => {
    const lat = v.location?.lat || v.address?.lat || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[1] : null);
    const lng = v.location?.lng || v.address?.lng || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[0] : null);
    return lat && lng;
  });

  // Online vendors
  const onlineVendors = mapVendors.filter(v => v.isOnline);

  // Active zone map center calculation
  const getZoneCenterAndBounds = (zone) => {
    if (!zone || !zone.coordinates || !zone.coordinates.coordinates) {
      return { center: [22.7196, 75.8577], positions: [] };
    }
    const coords = zone.coordinates.coordinates[0];
    const positions = coords.map(c => [c[1], c[0]]); // Leaflet [lat, lng]
    
    let sumLat = 0;
    let sumLng = 0;
    positions.forEach(p => {
      sumLat += p[0];
      sumLng += p[1];
    });
    const avgLat = sumLat / positions.length;
    const avgLng = sumLng / positions.length;

    return { center: [avgLat, avgLng], positions };
  };

  // Dedicated Zone Detail Page View
  if (selectedZone) {
    const { center: zoneCenter, positions: zonePositions } = getZoneCenterAndBounds(selectedZone);
    const mappedCategoriesForZone = categories.filter(c => {
      if (!c.zoneIds || c.zoneIds.length === 0) return true; // Global
      return c.zoneIds.some(zid => (zid._id || zid) === selectedZone._id);
    });

    return (
      <div className="space-y-6">
        {/* Detail View Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedZone(null)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <FiX className="w-5 h-5" />
              <span>Back to All Zones</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{selectedZone.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${selectedZone.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {selectedZone.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Created on {new Date(selectedZone.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => handleToggleZoneStatus(selectedZone._id, selectedZone.isActive, e)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedZone.isActive ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {selectedZone.isActive ? 'Deactivate Zone' : 'Activate Zone'}
            </button>
            <button
              onClick={(e) => handleDeleteZone(selectedZone._id, e)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiTrash2 className="w-4 h-4" />
              <span>Delete Zone</span>
            </button>
          </div>
        </div>

        {/* Detail Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
              <FiMapPin className="text-blue-500" /> Geofence Boundary Map
            </h3>
            <div className="h-[480px] w-full rounded-xl overflow-hidden border border-slate-200">
              <MapContainer 
                center={zoneCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%', zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {zonePositions.length > 0 && (
                  <Polygon
                    positions={zonePositions}
                    pathOptions={{
                      color: selectedZone.isActive ? '#0284c7' : '#94a3b8',
                      fillColor: selectedZone.isActive ? '#0284c7' : '#cbd5e1',
                      fillOpacity: 0.25,
                      weight: 3
                    }}
                  >
                    <Tooltip sticky>
                      <span className="text-xs font-bold">{selectedZone.name}</span>
                    </Tooltip>
                  </Polygon>
                )}

                {/* Render Vendors in Map */}
                {mapVendors.map((vendor) => {
                  const vLat = parseFloat(vendor.location?.lat || vendor.address?.lat || vendor.geoLocation?.coordinates[1]);
                  const vLng = parseFloat(vendor.location?.lng || vendor.address?.lng || vendor.geoLocation?.coordinates[0]);

                  return (
                    <Marker 
                      key={vendor._id}
                      position={[vLat, vLng]}
                      icon={vendor.isOnline ? greenIcon : redIcon}
                    >
                      <Popup className="vendor-popup">
                        <div className="p-1 min-w-[180px]">
                          <p className="font-bold text-slate-800 m-0">{vendor.businessName || vendor.name}</p>
                          <p className="text-xs text-slate-500 m-0">{vendor.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Details & Mapped Categories Panel */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b pb-2">Zone Overview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Boundary Points</span>
                  <span className="font-bold text-slate-800">{zonePositions.length} points</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mapped Categories</span>
                  <span className="font-bold text-blue-600">{mappedCategoriesForZone.length} Categories</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-bold ${selectedZone.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {selectedZone.isActive ? 'Active (Live)' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b pb-2 flex items-center justify-between">
                <span>Mapped Categories</span>
                <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold">
                  {mappedCategoriesForZone.length}
                </span>
              </h3>

              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                {mappedCategoriesForZone.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No categories mapped to this zone specifically.</p>
                ) : (
                  mappedCategoriesForZone.map(cat => (
                    <div key={cat.id || cat._id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      {cat.homeIconUrl ? (
                        <img src={cat.homeIconUrl} alt={cat.title} className="w-8 h-8 object-contain rounded-lg bg-white border border-slate-200 p-0.5" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-500">
                          {cat.title?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-xs text-slate-800 leading-tight">{cat.title}</p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {(!cat.zoneIds || cat.zoneIds.length === 0) ? 'Global (All Zones)' : 'Zone Exclusive'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main All Zones List / Grid View
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Zone Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage food-delivery style polygon geofences and check vendor real-time zone positions.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2">
              <FiLayers className="text-blue-500" />
              <span>Active Zones: {zones.filter(z => z.isActive).length} / {zones.length}</span>
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online Vendors: {onlineVendors.length}</span>
            </div>
          </div>

          <button
            onClick={() => { setIsDrawing(true); setDrawnPoints([]); }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Zone</span>
          </button>
        </div>
      </div>

      {/* If Drawing Mode is Active, show Draw Map Interface */}
      {isDrawing ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FiLayers className="text-blue-500" /> Geofence Creator
              </h3>
              <button 
                onClick={() => { setIsDrawing(false); setDrawnPoints([]); setSearchQuery(''); setSearchResults([]); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX />
              </button>
            </div>

            {/* 🔍 Location Search Input */}
            <div className="relative">
              <div className="flex items-center gap-2 border border-blue-200 rounded-lg bg-blue-50/50 px-3 py-2">
                <FiSearch className="text-blue-400 w-3.5 h-3.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search location (e.g. Indore, Bhopal)"
                  value={searchQuery}
                  onChange={(e) => handleSearchLocation(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none text-slate-800 placeholder:text-blue-300 font-medium"
                />
                {isSearching && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-[200px] overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(result)}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2 border-b border-slate-100 last:border-0 cursor-pointer"
                    >
                      <FiMapPin className="text-blue-500 mt-0.5 shrink-0 w-3.5 h-3.5" />
                      <span className="text-[11px] text-slate-700 font-medium leading-tight">{result.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl space-y-3">
              <p className="text-xs font-bold text-amber-800">✏️ Drawing mode active</p>
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                Click on the map to place boundary points (minimum 3 points required).
              </p>
              
              <div className="text-xs font-semibold text-slate-600">
                Points placed: <span className="font-extrabold text-blue-600">{drawnPoints.length}</span>
              </div>

              <input
                type="text"
                placeholder="Zone Name (e.g. Indore West)"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSaveZone}
                  disabled={savingZone || drawnPoints.length < 3}
                  className="flex-1 py-2 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  {savingZone ? 'Saving...' : <><FiCheck /> Save Zone</>}
                </button>
                <button
                  onClick={() => setDrawnPoints(prev => prev.slice(0, -1))}
                  disabled={drawnPoints.length === 0}
                  className="px-2.5 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer disabled:opacity-40 flex items-center gap-1"
                  title="Undo last point"
                >
                  <FiCornerDownLeft className="w-3 h-3" /> Undo
                </button>
                <button
                  onClick={() => setDrawnPoints([])}
                  className="px-2.5 py-2 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-[550px] w-full rounded-xl overflow-hidden border border-slate-200">
              <MapContainer 
                center={[22.7196, 75.8577]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapRefSetter onMapReady={setMapInstance} />
                <MapClickHandler enabled={isDrawing} onMapClick={handleMapClick} />

                {drawnPoints.length > 0 && (
                  <>
                    {drawnPoints.map((pt, idx) => (
                      <Marker 
                        key={`draw-pt-${idx}`} 
                        position={pt}
                        icon={new L.Icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                          iconSize: [16, 26],
                          iconAnchor: [8, 26]
                        })}
                      />
                    ))}
                    {drawnPoints.length >= 2 && (
                      <Polygon
                        positions={drawnPoints}
                        pathOptions={{
                          color: '#f59e0b',
                          fillColor: '#f59e0b',
                          fillOpacity: 0.15,
                          weight: 2
                        }}
                      />
                    )}
                  </>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      ) : (
        /* All Zones List / Card Grid View */
        <div>
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading service zones...</div>
          ) : zones.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
              <FiLayers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-lg">No Service Zones Configured</h3>
              <p className="text-slate-400 text-xs">Create polygon geofences to control category rendering across zones.</p>
              <button
                onClick={() => { setIsDrawing(true); setDrawnPoints([]); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                + Add First Zone
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map((zone) => {
                const { positions } = getZoneCenterAndBounds(zone);
                const zoneCatsCount = categories.filter(c => c.zoneIds && c.zoneIds.some(zid => (zid._id || zid) === zone._id)).length;

                return (
                  <div
                    key={zone._id}
                    onClick={() => setSelectedZone(zone)}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 p-5 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <FiMapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{zone.name}</h3>
                            <span className="text-[10px] text-slate-400 font-medium">Click to view details</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${zone.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">Points</span>
                          <span className="font-bold text-slate-700">{positions.length} Points</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">Exclusive Cats</span>
                          <span className="font-bold text-blue-600">{zoneCatsCount} Categories</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => handleToggleZoneStatus(zone._id, zone.isActive, e)}
                        className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        {zone.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={(e) => handleDeleteZone(zone._id, e)}
                        className="text-slate-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer"
                        title="Delete Zone"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorsZone;
