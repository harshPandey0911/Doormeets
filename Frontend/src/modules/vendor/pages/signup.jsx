import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiPhone, FiBriefcase, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../theme';
import { register } from '../services/authService';
import api from '../../../services/api';
import LogoLoader from '../../../components/common/LogoLoader';
import Logo from '../../../components/common/Logo';

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
        toast.success('Registration successful! You can now login.');
        navigate('/vendor/login');
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const brandColor = themeColors.brand?.teal || '#9634f7';

  return (
    <div className="min-h-screen flex flex-col pt-8 pb-8 px-4 sm:px-6 lg:px-8 relative bg-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF9F45] opacity-[0.05] rounded-full blur-3xl animate-floating" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF9F45] opacity-[0.03] rounded-full blur-3xl animate-floating" style={{ animationDelay: '2s' }} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 relative z-10 animate-fade-in">
        <Logo className="h-10 w-auto mx-auto transform hover:scale-110 transition-transform duration-500" />
        <h2 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
          Vendor Registration
        </h2>
        <p className="mt-2 text-sm text-gray-600 animate-stagger-1 animate-fade-in">
          Join Doormeets to grow your business
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100 relative overflow-hidden animate-slide-in-bottom">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9F45] via-[#FFB86C] to-[#FF9F45]" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 animate-stagger-1 animate-fade-in">
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-[#FF9F45] transition-colors">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                    style={{ '--tw-ring-color': brandColor }}
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 border-r pr-2 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-bold">+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className="block w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                    style={{ '--tw-ring-color': brandColor }}
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-[#FF9F45] transition-colors">
                    <FiBriefcase className="text-gray-400" />
                  </div>
                  <select
                    name="professionId"
                    required
                    value={formData.professionId}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400 appearance-none bg-white"
                    style={{ '--tw-ring-color': brandColor }}
                    disabled={loadingProfessions}
                  >
                    <option value="" disabled>Select your profession</option>
                    {professions.map(prof => (
                      <option key={prof._id} value={prof._id}>{prof.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="animate-stagger-3 animate-fade-in pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 10px 15px -3px ${brandColor}4D`
                }}
              >
                <span className="absolute inset-0 w-full h-full bg-white/10 group-hover:translate-x-full transition-transform duration-700 -translate-x-full" />
                {isLoading ? (
                  <div className="flex flex-col items-center gap-1">
                    <LogoLoader fullScreen={false} inline={true} size="w-5 h-5" />
                  </div>
                ) : (
                  <span className="flex items-center relative z-10">
                    Register
                    <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600 animate-fade-in animate-stagger-4">
          Already registered?{' '}
          <Link to="/vendor/login" className="font-semibold hover:text-[#FFB86C] transition-colors" style={{ color: brandColor }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VendorSignup;
