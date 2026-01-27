import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiX, FiSearch, FiMapPin, FiHome } from 'react-icons/fi';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { themeColors } from '../../../../../theme';
import LocationPicker from './LocationPicker';

const libraries = ['places', 'geometry'];

const AddressSelectionModal = ({ isOpen, onClose, address = '', houseNumber = '', onHouseNumberChange, onSave }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapAddress, setMapAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      setIsClosing(false);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

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

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div
          className={`bg-white rounded-t-3xl ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
          style={{
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <FiArrowLeft className="w-5 h-5 text-black" />
              </button>
              <h1 className="text-xl font-bold text-black">Confirm Location</h1>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiX className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Info Card - Styled with Brand Colors */}
          <div className="px-4 pt-4 shrink-0">
            <div className="rounded-xl p-3 mb-2 border" style={{ backgroundColor: `${themeColors.brand.teal}0D`, borderColor: `${themeColors.brand.teal}1A` }}>
              <div className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: themeColors.button }} />
                <div>
                  <h3 className="font-semibold mb-1 text-sm" style={{ color: themeColors.button }}>Set Delivery Location</h3>
                  <p className="text-xs" style={{ color: `${themeColors.brand.teal}CC` }}>
                    Place the pin accurately on the map to help the professional find you easily.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="px-4 pb-2 shrink-0">
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialPosition={selectedLocation}
              />
            </div>
          </div>

          {/* Address Details - Scrollable */}
          <div
            className="px-4 py-2 pb-8 overflow-y-auto flex-1"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {/* Address Search */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    componentRestrictions: { country: 'in' },
                    fields: ['formatted_address', 'geometry', 'name']
                  }}
                >
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="text"
                      placeholder="Search for area, street name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition-colors"
                      style={{ borderColor: '#e5e7eb' }}
                      onFocus={(e) => e.target.style.borderColor = themeColors.button}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </Autocomplete>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Loading Maps..."
                    disabled
                    className="w-full pl-4 py-3 border-2 rounded-lg text-sm bg-gray-100"
                  />
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={() => onSave('', selectedLocation)}
              disabled={!mapAddress}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-24"
              style={{
                backgroundColor: themeColors.button,
                boxShadow: `0 4px 12px ${themeColors.button}40`
              }}
            >
              Save Address
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddressSelectionModal;
