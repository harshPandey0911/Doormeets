import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiTool, FiUser, FiPhone, FiArrowRight, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

const SKILLS = [
  'Plumbing', 'Electrician', 'Painting', 'Carpentry', 'Mason / Construction',
  'AC / Appliance Repair', 'Cleaning', 'Welding', 'Tiling', 'Gardening',
  'Security Guard', 'Driving', 'Helper / General Labour'
];

const LabourRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, verificationToken } = location.state || {};

  const [form, setForm] = useState({ name: '', skills: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!phone || !verificationToken) {
      toast.error('Session expired. Please login again.');
      navigate('/labour/login', { replace: true });
    }
  }, [phone, verificationToken, navigate]);

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Please enter your name'); return; }
    if (form.skills.length === 0) { toast.error('Please select at least one skill'); return; }

    setIsLoading(true);
    try {
      const res = await api.post('/workers/auth/register', {
        name: form.name.trim(),
        phone,
        verificationToken,
        serviceCategories: form.skills
      });

      if (res.data.success) {
        // Store tokens if returned
        if (res.data.accessToken) {
          localStorage.setItem('labourAccessToken', res.data.accessToken);
          localStorage.setItem('labourRefreshToken', res.data.refreshToken);
          localStorage.setItem('labourData', JSON.stringify(res.data.worker || {}));
        }
        toast.success('Registered successfully! Welcome aboard.');
        navigate('/labour/dashboard', { replace: true });
      } else {
        toast.error(res.data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 py-12 px-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-amber-400 opacity-[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-400 opacity-[0.05] rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-orange-200">
            <FiTool className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Labour Account</h1>
          <p className="mt-2 text-sm text-gray-500">Setup your profile to start receiving booking requests</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <FiPhone className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">+91 {phone}</span>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/60 p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-400 rounded-t-[2rem]" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.18em] mb-2 block">Your Full Name *</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Raju Sharma"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all font-medium"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.18em] mb-3 block">
                Your Skills * <span className="text-gray-300 normal-case font-medium">(Select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(skill => {
                  const selected = form.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 ${
                        selected
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {selected && <FiCheck className="w-3 h-3" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
              {form.skills.length > 0 && (
                <p className="text-xs text-orange-600 font-bold mt-2">{form.skills.length} skill(s) selected</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Account...</>
              ) : (
                <>Start Working <FiArrowRight /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LabourRegister;
