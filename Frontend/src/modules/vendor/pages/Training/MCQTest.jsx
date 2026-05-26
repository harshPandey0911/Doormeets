import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiArrowRight, FiArrowLeft, FiClock, FiCheckCircle,
  FiAlertCircle, FiBookOpen, FiTarget, FiSend
} from 'react-icons/fi';
import { getTestQuestions, submitTest } from '../../../../services/trainingService';

const MCQTest = ({ onComplete = null }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  // In embedded mode (VerificationPage), skip intro screen and start directly
  const [testStarted, setTestStarted] = useState(!!onComplete);

  useEffect(() => {
    loadQuestions();
  }, []);

  // Timer — only runs when test is started
  useEffect(() => {
    if (!testStarted || timeLeft === null) return;
    if (timeLeft === 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, testStarted]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await getTestQuestions();
      if (!res.success) throw new Error(res.message);
      setQuestions(res.data || []);
      // Use admin-configured time limit from backend (in minutes), convert to seconds
      const timeLimitSecs = (res.timeLimitMinutes || 30) * 60;
      setTimeLeft(timeLimitSecs);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load test';
      toast.error(msg);
      if (!onComplete) navigate('/vendor/training');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = useCallback(async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const unanswered = questions.length - answeredCount;
      if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }

    setSubmitting(true);
    try {
      const payload = questions.map(q => ({
        questionId: q._id,
        selectedOptionIndex: answers[q._id] !== undefined ? answers[q._id] : -1
      })).filter(a => a.selectedOptionIndex >= 0);

      const res = await submitTest(payload);
      if (res.success) {
        if (onComplete) {
          onComplete(res.data);
        } else {
          navigate('/vendor/training/result', { state: { result: res.data }, replace: true });
        }
      } else {
        toast.error(res.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, navigate, onComplete]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // ─── Embedded (white) theme helpers ───
  const isEmbedded = !!onComplete;

  const timeUrgent = timeLeft !== null && timeLeft < 60;
  const timeWarning = timeLeft !== null && timeLeft < 180 && !timeUrgent;

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-20 ${isEmbedded ? 'bg-transparent' : 'min-h-screen'}`}
        style={isEmbedded ? {} : { background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="text-center">
          <div className={`w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${isEmbedded ? 'border-[#9634f7]' : 'border-purple-400'}`} />
          <p className={`text-base font-medium ${isEmbedded ? 'text-gray-600' : 'text-white'}`}>Preparing your test...</p>
        </div>
      </div>
    );
  }

  // ─── Intro screen (standalone mode only) ───
  if (!testStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
            <FiTarget className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Certification Test</h1>
          <p className="text-purple-200 mb-6">
            {questions.length} questions · {Math.round((timeLeft || 0) / 60)} minutes
          </p>

          <div className="space-y-3 mb-8 text-left">
            {[
              { icon: '📋', text: `${questions.length} multiple choice questions` },
              { icon: '✅', text: 'Each question has exactly 1 correct answer' },
              { icon: '🏆', text: '80%+ = Level L1 · 50-79% = Level L2 · <50% = Level L3' },
              { icon: '⏰', text: `${Math.round((timeLeft || 0) / 60)} minute time limit` },
              { icon: '🔄', text: 'If you score below 50%, you can retake after 24 hours' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-purple-100 text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setTestStarted(true)}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 hover:opacity-90 hover:-translate-y-1 transition-all duration-300 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}
          >
            Start Test <FiArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate('/vendor/training')}
            className="mt-3 w-full py-2 text-purple-300 text-sm hover:text-white transition-colors"
          >
            ← Back to Training
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQ];

  // ─── Embedded (White) Test UI ───
  if (isEmbedded) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-gray-700">
            <FiBookOpen size={18} className="text-[#9634f7]" />
            <span className="font-semibold text-sm">Question {currentQ + 1} of {questions.length}</span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-sm ${
            timeUrgent
              ? 'bg-red-100 text-red-600 animate-pulse'
              : timeWarning
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-purple-50 text-[#9634f7]'
          }`}>
            <FiClock size={15} />
            {formatTime(timeLeft)}
          </div>

          <div className="text-sm text-gray-500">
            <span className="font-semibold text-[#9634f7]">{answeredCount}</span>/{questions.length} answered
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full transition-all duration-500 rounded-r-full"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #9634f7, #c084fc)' }}
          />
        </div>

        <div className="p-6">
          {/* Question */}
          {currentQuestion && (
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#9634f7] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {currentQ + 1}
                </div>
                <p className="text-gray-800 text-base font-medium leading-relaxed pt-1">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 ml-11">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = answers[currentQuestion._id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswer(currentQuestion._id, optIdx)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-[#9634f7] bg-purple-50 shadow-md shadow-purple-100'
                          : 'border-gray-200 bg-white hover:border-[#9634f7]/40 hover:bg-purple-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-[#9634f7] bg-[#9634f7]' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-[#9634f7]' : 'text-gray-700'}`}>
                          {option.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question dot navigator */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => {
                  if (idx > currentQ && answers[currentQuestion._id] === undefined) {
                    toast.error('Please answer the current question first!');
                    return;
                  }
                  setCurrentQ(idx);
                }}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                  idx === currentQ
                    ? 'bg-[#9634f7] text-white border-[#9634f7] scale-110'
                    : answers[q._id] !== undefined
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-500 hover:border-[#9634f7] hover:text-[#9634f7]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
              disabled={currentQ === 0}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-gray-200 transition-all"
            >
              <FiArrowLeft size={18} /> Previous
            </button>

            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => {
                  if (answers[currentQuestion._id] === undefined) {
                    toast.error('Please answer the current question first!');
                    return;
                  }
                  setCurrentQ(q => q + 1);
                }}
                className="flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                style={{ background: 'linear-gradient(135deg, #9634f7, #c084fc)' }}
              >
                Next <FiArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><FiSend size={18} /> Submit Test</>
                )}
              </button>
            )}
          </div>

          {/* Unanswered warning */}
          {answeredCount < questions.length && currentQ === questions.length - 1 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <FiAlertCircle className="text-amber-500 flex-shrink-0" size={16} />
              <p className="text-amber-700 text-xs font-medium">
                {questions.length - answeredCount} question(s) unanswered. You can still submit.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Standalone Dark Test UI ───
  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiBookOpen className="text-purple-300" size={18} />
            <span className="text-white font-semibold text-sm">
              Q {currentQ + 1} / {questions.length}
            </span>
          </div>
          <div className={`flex items-center gap-1 font-mono font-bold text-lg ${
            timeUrgent ? 'text-red-400 animate-pulse' : timeWarning ? 'text-yellow-400' : 'text-green-400'
          }`}>
            <FiClock size={16} />
            {formatTime(timeLeft)}
          </div>
          <div className="text-purple-200 text-sm">
            {answeredCount}/{questions.length} answered
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #a855f7, #3b82f6)' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {currentQuestion && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {currentQ + 1}
              </div>
              <p className="text-white text-base font-medium leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>
            <div className="space-y-3">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = answers[currentQuestion._id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswer(currentQuestion._id, optIdx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-400 bg-purple-500/30 shadow-lg shadow-purple-900/50'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'border-purple-400 bg-purple-500' : 'border-white/40'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-purple-100'}`}>
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {questions.map((q, idx) => (
            <button
              key={q._id}
              onClick={() => {
                if (idx > currentQ && answers[currentQuestion._id] === undefined) {
                  toast.error('Please answer the current question first!');
                  return;
                }
                setCurrentQ(idx);
              }}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                idx === currentQ
                  ? 'bg-purple-500 text-white scale-110'
                  : answers[q._id] !== undefined
                  ? 'bg-green-500/40 border border-green-400 text-green-300'
                  : 'bg-white/10 border border-white/20 text-purple-300'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:bg-white/20"
          >
            <FiArrowLeft size={18} /> Previous
          </button>
          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => {
                if (answers[currentQuestion._id] === undefined) {
                  toast.error('Please answer the current question first!');
                  return;
                }
                setCurrentQ(q => q + 1);
              }}
              className="flex-1 py-3 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}
            >
              Next <FiArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><FiCheckCircle size={18} /> Submit Test</>
              )}
            </button>
          )}
        </div>

        {answeredCount < questions.length && currentQ === questions.length - 1 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-xl">
            <FiAlertCircle className="text-yellow-400 flex-shrink-0" size={16} />
            <p className="text-yellow-200 text-xs">
              {questions.length - answeredCount} question(s) unanswered. You can still submit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCQTest;
