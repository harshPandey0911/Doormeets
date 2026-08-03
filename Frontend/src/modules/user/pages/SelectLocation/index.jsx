import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiMapPin, FiHome, FiBriefcase, FiBookmark, FiCheck, FiX, FiNavigation } from 'react-icons/fi';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { themeColors } from '../../../../theme';
import LocationPicker from '../Checkout/components/LocationPicker';
import { userAuthService } from '../../../../services/authService';
import { useCity } from '../../../../context/CityContext';
import { toast } from 'react-hot-toast';

const libraries = ['places', 'geometry'];

const SelectLocationPage = () => {
  const navigate = useNavigate();
  const { currentCity, cities, selectCity } = useCity();

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapAddress, setMapAddress] = useState(localStorage.getItem('currentAddress') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        setLoadingSaved(true);
        const response = await userAuthService.getProfile();
        if (response.success && response.user?.addresses) {
          setSavedAddresses(response.user.addresses);
        }
      } catch (error) {
        console.error('Failed to load saved addresses:', error);
      } finally {
        setLoadingSaved(false);
      }
    };
    fetchSaved();
  }, []);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setMapAddress(location.address);
    setSearchQuery(location.address);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address,
          components: place.address_components
        };
        setSelectedLocation(location);
        setMapAddress(place.formatted_address);
        setSearchQuery(place.formatted_address);
      }
    }
  };

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const handleSaveAndApply = async (selectedHouseNum = houseNumber, locObj = selectedLocation) => {
    const targetLoc = locObj || { address: mapAddress };
    const newAddress = targetLoc.address || mapAddress;

    if (!newAddress) {
      toast.error('Please select a location on map or search address');
      return;
    }

    // 1. Save Address String & Coordinates
    localStorage.setItem('currentAddress', newAddress);
    if (targetLoc.lat && targetLoc.lng) {
      localStorage.setItem('user_lat', targetLoc.lat);
      localStorage.setItem('user_lng', targetLoc.lng);

      // 2. Fetch matching Zone via backend Point-in-Polygon check
      try {
        const { zoneService } = await import('../../../../services/catalogService');
        const res = await zoneService.resolveByCoordinates(targetLoc.lat, targetLoc.lng);
        if (res.success && res.zone && res.zone.id) {
          localStorage.setItem('user_zone_id', res.zone.id);
          localStorage.setItem('user_zone_name', res.zone.name);
          localStorage.removeItem('nearest_zone_info');
          toast.success(`Active Zone: ${res.zone.name}`);
        } else {
          localStorage.removeItem('user_zone_id');
          localStorage.removeItem('user_zone_name');
          // Store nearest zone info for "Not in Zone" UI
          if (res.nearestZone) {
            localStorage.setItem('nearest_zone_info', JSON.stringify(res.nearestZone));
          } else {
            localStorage.removeItem('nearest_zone_info');
          }
        }
      } catch (err) {
        console.error('Failed to resolve zone:', err);
      }
    }

    // Remove legacy city storage keys to guarantee city is fully removed
    localStorage.removeItem('currentCity');
    localStorage.removeItem('selectedCityId');

    toast.success('Location updated successfully!');
    navigate('/user/home');
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
              const result = data.results[0];
              const locationObj = {
                lat: latitude,
                lng: longitude,
                address: result.formatted_address,
                components: result.address_components
              };
              setSelectedLocation(locationObj);
              setMapAddress(result.formatted_address);
              setSearchQuery(result.formatted_address);
              toast.success('Current location detected!');
            }
          } catch (error) {
            toast.error('Failed to get address details');
          }
        },
        (error) => {
          toast.error('Location permission denied or unavailable');
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 px-4 py-3 border-b flex items-center justify-between shadow-xs" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-primary)' }}>
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>Select Location</h1>
            <p className="text-[10px] text-gray-400 font-medium">Choose your delivery area & address</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 space-y-5 flex-1 pb-24">
        {/* Search Input Box */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border shadow-xs space-y-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <label className="block text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
            Search Area or Landmark
          </label>
          {isLoaded ? (
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                componentRestrictions: { country: 'in' },
                fields: ['formatted_address', 'geometry', 'name', 'address_components']
              }}
            >
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <input
                  type="text"
                  placeholder="Search colony, street name, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-all"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Autocomplete>
          ) : (
            <div className="py-3 px-4 rounded-xl text-xs text-gray-400 bg-gray-100">Loading Map Search...</div>
          )}

          {/* Current GPS Location Button */}
          <button
            onClick={handleCurrentLocation}
            className="w-full py-2.5 px-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/50 text-teal-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
          >
            <FiNavigation className="w-4 h-4 text-teal-600 animate-pulse" />
            <span>Use Current Location (GPS)</span>
          </button>
        </div>

        {/* Map Location Picker */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border shadow-xs space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <FiMapPin className="text-teal-600" /> Pinpoint Exact Location
            </label>
            <span className="text-[10px] font-semibold text-gray-400">Drag or click to adjust</span>
          </div>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialPosition={selectedLocation}
            />
          </div>
          {mapAddress && (
            <p className="text-xs font-medium text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              📍 <span className="font-bold text-gray-800">{mapAddress}</span>
            </p>
          )}
        </div>

        {/* Saved Addresses Section */}
        {savedAddresses.length > 0 && (
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border shadow-xs space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <label className="block text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
              Choose from Saved Addresses
            </label>
            <div className="space-y-2.5">
              {savedAddresses.map((addr) => (
                <div
                  key={addr._id || addr.id}
                  onClick={() => {
                    const selectedLoc = {
                      lat: addr.lat,
                      lng: addr.lng,
                      address: addr.addressLine1,
                      components: [],
                      type: addr.type
                    };
                    handleSaveAndApply(addr.addressLine2 || '', selectedLoc);
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl border hover:border-teal-500/50 hover:bg-teal-50/5 active:scale-[0.99] transition-all cursor-pointer text-left"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                >
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                    {addr.type === 'work' ? (
                      <FiBriefcase className="w-4 h-4 text-teal-600" />
                    ) : addr.type === 'other' ? (
                      <FiBookmark className="w-4 h-4 text-teal-600" />
                    ) : (
                      <FiHome className="w-4 h-4 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded text-teal-700 bg-teal-50">
                        {addr.type || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold uppercase text-green-700 bg-green-50 px-1 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.addressLine1}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* House / Flat Number Field */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border shadow-xs space-y-2" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <label className="block text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
            House / Flat / Building No. (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Flat 101, Doormeets Tower"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Apply Location Button */}
        <button
          onClick={() => handleSaveAndApply()}
          disabled={!mapAddress}
          className="w-full py-3.5 rounded-xl font-black text-white text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-lg cursor-pointer"
          style={{ backgroundColor: themeColors.button }}
        >
          Confirm & Save Location
        </button>
      </div>
    </div>
  );
};

export default SelectLocationPage;
