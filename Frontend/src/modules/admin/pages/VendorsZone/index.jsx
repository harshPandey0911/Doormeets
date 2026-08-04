import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polygon, InfoWindow, Autocomplete } from '@react-google-maps/api';
import api from '../../../../services/api';
import { FiMapPin, FiPhone, FiStar, FiLayers, FiTrash2, FiPlus, FiX, FiCheck, FiSearch, FiCornerDownLeft, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const LIBRARIES = ['places', 'geometry'];

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%'
};

const DEFAULT_CENTER = {
  lat: 22.7196,
  lng: 75.8577
};

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  zoomControl: true,
  gestureHandling: 'greedy'
};

const VendorsZone = () => {
  const [vendors, setVendors] = useState([]);
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedVendorPopup, setSelectedVendorPopup] = useState(null);

  // Zone Creator / Editor States
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]); // [{lat, lng}, {lat, lng}, ...]
  const [newZoneName, setNewZoneName] = useState('');
  const [savingZone, setSavingZone] = useState(false);
  const [editingZone, setEditingZone] = useState(null); // Zone object being edited

  // Search & Map Instance
  const [mapInstance, setMapInstance] = useState(null);
  const autocompleteRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

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
      console.error('Fetch vendors error:', error);
      toast.error('Failed to load vendors');
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
      console.error('Fetch zones error:', error);
      toast.error('Failed to load zones');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  // Start Editing a Zone
  const handleStartEditZone = (zone, e) => {
    if (e) e.stopPropagation();
    setEditingZone(zone);
    setNewZoneName(zone.name);
    
    // Extract points from zone coordinates if present
    if (zone.coordinates && zone.coordinates.coordinates && zone.coordinates.coordinates[0]) {
      const pts = zone.coordinates.coordinates[0];
      // Exclude last closed point if it equals first point
      const formattedPoints = pts.slice(0, pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1] ? pts.length - 1 : pts)
        .map(p => ({ lng: p[0], lat: p[1] }));
      setDrawnPoints(formattedPoints);
    } else {
      setDrawnPoints([]);
    }
    setIsDrawing(true);
    setSelectedZone(null);
  };

  const handleCancelEditZone = () => {
    setEditingZone(null);
    setNewZoneName('');
    setDrawnPoints([]);
    setIsDrawing(false);
  };

  // Map Click Handler for polygon creation
  const handleMapClick = (e) => {
    if (!isDrawing || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setDrawnPoints(prev => [...prev, { lat, lng }]);
  };

  // Google Places Autocomplete selection handler
  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        if (mapInstance) {
          mapInstance.panTo({ lat, lng });
          mapInstance.setZoom(14);
        }
      }
    }
  };

  // Save or Update polygon zone to server
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
        ...drawnPoints.map(p => [p.lng, p.lat]),
        [drawnPoints[0].lng, drawnPoints[0].lat] // close polygon
      ];

      let response;
      if (editingZone) {
        // Update existing zone
        response = await api.put(`/admin/zones/${editingZone._id}`, {
          name: newZoneName,
          coordinates: [geoJsonCoordinates]
        });
      } else {
        // Create new zone
        response = await api.post('/admin/zones', {
          name: newZoneName,
          coordinates: [geoJsonCoordinates]
        });
      }

      if (response.data.success) {
        toast.success(`Service zone ${editingZone ? 'updated' : 'saved'} successfully`);
        setNewZoneName('');
        setDrawnPoints([]);
        setIsDrawing(false);
        setEditingZone(null);
        fetchZones();
      } else {
        toast.error(response.data.message || 'Failed to save zone');
      }
    } catch (error) {
      console.error('Save/Update zone error:', error);
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

  // Filter vendors with valid coordinates
  const mapVendors = vendors.filter(v => {
    const lat = v.location?.lat || v.address?.lat || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[1] : null);
    const lng = v.location?.lng || v.address?.lng || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[0] : null);
    return lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng));
  });

  // Online vendors count
  const onlineVendors = mapVendors.filter(v => v.isOnline);

  // Active zone map center & path calculation
  const getZoneCenterAndPath = (zone) => {
    if (!zone || !zone.coordinates || !zone.coordinates.coordinates) {
      return { center: DEFAULT_CENTER, path: [] };
    }
    const coords = zone.coordinates.coordinates[0];
    const path = coords.map(c => ({ lat: Number(c[1]), lng: Number(c[0]) }));
    
    let sumLat = 0;
    let sumLng = 0;
    path.forEach(p => {
      sumLat += p.lat;
      sumLng += p.lng;
    });
    const avgLat = sumLat / (path.length || 1);
    const avgLng = sumLng / (path.length || 1);

    return { center: { lat: avgLat, lng: avgLng }, path };
  };

  if (loadError) {
    return (
      <div className="p-8 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-center">
        <h3 className="font-bold text-lg mb-2">Google Maps API Error</h3>
        <p className="text-sm">Failed to load Google Maps API. Please verify your API key in environment variables.</p>
      </div>
    );
  }

  // Dedicated Zone Detail Page View
  if (selectedZone) {
    const { center: zoneCenter, path: zonePath } = getZoneCenterAndPath(selectedZone);
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
              onClick={(e) => handleStartEditZone(selectedZone, e)}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiEdit2 className="w-4 h-4" />
              <span>Edit Zone</span>
            </button>
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
              <FiMapPin className="text-blue-500" /> Geofence Boundary Map (Google Maps)
            </h3>
            <div className="h-[480px] w-full rounded-xl overflow-hidden border border-slate-200">
              {!isLoaded ? (
                <div className="h-full flex items-center justify-center bg-slate-100 text-slate-400">Loading Map...</div>
              ) : (
                <GoogleMap
                  mapContainerStyle={MAP_CONTAINER_STYLE}
                  center={zoneCenter}
                  zoom={13}
                  options={MAP_OPTIONS}
                >
                  {zonePath.length > 0 && (
                    <Polygon
                      paths={zonePath}
                      options={{
                        strokeColor: selectedZone.isActive ? '#0284c7' : '#94a3b8',
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                        fillColor: selectedZone.isActive ? '#0284c7' : '#cbd5e1',
                        fillOpacity: 0.25
                      }}
                    />
                  )}

                  {/* Render Vendors in Map */}
                  {mapVendors.map((vendor) => {
                    const vLat = Number(vendor.location?.lat || vendor.address?.lat || vendor.geoLocation?.coordinates[1]);
                    const vLng = Number(vendor.location?.lng || vendor.address?.lng || vendor.geoLocation?.coordinates[0]);

                    return (
                      <Marker 
                        key={vendor._id}
                        position={{ lat: vLat, lng: vLng }}
                        onClick={() => setSelectedVendorPopup(vendor)}
                        icon={{
                          url: vendor.isOnline 
                            ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' 
                            : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        }}
                      />
                    );
                  })}

                  {selectedVendorPopup && (
                    <InfoWindow
                      position={{
                        lat: Number(selectedVendorPopup.location?.lat || selectedVendorPopup.address?.lat || selectedVendorPopup.geoLocation?.coordinates[1]),
                        lng: Number(selectedVendorPopup.location?.lng || selectedVendorPopup.address?.lng || selectedVendorPopup.geoLocation?.coordinates[0])
                      }}
                      onCloseClick={() => setSelectedVendorPopup(null)}
                    >
                      <div className="p-1 min-w-[160px]">
                        <p className="font-bold text-slate-800 text-xs m-0">{selectedVendorPopup.businessName || selectedVendorPopup.name}</p>
                        <p className="text-[11px] text-slate-500 m-0 mt-0.5">{selectedVendorPopup.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
                        {selectedVendorPopup.phone && <p className="text-[10px] text-slate-400 m-0 mt-0.5">{selectedVendorPopup.phone}</p>}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>
          </div>

          {/* Details & Mapped Categories Panel */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b pb-2">Zone Overview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Boundary Points</span>
                  <span className="font-bold text-slate-800">{zonePath.length} points</span>
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
          <p className="text-slate-500 text-sm mt-1">Manage service polygon geofences and check vendor real-time zone positions using Google Maps API.</p>
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
                onClick={() => { setIsDrawing(false); setDrawnPoints([]); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX />
              </button>
            </div>

            {/* 🔍 Google Places Autocomplete Search Input */}
            <div className="relative">
              {isLoaded && (
                <Autocomplete
                  onLoad={(ref) => (autocompleteRef.current = ref)}
                  onPlaceChanged={onPlaceChanged}
                >
                  <div className="flex items-center gap-2 border border-blue-200 rounded-lg bg-blue-50/50 px-3 py-2">
                    <FiSearch className="text-blue-400 w-3.5 h-3.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search location (e.g. Indore, Bhopal)"
                      className="flex-1 bg-transparent text-xs outline-none text-slate-800 placeholder:text-blue-300 font-medium"
                    />
                  </div>
                </Autocomplete>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl space-y-3">
              <p className="text-xs font-bold text-amber-800">
                {editingZone ? `✏️ Editing Zone: ${editingZone.name}` : '✏️ Drawing mode active'}
              </p>
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                {editingZone 
                  ? 'Modify the zone name below or click on the map to add/adjust boundary points.' 
                  : 'Click directly on the Google Map to place boundary points (minimum 3 points required).'}
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
                  {savingZone ? 'Saving...' : <><FiCheck /> {editingZone ? 'Update Zone' : 'Save Zone'}</>}
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
                  onClick={handleCancelEditZone}
                  className="px-2.5 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-[550px] w-full rounded-xl overflow-hidden border border-slate-200">
              {!isLoaded ? (
                <div className="h-full flex items-center justify-center bg-slate-100 text-slate-400">Loading Map...</div>
              ) : (
                <GoogleMap
                  mapContainerStyle={MAP_CONTAINER_STYLE}
                  center={DEFAULT_CENTER}
                  zoom={12}
                  options={MAP_OPTIONS}
                  onLoad={(map) => setMapInstance(map)}
                  onClick={handleMapClick}
                >
                  {drawnPoints.map((pt, idx) => (
                    <Marker 
                      key={`draw-pt-${idx}`} 
                      position={pt}
                      icon={{
                        url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                      }}
                    />
                  ))}

                  {drawnPoints.length >= 2 && (
                    <Polygon
                      paths={drawnPoints}
                      options={{
                        strokeColor: '#f59e0b',
                        strokeOpacity: 0.9,
                        strokeWeight: 3,
                        fillColor: '#f59e0b',
                        fillOpacity: 0.2
                      }}
                    />
                  )}
                </GoogleMap>
              )}
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
                const { path } = getZoneCenterAndPath(zone);
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
                          <span className="font-bold text-slate-700">{path.length} Points</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block text-[10px]">Exclusive Cats</span>
                          <span className="font-bold text-blue-600">{zoneCatsCount} Categories</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleToggleZoneStatus(zone._id, zone.isActive, e)}
                          className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                        >
                          {zone.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={(e) => handleStartEditZone(zone, e)}
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>

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

