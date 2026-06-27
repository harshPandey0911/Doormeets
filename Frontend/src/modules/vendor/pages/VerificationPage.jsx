import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlayCircle, FiCheckCircle, FiAward, FiShield, FiUploadCloud, FiClock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
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
  
  // Step 1: Documents state (Aadhaar, PAN, and Police Verification)
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFront, setAadharFront] = useState('');
  const [aadharBack, setAadharBack] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panDoc, setPanDoc] = useState('');
  const [policeDoc, setPoliceDoc] = useState('');
  const [submittingDocs, setSubmittingDocs] = useState(false);
  
  // Step 2: Training Video
  const [video, setVideo] = useState(null);
  const [videoWatched, setVideoWatched] = useState(false);
  
  // State for tracking overall step
  const [step, setStep] = useState(1); 
  // 1 = Document Verification, 2 = Video, 3 = MCQ, 4 = Subscription
  const [levelInfo, setLevelInfo] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/vendors/profile');
      if (profileRes.data?.success) {
        const vendorData = profileRes.data.vendor;
        setVendor(vendorData);

        // Prepopulate documents if they exist
        if (vendorData.aadhar) {
          setAadharNumber(vendorData.aadhar.number || '');
          setAadharFront(vendorData.aadhar.document || '');
          setAadharBack(vendorData.aadhar.backDocument || '');
        }
        if (vendorData.pan) {
          setPanNumber(vendorData.pan.number || '');
          setPanDoc(vendorData.pan.document || '');
        }
        if (vendorData.policeVerification) {
          setPoliceDoc(vendorData.policeVerification.documentUrl || '');
        }

        const pvStatus = vendorData.policeVerification?.status || 'pending';
        const hasAadhar = vendorData.aadhar?.number && vendorData.aadhar?.document && vendorData.aadhar?.backDocument;
        const hasPan = vendorData.pan?.number && vendorData.pan?.document;
        const hasPV = vendorData.policeVerification?.documentUrl;

        // If documents are missing or rejected, force step 1 (upload docs)
        if (pvStatus === 'pending' || pvStatus === 'rejected' || !hasAadhar || !hasPan || !hasPV) {
          setStep(1);
        } else {
          // Documents are submitted or approved! Proceed with training video, MCQ test, and subscription.
          let hasWatchedVideo = false;
          let hasPassedMcq = false;

          // Check training status from backend
          try {
            const statusRes = await api.get('/vendors/training/status');
            if (statusRes.data?.success) {
              const trainingStatus = statusRes.data.data?.training?.status;
              // 'completed' means MCQ passed
              if (trainingStatus === 'completed') {
                hasWatchedVideo = true;
                hasPassedMcq = true;
              } else if (trainingStatus === 'in_progress') {
                hasWatchedVideo = false;
                hasPassedMcq = false;
              }
            }
          } catch(e) {
            console.log('Training status check failed, falling back to video check');
          }

          // If MCQ not passed, check if training videos are watched
          if (!hasPassedMcq) {
            try {
              const videoRes = await api.get('/vendors/training/videos');
              if (videoRes.data?.success && videoRes.data?.data?.length > 0) {
                setVideo(videoRes.data.data[0]);
                const totalRequired = videoRes.data.totalRequired || 0;
                const totalWatched = videoRes.data.totalWatched || 0;
                if (totalRequired === 0 || totalWatched >= totalRequired) {
                  hasWatchedVideo = true;
                } else {
                  hasWatchedVideo = false;
                }
              } else {
                hasWatchedVideo = true;
              }
            } catch(e) {
              hasWatchedVideo = true;
            }
          }

          setVideoWatched(hasWatchedVideo);

          if (!hasWatchedVideo) {
            setStep(2); // Training Video
          } else if (!hasPassedMcq) {
            setStep(3); // MCQ Test
          } else {
            // Already watched video and passed MCQ! They are done with onboarding, redirect to pending approval.
            handleSubscriptionComplete();
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

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitDocuments = async (e) => {
    if (e) e.preventDefault();

    if (!aadharNumber || aadharNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhar number');
      return;
    }
    if (!aadharFront) {
      toast.error('Please upload Aadhar Front photo');
      return;
    }
    if (!aadharBack) {
      toast.error('Please upload Aadhar Back photo');
      return;
    }
    if (!panNumber || panNumber.length !== 10) {
      toast.error('Please enter a valid 10-character PAN number');
      return;
    }
    if (!panDoc) {
      toast.error('Please upload PAN card document');
      return;
    }
    if (!policeDoc) {
      toast.error('Please upload Police Verification document');
      return;
    }

    setSubmittingDocs(true);
    try {
      // 1. Save Aadhaar and PAN details to vendor profile
      await api.put('/vendors/profile', {
        aadharNumber,
        aadharDocument: aadharFront,
        aadharBackDocument: aadharBack,
        panNumber,
        panDocument: panDoc
      });

      // 2. Submit Police Verification document
      const res = await api.post('/vendors/verification/police', {
        documentUrl: policeDoc
      });

      if (res.data.success) {
        toast.success('Verification documents submitted successfully!');
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit documents');
    } finally {
      setSubmittingDocs(false);
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
    const pvStatus = vendor?.policeVerification?.status || 'pending';
    if (pvStatus === 'approved') {
      navigate('/vendor/dashboard', { replace: true });
    } else {
      if (vendor?._id || vendor?.id) {
        sessionStorage.setItem('pendingVendorId', (vendor._id || vendor.id).toString());
      }
      navigate('/vendor/pending-approval', { replace: true });
    }
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
              <div className={`h-1 w-16 md:w-28 -ml-4 -mr-4 ${step >= 2 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-white z-10 ${step >= 2 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>2</div>
              <div className={`h-1 w-16 md:w-28 -ml-4 -mr-4 ${step >= 3 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-white z-10 ${step >= 3 ? 'bg-[#9634f7]' : 'bg-gray-300'}`}>3</div>
            </div>
            <div className="flex justify-center mt-2 gap-8 md:gap-20">
              <span className="text-xs md:text-sm font-semibold text-gray-700">Verification</span>
              <span className="text-xs md:text-sm font-semibold text-gray-700">Video</span>
              <span className="text-xs md:text-sm font-semibold text-gray-700">MCQ Test</span>
            </div>
          </div>
        )}

        {/* Step 1: Police Verification */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FiShield className="text-3xl sm:text-4xl text-[#9634f7]" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Document Verification</h2>
            </div>
            
            {vendor?.policeVerification?.status === 'rejected' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                <div className="flex items-start gap-2 text-red-600 mb-1">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <span className="font-bold text-sm">Verification Rejected by Admin</span>
                </div>
                <p className="text-xs text-red-500 ml-6">{vendor.policeVerification.rejectionReason}</p>
              </div>
            )}

            <form onSubmit={handleSubmitDocuments} className="space-y-6 text-left">
              {/* Aadhaar Section */}
              <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">1</span>
                  Aadhaar Card Verification
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Card Number</label>
                  <input
                    type="tel"
                    maxLength={12}
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="12-digit Aadhaar Number"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Aadhaar Front */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Front Photo</label>
                    {aadharFront ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50 flex items-center justify-center">
                        <img src={aadharFront} alt="Aadhaar Front" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setAadharFront('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">✕</button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                        <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600 font-bold">Upload Aadhaar Front</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setAadharFront)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                  {/* Aadhaar Back */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Back Photo</label>
                    {aadharBack ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50 flex items-center justify-center">
                        <img src={aadharBack} alt="Aadhaar Back" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setAadharBack('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">✕</button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors aspect-[4/3] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                        <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600 font-bold">Upload Aadhaar Back</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setAadharBack)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PAN Card Section */}
              <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black">2</span>
                  PAN Card Verification
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">PAN Card Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="10-character PAN Number"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">PAN Card Document</label>
                  {panDoc ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 max-w-sm aspect-[4/3] bg-gray-50 flex items-center justify-center">
                      <img src={panDoc} alt="PAN Card" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setPanDoc('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">✕</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors max-w-sm aspect-[16/9] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                      <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 font-bold">Upload PAN Document</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPanDoc)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>

              {/* Police Verification Section */}
              <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center text-[10px] font-black">3</span>
                  Police Verification Certificate
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Verification Document</label>
                  {policeDoc ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 max-w-sm aspect-[4/3] bg-gray-50 flex items-center justify-center">
                      {policeDoc.includes('pdf') || policeDoc.startsWith('data:application/pdf') ? (
                        <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                          <span className="text-4xl mb-2">📄</span>
                          <span className="text-xs font-bold">Police_Verification.pdf</span>
                        </div>
                      ) : (
                        <img src={policeDoc} alt="Police Verification" className="w-full h-full object-cover" />
                      )}
                      <button type="button" onClick={() => setPoliceDoc('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">✕</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors max-w-sm aspect-[16/9] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                      <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 font-bold">Upload Police Verification</span>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, setPoliceDoc)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingDocs}
                className="w-full py-4 bg-[#9634f7] hover:bg-[#822cd6] disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200 text-sm sm:text-base mt-8"
              >
                {submittingDocs ? (
                  <span className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit & Proceed to Training</span>
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
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
                  handleSubscriptionComplete();
                }}
                className="w-full py-3.5 bg-[#9634f7] hover:bg-[#b87cff] text-white font-bold rounded-xl transition-all shadow-md"
              >
                Proceed to Review
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
