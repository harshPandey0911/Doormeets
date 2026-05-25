import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiArrowRight, FiArrowLeft, FiClock, FiCheckCircle,
  FiAlertCircle, FiBookOpen, FiTarget
} from 'react-icons/fi';
import { getTestQuestions, submitTest } from '../../../../services/trainingService';

const MCQTest = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  // Timer
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
      // 90 seconds per question
      setTimeLeft((res.data?.length || 10) * 90);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load test';
      toast.error(msg);
      navigate('/vendor/training');
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
        navigate('/vendor/training/result', { state: { result: res.data }, replace: true });
      } else {
        toast.error(res.message || 'Submission failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, navigate]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timeColor = timeLeft < 60
    ? 'text-red-400 animate-pulse'
    : timeLeft < 180
      ? 'text-yellow-400'
      : 'text-green-400';

  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Preparing your test...</p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
            <FiTarget className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Certification Test</h1>
          <p className="text-purple-200 mb-6">
            {questions.length} questions · {Math.round(questions.length * 1.5)} minutes
          </p>

          <div className="space-y-3 mb-8 text-left">
            {[
              { icon: '📋', text: `${questions.length} multiple choice questions` },
              { icon: '✅', text: 'Each question has exactly 1 correct answer' },
              { icon: '🏆', text: '80%+ = Level L1 · 50-79% = Level L2 · <50% = Level L3' },
              { icon: '⏰', text: `${Math.round(questions.length * 1.5)} minute time limit` },
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
          {/* Timer */}
          <div className={`flex items-center gap-1 font-mono font-bold text-lg ${timeColor}`}>
            <FiClock size={16} />
            {formatTime(timeLeft)}
          </div>
          <div className="text-purple-200 text-sm">
            {answeredCount}/{questions.length} answered
          </div>
        </div>

        {/* Progress Bar */}
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
        {/* Question Card */}
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

            {/* Options */}
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

        {/* Question Navigator (dots) */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {questions.map((q, idx) => (
            <button
              key={q._id}
              onClick={() => setCurrentQ(idx)}
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

        {/* Navigation Buttons */}
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
              onClick={() => setCurrentQ(q => q + 1)}
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

        {/* Unanswered warning */}
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
