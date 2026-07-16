import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdPerson, MdPhone, MdBuild, MdCheckCircleOutline } from 'react-icons/md';

const AddVendor = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProfessions, setSelectedProfessions] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const response = await axios.get(`${API_URL}/public/professions`);
        if (response.data.success) {
          setProfessions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching professions:', err);
      }
    };
    fetchProfessions();
  }, []);

  const handleRemoveProfession = (id) => {
    setSelectedProfessions(selectedProfessions.filter(p => p._id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProfessions.length === 0) {
      setError('Please select at least one profession.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('shopAccessToken');
      const response = await axios.post(
        `${API_URL}/shop/vendors/add`,
        { 
          name, 
          phone, 
          professionIds: selectedProfessions.map(p => p._id),
          professionId: selectedProfessions[0]?._id // backwards compatibility
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess(true);
        setName('');
        setPhone('');
        setSelectedProfessions([]);
      } else {
        setError(response.data.message || 'Failed to onboard vendor.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while submitting vendor details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        {success && (
          <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 flex items-start space-x-3">
            <MdCheckCircleOutline className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-base mb-1">Vendor Registered Successfully!</h4>
              <p className="text-sm text-emerald-700 leading-normal">
                The vendor record has been created in the pending state. The referred vendor can now log in to the Doormeets App or Vendor Panel using their phone number to complete verification (submit Aadhar/PAN, complete police verification, and take training). Once approved by the admin, both of you will receive your referral bonuses.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Name */}
            <div>
              <label htmlFor="vendorName" className="block text-sm font-bold text-gray-700 mb-2">
                Vendor Full Name
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <MdPerson className="w-5 h-5" />
                </div>
                <input
                  id="vendorName"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Vendor Phone */}
            <div>
              <label htmlFor="vendorPhone" className="block text-sm font-bold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <MdPhone className="w-5 h-5" />
                </div>
                <input
                  id="vendorPhone"
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Profession Dropdown / Multiple Select */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Profession / Skills (Select multiple)
            </label>
            
            {/* Selected Badges */}
            {selectedProfessions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedProfessions.map((prof) => (
                  <span
                    key={prof._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100"
                  >
                    {prof.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveProfession(prof._id)}
                      className="w-4.5 h-4.5 flex items-center justify-center rounded-full hover:bg-blue-200/60 text-blue-500 font-extrabold hover:text-blue-700 transition-colors cursor-pointer text-sm"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative rounded-2xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <MdBuild className="w-5 h-5" />
              </div>
              <select
                id="profession"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !selectedProfessions.some(p => p._id === val)) {
                    const prof = professions.find(p => p._id === val);
                    if (prof) {
                      setSelectedProfessions([...selectedProfessions, prof]);
                    }
                  }
                }}
                className="block w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a profession...</option>
                {professions
                  .filter(prof => !selectedProfessions.some(p => p._id === prof._id))
                  .map((prof) => (
                    <option key={prof._id} value={prof._id}>
                      {prof.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/shop/dashboard')}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {loading ? 'Submitting...' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendor;
