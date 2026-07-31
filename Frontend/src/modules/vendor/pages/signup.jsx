import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiPhone, FiBriefcase, FiArrowRight, FiChevronDown, FiCheck, FiGift } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../theme';
import { register } from '../services/authService';
import api from '../../../services/api';
import LogoLoader from '../../../components/common/LogoLoader';
import Logo from '../../../components/common/Logo';
import loginIllustration from '../../../assets/images/loginpage.png';

const VendorSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vendorSignupDraft');
      return saved ? JSON.parse(saved) : { name: '', phone: '', professionIds: [], referralCode: '' };
    } catch {
      return { name: '', phone: '', professionIds: [], referralCode: '' };
    }
  });
  const [professions, setProfessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProfessions, setLoadingProfessions] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Save draft form data to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem('vendorSignupDraft', JSON.stringify(formData));
  }, [formData]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#profession-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedLabels = () => {
    if (!formData.professionIds || formData.professionIds.length === 0) {
      return 'Select your professions';
    }
    const selectedObj = professions.filter(p => formData.professionIds.includes(p._id));
    return selectedObj.map(p => p.name).join(', ');
  };

  useEffect(() => {
    // Clear any existing vendor tokens on page load
    localStorage.removeItem('vendorAccessToken');
    localStorage.removeItem('vendorRefreshToken');
    localStorage.removeItem('vendorData');
    
    // Fetch professions for dropdown
    const fetchProfessions = async () => {
      try {
        const response = await api.get('/public/professions');
        setProfessions(response.data?.data || []);
      } catch (err) {
        console.error('Error fetching professions:', err);
        toast.error('Failed to load professions');
      } finally {
        setLoadingProfessions(false);
      }
    };
    fetchProfessions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Format Full Name to allow only letters and spaces
    const cleanValue = name === 'name' ? value.replace(/[^a-zA-Z\s]/g, '') : value;
    setFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));
  };

  const toggleProfession = (profId) => {
    setFormData(prev => {
      const current = prev.professionIds || [];
      if (current.includes(profId)) {
        return { ...prev, professionIds: current.filter(id => id !== profId) };
      } else {
        return { ...prev, professionIds: [...current, profId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !/^[a-zA-Z\s]{2,}$/.test(formData.name.trim())) {
      toast.error('Full Name should contain only letters (at least 2 characters)');
      return;
    }
    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9');
      return;
    }
    if (!formData.professionIds || formData.professionIds.length === 0) {
      toast.error('Please select at least one profession');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        professionIds: formData.professionIds,
        professionId: formData.professionIds[0], // Fallback for backward compatibility
        referralCode: formData.referralCode
      };
      const response = await register(payload);
      if (response.success) {
        toast.success('Registration successful!');
        if (response.accessToken) {
          localStorage.setItem('vendorAccessToken', response.accessToken);
          localStorage.setItem('vendorRefreshToken', response.refreshToken);
          localStorage.setItem('vendorData', JSON.stringify(response.vendor));
          navigate('/vendor/verification');
        } else {
          navigate('/vendor/login');
        }
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const brandColor = '#B33A35';

  return (
    <div className="min-h-[100dvh] bg-[#F4F5F8] md:bg-gray-100 flex flex-col justify-start md:justify-center md:py-12 md:px-6 lg:px-8 relative overflow-x-hidden font-['Montserrat']">
      <div className="w-full max-w-md mx-auto bg-white md:rounded-3xl md:shadow-2xl md:border md:border-gray-100 overflow-hidden flex flex-col min-h-[100dvh] md:min-h-0 relative animate-fade-in">
        
        {/* Top Section: Header Banner with Illustration */}
        <div className="w-full bg-[#F4F5F8] py-4 px-6 relative flex items-center justify-center select-none border-b border-gray-100">

          {/* Illustration */}
          <img
            src={loginIllustration}
            alt="Signup Illustration"
            className="mx-auto mt-2 h-[140px] w-auto object-contain"
          />
        </div>

        {/* Bottom Section: Form Fields */}
        <div className="flex-1 bg-white px-7 py-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Vendor Registration
            </h2>
            <p className="mt-1 text-xs text-gray-500 font-normal">
              Join Doormeets to grow your business
            </p>

            <div className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <FiUser />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-4 py-2.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium text-sm border-r border-gray-200 pr-3">+91</span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length > 0 && !/^[6-9]/.test(val)) return;
                        setFormData(p => ({ ...p, phone: val.slice(0, 10) }));
                      }}
                      className="block w-full pl-16 pr-4 py-2.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>

                {/* Referral Code */}
                <div>
                  <label htmlFor="referralCode" className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex justify-between items-center">
                    <span>Referral Code</span>
                    <span className="text-[10px] text-gray-400 font-normal normal-case">Optional</span>
                  </label>
                  <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <FiGift className="w-4 h-4" />
                    </div>
                    <input
                      id="referralCode"
                      name="referralCode"
                      type="text"
                      value={formData.referralCode || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setFormData(p => ({ ...p, referralCode: val }));
                      }}
                      className="block w-full pl-10 pr-4 py-2.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                    />
                  </div>
                </div>

                {/* Profession Multi-Select Dropdown */}
                <div id="profession-dropdown-container" className="relative">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex justify-between items-center">
                    <span>Profession</span>
                    {formData.professionIds.length > 0 && (
                      <span className="text-[10px] text-[#B33A35] font-bold">
                        {formData.professionIds.length} Selected
                      </span>
                    )}
                  </label>
                  
                  {/* Dropdown Trigger Box */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between pl-4 pr-3 py-2.5 rounded-2xl border text-sm transition-all duration-200 bg-white text-left ${
                      isDropdownOpen
                        ? 'border-[#B33A35] ring-1 ring-[#B33A35]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <FiBriefcase className={`w-4 h-4 shrink-0 ${formData.professionIds.length > 0 ? 'text-[#B33A35]' : 'text-gray-400'}`} />
                      <span className={`truncate text-sm ${formData.professionIds.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {getSelectedLabels()}
                      </span>
                    </div>
                    <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180 text-[#B33A35]' : ''}`} />
                  </button>

                  {/* Dropdown Options Popup */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      {loadingProfessions ? (
                        <div className="p-3 text-center text-xs text-gray-400">Loading professions...</div>
                      ) : professions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-400">No professions available</div>
                      ) : (
                        professions.map(prof => {
                          const isSelected = formData.professionIds.includes(prof._id);
                          return (
                            <button
                              key={prof._id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProfession(prof._id);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                                isSelected
                                  ? 'bg-[#B33A35]/10 text-[#B33A35] font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{prof.name}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isSelected ? 'bg-[#B33A35] border-[#B33A35] text-white' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <FiCheck className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-1.5 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 text-center flex justify-center items-center gap-2 shadow-lg shadow-[#B33A35]/20 cursor-pointer active:scale-[0.98]"
                >
                  {isLoading ? (
                    <LogoLoader fullScreen={false} inline={true} size="w-5 h-5" />
                  ) : (
                    <>
                      <span>Register</span>
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-3">
            <p className="text-center text-xs text-gray-500 font-medium">
              Already registered?{' '}
              <Link to="/vendor/login" className="text-[#B33A35] hover:text-[#9E2E2A] font-semibold transition-colors">
                Login here
              </Link>
            </p>
            <p className="mt-2 text-center text-[10px] text-gray-400 font-normal">
              &copy; {new Date().getFullYear()} Doormeets. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorSignup;
