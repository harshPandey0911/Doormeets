import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlayCircle, FiCheckCircle, FiAward, FiShield, FiUploadCloud, FiClock, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import LogoLoader from '../../../components/common/LogoLoader';
import SubscriptionSelection from './Subscription/SubscriptionSelection'; // Reusing existing component
import MCQTest from './Training/MCQTest'; // Import MCQ Test
import { useSocket } from '../../../context/SocketContext';

const VerificationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  
  // Step 1: Police Verification
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Step 2: Training Video
  const [video, setVideo] = useState(null);
  const [videoWatched, setVideoWatched] = useState(false);
  
  // State for tracking overall step
  const [step, setStep] = useState(1); 
  // 1 = Police Verification, 2 = Video, 3 = MCQ, 4 = Subscription
  const [levelInfo, setLevelInfo] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/vendors/profile');
      if (profileRes.data?.success) {
        const vendorData = profileRes.data.vendor;
        setVendor(vendorData);

        // Determine step based on status
        const pvStatus = vendorData.policeVerification?.status || 'pending';
        
        if (pvStatus === 'pending' || pvStatus === 'rejected') {
          setStep(1);
        } else if (pvStatus === 'submitted') {
          setStep(1); // Stuck on waiting screen
        } else if (pvStatus === 'approved') {
          // Check training status from backend
          let hasWatchedVideo = false;
          let hasPassedMcq = false;

          // Step 1: Check training status (video watched + MCQ passed)
          try {
            const statusRes = await api.get('/vendors/training/status');
            if (statusRes.data?.success) {
              const trainingStatus = statusRes.data.data?.training?.status;
              // 'completed' means MCQ passed
              if (trainingStatus === 'completed') {
                hasWatchedVideo = true;
                hasPassedMcq = true;
              } else if (trainingStatus === 'in_progress') {
                // Video may have been watched, but MCQ not yet passed
                hasWatchedVideo = false; // will check videos below
                hasPassedMcq = false;
              }
            }
          } catch(e) {
            console.log('Training status check failed, falling back to video check');
          }

          // Step 2: If not completed, check if videos exist and if they were watched
          if (!hasPassedMcq) {
            try {
              const videoRes = await api.get('/vendors/training/videos');
              if (videoRes.data?.success && videoRes.data?.data?.length > 0) {
                setVideo(videoRes.data.data[0]);
                // Check if all required videos are watched
                const totalRequired = videoRes.data.totalRequired || 0;
                const totalWatched = videoRes.data.totalWatched || 0;
                if (totalRequired === 0 || totalWatched >= totalRequired) {
                  hasWatchedVideo = true; // No required videos or all watched
                } else {
                  hasWatchedVideo = false;
                }
              } else {
                hasWatchedVideo = true; // No videos = skip to MCQ
              }
            } catch(e) {
              hasWatchedVideo = true; // Error = skip to MCQ
            }
          }

          setVideoWatched(hasWatchedVideo);

          if (!hasWatchedVideo) {
            setStep(2); // Training Video
          } else if (!hasPassedMcq) {
            setStep(3); // MCQ Test
          } else {
            setStep(4); // Subscription
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch verification status', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notif) => {
      if (notif.type === 'police_verification_approved' || notif.type === 'police_verification_rejected') {
        toast(notif.message, {
          icon: notif.type === 'police_verification_approved' ? '✅' : '❌',
          duration: 6000
        });
        fetchStatus(); // Refresh to move to the next step
      }
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [socket]);

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingDoc(true);
    try {
      // In a real app, upload to Cloudinary/S3 first. Here we assume we have a direct upload route or base64.
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        try {
          const res = await api.post('/vendors/verification/police', { documentUrl: base64data });
          if (res.data.success) {
            toast.success('Document submitted successfully');
            fetchStatus(); // Refresh status
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to submit document');
        } finally {
          setUploadingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Error reading file');
      setUploadingDoc(false);
    }
  };

  const handleVideoWatched = async () => {
    try {
      if (video) {
        await api.post('/vendors/training/watch', { videoId: video._id, fullyWatched: true });
      }
      setVideoWatched(true);
      setStep(3); // Move to MCQ
      toast.success('Video completed. Moving to MCQ Test.');
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

  // Handle MCQ completion
  // Note: MCQTest component handles its own redirects usually, but if embedded, we might need to intercept it.
  // For now, if step 3 is active, we just render MCQTest. If it redirects to /vendor/training/result, the user can click "Next" from there to return here.
  // Actually, MCQTest component has a hardcoded navigate('/vendor/training/result').
  // We can just render it.

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Tracker */}
        {vendor?.policeVerification?.status !== 'submitted' && (
          <div className="mb-10">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-white z-10 ${step >= 1 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>1</div>
              <div className={`h-1 w-12 md:w-20 -ml-4 -mr-4 ${step >= 2 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-white z-10 ${step >= 2 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>2</div>
              <div className={`h-1 w-12 md:w-20 -ml-4 -mr-4 ${step >= 3 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-white z-10 ${step >= 3 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>3</div>
              <div className={`h-1 w-12 md:w-20 -ml-4 -mr-4 ${step >= 4 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-white z-10 ${step >= 4 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>4</div>
            </div>
            <div className="flex justify-center mt-2 gap-4 md:gap-12">
              <span className="text-xs md:text-sm font-semibold text-gray-700">Verification</span>
              <span className="text-xs md:text-sm font-semibold text-gray-700">Video</span>
              <span className="text-xs md:text-sm font-semibold text-gray-700">MCQ Test</span>
              <span className="text-xs md:text-sm font-semibold text-gray-700">Subscription</span>
            </div>
          </div>
        )}

        {/* Step 1: Police Verification */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 animate-fade-in text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FiShield className="text-4xl text-[#9634f7]" />
              <h2 className="text-2xl font-bold text-gray-800">Police Verification</h2>
            </div>
            
            {vendor?.policeVerification?.status === 'submitted' ? (
               <div className="py-8">
                 <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                   <FiClock className="w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-2">Verification Pending</h3>
                 <p className="text-gray-500 mb-6">Your police verification document is currently under review by our admin team. You will be notified once approved.</p>
                 <button onClick={fetchStatus} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                   Refresh Status
                 </button>
               </div>
            ) : (
              <div className="py-4">
                {vendor?.policeVerification?.status === 'rejected' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-left">
                    <div className="flex items-start gap-2 text-red-600 mb-1">
                      <FiAlertCircle className="mt-0.5" />
                      <span className="font-bold">Verification Rejected</span>
                    </div>
                    <p className="text-sm text-red-500 ml-6">{vendor.policeVerification.rejectionReason}</p>
                  </div>
                )}
                
                <p className="text-gray-600 mb-8">Please upload a valid Police Verification certificate to proceed with your onboarding process.</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors relative">
                   {uploadingDoc ? (
                     <div className="flex flex-col items-center justify-center py-4">
                       <div className="w-8 h-8 border-4 border-[#9634f7] border-t-transparent rounded-full animate-spin mb-4" />
                       <p className="text-gray-500 font-medium">Uploading Document...</p>
                     </div>
                   ) : (
                     <>
                       <FiUploadCloud className="text-5xl text-gray-400 mx-auto mb-4" />
                       <p className="font-medium text-gray-700 mb-1">Click to upload document</p>
                       <p className="text-sm text-gray-500 mb-4">PDF, JPG or PNG (Max 5MB)</p>
                       <input 
                         type="file" 
                         accept="image/*,.pdf" 
                         onChange={handleDocumentUpload}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                       />
                       <button className="px-6 py-2 bg-[#9634f7] text-white rounded-lg font-medium">
                         Select File
                       </button>
                     </>
                   )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Training Video */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FiPlayCircle className="text-3xl text-[#9634f7]" />
              <h2 className="text-2xl font-bold text-gray-800">Mandatory Training Video</h2>
            </div>
            <p className="text-center text-gray-500 mb-8">Please watch this short training video before taking the MCQ test.</p>

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

        {/* Step 3: MCQ Test */}
        {step === 3 && (
          <div className="animate-slide-in-bottom">
            <MCQTest
              onComplete={(result) => {
                if (result?.passed) {
                  setLevelInfo({
                    level: result.levelAssigned,
                    score: result.score,
                    passed: true
                  });
                } else {
                  setLevelInfo({
                    level: result?.levelAssigned || 'L3',
                    score: result?.score || 0,
                    passed: false
                  });
                  // Stay on step 3 but reload so cooldown is shown
                  fetchStatus();
                }
              }}
            />
          </div>
        )}

        {/* Step 4: Subscription */}
        {step === 4 && (
          <div className="animate-slide-in-bottom">
            <SubscriptionSelection 
              isVerificationFlow={true} 
              onComplete={handleSubscriptionComplete} 
            />
          </div>
        )}

      </div>

      {/* Level Assignment Modal */}
      {levelInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl animate-scale-up">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-400 text-white text-4xl shadow-lg">
              {levelInfo.level === 'L1' || levelInfo.level === 1 ? '🥇' : levelInfo.level === 'L2' || levelInfo.level === 2 ? '🥈' : '📚'}
            </div>
            
            <h3 className="text-gray-900 font-extrabold text-2xl mb-2">
              {levelInfo.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}
            </h3>
            
            <p className="text-gray-600 text-sm mb-6">
              You scored <span className="font-bold text-gray-800">{levelInfo.score}%</span> on the MCQ Test.
            </p>

            <div className={`p-5 rounded-2xl border mb-6 text-left ${
              levelInfo.level === 'L1' || levelInfo.level === 1 
                ? 'bg-amber-50/50 border-amber-200' 
                : levelInfo.level === 'L2' || levelInfo.level === 2 
                ? 'bg-blue-50/50 border-blue-200' 
                : 'bg-red-50/50 border-red-200'
            }`}>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
                levelInfo.level === 'L1' || levelInfo.level === 1 
                  ? 'bg-amber-500' 
                  : levelInfo.level === 'L2' || levelInfo.level === 2 
                  ? 'bg-blue-500' 
                  : 'bg-red-500'
              }`}>
                {levelInfo.level === 'L1' || levelInfo.level === 1 ? 'Level 1 — Premium' : levelInfo.level === 'L2' || levelInfo.level === 2 ? 'Level 2 — Standard' : 'Level 3 — Basic'}
              </span>
              <p className="text-gray-700 text-sm mt-3 font-medium leading-relaxed">
                {levelInfo.level === 'L1' || levelInfo.level === 1 
                  ? "You've been certified as a Premium vendor! You will receive priority job allocation." 
                  : levelInfo.level === 'L2' || levelInfo.level === 2 
                  ? "You've been certified as a Standard vendor with access to regular customer requests." 
                  : "Score 50% or above to pass and unlock vendor access. You can try again in 24 hours."}
              </p>
            </div>

            {levelInfo.passed ? (
              <button 
                onClick={() => {
                  setLevelInfo(null);
                  setStep(4);
                }}
                className="w-full py-3.5 bg-[#9634f7] hover:bg-[#b87cff] text-white font-bold rounded-xl transition-all shadow-md"
              >
                Proceed to Subscription
              </button>
            ) : (
              <button 
                onClick={() => setLevelInfo(null)}
                className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all shadow-md"
              >
                Okay
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;
