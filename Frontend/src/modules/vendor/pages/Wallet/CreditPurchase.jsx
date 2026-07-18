import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import api from '../../../../services/api';
import { toast } from 'react-hot-toast';

const CreditPurchase = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processingPackageId, setProcessingPackageId] = useState(null);
  const [gst, setGst] = useState(18);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors/credits/packages');
      if (res.data.success) {
        setPackages(res.data.data);
        if (res.data.gst !== undefined) {
          setGst(res.data.gst);
        }
      }
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    if (!pkg) {
      toast.error('Invalid package');
      return;
    }

    try {
      setProcessingPackageId(pkg._id);
      
      // 1. Create order
      const orderRes = await api.post('/vendors/credits/purchase', { packageId: pkg._id });
      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create order');
      }

      const { orderId, amount, currency, key } = orderRes.data.data;

      // 2. Initialize Razorpay
      const options = {
        key: key,
        amount: Math.round(amount * 100),
        currency: currency,
        name: "Doormeets Credits",
        description: `Purchase of ${pkg.creditsAmount} Credits`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyRes = await api.post('/vendors/credits/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: pkg._id
            });

            if (verifyRes.data.success) {
              toast.success('Credits added successfully!');
              navigate('/vendor/wallet/credit-history');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Error verifying payment');
          } finally {
            setProcessingPackageId(null);
          }
        },
        prefill: {
          name: "Vendor", // Can be dynamically filled from user state
        },
        theme: {
          color: "#2563EB" // blue-600
        },
        modal: {
          ondismiss: function() {
            setProcessingPackageId(null);
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        toast.error('Payment Failed: ' + response.error.description);
        setProcessingPackageId(null);
      });
      
      rzp1.open();

    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to initiate purchase');
      setProcessingPackageId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate('/vendor/wallet/credit-history')} className="p-2">
          <FiArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Credits Recharge</h1>
      </div>

      <div className="px-4 py-6">
        <p className="text-gray-600 mb-6 font-medium">Recharge amount select karein. Is se aapko platform pe services lene mein madad milegi.</p>
        
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : packages.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">No packages available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {packages.map((pkg) => {
              const gstAmount = (pkg.price * gst) / 100;
              const totalAmount = pkg.price + gstAmount;

              return (
                <div 
                  key={pkg._id}
                  className="bg-white rounded-2xl p-4 cursor-pointer transition-all border-2 relative flex flex-col border-gray-100 hover:border-gray-300 shadow-sm"
                >

                  <h3 className="font-bold text-gray-800 mb-1">{pkg.name}</h3>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-black text-blue-600">{pkg.creditsAmount}</span>
                    <span className="text-xs font-semibold text-blue-600/70 mb-1">Credits</span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100 space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg);
                      }}
                      disabled={processingPackageId === pkg._id}
                      className="w-full mt-3 py-2 rounded-xl text-sm font-bold transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {processingPackageId === pkg._id ? 'Processing...' : 'Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default CreditPurchase;
