import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { FiCrosshair } from 'react-icons/fi';
import flutterBridge from '../../../../../utils/flutterBridge';
import { toast } from 'react-hot-toast';

const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '256px'
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

const getValidLatLng = (pos) => {
  if (!pos || typeof pos !== 'object') return null;
  const rawLat = pos.lat ?? pos.latitude;
  const rawLng = pos.lng ?? pos.longitude;
  if (rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (isNaN(lat) || !isFinite(lat) || isNaN(lng) || !isFinite(lng)) return null;
  return { lat, lng };
};

const LocationPicker = ({ onLocationSelect, initialPosition = null }) => {
  const [map, setMap] = useState(null);
  const validInitial = getValidLatLng(initialPosition);
  const [marker, setMarker] = useState(validInitial || defaultCenter);
  const [autocomplete, setAutocomplete] = useState(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = React.useRef(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Update marker when initialPosition changes (from external selection)
  useEffect(() => {
    const validPos = getValidLatLng(initialPosition);
    if (validPos) {
      setMarker(validPos);
      if (map) {
        map.panTo(validPos);
        map.setZoom(15);
      }
    }
  }, [initialPosition, map]);

  // Get user's current location on mount
  useEffect(() => {
    const validPos = getValidLatLng(initialPosition);
    if (!validPos && isLoaded) {
      handleCurrentLocation();
    }
  }, [isLoaded, initialPosition]);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (position) => {
    const validPos = getValidLatLng(position);
    if (!window.google || !validPos) return;

    setLoading(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: validPos }, (results, status) => {
      setLoading(false);
      if (status === 'OK' && results[0]) {
        if (onLocationSelect) {
          onLocationSelect({
            lat: validPos.lat,
            lng: validPos.lng,
            address: results[0].formatted_address,
            components: results[0].address_components
          });
        }
      }
    });
  };

  // Handle map click
  const onMapClick = useCallback((e) => {
    if (!e || !e.latLng) return;
    const newPos = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    const validPos = getValidLatLng(newPos);
    if (validPos) {
      setMarker(validPos);
      reverseGeocode(validPos);
    }
  }, []);

  // Handle autocomplete place selection
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        const validPos = getValidLatLng(newPos);
        if (validPos) {
          setMarker(validPos);
          if (map) {
            map.panTo(validPos);
            map.setZoom(15);
          }
          if (onLocationSelect) {
            onLocationSelect({
              lat: validPos.lat,
              lng: validPos.lng,
              address: place.formatted_address
            });
          }
        }
      }
    }
  };

  // Handle current location button
  const handleCurrentLocation = async () => {
    setLoading(true);
    loadingRef.current = true;
    
    // Safety timer: If it takes more than 5 seconds, prompt user to check GPS
    const slowLocationTimer = setTimeout(() => {
      if (loadingRef.current) {
        window.dispatchEvent(new CustomEvent('requestLocationPrompt'));
        toast('Location taking too long. Please ensure GPS is ON.', { icon: '📍' });
      }
    }, 5000);

    try {
      const pos = await flutterBridge.getCurrentLocation();
      clearTimeout(slowLocationTimer);
      setLoading(false);
      loadingRef.current = false;
      
      const newPos = getValidLatLng({
        lat: pos?.latitude,
        lng: pos?.longitude
      });
      
      if (newPos) {
        setMarker(newPos);
        if (map) {
          map.panTo(newPos);
          map.setZoom(17);
        }
        reverseGeocode(newPos);
      } else {
        toast.error("Unable to retrieve valid GPS coordinates.");
      }
    } catch (error) {
      clearTimeout(slowLocationTimer);
      setLoading(false);
      loadingRef.current = false;
      console.error("Geolocation error:", error);
      
      // Trigger the specialized "Allow GPS" popup
      window.dispatchEvent(new CustomEvent('requestLocationPrompt'));
      
      let errorMessage = 'Unable to get location.';
      if (error?.code === 1) errorMessage = 'Location permission denied.';
      else if (error?.code === 2) errorMessage = 'GPS is turned off.';
      else if (error?.code === 3) errorMessage = 'Location request timed out.';

      toast.error(`${errorMessage} Please select manually on the map.`);
    }
  };

  if (loadError) {
    return <div className="h-64 bg-gray-200 flex items-center justify-center">
      <p className="text-red-600">Error loading Google Maps</p>
    </div>;
  }

  if (!isLoaded) {
    return <div className="h-64 bg-gray-200 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
    </div>;
  }

  const currentCenter = getValidLatLng(marker) || defaultCenter;
  const currentMarkerPosition = getValidLatLng(marker);

  return (
    <div className="w-full">
      <div className="relative h-64 bg-gray-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentCenter}
          zoom={15}
          onClick={onMapClick}
          onLoad={setMap}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            rotateControl: true,
            tiltControl: true,
            zoomControl: false
          }}
        >
          {currentMarkerPosition && <Marker position={currentMarkerPosition} />}
        </GoogleMap>

        {/* Pin Instruction Overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-10">
          {loading ? 'Fetching address...' : 'Place the pin accurately on map'}
        </div>

        {/* Locate Me Button */}
        <button
          onClick={handleCurrentLocation}
          className="absolute bottom-16 right-4 p-3 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all z-10"
        >
          <FiCrosshair className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
};

export default LocationPicker;
