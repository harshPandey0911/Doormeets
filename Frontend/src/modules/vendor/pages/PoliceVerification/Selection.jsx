import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiShield, FiUserCheck, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Logo from '../../../../components/common/Logo';
import verificationService from '../../services/verificationService';

const Selection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = location.state?.vendorId || sessionStorage.getItem('pendingVendorId');
  const [loading, setLoading] = useState(false);

  const handleChoice = async (method) => {
    if (!vendorId) {
      toast.error("Session expired. Please login again.");
      navigate('/vendor/login');
      return;
    }

    setLoading(true);
    try {
      const response = await verificationService.saveChoice(vendorId, method);
      if (response.success) {
        if (method === 'self') {
          navigate('/vendor/police-verification/upload', { replace: true, state: { vendorId } });
        } else {
          toast.success("Request submitted! Admin will verify your profile.");
          navigate('/vendor/pending-approval', { replace: true, state: { adminMethod: true } });
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to save choice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <Logo className="h-10 mb-6" />
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <FiShield className="text-3xl text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center">Police Verification</h1>
          <p className="text-slate-500 text-center mt-2">Required for security and trust on the platform</p>
        </div>

        <div className="space-y-4">
          {/* Option A: Self */}
          <button
            onClick={() => handleChoice('self')}
            disabled={loading}
            className="w-full group p-5 border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 rounded-2xl transition-all text-left flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
              <FiUserCheck className="text-xl text-blue-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Self Verification</h3>
              <p className="text-sm text-slate-500 mt-1">Upload your PCC document yourself within 10 days.</p>
              <span className="inline-block mt-2 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase">Fast Approval</span>
            </div>
          </button>

          {/* Option B: Admin */}
          <button
            onClick={() => handleChoice('admin')}
            disabled={loading}
            className="w-full group p-5 border-2 border-slate-100 hover:border-slate-800 hover:bg-slate-50 rounded-2xl transition-all text-left flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-slate-800 transition-colors">
              <FiClock className="text-xl text-slate-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Verification by Admin</h3>
              <p className="text-sm text-slate-500 mt-1">Admin will verify on your behalf within 0-10 days.</p>
              <span className="inline-block mt-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">Standard Process</span>
            </div>
          </button>
        </div>

        <div className="mt-8 bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100">
          <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Verification is mandatory. If you choose self-verification and fail to upload documents within 10 days, your application will be automatically rejected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Selection;
