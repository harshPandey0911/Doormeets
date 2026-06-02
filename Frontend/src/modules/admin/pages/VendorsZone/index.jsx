import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../../../services/api';
import { FiMapPin, FiPhone, FiStar } from 'react-icons/fi';
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

const VendorsZone = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([22.7196, 75.8577]); // Default Indore
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/admin/vendors');
      if (response.data.success) {
        setVendors(response.data.vendors || response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapVendors = vendors.filter(v => {
    const lat = v.location?.lat || v.address?.lat || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[1] : null);
    const lng = v.location?.lng || v.address?.lng || (v.geoLocation?.coordinates ? v.geoLocation.coordinates[0] : null);
    return lat && lng;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendor's Zone</h1>
          <p className="text-slate-500 text-sm mt-1">Live Map Feed of All Registered Vendors</p>
        </div>
        <div className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FiMapPin className="text-red-400" />
          <span className="font-semibold">{mapVendors.length}</span> Vendors Located
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 overflow-hidden"
      >
        {loading ? (
          <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        ) : (
          <div className="h-[600px] w-full rounded-lg overflow-hidden border border-slate-200">
            <MapContainer 
              center={center} 
              zoom={zoom} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {mapVendors.map((vendor) => {
                const lat = vendor.location?.lat || vendor.address?.lat || vendor.geoLocation?.coordinates[1];
                const lng = vendor.location?.lng || vendor.address?.lng || vendor.geoLocation?.coordinates[0];
                
                return (
                  <Marker 
                    key={vendor._id} 
                    position={[parseFloat(lat), parseFloat(lng)]}
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
      </motion.div>
    </div>
  );
};

export default VendorsZone;
