import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlayCircle,
  FiCheckCircle,
  FiAward,
  FiShield,
  FiUploadCloud,
  FiClock,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiFileText,
  FiCalendar,
  FiMaximize,
  FiMinimize
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import { configService } from '../../../services/configService';
import LogoLoader from '../../../components/common/LogoLoader';
import SubscriptionSelection from './Subscription/SubscriptionSelection'; // Reusing existing component
import MCQTest from './Training/MCQTest'; // Import MCQ Test
import { useSocket } from '../../../context/SocketContext';

const VerificationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [graceDays, setGraceDays] = useState(7);

  // Step 1: Basic Documents state (Aadhaar & PAN)
  const [aadharName, setAadharName] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFront, setAadharFront] = useState('');
  const [aadharBack, setAadharBack] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panDoc, setPanDoc] = useState('');
  const [pvMethod, setPvMethod] = useState('self'); // 'self' or 'admin'
  const [submittingDocs, setSubmittingDocs] = useState(false);

  // Step 2: Police Verification document state
  const [policeDoc, setPoliceDoc] = useState('');
  const [submittingPV, setSubmittingPV] = useState(false);

  // Step 3: Training Video
  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);

  // State for tracking overall step
  const [step, setStep] = useState(1);
  // 1 = Aadhaar & PAN Upload, 2 = Police Verification upload, 3 = Video, 4 = MCQ, 5 = Subscription
  const [levelInfo, setLevelInfo] = useState(null);
  const [canSubmitVideo, setCanSubmitVideo] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [adminLevelConfig, setAdminLevelConfig] = useState(null);

  useEffect(() => {
    configService.getSettings().then(res => {
      if (res?.success && res?.settings?.levelConfig) {
        setAdminLevelConfig(res.settings.levelConfig);
      }
    }).catch(() => {});
  }, []);

  // Refs for tracking HTML5 and YouTube watch times
  const playerRef = React.useRef(null);
  const videoContainerRef = React.useRef(null);
  const lastHtml5Time = React.useRef(0);
  const maxHtml5Time = React.useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = (e) => {
    if (e) e.stopPropagation();
    const elem = videoContainerRef.current;
    if (!elem) return;

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  };

  useEffect(() => {
    const fetchGraceDays = async () => {
      try {
        const res = await api.get('/public/config');
        if (res.data?.success && res.data?.settings) {
          setGraceDays(res.data.settings.policeVerificationDays || 7);
        }
      } catch (err) {
        console.error('Failed to load dynamic grace days config:', err);
      }
    };
    fetchGraceDays();
  }, []);

  // Load YouTube Iframe API if not loaded
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // On-screen countdown timer (ensures 100% reliability even if YT iframe events are blocked by adblockers/Brave)
  useEffect(() => {
    if (step === 3 && video) {
      const targetSec = video.durationSeconds || 30;
      setSecondsLeft(targetSec);
      
      const timer = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanSubmitVideo(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, video]);

const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = cleanUrl.match(regExp);
  return (match && match[1] && match[1].length === 11) ? match[1] : null;
};

  // Track YouTube watch progress
  useEffect(() => {
    if (step !== 3 || !video || !video.videoUrl) return;

    const ytId = extractYouTubeId(video.videoUrl);
    if (!ytId) return;

    let interval;
    let checkYT;
    let lastTime = 0;
    let maxTime = 0;
    let initialized = false;

    const initPlayer = () => {
      if (initialized) return;
      initialized = true;

      const container = document.getElementById('yt-player');
      if (!container) {
        initialized = false; // retry on next tick if DOM element isn't ready
        return;
      }

      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: ytId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          fs: 1,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            const player = event.target;
            playerRef.current = player;
            interval = setInterval(() => {
              if (!player || typeof player.getCurrentTime !== 'function') {
                return;
              }

              const currentTime = player.getCurrentTime();
              const actualDuration = player.getDuration() || 300;
              const requiredDuration = video.durationSeconds || actualDuration;
              const targetDuration = Math.min(actualDuration, requiredDuration);
              const rate = player.getPlaybackRate();

              // 1. Prevent speed change
              if (rate > 1) {
                player.setPlaybackRate(1);
                toast.error('Speeding up the training video is not allowed.');
              }

              // 2. Prevent skipping forward
              if (currentTime - lastTime > 2.0) {
                player.seekTo(maxTime, true);
                toast.error('Skipping forward is not allowed.');
              } else {
                lastTime = currentTime;
                if (currentTime > maxTime) {
                  maxTime = currentTime;
                }
              }

              // 3. Enable submit button when 95% of target duration is watched
              if (maxTime >= targetDuration * 0.95) {
                setCanSubmitVideo(true);
              }
            }, 500);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    // Polling backup to cover all script load race conditions or DOM render delays
    checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        if (initialized) {
          clearInterval(checkYT);
        }
      }
    }, 200);

    return () => {
      if (interval) clearInterval(interval);
      if (checkYT) clearInterval(checkYT);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [step, video]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/vendors/profile');
      if (profileRes.data?.success) {
        const vendorData = profileRes.data.vendor;
        setVendor(vendorData);

        // Prepopulate basic documents if they exist
        if (vendorData.aadhar) {
          const formattedName = (vendorData.aadhar.name || '').replace(/[^a-zA-Z\s]/g, '');
          setAadharName(formattedName);
          setAadharNumber(vendorData.aadhar.number || '');
          setAadharFront(vendorData.aadhar.document || '');
          setAadharBack(vendorData.aadhar.backDocument || '');
        } else if (vendorData.name) {
          const formattedVendorName = vendorData.name.replace(/[^a-zA-Z\s]/g, '');
          setAadharName(formattedVendorName);
        }
        if (vendorData.pan) {
          setPanNumber(vendorData.pan.number || '');
          setPanDoc(vendorData.pan.document || '');
        }
        if (vendorData.policeVerification) {
          setPoliceDoc(vendorData.policeVerification.documentUrl || '');
          setPvMethod(vendorData.policeVerification.method || 'self');
        }

        const pvStatus = vendorData.policeVerification?.status || 'pending';
        const hasAadhar = vendorData.aadhar?.number && vendorData.aadhar?.document && vendorData.aadhar?.backDocument;
        const hasPan = vendorData.pan?.number && vendorData.pan?.document;
        const hasPV = vendorData.policeVerification?.documentUrl;

        // Step 1: Aadhaar or PAN is missing
        if (!hasAadhar || !hasPan) {
          setStep(1);
        }
        // Step 2: Aadhaar/PAN are done, but Police Verification document is missing
        else if (pvStatus === 'pending' || pvStatus === 'rejected' || !hasPV) {
          setStep(2);
        }
        // Proceed with training video, MCQ test, and subscription
        else {
          let hasWatchedVideo = false;
          let hasPassedMcq = false;

          // Check training status from backend
          try {
            const statusRes = await api.get('/vendors/training/status');
            if (statusRes.data?.success) {
              const trainingStatus = statusRes.data.data?.training?.status;
              if (trainingStatus === 'completed') {
                hasWatchedVideo = true;
                hasPassedMcq = true;
              } else if (trainingStatus === 'in_progress') {
                hasWatchedVideo = false;
                hasPassedMcq = false;
              }
            }
          } catch (e) {
            console.log('Training status check failed, falling back to video check');
          }

          if (!hasPassedMcq) {
            try {
              const videoRes = await api.get('/vendors/training/videos');
              if (videoRes.data?.success && videoRes.data?.data?.length > 0) {
                const allVideos = videoRes.data.data;
                setVideos(allVideos);
                const unwatchedIdx = allVideos.findIndex(v => v.isRequired && !v.isWatched);
                const activeIdx = unwatchedIdx !== -1 ? unwatchedIdx : 0;
                setCurrentVideoIndex(activeIdx);
                setVideo(allVideos[activeIdx]);
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
            } catch (e) {
              hasWatchedVideo = true;
            }
          }

          setVideoWatched(hasWatchedVideo);

          if (!hasWatchedVideo) {
            setStep(3); // Training Video is now Step 3
          } else if (!hasPassedMcq) {
            setStep(4); // MCQ Test is now Step 4
          } else {
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

  // Submit Step 1: Aadhaar & PAN + PV Method Selection
  const handleSubmitBasicDocs = async (e) => {
    e.preventDefault();

    const trimmedName = (aadharName || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      toast.error('Please enter a valid name as on your Aadhaar card (min 2 letters)');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      toast.error('Aadhaar name can only contain letters and spaces');
      return;
    }
    if (!aadharNumber || aadharNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!aadharFront || !aadharBack) {
      toast.error('Please upload both Aadhaar Front & Back images');
      return;
    }
    if (!panNumber || panNumber.length !== 10) {
      toast.error('Please enter a valid 10-character PAN number');
      return;
    }
    if (!panDoc) {
      toast.error('Please upload your PAN card document');
      return;
    }

    setSubmittingDocs(true);
    try {
      const res = await api.put('/vendors/profile', {
        aadharName,
        aadharNumber,
        aadharDocument: aadharFront,
        aadharBackDocument: aadharBack,
        panNumber,
        panDocument: panDoc,
        policeVerificationMethod: pvMethod
      });

      if (res.data.success) {
        toast.success('Basic documents submitted successfully!');
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit basic documents');
    } finally {
      setSubmittingDocs(false);
    }
  };

  // Submit Step 2: Police Verification Document Upload
  const handleSubmitPVDocument = async (e) => {
    e.preventDefault();

    if (!policeDoc) {
      toast.error('Please upload the Police Verification document');
      return;
    }

    setSubmittingPV(true);
    try {
      const res = await api.post('/vendors/verification/police', {
        documentUrl: policeDoc
      });

      if (res.data.success) {
        toast.success('Police verification certificate submitted successfully!');
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit PV document');
    } finally {
      setSubmittingPV(false);
    }
  };

  const handleTimeUpdate = (e) => {
    const videoEl = e.target;
    const currentTime = videoEl.currentTime;

    // Prevent skipping forward
    if (currentTime - lastHtml5Time.current > 2.0) {
      videoEl.currentTime = maxHtml5Time.current;
      toast.error('Skipping forward is not allowed.');
    } else {
      lastHtml5Time.current = currentTime;
      if (currentTime > maxHtml5Time.current) {
        maxHtml5Time.current = currentTime;
      }
    }

    // Enable submit at 95% completion of target duration
    const actualDuration = videoEl.duration || 300;
    const requiredDuration = video?.durationSeconds || actualDuration;
    const targetDuration = Math.min(actualDuration, requiredDuration);

    if (maxHtml5Time.current >= targetDuration * 0.95) {
      setCanSubmitVideo(true);
    }
  };

  const handleRateChange = (e) => {
    const videoEl = e.target;
    if (videoEl.playbackRate > 1.0) {
      videoEl.playbackRate = 1.0;
      toast.error('Speeding up the training video is not allowed.');
    }
  };

  const handleVideoWatched = async () => {
    try {
      const currentVid = videos[currentVideoIndex] || video;
      if (currentVid) {
        await api.post('/vendors/training/watch', { videoId: currentVid._id, fullyWatched: true });
        setVideos(prev => prev.map((v, i) => i === currentVideoIndex ? { ...v, isWatched: true } : v));
      }

      // Find if there is another unwatched video
      const nextUnwatchedIdx = videos.findIndex((v, i) => i > currentVideoIndex && v.isRequired && !v.isWatched);
      if (nextUnwatchedIdx !== -1) {
        setCurrentVideoIndex(nextUnwatchedIdx);
        setVideo(videos[nextUnwatchedIdx]);
        setCanSubmitVideo(false);
        setSecondsLeft(videos[nextUnwatchedIdx]?.durationSeconds || 30);
        toast.success(`Video completed! Moving to Video ${nextUnwatchedIdx + 1} of ${videos.length}`);
      } else if (currentVideoIndex < videos.length - 1) {
        // Move to next sequential video
        const nextIdx = currentVideoIndex + 1;
        setCurrentVideoIndex(nextIdx);
        setVideo(videos[nextIdx]);
        setCanSubmitVideo(videos[nextIdx]?.isWatched || false);
        setSecondsLeft(videos[nextIdx]?.durationSeconds || 30);
        toast.success(`Moving to Video ${nextIdx + 1} of ${videos.length}`);
      } else {
        setVideoWatched(true);
        setStep(4); // Move to MCQ Test
        toast.success('All training videos completed. Moving to MCQ Test.');
      }
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

  const getGraceTimeRemaining = () => {
    if (!vendor?.policeVerification?.dueDate) return null;
    const diff = new Date(vendor.policeVerification.dueDate) - new Date();
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} days and ${hours} hours`;
    return `${hours} hour(s)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LogoLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative">
      {/* Close X Button to return to Vendor Login */}
      <button
        onClick={() => {
          localStorage.removeItem('vendorAccessToken');
          localStorage.removeItem('vendorRefreshToken');
          localStorage.removeItem('vendorData');
          navigate('/vendor/login');
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all z-50 cursor-pointer text-base font-bold"
        aria-label="Close to Login"
        title="Back to Vendor Login"
      >
        ✕
      </button>

      <div className="max-w-4xl w-full mx-auto space-y-8">

        {/* Step Indicator Header */}
        {step <= 2 && (
          <div className="mb-8 sm:mb-12 text-center max-w-md mx-auto px-2">
            <div className="flex items-center justify-center">
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-white text-xs sm:text-base z-10 transition-all ${step >= 1 ? 'bg-[#B33A35] shadow-lg shadow-[#B33A35]/20' : 'bg-gray-300'}`}>1</div>
              <div className={`h-1 w-16 sm:w-24 -ml-2 -mr-2 transition-all ${step >= 2 ? 'bg-[#B33A35]' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-white text-xs sm:text-base z-10 transition-all ${step >= 2 ? 'bg-[#B33A35] shadow-lg shadow-[#B33A35]/20' : 'bg-gray-300'}`}>2</div>
            </div>
            <div className="grid grid-cols-2 mt-2 sm:mt-3 text-xs font-bold text-gray-500 max-w-[220px] sm:max-w-[280px] mx-auto">
              <span className={`text-center ${step >= 1 ? 'text-[#B33A35]' : ''}`}>Identity Docs</span>
              <span className={`text-center ${step >= 2 ? 'text-[#B33A35]' : ''}`}>Police Verif.</span>
            </div>
          </div>
        )}

        {/* STEP 1: Aadhaar & PAN Upload */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FiShield className="text-3xl text-[#B33A35]" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Identify Proof Verification</h2>
            </div>

            {vendor?.approvalStatus === 'rejected' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                <div className="flex items-start gap-2 text-red-600 mb-1">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <span className="font-bold text-sm">Application Rejected / Resubmission Required</span>
                </div>
                <p className="text-xs text-red-500 ml-6">
                  {vendor.policeVerification?.rejectionReason || 'Please resubmit valid documents for review.'}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitBasicDocs} className="space-y-6 text-left">
              {/* Aadhaar Section */}
              <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#B33A35]/10 text-[#B33A35] flex items-center justify-center text-[10px] font-black">1</span>
                  Aadhaar Card Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name as on Aadhaar Card</label>
                    <input
                      type="text"
                      required
                      value={aadharName}
                      onChange={(e) => {
                        // Allow only letters and single space between words (no leading space, no double space)
                        const formatted = e.target.value
                          .replace(/[^a-zA-Z\s]/g, '')
                          .replace(/^\s+/g, '')
                          .replace(/\s{2,}/g, ' ');
                        setAadharName(formatted);
                      }}
                      onBlur={() => {
                        // Capitalize each word nicely on blur
                        if (aadharName) {
                          const titleCase = aadharName
                            .trim()
                            .replace(/\s+/g, ' ')
                            .toLowerCase()
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                          setAadharName(titleCase);
                        }
                      }}
                      placeholder="e.g. John Doe (Letters only)"
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B33A35]/20 focus:border-[#B33A35] transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Card Number</label>
                    <input
                      type="tel"
                      required
                      maxLength={12}
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="12-digit Aadhaar Number"
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B33A35]/20 focus:border-[#B33A35] transition-all bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Front Photo</label>
                    {aadharFront ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50 flex items-center justify-center">
                        <img src={aadharFront} alt="Aadhaar Front" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setAadharFront('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition">✕</button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition aspect-[4/3] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                        <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600 font-bold">Upload Aadhaar Front</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, aadharFront ? undefined : setAadharFront)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aadhaar Back Photo</label>
                    {aadharBack ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50 flex items-center justify-center">
                        <img src={aadharBack} alt="Aadhaar Back" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setAadharBack('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition">✕</button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition aspect-[4/3] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                        <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600 font-bold">Upload Aadhaar Back</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, aadharBack ? undefined : setAadharBack)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PAN Section */}
              <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#B33A35]/10 text-[#B33A35] flex items-center justify-center text-[10px] font-black">2</span>
                  PAN Card Details
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">PAN Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    placeholder="10-character PAN Number"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B33A35]/20 focus:border-[#B33A35] transition-all bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">PAN Card Document</label>
                  {panDoc ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 max-w-sm aspect-[16/9] bg-gray-50 flex items-center justify-center">
                      <img src={panDoc} alt="PAN Card" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setPanDoc('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition">✕</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition max-w-sm aspect-[16/9] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                      <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 font-bold">Upload PAN Document</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, panDoc ? undefined : setPanDoc)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                    </div>
                  )}
                </div>
              </div>

              {/* Police Verification Option Selection */}
              <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#B33A35]/10 text-[#B33A35] flex items-center justify-center text-[10px] font-black">3</span>
                  Police Verification Preferences
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Select how you would like your mandatory police verification to be conducted:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition ${pvMethod === 'self' ? 'border-[#B33A35] bg-[#B33A35]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="pvMethod"
                        value="self"
                        checked={pvMethod === 'self'}
                        onChange={() => setPvMethod('self')}
                        className="text-[#B33A35] focus:ring-[#B33A35]"
                      />
                      <span className="font-bold text-xs text-gray-800">Self Verification</span>
                    </div>
                    <span className="text-[10px] text-gray-500 leading-normal">
                      I will upload my police verification certificate myself.
                    </span>
                  </label>

                  <label className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition ${pvMethod === 'admin' ? 'border-[#B33A35] bg-[#B33A35]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="pvMethod"
                        value="admin"
                        checked={pvMethod === 'admin'}
                        onChange={() => setPvMethod('admin')}
                        className="text-[#B33A35] focus:ring-[#B33A35]"
                      />
                      <span className="font-bold text-xs text-gray-800">Doormeets Admin Verification</span>
                    </div>
                    <span className="text-[10px] text-gray-500 leading-normal">
                      I request the Doormeets Admin to process my verification.
                    </span>
                  </label>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-700 leading-normal font-semibold">
                  ⚠️ Note: Selecting either option grants you a temporary grace period of {graceDays} days to complete/submit your police clearance. If not completed within this time, your application will be automatically rejected.
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingDocs}
                className="w-full py-4 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 text-white rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#B33A35]/20 text-sm sm:text-base mt-8 cursor-pointer active:scale-95"
              >
                {submittingDocs ? (
                  <span className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Documents</span>
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Police Verification Document Upload */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-in max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <FiShield className="text-3xl text-[#B33A35]" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Police Verification</h2>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 flex items-center gap-1.5"><FiFileText /> Chosen Method:</span>
                <span className="text-[#B33A35] uppercase tracking-wider font-extrabold">{pvMethod === 'self' ? 'Self Upload' : 'Admin Process'}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 flex items-center gap-1.5"><FiCalendar /> Deadline:</span>
                <span className="text-gray-800 font-bold">
                  {vendor?.policeVerification?.dueDate ? new Date(vendor.policeVerification.dueDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 flex items-center gap-1.5"><FiClock /> Time Remaining:</span>
                <span className="text-rose-600 font-black animate-pulse">{getGraceTimeRemaining()}</span>
              </div>
            </div>

            {vendor?.policeVerification?.status === 'rejected' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                <div className="flex items-start gap-2 text-red-600 mb-1">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <span className="font-bold text-sm">Certificate Rejected by Admin</span>
                </div>
                <p className="text-xs text-red-500 ml-6">
                  {vendor.policeVerification.rejectionReason || 'Please upload a valid, clear police clearance certificate.'}
                </p>
              </div>
            )}

            <form onSubmit={pvMethod === 'admin' ? (e) => { e.preventDefault(); setStep(3); } : handleSubmitPVDocument} className="space-y-6">
              {pvMethod === 'admin' ? (
                <div className="bg-[#B33A35]/5 border border-[#B33A35]/10 p-6 rounded-2xl text-center space-y-3">
                  <FiShield className="mx-auto text-4xl text-[#B33A35] animate-pulse" />
                  <h3 className="font-bold text-sm text-gray-800">Admin Processing Active</h3>
                  <p className="text-xs text-gray-550 max-w-sm mx-auto leading-relaxed">
                    Your police verification is being processed by the Doormeets Admin team. You can proceed with the onboarding steps (training video and test) during the grace period.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <h3 className="font-bold text-xs text-gray-700">Upload Police Clearance Certificate</h3>
                  {policeDoc ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-50 flex items-center justify-center">
                      {policeDoc.includes('pdf') || policeDoc.startsWith('data:application/pdf') ? (
                        <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                          <span className="text-4xl mb-2">📄</span>
                          <span className="text-xs font-bold">Police_Verification_Document.pdf</span>
                        </div>
                      ) : (
                        <img src={policeDoc} alt="Police Doc" className="w-full h-full object-contain" />
                      )}
                      <button type="button" onClick={() => setPoliceDoc('')} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition">✕</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition aspect-[16/9] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                      <FiUploadCloud className="text-3xl text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 font-bold">Upload PV Certificate</span>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, setPoliceDoc)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition flex items-center gap-2 text-sm cursor-pointer"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submittingPV}
                  className="flex-1 py-4 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 text-white rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#B33A35]/20 text-sm cursor-pointer active:scale-95"
                >
                  {submittingPV ? (
                    <span className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{pvMethod === 'admin' ? 'Proceed to Training Video' : 'Submit Certificate & Proceed'}</span>
                      <FiArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Training Video */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-4 sm:p-8 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
              <FiPlayCircle className="text-2xl sm:text-3xl text-[#B33A35] shrink-0" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 text-center">
                Mandatory Training Video {videos.length > 1 ? `(${currentVideoIndex + 1}/${videos.length})` : ''}
              </h2>
            </div>
            <p className="text-center text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              {videos[currentVideoIndex]?.title
                ? `Video ${currentVideoIndex + 1}: ${videos[currentVideoIndex].title}`
                : 'Please watch the training video before taking the MCQ test.'}
            </p>

            {/* Video Selector Pills for Multiple Videos */}
            {videos.length > 1 && (
              <div className="flex items-center justify-start sm:justify-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 px-1 scrollbar-none max-w-full">
                {videos.map((v, idx) => (
                  <button
                    key={v._id || idx}
                    type="button"
                    onClick={() => {
                      setCurrentVideoIndex(idx);
                      setVideo(videos[idx]);
                      setCanSubmitVideo(v.isWatched || false);
                      setSecondsLeft(v.durationSeconds || 30);
                    }}
                    className={`shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      idx === currentVideoIndex
                        ? 'bg-[#B33A35] text-white shadow-md'
                        : v.isWatched
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>Video {idx + 1}</span>
                    {v.isWatched && <FiCheckCircle className="text-green-600 inline" />}
                  </button>
                ))}
              </div>
            )}

            <div
              ref={videoContainerRef}
              className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative group flex items-center justify-center mb-6 sm:mb-8"
            >
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullScreen}
                className="absolute top-3 right-3 z-30 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-lg"
                title={isFullscreen ? "Exit Fullscreen" : "Full Screen"}
              >
                {isFullscreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
              </button>

              {video?.videoUrl ? (
                extractYouTubeId(video.videoUrl) ? (
                  <div id="yt-player" key={extractYouTubeId(video.videoUrl)} className="w-full h-full" />
                ) : (
                  <video
                    key={video.videoUrl}
                    src={video.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    onEnded={handleVideoWatched}
                    onTimeUpdate={handleTimeUpdate}
                    onRateChange={handleRateChange}
                  />
                )
              ) : (
                <>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        handleVideoWatched();
                        toggleFullScreen(e);
                      }}
                      className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all transform hover:scale-110"
                    >
                      <FiPlayCircle className="text-white text-3xl sm:text-4xl" />
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

            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (currentVideoIndex > 0) {
                    const prevIdx = currentVideoIndex - 1;
                    setCurrentVideoIndex(prevIdx);
                    setVideo(videos[prevIdx]);
                  } else {
                    setStep(2);
                  }
                }}
                className="w-full sm:w-auto px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-1.5 text-xs"
              >
                <FiArrowLeft /> {currentVideoIndex > 0 ? `Previous Video` : 'Back'}
              </button>
              <button
                type="button"
                disabled={!canSubmitVideo && !videoWatched && !videos[currentVideoIndex]?.isWatched}
                onClick={handleVideoWatched}
                className="w-full sm:w-auto py-3 px-6 sm:px-8 bg-[#B33A35] hover:bg-[#9E2E2A] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors shadow-lg cursor-pointer active:scale-95 text-xs flex items-center justify-center gap-1.5 text-center"
              >
                {currentVideoIndex < videos.length - 1
                  ? (secondsLeft > 0 && !videos[currentVideoIndex]?.isWatched ? `Watched Video (${secondsLeft}s)` : `Next Video (${currentVideoIndex + 2}/${videos.length}) →`)
                  : (secondsLeft > 0 && !videos[currentVideoIndex]?.isWatched && !videoWatched ? `Watched Video (${secondsLeft}s)` : "Complete Training & Take MCQ Test")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MCQ Test */}
        {step === 4 && (
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
                  fetchStatus();
                }
              }}
            />
          </div>
        )}

      </div>

      {/* Level Assignment Modal */}
      {levelInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 w-full max-w-xs sm:max-w-sm text-center shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-400 text-white text-2xl shadow-md">
              {levelInfo.level === 'L1' || levelInfo.level === 1 ? '🥇' : levelInfo.level === 'L2' || levelInfo.level === 2 ? '🥈' : '📚'}
            </div>

            <h3 className="text-gray-900 font-extrabold text-lg sm:text-xl mb-1">
              {levelInfo.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}
            </h3>

            <p className="text-gray-500 text-xs sm:text-sm mb-3">
              You scored <span className="font-bold text-gray-800">{levelInfo.score}%</span> on the MCQ Test.
            </p>

            <div className={`p-3 rounded-xl border mb-4 text-left ${levelInfo.level === 'L1' || levelInfo.level === 1
                ? 'bg-amber-50/50 border-amber-200'
                : levelInfo.level === 'L2' || levelInfo.level === 2
                  ? 'bg-blue-50/50 border-blue-200'
                  : 'bg-red-50/50 border-red-200'
              }`}>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white inline-block ${levelInfo.level === 'L1' || levelInfo.level === 1
                  ? 'bg-amber-500'
                  : levelInfo.level === 'L2' || levelInfo.level === 2
                    ? 'bg-blue-500'
                    : 'bg-red-500'
                }`}>
                {levelInfo.level === 'L1' || levelInfo.level === 1
                  ? adminLevelConfig?.L1?.badge || adminLevelConfig?.L1?.name || 'Level 1 — Premium'
                  : levelInfo.level === 'L2' || levelInfo.level === 2
                    ? adminLevelConfig?.L2?.badge || adminLevelConfig?.L2?.name || 'Level 2 — Standard'
                    : adminLevelConfig?.L3?.badge || adminLevelConfig?.L3?.name || 'Level 3 — Basic'}
              </span>
              <p className="text-gray-700 text-xs mt-2 font-medium leading-relaxed">
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
                className="w-full py-2.5 bg-[#B33A35] hover:bg-[#9E2E2A] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs sm:text-sm active:scale-95"
              >
                Proceed to Review
              </button>
            ) : (
              <button
                onClick={() => setLevelInfo(null)}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs sm:text-sm active:scale-95"
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
