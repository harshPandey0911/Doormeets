import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiCheckCircle, FiXCircle, FiAward, FiRefreshCw,
  FiArrowRight, FiBookOpen, FiHome
} from 'react-icons/fi';

const levelConfig = {
  L1: {
    label: 'Level 1 — Premium',
    color: '#f59e0b',
    glow: '#f59e0b40',
    bg: 'from-yellow-500/30 to-orange-500/20',
    border: 'border-yellow-400/50',
    emoji: '🥇',
    message: 'Outstanding! You\'re a Level 1 certified vendor. You\'ll receive priority job allocation.',
    badge: 'bg-gradient-to-r from-yellow-400 to-orange-400'
  },
  L2: {
    label: 'Level 2 — Standard',
    color: '#3b82f6',
    glow: '#3b82f640',
    bg: 'from-blue-500/30 to-indigo-500/20',
    border: 'border-blue-400/50',
    emoji: '🥈',
    message: 'Well done! You\'re a Level 2 certified vendor with standard job access.',
    badge: 'bg-gradient-to-r from-blue-400 to-indigo-400'
  },
  L3: {
    label: 'Level 3 — Basic',
    color: '#ef4444',
    glow: '#ef444440',
    bg: 'from-red-500/20 to-pink-500/10',
    border: 'border-red-400/40',
    emoji: '📚',
    message: 'Keep learning! Score 50% or above to unlock full vendor access.',
    badge: 'bg-gradient-to-r from-red-400 to-pink-400'
  }
};

const ScoreRing = ({ score, color }) => {
  const r = 60;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;
  const ringRef = useRef(null);

  useEffect(() => {
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = circumference;
      setTimeout(() => {
        if (ringRef.current) {
          ringRef.current.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
          ringRef.current.style.strokeDashoffset = dashOffset;
        }
      }, 300);
    }
  }, [score]);

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
        <circle
          ref={ringRef}
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white">{score}%</span>
        <span className="text-purple-300 text-xs font-medium">Score</span>
      </div>
    </div>
  );
};

const TrainingResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    navigate('/vendor/training', { replace: true });
    return null;
  }

  const { score, correctAnswers, totalQuestions, levelAssigned, passed, attemptNumber, nextAttemptAt, answerReview } = result;
  const level = levelConfig[levelAssigned] || levelConfig.L3;
  const [showReview, setShowReview] = React.useState(false);

  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-12">

        {/* Main Result Card */}
        <div className={`bg-gradient-to-br ${level.bg} border ${level.border} rounded-3xl p-8 text-center mb-6 relative overflow-hidden`}>
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: level.color }} />
          </div>

          <div className="relative z-10">
            <div className="text-5xl mb-4">{level.emoji}</div>

            {/* Score Ring */}
            <ScoreRing score={score} color={level.color} />

            {/* Level Badge */}
            <div className={`inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full text-white font-bold text-sm shadow-lg ${level.badge}`}>
              <FiAward size={16} />
              {level.label}
            </div>

            <p className="text-white/80 text-sm mt-4 max-w-xs mx-auto leading-relaxed">
              {level.message}
            </p>

            {/* Stats Row */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{correctAnswers}</p>
                <p className="text-xs text-white/60">Correct</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalQuestions - correctAnswers}</p>
                <p className="text-xs text-white/60">Incorrect</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">#{attemptNumber}</p>
                <p className="text-xs text-white/60">Attempt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Passing / Failing info */}
        {passed ? (
          <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <FiCheckCircle className="text-green-400 flex-shrink-0" size={24} />
            <div>
              <p className="text-green-200 font-semibold">Training Passed! 🎉</p>
              <p className="text-green-300 text-sm">Your account is now pending admin review. You'll be notified once approved.</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <FiXCircle className="text-red-400 flex-shrink-0" size={24} />
              <p className="text-red-200 font-semibold">Score Below Passing (50%)</p>
            </div>
            <p className="text-red-300 text-sm">
              You need at least 50% to pass. Review the training videos and retake the test.
            </p>
            {nextAttemptAt && (
              <p className="text-red-300 text-xs mt-2">
                ⏰ Next attempt allowed: {new Date(nextAttemptAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Score Breakdown Bar */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-purple-200 text-sm font-medium">Score Breakdown</span>
            <span className="text-white font-bold text-sm">{score}% / 100%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-1000"
              style={{
                width: `${score}%`,
                background: passed ? 'linear-gradient(90deg, #10b981, #3b82f6)' : 'linear-gradient(90deg, #ef4444, #f59e0b)'
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-purple-300 mt-1">
            <span>0%</span>
            <span className="text-red-400">50% (L3 min)</span>
            <span className="text-blue-400">80% (L1)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Answer Review Toggle */}
        {answerReview && answerReview.length > 0 && (
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 mb-4 hover:bg-white/20 transition-colors"
          >
            <FiBookOpen size={16} />
            {showReview ? 'Hide' : 'Review'} Answers & Explanations
          </button>
        )}

        {showReview && answerReview && (
          <div className="space-y-3 mb-6">
            {answerReview.map((item, idx) => (
              <div
                key={item.questionId}
                className={`rounded-2xl p-4 border ${
                  item.isCorrect
                    ? 'bg-green-500/10 border-green-400/30'
                    : 'bg-red-500/10 border-red-400/30'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {item.isCorrect
                    ? <FiCheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                    : <FiXCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                  }
                  <p className="text-white text-sm font-medium">
                    Q{idx + 1}. {item.question}
                  </p>
                </div>
                {!item.isCorrect && item.explanation && (
                  <p className="text-purple-200 text-xs ml-6 italic">
                    💡 {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {passed ? (
            <button
              onClick={() => navigate('/vendor/verification')}
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:-translate-y-1 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <FiArrowRight size={20} /> Proceed to Next Step
            </button>
          ) : (
            <button
              onClick={() => navigate('/vendor/training')}
              disabled={nextAttemptAt && new Date() < new Date(nextAttemptAt)}
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:-translate-y-1 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}
            >
              <FiRefreshCw size={20} /> Review Training & Retake
            </button>
          )}

          <button
            onClick={() => navigate('/vendor/training')}
            className="w-full py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <FiArrowRight size={16} /> Back to Training
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingResult;
