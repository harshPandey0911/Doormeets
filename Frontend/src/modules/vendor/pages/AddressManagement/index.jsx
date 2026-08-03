import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { GoogleMap, useJsApiLoader, Polygon, Marker } from '@react-google-maps/api';
import { vendorTheme as themeColors } from '../../../../theme';
import vendorService from '../../../../services/vendorService';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';

const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '280px',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: 22.7196,
  lng: 75.8577
};

const AddressManagement = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [vendorLocation, setVendorLocation] = useState(null);
  const [zoneStatus, setZoneStatus] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await vendorService.getProfile();
        if (response.success && response.vendor) {
          const v = response.vendor;
          const addr = v.address;

          if (addr) {
            let displayAddress = typeof addr === 'string' ? addr : (addr.fullAddress || [addr.city, addr.state].filter(Boolean).join(', '));
            setAddress(displayAddress);
            if (typeof addr === 'object' && addr.addressLine1) {
              setHouseNumber(addr.addressLine1);
            }
            if (typeof addr === 'object' && addr.lat && addr.lng) {
              setVendorLocation({ lat: parseFloat(addr.lat), lng: parseFloat(addr.lng) });
            }
          }

          if (v.zoneStatus) {
            setZoneStatus(v.zoneStatus);
          }
        }
      } catch (error) {
        console.error('Error loading vendor profile & zone:', error);
      }
    };
    loadData();
  }, []);

  // Format GeoJSON polygon [[[lng, lat], [lng, lat]...]] to Google Maps path [{lat, lng}, {lat, lng}...]
  const polygonPath = useMemo(() => {
    if (!zoneStatus?.coordinates?.coordinates || !Array.isArray(zoneStatus.coordinates.coordinates[0])) {
      return null;
    }
    const ring = zoneStatus.coordinates.coordinates[0];
    return ring.map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }));
  }, [zoneStatus]);

  // Calculate Map center from polygon or vendor location
  const mapCenter = useMemo(() => {
    if (vendorLocation) return vendorLocation;
    if (polygonPath && polygonPath.length > 0) {
      let latSum = 0, lngSum = 0;
      polygonPath.forEach(pt => { latSum += pt.lat; lngSum += pt.lng; });
      return { lat: latSum / polygonPath.length, lng: lngSum / polygonPath.length };
    }
    return defaultCenter;
  }, [vendorLocation, polygonPath]);

  const polygonOptions = {
    fillColor: '#8b5cf6',
    fillOpacity: 0.25,
    strokeColor: '#6d28d9',
    strokeOpacity: 0.9,
    strokeWeight: 3,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 1
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header
        title="Manage Business Address"
        showBack={true}
        onBack={() => navigate('/vendor/settings')}
      />

      <main className="px-3.5 py-4 max-w-lg mx-auto">
        {/* Info Card */}
        <div className="rounded-xl p-4 mb-4 border shadow-sm bg-purple-50/80 border-purple-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <h3 className="font-bold mb-1 text-sm text-purple-900 flex items-center gap-1.5">
                Assigned Operating Zone: <span className="text-purple-700 font-extrabold">{zoneStatus?.zoneName || 'All Zones (Global)'}</span>
              </h3>
              <p className="text-xs leading-relaxed font-medium text-purple-700">
                Your assigned operating zone boundary is displayed on the map below. Jobs in this zone will be allocated to you.
              </p>
            </div>
          </div>
        </div>

        {/* Google Map showing Polygon Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 p-1">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
                zoomControl: true,
                gestureHandling: 'greedy'
              }}
            >
              {polygonPath && <Polygon paths={polygonPath} options={polygonOptions} />}
              {vendorLocation && <Marker position={vendorLocation} title="Your Business Location" />}
            </GoogleMap>
          ) : loadError ? (
            <div className="h-64 bg-gray-100 flex items-center justify-center text-red-500 font-semibold text-xs">
              Error loading Google Maps
            </div>
          ) : (
            <div className="h-64 bg-gray-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-600 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Form Inputs Container (Read Only Display) */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Registered Business Address
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-medium text-xs text-gray-800 leading-relaxed">
              {address || 'No address set'}
              {houseNumber ? ` (${houseNumber})` : ''}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Active Service Zone Boundary
            </label>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{zoneStatus?.zoneName || 'All Zones (Global)'} (Geofence Active)</span>
            </div>
          </div>

          {vendorLocation && (
            <p className="text-[10px] text-gray-400 font-semibold">
              Coordinates: {vendorLocation.lat?.toFixed(5)}, {vendorLocation.lng?.toFixed(5)}
            </p>
          )}

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium">
              If you need to update your operating zone, please contact platform support or your city admin.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddressManagement;
