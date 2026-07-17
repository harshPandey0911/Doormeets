import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiPhone, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../theme';
import { register } from '../services/authService';
import api from '../../../services/api';
import LogoLoader from '../../../components/common/LogoLoader';
import Logo from '../../../components/common/Logo';
import loginIllustration from '../../../assets/images/loginpage.png';

const VendorSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    professionId: ''
  });
  const [professions, setProfessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProfessions, setLoadingProfessions] = useState(true);

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.name.length < 2) {
      toast.error('Please enter a valid name');
      return;
    }
    if (!formData.phone || formData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.professionId) {
      toast.error('Please select a profession');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register(formData);
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
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className="block w-full pl-16 pr-4 py-2.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>

                {/* Profession dropdown */}
                <div>
                  <label htmlFor="professionId" className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Profession
                  </label>
                  <div className="relative rounded-2xl border border-gray-200 overflow-hidden focus-within:border-[#B33A35] focus-within:ring-1 focus-within:ring-[#B33A35] transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <FiBriefcase />
                    </div>
                    <select
                      id="professionId"
                      name="professionId"
                      required
                      value={formData.professionId}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-2.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-0 appearance-none bg-white"
                      disabled={loadingProfessions}
                    >
                      <option value="" disabled>Select your profession</option>
                      {professions.map(prof => (
                        <option key={prof._id} value={prof._id}>{prof.name}</option>
                      ))}
                    </select>
                  </div>
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
