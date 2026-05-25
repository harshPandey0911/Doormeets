import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiVideo, FiHelpCircle, FiUsers, FiBarChart2, FiPlus, FiEdit2,
  FiTrash2, FiCheck, FiX, FiRefreshCw, FiZap, FiAlertTriangle,
  FiChevronDown, FiChevronUp, FiStar, FiActivity
} from 'react-icons/fi';
import {
  getTrainingStats, listVideos, createVideo, updateVideo, deleteVideo,
  listQuestions, createQuestion, updateQuestion, deleteQuestion,
  listAttempts, assignRetraining, freezeVendor, unfreezeVendor
} from '../../../../services/adminTrainingService';

// ────────────────────── CONSTANTS ──────────────────────
const TABS = [
  { id: 'stats', label: 'Overview', icon: FiBarChart2 },
  { id: 'videos', label: 'Training Videos', icon: FiVideo },
  { id: 'questions', label: 'MCQ Questions', icon: FiHelpCircle },
  { id: 'attempts', label: 'Vendor Attempts', icon: FiUsers }
];

const LEVEL_COLORS = {
  L1: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  L2: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  L3: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

// ────────────────────── MODAL COMPONENT ──────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-900 font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ────────────────────── STATS TAB ──────────────────────
const StatsTab = ({ stats }) => {
  if (!stats) return <div className="text-gray-500 text-center py-12">Loading stats...</div>;

  const levels = ['L1', 'L2', 'L3'];
  const total = stats.totalVendorsTrained || 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Attempts', value: stats.totalAttempts || 0, icon: FiActivity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Vendors Trained', value: total, icon: FiUsers, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pass Rate', value: `${stats.passRate || 0}%`, icon: FiCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg Score', value: `${stats.averageScore || 0}%`, icon: FiStar, color: 'text-yellow-600', bg: 'bg-yellow-50' }
        ].map((item, i) => (
          <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col items-center text-center">
            <div className={`p-3 rounded-full ${item.bg} mb-3`}>
              <item.icon className={item.color} size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <p className="text-gray-500 text-xs mt-1 font-medium uppercase tracking-wide">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Level Distribution */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
        <h4 className="text-gray-900 font-bold mb-6">Level Distribution</h4>
        {levels.map(level => {
          const entry = stats.levelDistribution?.find(l => l._id === level);
          const count = entry?.count || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const colors = LEVEL_COLORS[level];
          return (
            <div key={level} className="mb-4 last:mb-0">
              <div className="flex justify-between mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>{level}</span>
                <span className="text-gray-600 text-sm font-medium">{count} vendors ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${
                    level === 'L1' ? 'bg-yellow-400' : level === 'L2' ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ────────────────────── VIDEOS TAB ──────────────────────
const VideosTab = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', videoSource: 'youtube', durationSeconds: 300, isRequired: true, order: 0 });

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const res = await listVideos();
      setVideos(res.data || []);
    } catch { toast.error('Failed to load videos'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingVideo(null);
    setForm({ title: '', description: '', videoUrl: '', videoSource: 'youtube', durationSeconds: 300, isRequired: true, order: videos.length });
    setShowModal(true);
  };

  const openEdit = (video) => {
    setEditingVideo(video);
    setForm({ title: video.title, description: video.description, videoUrl: video.videoUrl, videoSource: video.videoSource, durationSeconds: video.durationSeconds, isRequired: video.isRequired, order: video.order });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.videoUrl) return toast.error('Title and Video URL are required');
    try {
      if (editingVideo) {
        await updateVideo(editingVideo._id, form);
        toast.success('Video updated');
      } else {
        await createVideo(form);
        toast.success('Video created');
      }
      setShowModal(false);
      loadVideos();
    } catch { toast.error('Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this video?')) return;
    try {
      await deleteVideo(id);
      toast.success('Video deactivated');
      loadVideos();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="text-gray-500 text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">{videos.length} training videos</p>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md" style={{ backgroundColor: '#347989' }}>
          <FiPlus size={16} /> Add Video
        </button>
      </div>

      <div className="space-y-4">
        {videos.map(video => (
          <div key={video._id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-[#347989]/10 border border-[#347989]/20 flex items-center justify-center flex-shrink-0">
              <FiVideo className="text-[#347989]" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h4 className="text-gray-900 font-bold text-base">{video.title}</h4>
                <div className="flex gap-2">
                  {video.isRequired && <span className="text-xs bg-orange-100 text-orange-700 font-semibold border border-orange-200 rounded-full px-2.5 py-0.5">Required</span>}
                  {!video.isActive && <span className="text-xs bg-red-100 text-red-700 font-semibold border border-red-200 rounded-full px-2.5 py-0.5">Inactive</span>}
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-1 font-medium">Duration: {Math.floor(video.durationSeconds / 60)}m · Views: {video.totalViews} · Order: {video.order}</p>
              <p className="text-gray-400 text-xs mt-1 truncate max-w-md">{video.videoUrl}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(video)} className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-lg transition-colors">
                <FiEdit2 size={16} />
              </button>
              <button onClick={() => handleDelete(video._id)} className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-lg transition-colors">
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {videos.length === 0 && <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 text-center py-12">No videos yet. Add your first training video.</div>}
      </div>

      {showModal && (
        <Modal title={editingVideo ? 'Edit Video' : 'Add Training Video'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {[
              { label: 'Title *', key: 'title', type: 'text', placeholder: 'e.g. Customer Service Excellence' },
              { label: 'Description', key: 'description', type: 'textarea', placeholder: 'Brief description...' },
              { label: 'YouTube Video ID or URL *', key: 'videoUrl', type: 'text', placeholder: 'dQw4w9WgXcQ or full URL' },
              { label: 'Duration (seconds)', key: 'durationSeconds', type: 'number', placeholder: '300' },
              { label: 'Display Order', key: 'order', type: 'number', placeholder: '1' }
            ].map(field => (
              <div key={field.key}>
                <label className="block text-gray-700 text-sm font-bold mb-1.5">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full bg-white border border-gray-300 focus:border-[#347989] focus:ring-2 focus:ring-[#347989]/20 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none resize-none transition-all"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-white border border-gray-300 focus:border-[#347989] focus:ring-2 focus:ring-[#347989]/20 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none transition-all"
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setForm(f => ({ ...f, isRequired: !f.isRequired }))}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${form.isRequired ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                {form.isRequired ? '✓ Required Video' : 'Optional Video'}
              </button>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 mt-4 rounded-xl text-white font-bold transition-transform hover:-translate-y-0.5 shadow-md" style={{ backgroundColor: '#347989' }}>
              {editingVideo ? 'Update Video' : 'Create Video'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ────────────────────── QUESTIONS TAB ──────────────────────
const QuestionsTab = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);
  const emptyForm = () => ({
    question: '',
    explanation: '',
    difficulty: 'medium',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { loadQuestions(); }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await listQuestions();
      setQuestions(res.data || []);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditingQ(null); setForm(emptyForm()); setShowModal(true); };
  const openEdit = (q) => {
    setEditingQ(q);
    setForm({ question: q.question, explanation: q.explanation, difficulty: q.difficulty, options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })) });
    setShowModal(true);
  };

  const setCorrect = (idx) => {
    setForm(f => ({ ...f, options: f.options.map((o, i) => ({ ...o, isCorrect: i === idx })) }));
  };

  const handleSave = async () => {
    if (!form.question || form.options.some(o => !o.text)) return toast.error('All fields required');
    try {
      if (editingQ) { await updateQuestion(editingQ._id, form); toast.success('Question updated'); }
      else { await createQuestion(form); toast.success('Question created'); }
      setShowModal(false);
      loadQuestions();
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this question?')) return;
    try { await deleteQuestion(id); toast.success('Deactivated'); loadQuestions(); }
    catch { toast.error('Failed'); }
  };

  const DIFF_COLORS = { easy: 'text-green-600 bg-green-50 border-green-200', medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', hard: 'text-red-600 bg-red-50 border-red-200' };

  if (loading) return <div className="text-gray-500 text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm font-medium">{questions.length} questions total</p>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md" style={{ backgroundColor: '#347989' }}>
          <FiPlus size={16} /> Add Question
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q._id} className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md">
            <button
              className="w-full p-5 text-left flex items-start gap-4"
              onClick={() => setExpandedQ(expandedQ === q._id ? null : q._id)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-gray-900 text-base font-bold text-left leading-snug">{q.question}</p>
                <span className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full border capitalize ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={e => { e.stopPropagation(); openEdit(q); }} className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-lg transition-colors">
                  <FiEdit2 size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); handleDelete(q._id); }} className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-lg transition-colors">
                  <FiTrash2 size={14} />
                </button>
                <div className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
                  {expandedQ === q._id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </div>
              </div>
            </button>

            {expandedQ === q._id && (
              <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
                <div className="space-y-2 mt-4">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium border ${opt.isCorrect ? 'bg-green-100/50 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-600'}`}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${opt.isCorrect ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                        {opt.isCorrect && <FiCheck size={12} className="text-white" />}
                      </div>
                      {opt.text}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                    <span className="text-blue-500 flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-blue-800 text-sm">{q.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {questions.length === 0 && <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 text-center py-12">No questions yet. Add your first MCQ.</div>}
      </div>

      {showModal && (
        <Modal title={editingQ ? 'Edit Question' : 'Add MCQ Question'} onClose={() => setShowModal(false)}>
          <div className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1.5">Question *</label>
              <textarea
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder="What is...?"
                rows={3}
                className="w-full bg-white border border-gray-300 focus:border-[#347989] focus:ring-2 focus:ring-[#347989]/20 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Options (click circle to mark correct) *</label>
              <div className="space-y-3">
                {form.options.map((opt, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${opt.isCorrect ? 'border-green-400 bg-green-50 shadow-sm' : 'border-gray-200 bg-gray-50 hover:bg-white'}`}>
                    <button
                      onClick={() => setCorrect(idx)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${opt.isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                    >
                      {opt.isCorrect && <FiCheck size={14} className="text-white" />}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => setForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, text: e.target.value } : o) }))}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-transparent text-gray-900 font-medium text-sm outline-none placeholder-gray-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1.5">Explanation (shown after test)</label>
              <textarea
                value={form.explanation}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="Why is this the correct answer..."
                rows={2}
                className="w-full bg-white border border-gray-300 focus:border-[#347989] focus:ring-2 focus:ring-[#347989]/20 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Difficulty</label>
              <div className="flex gap-3">
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border capitalize transition-all ${form.difficulty === d ? 'border-[#347989] bg-[#347989] text-white shadow-md' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-3.5 mt-2 rounded-xl text-white font-bold transition-transform hover:-translate-y-0.5 shadow-md" style={{ backgroundColor: '#347989' }}>
              {editingQ ? 'Update Question' : 'Create Question'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ────────────────────── ATTEMPTS TAB ──────────────────────
const AttemptsTab = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freezeModal, setFreezeModal] = useState(null);
  const [freezeReason, setFreezeReason] = useState('');

  useEffect(() => { loadAttempts(); }, []);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const res = await listAttempts({ limit: 50 });
      setAttempts(res.data || []);
    } catch { toast.error('Failed to load attempts'); }
    finally { setLoading(false); }
  };

  const handleRetraining = async (vendorId) => {
    const reason = window.prompt('Reason for retraining (optional):');
    if (reason === null) return; // Cancelled
    try {
      await assignRetraining(vendorId, reason);
      toast.success('Retraining assigned');
      loadAttempts();
    } catch { toast.error('Failed'); }
  };

  const handleFreeze = async () => {
    if (!freezeReason.trim()) return toast.error('Reason is required');
    try {
      await freezeVendor(freezeModal._id, freezeReason);
      toast.success('Vendor frozen');
      setFreezeModal(null);
      setFreezeReason('');
      loadAttempts();
    } catch { toast.error('Failed'); }
  };

  const handleUnfreeze = async (vendorId) => {
    try {
      await unfreezeVendor(vendorId);
      toast.success('Vendor unfrozen');
      loadAttempts();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="text-gray-500 text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="space-y-4">
        {attempts.map(attempt => {
          const vendor = attempt.vendorId;
          if (!vendor) return null;
          const level = attempt.levelAssigned;
          const lc = LEVEL_COLORS[level] || LEVEL_COLORS.L3;

          return (
            <div key={attempt._id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h4 className="text-gray-900 font-bold text-lg">{vendor.name}</h4>
                    <span className={`text-xs px-3 py-0.5 rounded-full border font-bold uppercase tracking-wide ${lc.bg} ${lc.text} ${lc.border}`}>
                      {level}
                    </span>
                    {vendor.isFrozen && (
                      <span className="text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-3 py-0.5 font-bold uppercase tracking-wide flex items-center gap-1">
                        <FiAlertTriangle size={12} /> Frozen
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm font-medium">{vendor.email} · {vendor.phone}</p>
                  
                  <div className="flex items-center gap-4 mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 font-medium border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-900 shadow-sm">
                        {attempt.score}
                      </div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Score</span>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div>Attempt #{attempt.attemptNumber}</div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div>{new Date(attempt.completedAt).toLocaleDateString()}</div>
                  </div>
                  
                  {/* Score bar */}
                  <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${attempt.score >= 80 ? 'bg-yellow-400' : attempt.score >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                      style={{ width: `${attempt.score}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2">
                  <button
                    onClick={() => handleRetraining(vendor._id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-[#347989] hover:border-[#347989]/30 transition-colors shadow-sm"
                  >
                    <FiRefreshCw size={14} /> Retrain
                  </button>
                  {vendor.isFrozen ? (
                    <button
                      onClick={() => handleUnfreeze(vendor._id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors shadow-sm"
                    >
                      <FiZap size={14} /> Unfreeze
                    </button>
                  ) : (
                    <button
                      onClick={() => setFreezeModal(vendor)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
                    >
                      <FiAlertTriangle size={14} /> Freeze
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {attempts.length === 0 && <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 text-center py-12">No vendor attempts yet.</div>}
      </div>

      {/* Freeze Modal */}
      {freezeModal && (
        <Modal title={`Freeze ${freezeModal.name}`} onClose={() => setFreezeModal(null)}>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <FiAlertTriangle className="text-red-500 mt-0.5" size={18} />
              <p className="text-red-800 text-sm font-medium leading-relaxed">This will block all activity for this vendor immediately. They will not be able to log in or access the app.</p>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1.5">Freeze Reason *</label>
              <textarea
                value={freezeReason}
                onChange={e => setFreezeReason(e.target.value)}
                placeholder="Explain why this account is being frozen..."
                rows={3}
                className="w-full bg-white border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 rounded-xl px-4 py-2.5 text-gray-900 text-sm outline-none resize-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setFreezeModal(null)} className="flex-1 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 shadow-sm transition-colors">Cancel</button>
              <button onClick={handleFreeze} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-md transition-transform hover:-translate-y-0.5">Freeze Account</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ────────────────────── MAIN PAGE ──────────────────────
const AdminTrainingPage = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getTrainingStats()
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-6 py-8 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-extrabold text-gray-900">Training & Certification</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Manage training videos, MCQ questions, and vendor certifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-bold whitespace-nowrap border-b-[3px] transition-all ${
                  activeTab === tab.id
                    ? 'text-[#347989] border-[#347989]'
                    : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'stats' && <StatsTab stats={stats} />}
        {activeTab === 'videos' && <VideosTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'attempts' && <AttemptsTab />}
      </div>
    </div>
  );
};

export default AdminTrainingPage;
