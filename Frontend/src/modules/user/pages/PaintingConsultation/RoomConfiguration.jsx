import React, { useState } from 'react';
import { requestConsultation } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';

const RoomConfiguration = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

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
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to request consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-on-surface bg-surface min-h-screen pt-20 pb-24 px-4 max-w-5xl mx-auto font-body-lg">
      
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
        
        {/* 1 BHK Card */}
        <div 
          className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant hover:border-primary transition-all group cursor-pointer"
          onClick={() => !loading && handleRequest('1BHK')}
        >
          <div 
            className="h-48 w-full bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCzgvuaA6bj625WjQRVratyMeUHbH2ggncA0_tXa2fp7ycEL72TZ_dbde9UeiIlwcwuxU-XYbTlYelLl873XyAebIWgrIZue131yzhtPqItQDZcJe9YUQEY9BVw80sLydP132mj6DROc3PCi6AN80L4rjQ8qpyrgbj9kM9l3JbPsq41Nmyz9gITV-SK9TrfN-HFq1QPWzCmE4V3QBdW3dNS7NB7X6Bq9PM9Y7AsrqGpJHK-jo9P93MQ_T3qmCUHXB4D0OFqtnBn-Y4')" }}
          ></div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">1 BHK</h3>
              <span className="bg-surface-container-highest px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">Compact</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">bed</span>
                <span className="text-sm">1 Bedroom, 1 Living Room</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">kitchen</span>
                <span className="text-sm">1 Kitchen, 1 Bathroom</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRequest('1BHK'); }}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all mt-4 shadow-md shadow-orange-100 disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request Consultation'}
            </button>
          </div>
        </div>

        {/* 2 BHK Card */}
        <div 
          className="bg-surface-container-low rounded-2xl overflow-hidden border border-primary transition-all group relative shadow-md cursor-pointer"
          onClick={() => !loading && handleRequest('2BHK')}
        >
          <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold z-10">Popular Choice</div>
          <div 
            className="h-48 w-full bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBMv2pT7nEbkYrZ9vKYRz2IOI1vbnqgoYThy98TiXUX0OA4kMqYe9219QfU1z8O6XP1JUCCRx_2u7gjLC_PASuYXaPsGB4_p-mC9a8_UsaCm2np_Ar2i0lTWneBU731ak5CujTL5znu1j3kzEyev2Lcj7tcfbmvnjUKiB4yAV-NGELGYzbcJIfLFMCRF9sJ5SyQ4vlA1FcvV2LTv0_PlUcKcwORISb1XvkYIRAlXffLhMq_WZ_WzMZRtw8Anm3j0K10QHWKcz5LU8w')" }}
          ></div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">2 BHK</h3>
              <span className="bg-primary-fixed px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider text-primary">Standard</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">bed</span>
                <span className="text-sm">2 Bedrooms, 1 Living Room</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">kitchen</span>
                <span className="text-sm">1 Kitchen, 2 Bathrooms, 1 Balcony</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRequest('2BHK'); }}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all mt-4 shadow-md shadow-orange-100 disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request Consultation'}
            </button>
          </div>
        </div>

        {/* 3 BHK Card */}
        <div 
          className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant hover:border-primary transition-all group cursor-pointer"
          onClick={() => !loading && handleRequest('3BHK')}
        >
          <div 
            className="h-48 w-full bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAOWin9c94OEhLU2uNLL91sChXblUBUeQFx8fsZfxpKr7IPs-8KvmCmd7tr3mWj8McoPBD3lPyBC2DRiIS4Hm5qDHl9qbOeX3rB8T554FVfg1UCajUispCq_pmXtyUWj-TnCsi4zlqAbm0eCo0nQ2vGJSyPu6nnxYhh-7epU8zHXQQetPDY3KTtnMIvdUl1gVxOd5qdyuJFvOFABAARlI4S-xEdklV-oYbDPl7FQ24c4LPEljJ0JgZjrH0EPWDoOPsmG-elt6Zew_E')" }}
          ></div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">3 BHK</h3>
              <span className="bg-surface-container-highest px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">Premium</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">bed</span>
                <span className="text-sm">3 Bedrooms, 1 Large Living Room</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">kitchen</span>
                <span className="text-sm">Modular Kitchen, 3 Bathrooms, 2 Balconies</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRequest('3BHK'); }}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all mt-4 shadow-md shadow-orange-100 disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request Consultation'}
            </button>
          </div>
        </div>

        {/* Villa Card */}
        <div 
          className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant hover:border-primary transition-all group cursor-pointer"
          onClick={() => !loading && handleRequest('Villa')}
        >
          <div 
            className="h-48 w-full bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZcre3Mcil2LXTT3pY6PLD7gcMjXVWPqEItoFEMopnYsvoAD5dEpfUOdIJwMnMYVE40hCPgamH4MBT17vcsngoHe3TdEQTRafyTTjZclau7Kx4QyNUiTbWXfH7JsnhqKiDfdI2vAcRFGaWQSJcsEY5u3u2YUqwRJx6nUBltx7POTSmIxH8VwsoTUst6z5YGfLgBCOPH9tQhESZs990d1JbgTDCbFQRSdAo-G7hmVfxP9B5CgDfd6-XhGjcdYsQTVCfzHKl7ewNGpk')" }}
          ></div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">Villa</h3>
              <span className="bg-surface-container-highest px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">Elite</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">home</span>
                <span className="text-sm">Multi-story, 4+ Bedrooms, Library</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">deck</span>
                <span className="text-sm">Exterior + Interior, Private Terrace</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleRequest('Villa'); }}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all mt-4 shadow-md shadow-orange-100 disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request Consultation'}
            </button>
          </div>
        </div>

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
