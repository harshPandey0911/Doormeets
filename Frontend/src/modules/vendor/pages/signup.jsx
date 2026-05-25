import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiFileText, FiUpload, FiX, FiArrowRight, FiChevronLeft, FiCheckCircle, FiCamera, FiAward } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../theme';
import { register, sendOTP as sendVendorOTP, verifyLogin } from '../services/authService';
import LogoLoader from '../../../components/common/LogoLoader';
import Logo from '../../../components/common/Logo';
import { compressImage } from '../../../utils/imageCompression';
import ProfessionSelection from '../components/signup/ProfessionSelection';
import TrainingModule from '../components/signup/TrainingModule';

import { z } from "zod";

// Zod schema for Vendor Signup
const vendorSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").regex(/^[a-zA-Z\s]+$/, "Name can only contain letters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  aadhar: z.string().regex(/^\d{12}$/, "Aadhar number must be exactly 12 digits"),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g. ABCDE1234F)"),
  experience: z.string().min(1, "Please enter your years of experience").regex(/^\d+$/, "Experience must be a number")
});

const VendorSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('details'); // 'details' or 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    aadhar: '',
    pan: '',
    experience: '',
    service: '',
    documents: [],
    professions: [],
    categories: [], // keeping for backward compatibility if needed, but not populated by new UI
    isConsultant: false,
    training: null
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [documentPreview, setDocumentPreview] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Refs for auto-focus
  const nameInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Unified Flow: Pre-fill
  useEffect(() => {
    if (location.state?.phone && location.state?.verificationToken) {
      setFormData(prev => ({ ...prev, phoneNumber: location.state.phone }));
      setVerificationToken(location.state.verificationToken);
    }
  }, [location.state]);

  // Clear any existing vendor tokens on page load
  useEffect(() => {
    localStorage.removeItem('vendorAccessToken');
    localStorage.removeItem('vendorRefreshToken');
    localStorage.removeItem('vendorData');
  }, []);

  // Auto-focus logic
  useEffect(() => {
    if (step === 'details' && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    } else if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0].focus(), 100);
    }
  }, [step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image or PDF');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size should be less than 15MB');
      return;
    }

    setUploadingDocs(prev => ({ ...prev, [type]: true }));
    const loadingToast = toast.loading("Processing file...");

    try {
      let fileToUpload = file;
      let previewUrl = '';

      // Compress if it is an image
      if (file.type.startsWith('image/')) {
        try {
          const compressedFile = await compressImage(file, {
            maxWidth: 1280, // Reasonable max width for documents
            maxHeight: 1280,
            quality: 0.8
          });
          fileToUpload = compressedFile;
          toast.dismiss(loadingToast); // Dismiss compression loading
        } catch (compressionError) {
          console.error("Compression failed, using original file", compressionError);
          toast.error("Compression failed, using original");
          // fileToUpload remains original
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        previewUrl = reader.result;
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents.filter(d => d.type !== type), { type, file: fileToUpload, url: previewUrl }]
        }));
        setDocumentPreview(prev => ({
          ...prev,
          [type]: previewUrl
        }));
        setUploadingDocs(prev => ({ ...prev, [type]: false }));
        toast.success("Image uploaded", { duration: 2000 });
      };

      reader.onerror = () => {
        console.error("FileReader failed");
        toast.error("Failed to read file");
        setUploadingDocs(prev => ({ ...prev, [type]: false }));
      };

      reader.readAsDataURL(fileToUpload);

    } catch (error) {
      console.error("Upload processing error", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to process file");
      setUploadingDocs(prev => ({ ...prev, [type]: false }));
    }
  };

  const removeDocument = (type) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.type !== type)
    }));
    setDocumentPreview(prev => {
      const newPreview = { ...prev };
      delete newPreview[type];
      return newPreview;
    });
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();

    // Zod Validation
    const validationResult = vendorSignupSchema.safeParse({
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      aadhar: formData.aadhar,
      pan: formData.pan,
      experience: formData.experience
    });

    if (!validationResult.success) {
      validationResult.error.issues.forEach(err => toast.error(err.message));
      return;
    }

    // Manual Document Validation remains
    const hasAadharDoc = formData.documents.some(d => d.type === 'aadhar');
    const hasAadharBackDoc = formData.documents.some(d => d.type === 'aadharBack');
    const hasPanDoc = formData.documents.some(d => d.type === 'pan');
    if (!hasAadharDoc) { toast.error('Please upload Aadhar Front document'); return; }
    if (!hasAadharBackDoc) { toast.error('Please upload Aadhar Back document'); return; }
    if (!hasPanDoc) { toast.error('Please upload PAN document'); return; }

    // Proceed to next step instead of registering
    setStep('profession');
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setLoadingMessage('Initializing registration...');

    if (verificationToken) {
      try {
        setLoadingMessage('Uploading documents...');
        const aadharDoc = formData.documents.find(d => d.type === 'aadhar')?.url || null;
        const aadharBackDoc = formData.documents.find(d => d.type === 'aadharBack')?.url || null;
        const panDoc = formData.documents.find(d => d.type === 'pan')?.url || null;
        const otherDocs = formData.documents.filter(d => d.type === 'other').map(d => d.url);

        const registerData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phoneNumber,
          aadhar: formData.aadhar,
          pan: formData.pan,
          experience: formData.experience,
          professions: formData.professions,
          isConsultant: formData.isConsultant,
          training: formData.training,
          aadharDocument: aadharDoc,
          aadharBackDocument: aadharBackDoc,
          panDocument: panDoc,
          otherDocuments: otherDocs,
          verificationToken
        };

        setLoadingMessage('Creating your profile...');
        const response = await register(registerData);

        if (response.success) {
          sessionStorage.setItem('pendingVendorId', response.vendor.id);
          toast.success('Registration successful! Please choose your verification method.');
          navigate('/vendor/police-verification/selection', { state: { vendorId: response.vendor.id } });
        } else {
          toast.error(response.message || 'Registration failed');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Registration failed');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
      return;
    }

    // BYPASS OTP: Directly call register since OTP is no longer needed
    try {
      setLoadingMessage('Uploading documents & creating profile...');
      const aadharDoc = formData.documents.find(d => d.type === 'aadhar')?.url || null;
      const aadharBackDoc = formData.documents.find(d => d.type === 'aadharBack')?.url || null;
      const panDoc = formData.documents.find(d => d.type === 'pan')?.url || null;
      const otherDocs = formData.documents.filter(d => d.type === 'other').map(d => d.url);

      const registerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phoneNumber,
        aadhar: formData.aadhar,
        pan: formData.pan,
        experience: formData.experience,
        professions: formData.professions,
        isConsultant: formData.isConsultant,
        training: formData.training,
        aadharDocument: aadharDoc,
        aadharBackDocument: aadharBackDoc,
        panDocument: panDoc,
        otherDocuments: otherDocs,
        verificationToken: verificationToken || null
      };

      const response = await register(registerData);

      if (response.success) {
        sessionStorage.setItem('pendingVendorId', response.vendor.id);
        toast.success('Registration successful! Please choose your verification method.');
        navigate('/vendor/police-verification/selection', { state: { vendorId: response.vendor.id } });
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (cleanValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Auto-verify as last digit enters
  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken) {
      handleOtpSubmit();
    }
  }, [otp]);

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    if (!otpToken) {
      toast.error('Please request OTP first');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Verifying OTP...');
    try {
      // 1. Verify OTP using the unified verify-login endpoint
      // This will return isNewUser: true and a verificationToken for new vendors
      const response = await verifyLogin({ 
        phone: formData.phoneNumber, 
        otp: otpValue 
      });

      if (response.success && response.isNewUser) {
        // Step 3: Complete registration now that phone is verified
        try {
          setLoadingMessage('OTP Verified! Uploading documents...');
          const aadharDoc = formData.documents.find(d => d.type === 'aadhar')?.url || null;
          const aadharBackDoc = formData.documents.find(d => d.type === 'aadharBack')?.url || null;
          const panDoc = formData.documents.find(d => d.type === 'pan')?.url || null;
          const otherDocs = formData.documents.filter(d => d.type === 'other').map(d => d.url);

          const registerData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phoneNumber,
            aadhar: formData.aadhar,
            pan: formData.pan,
            experience: formData.experience,
            service: [],
            aadharDocument: aadharDoc,
            aadharBackDocument: aadharBackDoc,
            panDocument: panDoc,
            otherDocuments: otherDocs,
            verificationToken: response.verificationToken
          };

          setLoadingMessage('Finalizing registration...');
          const regResponse = await register(registerData);
          
          if (regResponse.success) {
            setLoadingMessage('Account created! Redirecting...');
            toast.success('OTP Verified! Complete your police verification choice.');
            sessionStorage.setItem('pendingVendorId', regResponse.vendor.id);
            navigate('/vendor/police-verification/selection', { replace: true, state: { vendorId: regResponse.vendor.id } });
          } else {
            toast.error(regResponse.message || 'Registration failed');
          }
        } catch (regError) {
          toast.error(regError.response?.data?.message || 'Registration failed after OTP verification');
        }
      } else if (response.success && !response.isNewUser) {
        // This shouldn't happen if they came through signup flow with a new number,
        // but if they are already a vendor, they might be logged in now.
        toast.success('Account already exists. Logged in successfully.');
        navigate('/vendor/dashboard', { replace: true });
      } else {
        toast.error(response.message || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const brandColor = themeColors.brand?.teal || '#9634f7';

  return (
    <div className="min-h-screen flex flex-col pt-8 pb-8 px-4 sm:px-6 lg:px-8 relative" style={{ background: 'linear-gradient(90deg, rgba(213, 181, 235, 1) 0%, rgba(240, 203, 242, 1) 90%)' }}>
      {/* Decorative Background Elements - Fixed Container to prevent scroll issues */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#9634f7] opacity-[0.05] rounded-full blur-3xl animate-floating" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9634f7] opacity-[0.03] rounded-full blur-3xl animate-floating" style={{ animationDelay: '2s' }} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-1 relative z-10 animate-fade-in">
        <Logo className="h-10 w-auto mx-auto transform hover:scale-110 transition-transform duration-500" />
        <h2 className="mt-[-4px] text-2xl font-bold text-gray-900 tracking-tight">
          {step === 'details' ? 'Vendor Registration' : 'Verify Identity'}
        </h2>
        <p className="mt-0.5 text-xs text-gray-600 animate-stagger-1 animate-fade-in">
          Partner with Doormeets and grow your business
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-white py-5 px-4 shadow-2xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100 relative overflow-hidden animate-slide-in-bottom">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#9634f7] via-[#b87cff] to-[#9634f7]" />

          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Details */}
                <div className="space-y-3 animate-stagger-1 animate-fade-in">
                  <h3 className="text-sm font-semibold text-gray-800 border-b pb-1 mb-2">Business Profile</h3>

                  <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-[#9634f7] transition-colors">
                        <FiUser className="text-gray-400" />
                      </div>
                      <input
                        ref={nameInputRef}
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                        style={{ '--tw-ring-color': brandColor }}
                        placeholder="Organization name"
                      />
                    </div>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-[#9634f7] transition-colors">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                        style={{ '--tw-ring-color': brandColor }}
                        placeholder="vendor@example.com"
                      />
                    </div>
                  </div>

                  {!verificationToken && (
                    <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 border-r pr-2 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm font-bold">+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                          className="block w-full pl-14 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                          style={{ '--tw-ring-color': brandColor }}
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  )}

                  <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-[#9634f7] transition-colors">
                        <FiFileText className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.aadhar}
                        onChange={(e) => setFormData(p => ({ ...p, aadhar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                        style={{ '--tw-ring-color': brandColor }}
                        placeholder="1234 5678 9012"
                      />
                    </div>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-[#9634f7] transition-colors">
                        <FiFileText className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.pan}
                        onChange={(e) => setFormData(p => ({ ...p, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) }))}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                        style={{ '--tw-ring-color': brandColor }}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-[#9634f7] transition-colors">
                        <FiAward className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="experience"
                        required
                        value={formData.experience}
                        onChange={(e) => setFormData(p => ({ ...p, experience: e.target.value.replace(/\D/g, '') }))}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 transition-all duration-300 outline-none hover:border-gray-400"
                        style={{ '--tw-ring-color': brandColor }}
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="space-y-2 animate-stagger-2 animate-fade-in">
                  <h3 className="text-sm font-semibold text-gray-800 border-b pb-1 mb-2">Verification Docs</h3>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Aadhar Front Upload */}
                    <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aadhar Front</p>
                      {documentPreview.aadhar ? (
                        <div className="relative group overflow-hidden rounded-xl">
                          <img src={documentPreview.aadhar} className="w-full h-24 object-cover border transform group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeDocument('aadhar')} className="bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition-colors">
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:border-[#9634f7] group bg-white relative">
                          {uploadingDocs.aadhar ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9634f7]"></div>
                            </div>
                          ) : null}
                          <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-0.5 hover:bg-blue-100">
                              <FiUpload className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold">Upload Front</span>
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'aadhar')} disabled={uploadingDocs.aadhar} />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Aadhar Back Upload */}
                    <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Aadhar Back</p>
                      {documentPreview.aadharBack ? (
                        <div className="relative group overflow-hidden rounded-xl">
                          <img src={documentPreview.aadharBack} className="w-full h-24 object-cover border transform group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeDocument('aadharBack')} className="bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition-colors">
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:border-[#9634f7] group bg-white relative">
                          {uploadingDocs.aadharBack ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9634f7]"></div>
                            </div>
                          ) : null}
                          <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-0.5 hover:bg-blue-100">
                              <FiUpload className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold">Upload Back</span>
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'aadharBack')} disabled={uploadingDocs.aadharBack} />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* PAN Upload */}
                    <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">PAN Card</p>
                      {documentPreview.pan ? (
                        <div className="relative group overflow-hidden rounded-xl">
                          <img src={documentPreview.pan} className="w-full h-24 object-cover border transform group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeDocument('pan')} className="bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition-colors">
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:border-[#9634f7] group bg-white relative">
                          {uploadingDocs.pan ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9634f7]"></div>
                            </div>
                          ) : null}
                          <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-0.5 hover:bg-blue-100">
                              <FiUpload className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] text-gray-500 font-semibold">Upload Image</span>
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'pan')} disabled={uploadingDocs.pan} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl mt-2 animate-pulse-subtle">
                    <p className="text-[10px] text-purple-700 leading-relaxed italic">
                      "Doormeets values trust. Please ensure all documents are clear and valid for faster approval."
                    </p>
                  </div>
                </div>
              </div>

              <div className="animate-stagger-3 animate-fade-in">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  style={{
                    backgroundColor: brandColor,
                    boxShadow: `0 10px 15px -3px ${brandColor}4D`
                  }}
                >
                  <span className="absolute inset-0 w-full h-full bg-white/10 group-hover:translate-x-full transition-transform duration-700 -translate-x-full" />
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-1">
                      <LogoLoader fullScreen={false} inline={true} size="w-5 h-5" />
                      <span className="text-[9px] font-medium opacity-80">{loadingMessage}</span>
                    </div>
                  ) : (
                    <span className="flex items-center relative z-10">
                      {verificationToken ? 'Finish Application' : 'Proceed to Verify'}
                      <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'profession' && (
             <ProfessionSelection 
                formData={formData} 
                setFormData={setFormData} 
                onNext={() => setStep('training')} 
                onBack={() => setStep('details')} 
             />
          )}

          {step === 'training' && (
             <TrainingModule 
                formData={formData} 
                setFormData={setFormData} 
                onNext={handleFinalSubmit} 
                onBack={() => setStep('profession')} 
             />
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('details')}
                className="flex items-center text-xs text-gray-500 hover:text-[#9634f7] transition-colors mb-2 animate-fade-in"
              >
                <FiChevronLeft className="mr-1" /> Re-check details
              </button>

              <div className="text-center animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-900">One Last Step</h3>
                <p className="text-xs text-gray-500">Enter the 6-digit code sent to your phone</p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-between gap-2 px-2 sm:px-8 animate-stagger-1 animate-fade-in">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-full h-12 text-center text-lg font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-offset-2 outline-none transition-all duration-300 hover:border-gray-400"
                      style={{ '--tw-ring-color': brandColor, backgroundColor: digit ? `${brandColor}05` : 'white' }}
                    />
                  ))}
                </div>

                <div className="text-center animate-stagger-2 animate-fade-in">
                  <button
                    type="button"
                    onClick={async () => {
                      if (resendTimer > 0) return;
                      try {
                        const response = await sendVendorOTP(formData.phoneNumber);
                        if (response.success) {
                          setOtpToken(response.token);
                          setResendTimer(120);
                          toast.success('OTP sent again');
                        }
                      } catch (e) { toast.error('Resend failed'); }
                    }}
                    disabled={resendTimer > 0}
                    className="text-xs font-semibold transition-colors duration-300 opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: brandColor }}
                  >
                    {resendTimer > 0
                      ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                      : 'Resend Code'}
                  </button>
                </div>

                <div className="animate-stagger-3 animate-fade-in">
                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length !== 6}
                    className="group relative w-full py-3 rounded-xl text-white font-semibold transition-all transform hover:-translate-y-1 shadow-lg disabled:opacity-50 overflow-hidden"
                    style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}4D` }}
                  >
                    <span className="absolute inset-0 w-full h-full bg-white/10 group-hover:translate-x-full transition-transform duration-700 -translate-x-full" />
                    <span className="relative z-10 flex items-center justify-center">
                      {isLoading ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-medium opacity-80">{loadingMessage}</span>
                        </div>
                      ) : (
                        'Verify & Register'
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 animate-fade-in animate-stagger-4">
          Already a partner?{' '}
          <Link to="/vendor/login" className="font-semibold hover:text-[#b87cff] transition-colors" style={{ color: brandColor }}>
            Login here
          </Link>
        </p>
      </div >
    </div >
  );
};

export default VendorSignup;
