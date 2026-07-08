import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiCheck, FiNavigation, FiSend, FiShield, FiCamera,
  FiLock, FiAlertCircle, FiArrowRight, FiFileText, FiImage
} from 'react-icons/fi';
import {
  markEnRoute,
  sendArrivalOtp,
  verifyArrivalOtp,
  sendCompletionOtp,
  verifyCompletionOtp,
} from '../../services/paintingConsultationService';

// ─── Step indicator component ─────────────────────────────────────────────────
const TrackingStep = ({ step, index, isActive, isDone }) => (
  <div className={`flex items-start gap-3 py-4 px-4 rounded-2xl transition-all duration-300 ${
    isActive ? 'bg-orange-50 border-2 border-orange-200 shadow-md' :
    isDone ? 'bg-green-50 border-2 border-green-200' :
    'bg-gray-50 border-2 border-gray-100 opacity-50'
  }`}>
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
      isDone ? 'bg-green-500 text-white' :
      isActive ? 'bg-orange-500 text-white ring-4 ring-orange-100' :
      'bg-gray-300 text-gray-500'
    }`}>
      {isDone ? <FiCheck /> : index + 1}
    </div>
    <div>
      <p className={`font-bold text-sm ${isActive ? 'text-orange-700' : isDone ? 'text-green-700' : 'text-gray-400'}`}>
        {step.label}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
    </div>
  </div>
);

// ─── OTP Input component ──────────────────────────────────────────────────────
const OtpInput = ({ value, onChange, label }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
    <input
      type="number"
      maxLength={4}
      value={value}
      onChange={e => onChange(e.target.value.slice(0, 4))}
      placeholder="_ _ _ _"
      className="w-full text-center text-3xl font-black tracking-[0.5em] border-2 border-gray-200 rounded-2xl py-4 focus:outline-none focus:border-orange-400 text-gray-900"
    />
  </div>
);

// ─── Photo Upload component ───────────────────────────────────────────────────
const PhotoUpload = ({ label, hint, multiple, onFilesSelected }) => {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    onFilesSelected(multiple ? files : files[0]);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-5 flex flex-col items-center gap-2 hover:border-orange-400 transition-colors"
      >
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <FiCamera className="text-orange-500 text-lg" />
        </div>
        <span className="text-sm font-semibold text-gray-600">{hint}</span>
        <span className="text-xs text-gray-400">{multiple ? 'Select multiple' : 'Select one photo'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      {previews.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {previews.map((src, i) => (
            <img key={i} src={src} alt="preview" className="w-20 h-20 object-cover rounded-xl border-2 border-orange-200" />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main InspectionTracker Component ────────────────────────────────────────
const InspectionTracker = ({ consultation, onStartQuote, onSubmitDone }) => {
  const id = consultation._id;
  const status = consultation.status;
  const tracking = consultation.tracking || {};

  // Local UI state
  const [loading, setLoading] = useState('');
  const [arrivalOtp, setArrivalOtp] = useState('');
  const [arrivalPhoto, setArrivalPhoto] = useState(null);
  const [completionOtp, setCompletionOtp] = useState('');
  const [inspectionPhotos, setInspectionPhotos] = useState([]);
  const [otpSent, setOtpSent] = useState({ arrival: false, completion: false });
  const [inspectionVerified, setInspectionVerified] = useState(tracking.completionOtpVerified || false);

  // Determine the current active stage (0-3)
  const getActiveStage = () => {
    if (status === 'ACCEPTED_BY_VENDOR') return 0;
    if (status === 'VENDOR_EN_ROUTE') return 1;
    if (status === 'INSPECTION_IN_PROGRESS' && !inspectionVerified) return 2;
    if (status === 'INSPECTION_IN_PROGRESS' && inspectionVerified) return 3;
    if (status === 'QUOTE_GENERATED') return 4;
    return 0;
  };
  const activeStage = getActiveStage();

  const STAGES = [
    { label: 'Accepted', desc: 'Tap "Mark En Route" when you leave for the location' },
    { label: 'En Route', desc: 'Send OTP to customer, then verify your arrival' },
    { label: 'Inspection In Progress', desc: 'Fill out the quote wizard after verifying arrival' },
    { label: 'Inspection Complete', desc: 'Send completion OTP and upload inspection photos' },
  ];

  const handleMarkEnRoute = async () => {
    try {
      setLoading('enroute');
      await markEnRoute(id);
      toast.success('📍 Marked as En Route! Customer has been notified.');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading('');
    }
  };

  const handleSendArrivalOtp = async () => {
    try {
      setLoading('sendArrival');
      await sendArrivalOtp(id);
      setOtpSent(p => ({ ...p, arrival: true }));
      toast.success('📱 OTP sent to customer\'s phone! Ask them to share it.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading('');
    }
  };

  const handleVerifyArrival = async () => {
    if (arrivalOtp.length !== 4) {
      toast.error('Please enter the 4-digit OTP from the customer');
      return;
    }
    try {
      setLoading('verifyArrival');
      let geoLat = null, geoLng = null;
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { geoLat = pos.coords.latitude; geoLng = pos.coords.longitude; resolve(); },
            () => resolve()
          );
        });
      }
      await verifyArrivalOtp(id, { otp: arrivalOtp, geoLat, geoLng, photoFile: arrivalPhoto });
      toast.success('✅ Arrival verified! Inspection started.');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP or upload failed');
    } finally {
      setLoading('');
    }
  };

  const handleSendCompletionOtp = async () => {
    try {
      setLoading('sendCompletion');
      await sendCompletionOtp(id);
      setOtpSent(p => ({ ...p, completion: true }));
      toast.success('📱 Completion OTP sent to customer\'s phone!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading('');
    }
  };

  const handleVerifyCompletion = async () => {
    if (completionOtp.length !== 4) {
      toast.error('Please enter the 4-digit completion OTP from the customer');
      return;
    }
    try {
      setLoading('verifyCompletion');
      await verifyCompletionOtp(id, { otp: completionOtp, photoFiles: inspectionPhotos });
      toast.success('🎉 Inspection verified! You can now generate the quote.');
      setInspectionVerified(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP or upload failed');
    } finally {
      setLoading('');
    }
  };

  const bookingBadge = consultation.bookingType === 'SCHEDULED' ? (
    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
      <span>📅</span>
      <div>
        <p className="text-xs font-bold text-indigo-700">Scheduled Slot</p>
        <p className="text-xs text-indigo-600">
          {consultation.scheduledSlot?.timeSlot || 'Slot confirmed'}
        </p>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
      <span>⚡</span>
      <div>
        <p className="text-xs font-bold text-orange-700">Instant Booking</p>
        <p className="text-xs text-orange-600">Visit ASAP</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 pt-10 pb-6">
        <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest">Inspection Tracker</p>
        <h1 className="text-white text-2xl font-black mt-1">
          {consultation.userId?.name || 'Customer'}'s Property
        </h1>
        <p className="text-orange-100 text-sm mt-1">
          📍 {consultation.address?.fullAddress || consultation.address?.city || 'Address on file'}
        </p>
        <div className="mt-3">{bookingBadge}</div>
      </div>

      {/* Customer Info Card */}
      {(status !== 'PENDING') && (
        <div className="mx-4 -mt-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Contact</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">{consultation.userId?.name || '—'}</p>
              <p className="text-sm text-gray-500">{consultation.userId?.phone || '—'}</p>
            </div>
            <a
              href={`tel:${consultation.userId?.phone}`}
              className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"
            >
              <span className="text-green-600 text-lg">📞</span>
            </a>
          </div>
        </div>
      )}

      <div className="px-4 py-6 space-y-4">
        {/* Progress Stages */}
        <div className="space-y-2">
          {STAGES.map((stage, idx) => (
            <TrackingStep
              key={idx}
              step={stage}
              index={idx}
              isActive={activeStage === idx}
              isDone={activeStage > idx || (idx === 3 && inspectionVerified)}
            />
          ))}
        </div>

        {/* ── Stage 0: Mark En Route ── */}
        <AnimatePresence>
          {activeStage === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-orange-200 p-5 space-y-3"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FiNavigation className="text-orange-500" /> Ready to Leave?
              </h3>
              <p className="text-sm text-gray-500">Tap the button when you start heading to the customer's location. They'll be notified.</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleMarkEnRoute}
                disabled={loading === 'enroute'}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all"
              >
                {loading === 'enroute' ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><FiNavigation /> Mark En Route</>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage 1: Arrival OTP ── */}
        <AnimatePresence>
          {activeStage === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-orange-200 p-5 space-y-4"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FiShield className="text-orange-500" /> Verify Your Arrival
              </h3>

              {/* Step 1: Send OTP */}
              <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-orange-700">Step 1: Send OTP to Customer</p>
                <p className="text-xs text-gray-500">An OTP will be sent to the customer's phone. Ask them to share it with you.</p>
                <button
                  onClick={handleSendArrivalOtp}
                  disabled={loading === 'sendArrival' || otpSent.arrival}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    otpSent.arrival
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {loading === 'sendArrival' ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : otpSent.arrival ? (
                    <><FiCheck /> OTP Sent! Send Again?</>
                  ) : (
                    <><FiSend /> Send Arrival OTP</>
                  )}
                </button>
              </div>

              {/* Step 2: Enter OTP + Photo */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Step 2: Enter OTP + Upload Arrival Photo</p>
                <OtpInput
                  value={arrivalOtp}
                  onChange={setArrivalOtp}
                  label="OTP from Customer"
                />
                <PhotoUpload
                  label="Arrival Photo (at property entrance)"
                  hint="Take a photo at the customer's door"
                  multiple={false}
                  onFilesSelected={setArrivalPhoto}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleVerifyArrival}
                  disabled={loading === 'verifyArrival' || arrivalOtp.length !== 4}
                  className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    arrivalOtp.length === 4
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading === 'verifyArrival' ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><FiLock /> Verify Arrival &amp; Start Inspection</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage 2: Inspection In Progress → Open Quote Wizard ── */}
        <AnimatePresence>
          {activeStage === 2 && !inspectionVerified && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-orange-200 p-5 space-y-4"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FiFileText className="text-orange-500" /> Inspection In Progress
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <FiCheck className="text-green-600 text-lg" />
                <p className="text-sm text-green-700 font-semibold">Arrival verified at {
                  tracking.inspectionStartedAt
                    ? new Date(tracking.inspectionStartedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : 'just now'
                }</p>
              </div>
              <p className="text-sm text-gray-500">Fill out the room-by-room quote wizard, then come back here to complete the inspection.</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onStartQuote}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
              >
                <FiFileText /> Open Quote Wizard <FiArrowRight />
              </motion.button>

              {/* Completion OTP section shown after quote is filled */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">After Inspection — Verify Completion</h4>

                <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-blue-700 font-semibold">Step 1: Send Completion OTP to Customer</p>
                  <button
                    onClick={handleSendCompletionOtp}
                    disabled={loading === 'sendCompletion' || otpSent.completion}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      otpSent.completion
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading === 'sendCompletion' ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : otpSent.completion ? (
                      <><FiCheck /> OTP Sent!</>
                    ) : (
                      <><FiSend /> Send Completion OTP</>
                    )}
                  </button>
                </div>

                <OtpInput
                  value={completionOtp}
                  onChange={setCompletionOtp}
                  label="Completion OTP from Customer"
                />
                <PhotoUpload
                  label="Inspection Photos (multiple)"
                  hint="Upload photos of all rooms inspected"
                  multiple={true}
                  onFilesSelected={setInspectionPhotos}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleVerifyCompletion}
                  disabled={loading === 'verifyCompletion' || completionOtp.length !== 4}
                  className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    completionOtp.length === 4
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading === 'verifyCompletion' ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><FiCheck /> Verify Inspection Complete</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage 3: Submit to Admin (after completion verified) ── */}
        <AnimatePresence>
          {(activeStage === 3 || inspectionVerified) && status === 'INSPECTION_IN_PROGRESS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-green-300 p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <FiCheck className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Inspection Complete!</h3>
                  <p className="text-sm text-gray-500">Both OTPs verified. Submit the quote to admin.</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onStartQuote}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-200"
              >
                <FiFileText /> Submit Quotation to Admin <FiArrowRight />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Quote submitted confirmation ── */}
        {status === 'QUOTE_GENERATED' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center"
          >
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-black text-green-800 text-lg">Quote Submitted!</h3>
            <p className="text-sm text-green-600 mt-1">Your quotation is now under admin review. You'll be notified once approved.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InspectionTracker;
