import React, { useState, useEffect } from 'react';
import { requestConsultation, getPaintingPublicSettings } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';

const DEFAULT_LAYOUTS = [
  {
    id: '1BHK',
    name: '1 BHK',
    tag: 'Compact',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzgvuaA6bj625WjQRVratyMeUHbH2ggncA0_tXa2fp7ycEL72TZ_dbde9UeiIlwcwuxU-XYbTlYelLl873XyAebIWgrIZue131yzhtPqItQDZcJe9YUQEY9BVw80sLydP132mj6DROc3PCi6AN80L4rjQ8qpyrgbj9kM9l3JbPsq41Nmyz9gITV-SK9TrfN-HFq1QPWzCmE4V3QBdW3dNS7NB7X6Bq9PM9Y7AsrqGpJHK-jo9P93MQ_T3qmCUHXB4D0OFqtnBn-Y4',
    details: ['1 Bedroom, 1 Living Room', '1 Kitchen, 1 Bathroom']
  },
  {
    id: '2BHK',
    name: '2 BHK',
    tag: 'Standard',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMv2pT7nEbkYrZ9vKYRz2IOI1vbnqgoYThy98TiXUX0OA4kMqYe9219QfU1z8O6XP1JUCCRx_2u7gjLC_PASuYXaPsGB4_p-mC9a8_UsaCm2np_Ar2i0lTWneBU731ak5CujTL5znu1j3kzEyev2Lcj7tcfbmvnjUKiB4yAV-NGELGYzbcJIfLFMCRF9sJ5SyQ4vlA1FcvV2LTv0_PlUcKcwORISb1XvkYIRAlXffLhMq_WZ_WzMZRtw8Anm3j0K10QHWKcz5LU8w',
    details: ['2 Bedrooms, 1 Living Room', '1 Kitchen, 2 Bathrooms, 1 Balcony']
  },
  {
    id: '3BHK',
    name: '3 BHK',
    tag: 'Premium',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOWin9c94OEhLU2uNLL91sChXblUBUeQFx8fsZfxpKr7IPs-8KvmCmd7tr3mWj8McoPBD3lPyBC2DRiIS4Hm5qDHl9qbOeX3rB8T554FVfg1UCajUispCq_pmXtyUWj-TnCsi4zlqAbm0eCo0nQ2vGJSyPu6nnxYhh-7epU8zHXQQetPDY3KTtnMIvdUl1gVxOd5qdyuJFvOFABAARlI4S-xEdklV-oYbDPl7FQ24c4LPEljJ0JgZjrH0EPWDoOPsmG-elt6Zew_E',
    details: ['3 Bedrooms, 1 Large Living Room', 'Modular Kitchen, 3 Bathrooms, 2 Balconies']
  },
  {
    id: 'Villa',
    name: 'Villa',
    tag: 'Elite',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZcre3Mcil2LXTT3pY6PLD7gcMjXVWPqEItoFEMopnYsvoAD5dEpfUOdIJwMnMYVE40hCPgamH4MBT17vcsngoHe3TdEQTRafyTTjZclau7Kx4QyNUiTbWXfH7JsnhqKiDfdI2vAcRFGaWQSJcsEY5u3u2YUqwRJx6nUBltx7POTSmIxH8VwsoTUst6z5YGfLgBCOPH9tQhESZs990d1JbgTDCbFQRSdAo-G7hmVfxP9B5CgDfd6-XhGjcdYsQTVCfzHKl7ewNGpk',
    details: ['Multi-story, 4+ Bedrooms, Library', 'Exterior + Interior, Private Terrace']
  }
];

