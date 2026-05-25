import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiBriefcase } from 'react-icons/fi';
import api from '../../../../services/api';

const ProfessionSelection = ({ formData, setFormData, onNext, onBack }) => {
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfessions();
  }, []);

  const fetchProfessions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/public/professions');
      setProfessions(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching professions:', err);
      setError('Failed to load professions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProfession = (professionId) => {
    const currentProfessions = formData.professions || [];
    const newProfessions = currentProfessions.includes(professionId)
      ? currentProfessions.filter(id => id !== professionId)
      : [...currentProfessions, professionId];
    
    setFormData({ ...formData, professions: newProfessions });
  };

  const handleConsultantToggle = (e) => {
    setFormData({ ...formData, isConsultant: e.target.checked });
  };

  const handleNext = () => {
    if (!formData.professions || formData.professions.length === 0) {
      alert('Please select at least one profession to continue.');
      return;
    }
    onNext();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8 border border-gray-100">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Select Your Profession</h2>
        <p className="text-center text-gray-500 mb-8">What services do you provide?</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {professions.map(prof => {
                const isSelected = (formData.professions || []).includes(prof._id || prof.id);
                return (
                  <div 
                    key={prof._id || prof.id}
                    onClick={() => toggleProfession(prof._id || prof.id)}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                      isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 mb-3 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl">
                      <FiBriefcase />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {prof.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-blue-600">
                        <FiCheckCircle size={18} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {professions.length === 0 && (
              <div className="text-center text-gray-500 py-8">No professions available at the moment. Please contact support.</div>
            )}

            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-8 flex items-start gap-3">
              <input 
                type="checkbox" 
                id="consultant-checkbox"
                checked={formData.isConsultant || false}
                onChange={handleConsultantToggle}
                className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <label htmlFor="consultant-checkbox" className="font-semibold text-gray-800 cursor-pointer">
                  I am working as a Consultant
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Check this if you provide consultation services for the selected professions. Users will be able to book you as a consultant before proceeding with the actual service.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="w-1/3 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-2/3 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
              >
                Continue to Training
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfessionSelection;
