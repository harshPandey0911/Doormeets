import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlayCircle, FiCheckCircle, FiAward } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import LogoLoader from '../../../components/common/LogoLoader';
import SubscriptionSelection from './Subscription/SubscriptionSelection'; // Reusing existing component

const VerificationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [step, setStep] = useState(1); // 1 = Video, 2 = Subscription

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await api.get('/vendor/training/videos');
        if (response.data?.success && response.data?.data?.length > 0) {
          setVideo(response.data.data[0]);
          if (response.data.data[0].isWatched) {
            setVideoWatched(true);
            setStep(2);
          }
        } else {
          // No video found, skip to subscription
          setVideoWatched(true);
          setStep(2);
        }
      } catch (error) {
        console.error('Failed to fetch training video', error);
        // Skip video step if error
        setVideoWatched(true);
        setStep(2);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, []);

  const handleVideoWatched = async () => {
    try {
      if (video) {
        await api.post('/vendor/training/watch', { videoId: video._id, fullyWatched: true });
      }
      setVideoWatched(true);
      setStep(2);
      toast.success('Training marked as completed.');
    } catch (error) {
      console.error('Failed to mark video watched', error);
      toast.error('Failed to update training status. Please try again.');
    }
  };

  const handleSubscriptionComplete = () => {
    toast.success('Verification complete! Welcome to Doormeets.');
    navigate('/vendor/dashboard', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LogoLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Tracker */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${step >= 1 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>
              1
            </div>
            <div className={`h-1 w-20 ${step >= 2 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${step >= 2 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>
              2
            </div>
          </div>
          <div className="flex justify-center mt-2 gap-16">
            <span className="text-sm font-semibold text-gray-700">Training</span>
            <span className="text-sm font-semibold text-gray-700">Subscription</span>
          </div>
        </div>

        {/* Step 1: Training Video */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FiAward className="text-3xl text-[#9634f7]" />
              <h2 className="text-2xl font-bold text-gray-800">Complete Your Training</h2>
            </div>
            <p className="text-center text-gray-500 mb-8">Please watch this short training video to understand our guidelines.</p>

            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative group flex items-center justify-center mb-8">
              {video?.videoUrl ? (
                <video 
                  src={video.videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                  onEnded={handleVideoWatched}
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <button 
                      onClick={handleVideoWatched}
                      className="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all transform hover:scale-110"
                    >
                      <FiPlayCircle className="text-white text-4xl" />
                    </button>
                  </div>
                  <img 
                    src={video?.thumbnailUrl || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"} 
                    alt="Training Video Thumbnail" 
                    className="w-full h-full object-cover opacity-60"
                  />
                </>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleVideoWatched}
                className="py-3 px-8 bg-[#9634f7] text-white rounded-xl font-bold hover:bg-[#b87cff] transition-colors shadow-lg"
              >
                I have watched the video
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Subscription */}
        {step === 2 && (
          <div className="animate-slide-in-bottom">
            <SubscriptionSelection 
              isVerificationFlow={true} 
              onComplete={handleSubscriptionComplete} 
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default VerificationPage;
