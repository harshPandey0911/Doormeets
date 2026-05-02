import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUpload, FiCheckCircle, FiFileText, FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Logo from '../../../../components/common/Logo';
import verificationService from '../../services/verificationService';

const Upload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = location.state?.vendorId || sessionStorage.getItem('pendingVendorId');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !preview) {
      toast.error("Please select a document first");
      return;
    }

    setLoading(true);
    try {
      const response = await verificationService.uploadPCC(vendorId, preview);
      if (response.success) {
        toast.success("Document uploaded! Admin will review it shortly.");
        navigate('/vendor/pending-approval', { replace: true });
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <Logo className="h-10 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 text-center">Upload PCC Document</h1>
          <p className="text-slate-500 text-center mt-2">Police Clearance Certificate (PCC) Front Side</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            {!preview ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or JPEG (Max 5MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200">
                <img src={preview} alt="PCC Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-xl p-4 flex gap-3 border border-blue-100">
            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Make sure the document is clearly visible and not expired. This will be verified manually by our team.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
              loading || !file ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {loading ? 'Uploading...' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
