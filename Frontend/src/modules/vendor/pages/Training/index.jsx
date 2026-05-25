import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiPlay, FiCheckCircle, FiClock, FiLock, FiArrowRight,
  FiYoutube, FiBookOpen, FiAward, FiAlertCircle
} from 'react-icons/fi';
import { getTrainingVideos, markVideoWatched, getTrainingStatus } from '../../../../services/trainingService';

const TrainingPage = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [watchTimers, setWatchTimers] = useState({});
  const timerRef = useRef({});

  useEffect(() => {
    loadData();
    return () => {
      // Clear all timers on unmount
      Object.values(timerRef.current).forEach(clearInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [videosRes, statusRes] = await Promise.all([
        getTrainingVideos(),
        getTrainingStatus()
      ]);
      setVideos(videosRes.data || []);
      setStatus(statusRes.data);
    } catch (err) {
      toast.error('Failed to load training content');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPlay = (video) => {
    setActiveVideo(video._id);
    // Start watch timer
    if (!timerRef.current[video._id]) {
      let seconds = 0;
      timerRef.current[video._id] = setInterval(() => {
        seconds++;
        setWatchTimers(prev => ({ ...prev, [video._id]: seconds }));
        // Auto-mark as watched at 80% of duration
        const threshold = Math.floor(video.durationSeconds * 0.8);
        if (seconds >= threshold) {
          clearInterval(timerRef.current[video._id]);
          delete timerRef.current[video._id];
          handleMarkWatched(video._id, seconds, true);
        }
      }, 1000);
    }
  };

  const handleMarkWatched = async (videoId, watchedSeconds, fullyWatched) => {
    try {
      const res = await markVideoWatched(videoId, watchedSeconds, fullyWatched);
      if (res.success) {
        // Update local state
        setVideos(prev => prev.map(v =>
          v._id === videoId ? { ...v, isWatched: fullyWatched } : v
        ));
        if (fullyWatched) {
          toast.success('✅ Video completed!');
        }
      }
    } catch (err) {
      console.error('Failed to record video progress:', err);
    }
  };

  const watchedRequired = videos.filter(v => v.isRequired && v.isWatched).length;
  const totalRequired = videos.filter(v => v.isRequired).length;
  const canTakeTest = watchedRequired >= totalRequired && totalRequired > 0;
  const progress = totalRequired > 0 ? Math.round((watchedRequired / totalRequired) * 100) : 0;

  const getYouTubeEmbedUrl = (videoUrl) => {
    // Handle both full URLs and video IDs
    const youtubeId = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
      ? videoUrl.split(/[?&=/]/).filter(s => s.length === 11)[0]
      : videoUrl;
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatWatchTime = (videoId) => {
    const secs = watchTimers[videoId] || 0;
    return formatDuration(secs);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading training content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      {/* Header */}
      <div className="relative px-6 pt-12 pb-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-purple-600 rounded-full opacity-10 blur-3xl" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <FiBookOpen className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vendor Training</h1>
              <p className="text-purple-200 text-sm">Complete training to unlock your dashboard</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold text-sm">Progress</span>
              <span className="text-purple-200 text-sm">{watchedRequired}/{totalRequired} required videos</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #a855f7, #3b82f6)'
                }}
              />
            </div>
            <p className="text-purple-200 text-xs mt-2">{progress}% Complete</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* Status Banner */}
        {status?.training?.status === 'failed' && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-2xl flex items-start gap-3">
            <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-200 font-semibold text-sm">Previous attempt failed</p>
              {status.nextAttemptAt && (
                <p className="text-red-300 text-xs mt-1">
                  Next retake allowed: {new Date(status.nextAttemptAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Videos */}
        <div className="space-y-4">
          {videos.map((video, idx) => (
            <div
              key={video._id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden transition-all duration-300"
            >
              {/* Video Header */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    video.isWatched
                      ? 'bg-green-500/30 border border-green-400/50'
                      : 'bg-purple-500/30 border border-purple-400/50'
                  }`}>
                    {video.isWatched
                      ? <FiCheckCircle className="text-green-400" size={20} />
                      : <span className="text-purple-200 font-bold text-sm">{idx + 1}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-semibold text-sm leading-tight">{video.title}</h3>
                      {video.isRequired && (
                        <span className="text-xs bg-orange-500/30 text-orange-300 border border-orange-400/30 rounded-full px-2 py-0.5 flex-shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-purple-300 text-xs mt-1 line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-purple-300 text-xs">
                        <FiClock size={10} />
                        {formatDuration(video.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1 text-purple-300 text-xs">
                        <FiYoutube size={10} />
                        YouTube
                      </span>
                      {watchTimers[video._id] && !video.isWatched && (
                        <span className="text-yellow-300 text-xs">
                          Watched: {formatWatchTime(video._id)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Watch Button */}
                <button
                  onClick={() => setActiveVideo(activeVideo === video._id ? null : video._id)}
                  className={`mt-3 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 ${
                    video.isWatched
                      ? 'bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-purple-900/50'
                  }`}
                >
                  {video.isWatched ? (
                    <><FiCheckCircle size={16} /> Watched — Rewatch</>
                  ) : (
                    <><FiPlay size={16} /> Watch Video</>
                  )}
                </button>
              </div>

              {/* Embedded Video Player */}
              {activeVideo === video._id && (
                <div className="border-t border-white/20">
                  <div className="relative" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={getYouTubeEmbedUrl(video.videoUrl)}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                      onLoad={() => handleVideoPlay(video)}
                    />
                  </div>
                  {!video.isWatched && (
                    <div className="p-3 flex gap-2">
                      <button
                        onClick={() => handleMarkWatched(video._id, watchTimers[video._id] || 0, true)}
                        className="flex-1 py-2 bg-green-500/20 border border-green-400/30 text-green-300 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-colors"
                      >
                        ✅ Mark as Watched
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Take Test CTA */}
        <div className="mt-6">
          {canTakeTest ? (
            <button
              onClick={() => navigate('/vendor/training/test')}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:opacity-90 hover:-translate-y-1 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}
            >
              <FiAward size={22} />
              Start Certification Test
              <FiArrowRight size={22} />
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center gap-3">
              <FiLock className="text-purple-300" size={20} />
              <div className="text-left">
                <p className="text-white font-semibold">Test Locked</p>
                <p className="text-purple-300 text-xs">Watch all required videos to unlock the test</p>
              </div>
            </div>
          )}
        </div>

        {/* Already completed */}
        {status?.training?.status === 'completed' && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-400/30 rounded-2xl text-center">
            <FiCheckCircle className="text-green-400 mx-auto mb-2" size={28} />
            <p className="text-green-200 font-semibold">Training Completed!</p>
            <p className="text-green-300 text-sm mt-1">
              Score: {status.trainingScore}% — Level {status.currentLevel}
            </p>
            <p className="text-green-300 text-xs mt-1">Awaiting admin approval to go live.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingPage;
