import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiMoreVertical, FiEdit2, FiTrash2, FiMapPin, FiNavigation } from 'react-icons/fi';
import AddressSelectionModal from '../Checkout/components/AddressSelectionModal';
import { userAuthService } from '../../../../services/authService';
import { apiCache } from '../../../../utils/apiCache';

import { z } from "zod";

// Zod schema for Address validation
const addressSchema = z.object({
  addressLine1: z.string().min(5, "Address location is too short"),
  addressLine2: z.string().optional(), // House Number
  city: z.string().min(2, "City name is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid Pincode format"),
});

const ManageAddresses = () => {
  const navigate = useNavigate();

  // Initialize addresses from profile cache or localStorage instantly
  const [addresses, setAddresses] = useState(() => {
    const cached = apiCache.getStale('user:profile');
    if (cached?.addresses) return cached.addresses;
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const u = JSON.parse(stored);
        return u.addresses || [];
      }
    } catch {}
    return [];
  });
  // Only show loader if truly no address data cached
  const [loading, setLoading] = useState(() => {
    const cached = apiCache.getStale('user:profile');
    if (cached?.addresses) return false;
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const u = JSON.parse(stored);
        return !u.addresses;
      }
    } catch {}
    return true;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [houseNumber, setHouseNumber] = useState('');

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      // Don't show loader if we already have addresses from cache
      const hasStale = apiCache.getStale('user:profile');
      if (!hasStale) setLoading(true);

      const response = await userAuthService.getProfile();
      if (response.success && response.user?.addresses) {
        setAddresses(response.user.addresses);
        // Update profile cache with fresh addresses for next visit
        const freshProfile = {
          name: response.user.name || '',
          phone: response.user.phone || '',
          email: response.user.email || '',
          profilePhoto: response.user.profilePhoto || '',
          walletBalance: response.user.wallet?.balance ?? 0,
          plans: response.user.plans,
          addresses: response.user.addresses
        };
        apiCache.set('user:profile', freshProfile, 60);
        try { localStorage.setItem('userData', JSON.stringify(response.user)); } catch {}
      }
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };


  const handleAddAddress = () => {
    setEditingAddress(null);
    setHouseNumber('');
    setShowAddModal(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setHouseNumber(address.addressLine2 || '');
    setShowMenu(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingAddress(null);
    setHouseNumber('');
  };

  const getComponent = (components, type) => {
    return components?.find(c => c.types.includes(type))?.long_name || '';
  };

  const handleSaveAddress = async (savedHouseNumber, locationObj) => {
    try {
      if (!locationObj) {
        toast.error('Please select a location on the map');
        return;
      }

      // Extract details
      const components = locationObj.components || [];
      const city = getComponent(components, 'locality') || getComponent(components, 'administrative_area_level_2') || '';
      const state = getComponent(components, 'administrative_area_level_1') || '';
      const pincode = getComponent(components, 'postal_code') || '';

      // Zod Validation Preparation
      const addressData = {
        addressLine1: locationObj.address,
        addressLine2: savedHouseNumber,
        city,
        state,
        pincode
      };

      const validationResult = addressSchema.safeParse(addressData);
      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const newAddress = {
        type: 'home', // Default type
        ...addressData,
        lat: locationObj.lat,
        lng: locationObj.lng,
        isDefault: editingAddress ? editingAddress.isDefault : addresses.length === 0
      };

      let updatedAddresses;
      if (editingAddress) {
        updatedAddresses = addresses.map(addr => 
          (addr._id || addr.id) === (editingAddress._id || editingAddress.id)
            ? { ...addr, ...newAddress }
            : addr
        );
      } else {
        updatedAddresses = [...addresses, newAddress];
      }

      // Call API
      toast.loading('Saving address...');
      const response = await userAuthService.updateProfile({ addresses: updatedAddresses });
      toast.dismiss();

      if (response.success) {
        setAddresses(response.user.addresses || updatedAddresses);
        toast.success(editingAddress ? 'Address updated!' : 'Address added!');
        handleCloseModal();
      } else {
        toast.error(response.message || 'Failed to save address');
      }

    } catch (error) {
      console.error('[Save Address Error]:', error);
      toast.dismiss();
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (addressId) => {
    try {
      const updatedAddresses = addresses.filter(addr => (addr._id || addr.id) !== addressId);

      toast.loading('Deleting address...');
      const response = await userAuthService.updateProfile({ addresses: updatedAddresses });
      toast.dismiss();

      if (response.success) {
        setAddresses(response.user.addresses || updatedAddresses);
        setShowMenu(null);
        toast.success('Address deleted successfully!');
      } else {
        toast.error('Failed to delete address');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: (addr._id || addr.id) === addressId
      }));

      toast.loading('Setting default address...');
      const response = await userAuthService.updateProfile({ addresses: updatedAddresses });
      toast.dismiss();

      if (response.success) {
        setAddresses(response.user.addresses || updatedAddresses);
        setShowMenu(null);
        toast.success('Default address updated!');
      } else {
        toast.error('Failed to update default address');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Something went wrong');
    }
  };

  const handleMenuToggle = (addressId) => {
    setShowMenu(showMenu === addressId ? null : addressId);
  };

  // Helper to format address for display
  const formatAddress = (addr) => {
    const parts = [
      addr.addressLine2,
      addr.addressLine1,
      addr.city,
      addr.state,
      addr.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="min-h-screen bg-light-bg pb-4">
      {/* Header */}
      <header className="bg-transparent border-b border-border-color sticky top-0 z-30 w-full">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800/10 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-dark-text" />
            </button>
            <h1 className="text-xl font-bold text-dark-text">Manage Addresses</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4">


        {/* Saved Addresses Section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-secondary-text uppercase tracking-wider">Saved Addresses</h2>
          <button
            onClick={handleAddAddress}
            className="flex items-center gap-1.5 text-sm font-bold text-purple-600 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Address
          </button>
        </div>

        {/* Loading State */}
        {loading && addresses.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-4 border-border-color border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-secondary-text">Loading your addresses...</p>
          </div>
        )}
 
        {/* Empty State */}
        {!loading && addresses.length === 0 && (
          <div className="py-10 text-center bg-card-bg rounded-2xl border-2 border-dashed border-border-color">
            <FiMapPin className="w-12 h-12 text-secondary-text mx-auto mb-2" />
            <p className="text-sm text-secondary-text font-medium">No saved addresses yet</p>
          </div>
        )}

        {/* Address List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id || address.id}
              className="bg-card-bg border border-border-color rounded-xl p-4 relative"
            >
              {/* Menu Button */}
              <button
                onClick={() => handleMenuToggle(address._id || address.id)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800/10 rounded-full transition-colors cursor-pointer"
              >
                <FiMoreVertical className="w-5 h-5 text-secondary-text" />
              </button>
 
              {/* Menu Dropdown */}
              {showMenu === (address._id || address.id) && (
                <div className="absolute top-12 right-4 bg-card-bg border border-border-color rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => handleEdit(address)}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-800/10 transition-colors text-left cursor-pointer"
                  >
                    <FiEdit2 className="w-4 h-4 text-secondary-text" />
                    <span className="text-sm text-dark-text">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(address._id || address.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-800/10 transition-colors text-left text-red-600 cursor-pointer"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address._id || address.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-800/10 transition-colors text-left text-teal-600 cursor-pointer font-semibold border-t border-border-color"
                    >
                      <FiMapPin className="w-4 h-4" />
                      <span className="text-sm">Set Default</span>
                    </button>
                  )}
                </div>
              )}

              {/* Address Content */}
              <div className="pr-12">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-gray-500/10 rounded text-xs font-bold uppercase text-secondary-text">
                    {address.type || 'HOME'}
                  </span>
                  {address.isDefault && (
                    <span className="px-2 py-0.5 bg-green-500/10 rounded text-xs font-bold uppercase text-green-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-dark-text mb-2 leading-relaxed font-medium">
                  {/* Combined line 1 & 2 for title-like display if needed, or just full address */}
                  {address.addressLine2 ? `${address.addressLine2}, ` : ''}{address.addressLine1}
                </p>
                <p className="text-xs text-secondary-text">
                  {address.city}, {address.state} - {address.pincode}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Address Selection Modal (Reuse from Checkout) */}
      <AddressSelectionModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        houseNumber={houseNumber}
        onHouseNumberChange={setHouseNumber}
        onSave={handleSaveAddress}
      />

      {/* Close menu when clicking outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
};

export default ManageAddresses;

