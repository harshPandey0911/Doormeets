import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCamera, FiImage, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../../theme';
import { userAuthService } from '../../../../services/authService';
import flutterBridge from '../../../../utils/flutterBridge';
import { apiCache } from '../../../../utils/apiCache';

import { z } from "zod";

// Zod schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").refine(val => val.includes('@'), "Invalid email address"),
});

const UpdateProfile = () => {
  const navigate = useNavigate();

  // Initialize form data instantly from cache or localStorage (no delay/empty fields)
  const [formData, setFormData] = useState(() => {
    // 1. Check cached profile first
    const cached = apiCache.getStale('user:profile');
    if (cached) {
      return {
        name: cached.name || '',
        email: cached.email || '',
        phone: cached.phone || '',
        profilePhoto: cached.profilePhoto || '',
      };
    }
    // 2. Fallback to localStorage
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          profilePhoto: u.profilePhoto || '',
        };
      }
    } catch {}
    return { name: '', email: '', phone: '', profilePhoto: '' };
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Set isLoading to false if we have cached data to avoid disabling fields on load
  const [isLoading, setIsLoading] = useState(() => {
    const cached = apiCache.getStale('user:profile');
    if (cached) return false;
    try {
      const stored = localStorage.getItem('userData');
      return !stored;
    } catch {}
    return true;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isFlutter, setIsFlutter] = useState(flutterBridge.isFlutter);
  const [showSourceSheet, setShowSourceSheet] = useState(false);

  // Sync flutter bridge state
  useEffect(() => {
    flutterBridge.waitForFlutter().then(ready => {
      setIsFlutter(ready);
    });
  }, []);

  const handleNativeCamera = async () => {
    try {
      const file = await flutterBridge.openCamera();
      if (file) {
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        flutterBridge.hapticFeedback('success');
      }
    } catch (error) {
      console.error('Native camera failed:', error);
    }
  };

  const handleImageClick = () => {
    setShowSourceSheet(true);
  };

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // SWR: Skip fetch if cache still fresh
        const cached = apiCache.get('user:profile');
        if (cached) {
          setFormData({
            name: cached.name || '',
            email: cached.email || '',
            phone: cached.phone || '',
            profilePhoto: cached.profilePhoto || '',
          });
          setIsLoading(false);
          return;
        }

        // Fetch fresh data from API
        const response = await userAuthService.getProfile();
        if (response.success && response.user) {
          const user = response.user;
          const freshProfile = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            profilePhoto: user.profilePhoto || '',
            walletBalance: user.wallet?.balance ?? 0,
            plans: user.plans,
            addresses: user.addresses || []
          };
          apiCache.set('user:profile', freshProfile, 60);
          setFormData({
            name: freshProfile.name,
            email: freshProfile.email,
            phone: freshProfile.phone,
            profilePhoto: freshProfile.profilePhoto,
          });

          // Update localStorage with fresh data
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            const updatedLocal = { ...JSON.parse(storedUserData), ...user };
            localStorage.setItem('userData', JSON.stringify(updatedLocal));
          }
        }
      } catch (error) {
        // Use localStorage data if API fails
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            profilePhoto: userData.profilePhoto || '',
          });
        } else {
          toast.error('Failed to load profile data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Upload file helper
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    let baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    if (!baseUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5000';
      } else {
        baseUrl = window.location.origin;
      }
    }
    baseUrl = baseUrl.replace(/\/api$/, '');
    const response = await fetch(`${baseUrl}/api/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    return data.imageUrl;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    if (phone.startsWith('+91')) return phone;
    if (phone.length === 10) return `+91 ${phone}`;
    return phone;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Zod Validation
    const validationResult = profileSchema.safeParse({
      name: formData.name.trim(),
      email: formData.email.trim()
    });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsSaving(true);
    setUploading(true);
    try {
      let photoUrl = formData.profilePhoto;

      // Upload photo if selected
      if (photoFile) {
        try {
          photoUrl = await uploadFile(photoFile);
        } catch (err) {
          console.error('Photo upload failed:', err);
          toast.error('Failed to upload profile photo');
          setIsSaving(false);
          setUploading(false);
          return;
        }
      }

      const response = await userAuthService.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        profilePhoto: photoUrl
      });

      if (response.success) {
        toast.success('Profile updated successfully!');
        // authService.updateProfile already updates localStorage with response.user
        // but let's ensure we have the latest data
        if (response.user) {
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            const existingData = JSON.parse(storedUserData);
            const updatedData = { ...existingData, ...response.user };
            localStorage.setItem('userData', JSON.stringify(updatedData));
          } else {
            localStorage.setItem('userData', JSON.stringify(response.user));
          }
        }
        navigate('/user/account');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate('/user/account');
  };

  return (
    <div className="min-h-screen bg-light-bg pb-20">
      {/* Header */}
      <header className="bg-transparent border-b border-border-color sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-800/10 rounded-full transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-dark-text" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-dark-text tracking-tight">Update Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
        {/* Profile Form Card Wrapper */}
        <div className="max-w-2xl mx-auto md:bg-card-bg md:border md:border-border-color md:rounded-2xl md:p-8 md:shadow-sm">
          <div className="space-y-5">
          {/* Profile Photo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative group">
              <div
                className="w-28 h-28 rounded-full overflow-hidden border-4 border-border-color shadow-xl cursor-pointer"
                style={{ background: 'var(--card-bg)' }}
                onClick={handleImageClick}
              >
                {photoPreview || formData.profilePhoto ? (
                  <img
                    src={photoPreview || formData.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-card-bg text-secondary-text">
                    <FiUser className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div
                onClick={handleImageClick}
                className="absolute bottom-1 right-1 p-2 rounded-full cursor-pointer shadow-lg transition-transform active:scale-95 hover:scale-105"
                style={{ background: themeColors.button }}
              >
                <FiCamera className="w-5 h-5 text-white" />
                <input
                  id="user-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <p className="text-secondary-text text-[10px] mt-3 font-bold uppercase tracking-wider">Tap to change photo</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-dark-text mb-2">
              Full Name
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: themeColors.button }}
              >
                <FiUser className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-color bg-card-bg text-dark-text focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{
                  focusRingColor: themeColors.button,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = themeColors.button;
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 166, 166, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-dark-text mb-2">
              Email Address
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: themeColors.button }}
              >
                <FiMail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-color bg-card-bg text-dark-text focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                onFocus={(e) => {
                  e.target.style.borderColor = themeColors.button;
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 166, 166, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-dark-text mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: themeColors.button }}
              >
                <FiPhone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formatPhoneNumber(formData.phone)}
                disabled
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-color bg-card-bg/60 text-secondary-text cursor-not-allowed"
                placeholder="Phone number cannot be changed"
              />
              <p className="text-xs text-secondary-text mt-1 ml-1">
                Phone number cannot be changed for security reasons
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="w-full text-white font-bold py-3.5 rounded-xl active:scale-98 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${themeColors.button} 0%, ${themeColors.icon} 100%)`,
              boxShadow: '0 4px 12px rgba(0, 166, 166, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isSaving) {
                e.target.style.boxShadow = '0 6px 16px rgba(0, 166, 166, 0.5)';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 12px rgba(0, 166, 166, 0.4)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>

      {/* Photo Source Selection - Mobile Styled Bottom Sheet */}
      <AnimatePresence>
        {showSourceSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSourceSheet(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-card-bg border border-border-color w-full rounded-t-[32px] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10"
            >
              <div className="w-12 h-1.5 bg-border-color rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-dark-text text-lg">Select Photo Source</h4>
                <button 
                  onClick={() => setShowSourceSheet(false)}
                  className="p-2 bg-gray-800/10 rounded-full text-secondary-text cursor-pointer"
                >
                  <FiX />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Camera Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceSheet(false);
                    if (isFlutter) {
                      handleNativeCamera();
                    } else {
                      // On web, if they want camera specifically we'd need another input, 
                      // but standard input with capture="environment" works for mobile browsers.
                      // For now, let's just trigger the same input which allows both on most browsers.
                      document.getElementById('user-photo-upload')?.click();
                    }
                  }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-teal-100 active:scale-95 transition-all"
                  style={{ backgroundColor: `${themeColors.button}10` }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: themeColors.button }}
                  >
                    <FiCamera className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-teal-800 text-sm">Take Photo</span>
                </button>

                {/* Gallery Option */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceSheet(false);
                    document.getElementById('user-photo-upload')?.click();
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <FiImage className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-blue-400 text-sm">Gallery</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UpdateProfile;