const RoomConfiguration = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  
  // Dynamic Page states
  const [viewState, setViewState] = useState('list'); // 'list' | 'detail'
  const [selectedLayout, setSelectedLayout] = useState(null);

  useEffect(() => {
    getPaintingPublicSettings().then(res => {
      if (res?.success && res?.settings?.propertyLayouts?.length > 0) {
        setLayouts(res.settings.propertyLayouts);
      }
    }).catch(err => console.error('Error fetching dynamic layouts:', err));
  }, []);

  const handleRequest = async (propertyType) => {
    try {
      setLoading(true);
      const payload = {
        propertyType,
        address: {
          street: '123 Test St',
          city: 'Indore',
          state: 'MP',
          pincode: '452001',
          fullAddress: '123 Test St, Indore, MP 452001'
        }
      };

      await requestConsultation(payload);
      toast.success(`${propertyType} Consultation Requested!`);
      setRequested(true);
      setViewState('list');
      setSelectedLayout(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to request consultation');
    } finally {
      setLoading(false);
    }
  };

  if (viewState === 'detail' && selectedLayout) {
    return (
      <div className="text-on-surface bg-surface min-h-screen pt-6 pb-24 px-4 max-w-2xl mx-auto font-body-lg">
        {/* Back navigation */}
        <button 
          onClick={() => { setViewState('list'); setSelectedLayout(null); }}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-500 mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> Back to Layouts
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg">
          <div className="h-64 w-full bg-cover bg-center" style={{ backgroundImage: `url('${selectedLayout.imageUrl}')` }}></div>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">{selectedLayout.name}</h3>
              {selectedLayout.tag && (
                <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">{selectedLayout.tag}</span>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Layout Specifications:</h4>
              {(selectedLayout.details || []).map((detail, dIdx) => (
                <div key={dIdx} className="flex items-center gap-3.5 text-gray-700 dark:text-gray-300">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-gray-850 flex items-center justify-center text-orange-500">
                    <span className="material-symbols-outlined text-lg">
                      {detail.toLowerCase().includes('bed') ? 'bed' : detail.toLowerCase().includes('kitchen') ? 'kitchen' : 'check_circle'}
                    </span>
                  </div>
                  <span className="text-base font-semibold">{detail}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-50 dark:border-gray-850 flex gap-4">
              <button 
                onClick={() => { setViewState('list'); setSelectedLayout(null); }}
                className="flex-1 py-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRequest(selectedLayout.id)}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Requesting...
                  </>
                ) : (
                  'Confirm & Book Consultation'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-on-surface bg-surface min-h-screen pt-10 pb-24 px-4 max-w-5xl mx-auto font-body-lg">
      
      {requested && (
        <div className="mb-6 bg-primary-fixed text-on-primary-fixed p-4 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">pending_actions</span>
            <span className="font-label-md text-sm font-bold">Consultation Requested Successfully! Vendors are being notified.</span>
          </div>
          <button className="text-on-primary-fixed-variant" onClick={() => setRequested(false)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <header className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-on-background">Room Configuration</h2>
        <p className="text-on-surface-variant mt-2">Select your layout to receive a tailored professional quote for your home transformation.</p>
      </header>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {layouts.map(layout => (
          <div 
            key={layout.id}
            className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant hover:border-primary transition-all group cursor-pointer"
            onClick={() => { setSelectedLayout(layout); setViewState('detail'); }}
          >
            <div 
              className="h-48 w-full bg-cover bg-center" 
              style={{ backgroundImage: `url('${layout.imageUrl}')` }}
            ></div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{layout.name}</h3>
                {layout.tag && (
                  <span className="bg-surface-container-highest px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">{layout.tag}</span>
                )}
              </div>
              <div className="space-y-2 mb-6">
                {(layout.details || []).slice(0, 2).map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">
                      {detail.toLowerCase().includes('bed') ? 'bed' : detail.toLowerCase().includes('kitchen') ? 'kitchen' : 'home'}
                    </span>
                    <span className="text-sm">{detail}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedLayout(layout); setViewState('detail'); }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all mt-4 shadow-md shadow-orange-100"
              >
                View Details
              </button>
            </div>
          </div>
        ))}

      </div>

      {/* Support Section */}
      <section className="mt-8 p-6 bg-surface border border-outline-variant rounded-xl flex flex-col md:flex-row items-center gap-6">
        <div className="bg-primary-fixed p-4 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-primary scale-125">support_agent</span>
        </div>
        <div className="text-center md:text-left">
          <h4 className="text-xl font-bold">Need a Custom Layout?</h4>
          <p className="text-on-surface-variant">Our experts can handle commercial spaces and unique floor plans. Speak to a design consultant.</p>
        </div>
        <button className="md:ml-auto border-2 border-primary text-primary font-bold px-6 py-2 rounded-lg hover:bg-primary-fixed transition-colors active:scale-95">
            Contact Support
        </button>
      </section>

    </div>
  );
};

export default RoomConfiguration;
