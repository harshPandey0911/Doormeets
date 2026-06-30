import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  MdPerson,
  MdPhone,
  MdBuild,
  MdCheckCircleOutline,
  MdArrowForward,
  MdArrowBack,
  MdCloudUpload,
  MdPlayCircleFilled,
  MdHelpOutline,
  MdCheckCircle,
  MdClose
} from 'react-icons/md';

const AddVendor = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Documents, 3: Video, 4: MCQ, 5: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basic details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [professionId, setProfessionId] = useState('');
  const [professions, setProfessions] = useState([]);
  
  // Vendor tokens & info (received after Step 1)
  const [vendorToken, setVendorToken] = useState('');
  const [onboardedVendor, setOnboardedVendor] = useState(null);

  // Step 2: Verification Documents
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFront, setAadharFront] = useState('');
  const [aadharBack, setAadharBack] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panDoc, setPanDoc] = useState('');
  const [policeDoc, setPoliceDoc] = useState('');

  // Step 3: Training Video
  const [video, setVideo] = useState(null);
  const [videoWatched, setVideoWatched] = useState(false);

  // Step 4: MCQ Test
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Helper axios client for making vendor calls
  const getVendorClient = (token) => {
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  };

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const response = await axios.get(`${API_URL}/public/professions`);
        if (response.data.success) {
          setProfessions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching professions:', err);
      }
    };
    fetchProfessions();
  }, []);

  // Step 1: Register vendor
  const handleRegisterVendor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('shopAccessToken');
      const response = await axios.post(
        `${API_URL}/shop/vendors/add`,
        { name, phone, professionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const vendorData = response.data.data;
        const tokens = response.data.tokens;
        
        setOnboardedVendor(vendorData);
        setVendorToken(tokens.accessToken);
        toast.success('Basic registration completed successfully!');
        setStep(2); // Go to docs upload
      } else {
        setError(response.data.message || 'Failed to register vendor.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while submitting vendor details.');
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded file to base64
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

  // Step 2: Submit documents
  const handleSubmitDocuments = async (e) => {
    e.preventDefault();
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
    if (!policeDoc) {
      toast.error('Please upload Police Verification document');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const client = getVendorClient(vendorToken);
      
      // 1. Update Aadhaar and PAN on vendor profile
      await client.put('/vendors/profile', {
        aadharNumber,
        aadharDocument: aadharFront,
        aadharBackDocument: aadharBack,
        panNumber,
        panDocument: panDoc
      });

      // 2. Submit Police Verification
      const res = await client.post('/vendors/verification/police', {
        documentUrl: policeDoc
      });

      if (res.data.success) {
        toast.success('Verification documents submitted successfully!');
        
        // Fetch training videos for Step 3
        try {
          const videoRes = await client.get('/vendors/training/videos');
          if (videoRes.data?.success && videoRes.data?.data?.length > 0) {
            setVideo(videoRes.data.data[0]);
          }
        } catch (vErr) {
          console.error('Failed to fetch training videos:', vErr);
        }

        setStep(3); // Go to training video
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit verification documents.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete training video watch
  const handleVideoCompleted = async () => {
    if (!video) {
      // If no video was configured, proceed to MCQ directly
      setStep(4);
      return;
    }

    setLoading(true);
    try {
      const client = getVendorClient(vendorToken);
      await client.post('/vendors/training/watch', {
        videoId: video._id,
        watchedSeconds: video.duration || 60,
        fullyWatched: true
      });

      toast.success('Training video watched successfully.');

      // Load test questions for Step 4
      const testRes = await client.get('/vendors/training/test');
      if (testRes.data?.success) {
        setQuestions(testRes.data.data || []);
      }

      setStep(4); // Go to MCQ Test
    } catch (err) {
      console.error(err);
      toast.error('Failed to update video progress.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Submit MCQ test
  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const unanswered = questions.length - answeredCount;
      if (!window.confirm(`There are ${unanswered} unanswered question(s). Submit test anyway?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const client = getVendorClient(vendorToken);
      const payload = questions.map(q => ({
        questionId: q._id,
        selectedOptionIndex: answers[q._id] !== undefined ? answers[q._id] : -1
      })).filter(a => a.selectedOptionIndex >= 0);

      const res = await client.post('/vendors/training/submit', { answers: payload });
      if (res.data?.success) {
        setTestResult(res.data.data);
        toast.success(`MCQ test submitted! Score: ${res.data.data.score}%`);
        setStep(5); // Complete onboarding
      } else {
        setError(res.data?.message || 'Submission failed.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit MCQ test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Progress Tracker */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {[
            { id: 1, label: 'Details' },
            { id: 2, label: 'Verification' },
            { id: 3, label: 'Training' },
            { id: 4, label: 'MCQ Test' },
            { id: 5, label: 'Done' }
          ].map((s, index, arr) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    step >= s.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.id ? '✓' : s.id}
                </div>
                <span
                  className={`text-xs mt-2 font-bold ${
                    step >= s.id ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {index < arr.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                    step > s.id ? 'bg-blue-600' : 'bg-gray-100'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-600 hover:opacity-85 text-base">✕</button>
        </div>
      )}

      {/* STEP 1: Basic details */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">1</span>
            Onboard New Vendor Details
          </h3>
          <form onSubmit={handleRegisterVendor} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="vendorName" className="block text-sm font-bold text-gray-700 mb-2">
                  Vendor Full Name
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <MdPerson className="w-5 h-5" />
                  </div>
                  <input
                    id="vendorName"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vendorPhone" className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <MdPhone className="w-5 h-5" />
                  </div>
                  <input
                    id="vendorPhone"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-bold text-gray-700 mb-2">
                Profession / Primary Skill
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <MdBuild className="w-5 h-5" />
                </div>
                <select
                  id="profession"
                  required
                  value={professionId}
                  onChange={(e) => setProfessionId(e.target.value)}
                  className="block w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select a profession...</option>
                  {professions.map((prof) => (
                    <option key={prof._id} value={prof._id}>
                      {prof.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => navigate('/shop/dashboard')}
                className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
              >
                {loading ? 'Registering...' : 'Register & Verify'}
                <MdArrowForward className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Document Verification */}
      {step === 2 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">2</span>
            Document Verification for {name}
          </h3>
          <form onSubmit={handleSubmitDocuments} className="space-y-6">
            {/* Aadhaar details */}
            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">A</span>
                Aadhaar Card Details
              </h4>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Aadhaar Card Number</label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="12-digit Aadhaar Number"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Aadhaar Front Photo</label>
                  {aadharFront ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50 flex items-center justify-center">
                      <img src={aadharFront} alt="Aadhaar Front" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setAadharFront('')} className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition">✕</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 transition aspect-[4/3] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                      <MdCloudUpload className="text-3xl text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 font-bold">Upload Aadhaar Front</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setAadharFront)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Aadhaar Back Photo</label>
                  {aadharBack ? (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-50 flex items-center justify-center">
                      <img src={aadharBack} alt="Aadhaar Back" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setAadharBack('')} className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition">✕</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 transition aspect-[4/3] flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                      <MdCloudUpload className="text-3xl text-gray-400 mb-2" />
                      <span className="text-xs text-gray-600 font-bold">Upload Aadhaar Back</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setAadharBack)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PAN details */}
            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">B</span>
                PAN Card Details
              </h4>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">PAN Card Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="10-character PAN Number"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">PAN Card Document</label>
                {panDoc ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-50 flex items-center justify-center max-w-md">
                    <img src={panDoc} alt="PAN Card" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPanDoc('')} className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition">✕</button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 transition aspect-[16/9] flex flex-col items-center justify-center p-4 text-center cursor-pointer max-w-md">
                    <MdCloudUpload className="text-3xl text-gray-400 mb-2" />
                    <span className="text-xs text-gray-600 font-bold">Upload PAN Document</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPanDoc)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                  </div>
                )}
              </div>
            </div>

            {/* Police Verification details */}
            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">C</span>
                Police Verification Certificate
              </h4>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Verification Document</label>
                {policeDoc ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-50 flex items-center justify-center max-w-md">
                    <img src={policeDoc} alt="Police Doc" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPoliceDoc('')} className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition">✕</button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50 transition aspect-[16/9] flex flex-col items-center justify-center p-4 text-center cursor-pointer max-w-md">
                    <MdCloudUpload className="text-3xl text-gray-400 mb-2" />
                    <span className="text-xs text-gray-600 font-bold">Upload Police Certificate</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPoliceDoc)} className="absolute inset-0 opacity-0 cursor-pointer" required />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between space-x-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition cursor-pointer flex items-center gap-2"
              >
                <MdArrowBack className="w-5 h-5" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
              >
                {loading ? 'Submitting...' : 'Upload & Proceed'}
                <MdArrowForward className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Training Video */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center justify-center gap-2">
            <span className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">3</span>
            Training Material & Guidelines
          </h3>

          {video ? (
            <div className="space-y-6">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-black relative">
                {/* Embedded Video Player */}
                <video
                  src={video.videoUrl}
                  controls
                  className="w-full h-full"
                  onEnded={() => setVideoWatched(true)}
                />
              </div>
              <div className="text-left bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-2">
                <h4 className="font-bold text-lg text-gray-800">{video.title}</h4>
                <p className="text-sm text-gray-600">{video.description || 'Watch the training guidelines to prepare for the test.'}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">
              <MdPlayCircleFilled className="text-5xl text-gray-300 mx-auto mb-3" />
              No training video available. You can directly proceed to the MCQ test.
            </div>
          )}

          <div className="pt-6 flex justify-between border-t border-gray-100 mt-8">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition cursor-pointer flex items-center gap-2"
            >
              <MdArrowBack className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={handleVideoCompleted}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
            >
              Mark Watched & Take Test
              <MdArrowForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: MCQ Test */}
      {step === 4 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-left max-w-3xl mx-auto">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">4</span>
            MCQ Evaluation Test
          </h3>

          {questions.length > 0 ? (
            <form onSubmit={handleSubmitTest} className="space-y-8">
              {questions.map((q, index) => (
                <div key={q._id} className="p-6 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-4">
                  <h4 className="font-bold text-base text-gray-800">
                    Q{index + 1}. {q.question}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition ${
                          answers[q._id] === optIndex
                            ? 'border-blue-600 bg-blue-50/50 text-blue-800 font-bold'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q._id}`}
                          value={optIndex}
                          checked={answers[q._id] === optIndex}
                          onChange={() => handleAnswerSelect(q._id, optIndex)}
                          className="hidden"
                        />
                        <span
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                            answers[q._id] === optIndex
                              ? 'border-blue-600 bg-blue-600 text-white font-bold'
                              : 'border-gray-300 text-gray-500'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="text-sm">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6 flex justify-between border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition cursor-pointer flex items-center gap-2"
                >
                  <MdArrowBack className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                >
                  {loading ? 'Submitting Test...' : 'Finish & Onboard'}
                  <MdCheckCircleOutline className="w-5 h-5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 text-center">
              <MdHelpOutline className="text-5xl text-gray-300 mx-auto mb-3" />
              Loading MCQ test questions...
            </div>
          )}
        </div>
      )}

      {/* STEP 5: Success Screen */}
      {step === 5 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center max-w-xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/10">
            ✓
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-800">Successfully Onboarded!</h3>
            <p className="text-sm text-gray-500">
              The vendor registration, document submission, and training evaluation has been completed.
            </p>
          </div>

          {onboardedVendor && (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-bold text-gray-800">{onboardedVendor.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone Number</span>
                <span className="font-bold text-gray-800">{onboardedVendor.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">MCQ Score</span>
                <span className={`font-black ${testResult?.score >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {testResult ? `${testResult.score}%` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-bold text-amber-600 uppercase text-xs tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {onboardedVendor.approvalStatus || 'pending'}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-left">
            <p className="text-xs text-emerald-700 leading-normal font-semibold">
              Note: The referred vendor's profile details are complete. Once the admin reviews and approves their verification documents, both of you will receive your referral bonuses.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate('/shop/dashboard')}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVendor;
