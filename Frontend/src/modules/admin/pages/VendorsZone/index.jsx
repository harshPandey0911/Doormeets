import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../../../services/api';
import { FiMapPin, FiPhone, FiStar, FiLayers, FiTrash2, FiPlus, FiX, FiCheck } from 'react-icons/fi';
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

const VendorsZone = () => {
  const [vendors, setVendors] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([22.7196, 75.8577]); // Default Indore
  const [zoom, setZoom] = useState(12);

  // Zone Creator States
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]); // [[lat, lng], [lat, lng], ...]
  const [newZoneName, setNewZoneName] = useState('');
  const [savingZone, setSavingZone] = useState(false);

  useEffect(() => {
    fetchData();
    fetchZones();
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
  const handleToggleZoneStatus = async (id, currentStatus) => {
    try {
      const response = await api.put(`/admin/zones/${id}`, {
        isActive: !currentStatus
      });
      if (response.data.success) {
        toast.success(`Zone ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchZones();
      }
    } catch (error) {
      console.error('Toggle zone status error:', error);
      toast.error('Failed to update zone status');
    }
  };

  // Delete service zone
  const handleDeleteZone = async (id) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;
    try {
      const response = await api.delete(`/admin/zones/${id}`);
      if (response.data.success) {
        toast.success('Zone deleted');
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

  return (
    <div className="space-y-6">
      {/* Header section with Stats widgets */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Service Zones</h1>
          <p className="text-slate-500 text-sm mt-1">Manage food-delivery style polygon geofences and check vendor real-time zone positions.</p>
        </div>
        
        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <FiLayers className="text-blue-500" />
            <span>Active Zones: {zones.filter(z => z.isActive).length} / {zones.length}</span>
          </div>
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online Vendors: {onlineVendors.length}</span>
          </div>
          <div className="bg-slate-50 border rounded-xl px-4 py-2 flex items-center gap-2 text-slate-700">
            <FiMapPin className="text-slate-400" />
            <span>Total Vendors: {mapVendors.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Zone Controls Panel */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-5 h-fit">
          <div className="border-b pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FiLayers className="text-blue-500" /> Geofence Creator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Define custom boundaries for broadcasts.</p>
          </div>

          {/* Draw Zone Controls */}
          {!isDrawing ? (
            <button
              onClick={() => { setIsDrawing(true); setDrawnPoints([]); }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPlus /> Draw New Zone Polygon
            </button>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-amber-800">Drawing mode active</p>
                <button 
                  onClick={() => { setIsDrawing(false); setDrawnPoints([]); }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                Map par clicks karke boundary points lagayein (minimum 3 points).
              </p>
              
              <div className="text-xs font-semibold text-slate-600">
                Points: <span className="font-extrabold text-blue-600">{drawnPoints.length}</span>
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
                  onClick={() => setDrawnPoints([])}
                  className="px-2.5 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Zones list */}
          <div className="space-y-2 border-t pt-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Zone Boundaries</span>
            {zones.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No geofences created yet.</p>
            ) : (
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {zones.map((zone) => (
                  <div 
                    key={zone._id}
                    className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-xs">
                      <p className="font-bold text-slate-700 leading-tight">{zone.name}</p>
                      <span className={`text-[9px] font-semibold uppercase ${zone.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={zone.isActive}
                        onChange={() => handleToggleZoneStatus(zone._id, zone.isActive)}
                        className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                      />
                      <button
                        onClick={() => handleDeleteZone(zone._id)}
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-150 overflow-hidden">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-lg">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
                <p className="text-slate-400 text-sm font-semibold">Loading map data...</p>
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

                {/* Map Click Listener */}
                <MapClickHandler enabled={isDrawing} onMapClick={handleMapClick} />

                {/* 1. RENDER POLYGON SERVICE ZONES */}
                {zones.map((zone) => {
                  if (!zone.coordinates || !zone.coordinates.coordinates) return null;
                  
                  // GeoJSON coordinates standard is [longitude, latitude]
                  // Leaflet expects [latitude, longitude]
                  const leafletPositions = zone.coordinates.coordinates[0].map(coord => [coord[1], coord[0]]);

                  return (
                    <Polygon
                      key={zone._id}
                      positions={leafletPositions}
                      pathOptions={{
                        color: zone.isActive ? '#0284c7' : '#94a3b8',
                        fillColor: zone.isActive ? '#0284c7' : '#cbd5e1',
                        fillOpacity: zone.isActive ? 0.12 : 0.04,
                        weight: 2.5,
                        dashArray: zone.isActive ? undefined : '5, 5'
                      }}
                    >
                      <Tooltip sticky>
                        <span className="text-xs font-bold">{zone.name} (Service Zone)</span>
                      </Tooltip>
                    </Polygon>
                  );
                })}

                {/* 2. RENDER CURRENT DRAWING SHAPE */}
                {isDrawing && drawnPoints.length > 0 && (
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

                {/* 3. RENDER VENDOR MARKERS */}
                {mapVendors.map((vendor) => {
                  const lat = parseFloat(vendor.location?.lat || vendor.address?.lat || vendor.geoLocation?.coordinates[1]);
                  const lng = parseFloat(vendor.location?.lng || vendor.address?.lng || vendor.geoLocation?.coordinates[0]);

                  return (
                    <Marker 
                      key={vendor._id}
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
