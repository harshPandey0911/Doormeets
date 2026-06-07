import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiShare2, FiShield, FiStar, FiClock, FiCheckCircle, FiSliders, FiInfo, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/premium/Navbar';
import BottomCheckoutBar from '../../components/premium/BottomCheckoutBar';
import PriceTag from '../../components/premium/PriceTag';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCart } from '../../../../context/CartContext';
import api from '../../../../services/api';

const PremiumServiceDetailPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  const service = location.state?.service || null;
  const brand = location.state?.brand || null;
  const category = location.state?.category || null;

  const features = useMemo(() => service?.features || [], [service]);
  const steps = service?.steps || [];

  const [fields, setFields] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [calculatedPrice, setCalculatedPrice] = useState(service?.price || 0);
  const [uploadingFiles, setUploadingFiles] = useState({});

  useEffect(() => {
    const fetchDynamicDetails = async () => {
      if (!service?._id && !service?.id) return;
      const sId = service._id || service.id;
      try {
        const res = await api.get(`/public/services/${sId}/dynamic-details`);
        if (res.data.success) {
          setFields(res.data.fields || []);
          setPricingRules(res.data.pricingRules || []);
          
          const initialAnswers = {};
          (res.data.fields || []).forEach(f => {
            initialAnswers[f.name] = f.defaultValue || '';
          });
          setDynamicAnswers(initialAnswers);
        }
      } catch (err) {
        console.error("Error loading dynamic details", err);
      }
    };
    fetchDynamicDetails();
  }, [service]);

  useEffect(() => {
    if (!service) return;
    let price = service.price || 0;
    if (pricingRules.length === 0) {
      setCalculatedPrice(price);
      return;
    }

    const formulaRule = pricingRules.find(r => r.ruleType === 'formula');
    const conditionalRules = pricingRules.filter(r => r.ruleType === 'conditional');

    if (formulaRule && formulaRule.formulaString) {
      try {
        let formula = formulaRule.formulaString;
        const vars = { basePrice: service.price || 0, ...dynamicAnswers };
        Object.keys(vars).forEach(key => {
          const val = parseFloat(vars[key]) || 0;
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          formula = formula.replace(regex, val);
        });
        const safeFormula = formula.replace(/[^0-9\s+\-*/().]/g, '');
        const evaluated = new Function(`return (${safeFormula})`)();
        if (typeof evaluated === 'number' && !isNaN(evaluated)) {
          price = evaluated;
        }
      } catch (e) {
        console.error('Error evaluating formula:', e);
      }
    }

    conditionalRules.forEach(rule => {
      const userVal = dynamicAnswers[rule.fieldName];
      if (userVal === undefined) return;

      let isMatch = false;
      if (rule.operator === 'equals') {
        isMatch = String(userVal).toLowerCase() === String(rule.value).toLowerCase();
      } else if (rule.operator === 'greater_than') {
        isMatch = parseFloat(userVal) > parseFloat(rule.value);
      } else if (rule.operator === 'less_than') {
        isMatch = parseFloat(userVal) < parseFloat(rule.value);
      }

      if (isMatch) {
        if (rule.priceModifierType === 'add') {
          price += rule.modifierValue;
        } else if (rule.priceModifierType === 'multiply') {
          price *= rule.modifierValue;
        } else if (rule.priceModifierType === 'fixed') {
          price = rule.modifierValue;
        }
      }
    });

    setCalculatedPrice(Math.max(0, price));
  }, [dynamicAnswers, pricingRules, service]);

  const handleFileUpload = async (fieldName, file) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [fieldName]: true }));
      const { uploadToCloudinary } = await import('../../../../utils/cloudinaryUpload');
      const url = await uploadToCloudinary(file, 'user_bookings');
      if (url) {
        setDynamicAnswers(prev => ({
          ...prev,
          [fieldName]: url
        }));
        toast.success('File uploaded successfully!');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const fetchCurrentLocation = (fieldName) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locStr = `${position.coords.latitude}, ${position.coords.longitude}`;
          setDynamicAnswers(prev => ({ ...prev, [fieldName]: locStr }));
          toast.success('Location detected!');
        },
        (error) => {
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleAdd = async () => {
    if (!service) return;

    // Validate required fields
    // Validate required fields (only if shown to user)
    const missingFields = fields.filter(f => f.showToUser !== false && f.isRequired && !dynamicAnswers[f.name]);
    if (missingFields.length > 0) {
      toast.error(`Please fill out required field: ${missingFields[0].label}`);
      return;
    }

    const dynamicFieldsPayload = Object.keys(dynamicAnswers)
      .filter(key => {
        const field = fields.find(f => f.name === key);
        return field && field.showToUser !== false;
      })
      .map(key => {
        const field = fields.find(f => f.name === key);
        return {
          fieldId: field?._id || field?.id,
          name: key,
          label: field?.label || key,
          value: dynamicAnswers[key]
        };
      });

    const cartData = buildCartItemData({ service, category, brand });
    cartData.price = calculatedPrice;
    cartData.unitPrice = calculatedPrice;
    if (cartData.card) {
      cartData.card.price = calculatedPrice;
    }
    cartData.dynamicFields = dynamicFieldsPayload;

    const response = await addToCart(cartData);
    if (response?.success) {
      toast.success('Added to cart');
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-white p-6">
        <Navbar locationLabel="Premium service" cartCount={cartCount} onSearchClick={() => {}} onLocationClick={() => navigate('/user/home')} />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white p-10 shadow-sm">
            <h1 className="text-2xl font-black text-gray-900">Service not available</h1>
            <p className="mt-3 text-sm text-gray-500">Open this page from a brand or category service card so we can load the live service data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#ffffff_38%,#ffffff_100%)] pb-28">
      <Navbar locationLabel="Premium service" cartCount={cartCount} onSearchClick={() => {}} onLocationClick={() => navigate('/user/home')} />

      <div className="mx-auto max-w-4xl pt-[80px] pb-4 md:px-6">
        <div className="px-4 md:px-0">
          <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-normal text-gray-900 shadow-sm border border-gray-100">
            <FiArrowLeft /> Back
          </button>
        </div>

        <div className="overflow-hidden bg-white shadow-[0_18px_60px_rgba(17,24,39,0.08)] md:rounded-4xl md:border md:border-gray-100">
          <div className="relative h-80 md:h-[460px]">
            <img src={service.image ? toAssetUrl(service.image) : service.image} alt={service.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute left-5 top-5 flex gap-2 text-white">
              <button className="rounded-full bg-black/25 p-3 backdrop-blur"><FiHeart /></button>
              <button className="rounded-full bg-black/25 p-3 backdrop-blur"><FiShare2 /></button>
            </div>
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-normal tracking-[0.1em] text-white/80">Service detail</p>
              <h1 className="mt-2 text-3xl font-normal md:text-5xl">
                {service.title ? service.title.charAt(0).toUpperCase() + service.title.slice(1).toLowerCase() : ''}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-normal text-white/90">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 backdrop-blur"><FiStar className="text-amber-300" /> {service.rating || 4.8}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 backdrop-blur"><FiClock /> 45 mins</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 backdrop-blur"><FiShield /> Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-0">

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <PriceTag price={calculatedPrice} originalPrice={service.originalPrice} />
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-normal text-emerald-700">Save up to {service.originalPrice ? Math.round(((service.originalPrice - calculatedPrice) / service.originalPrice) * 100) : 25}%</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-gray-600 font-normal">{service.description}</p>
        </section>

        {fields.filter(f => f.showToUser !== false).length > 0 && (
          <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-orange-50 text-[#FF9F45] rounded-lg">
                <FiSliders className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-normal text-gray-900">Custom Options</h2>
            </div>
            
            <div className="space-y-4">
              {fields.filter(f => f.showToUser !== false).map((field) => {
                const value = dynamicAnswers[field.name] || '';
                return (
                  <div key={field._id || field.name} className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    
                    {/* Render inputs based on type */}
                    {field.fieldType === 'text' && (
                      <input
                        type="text"
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'number' && (
                      <input
                        type="number"
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'textarea' && (
                      <textarea
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                        rows={3}
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'dropdown' && (
                      <select
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-1 focus:ring-orange-300 outline-none"
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      >
                        <option value="">Select Option</option>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.fieldType === 'radio' && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {(field.options || []).map(opt => (
                          <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name={field.name}
                              value={opt}
                              checked={value === opt}
                              onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}

                    {field.fieldType === 'checkbox' && (
                      <label className="flex items-center gap-2 py-1 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.checked }))}
                        />
                        Enable this Option
                      </label>
                    )}

                    {field.fieldType === 'date' && (
                      <input
                        type="date"
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'time' && (
                      <input
                        type="time"
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {/* File / Image Uploader with progress indicator */}
                    {(field.fieldType === 'image' || field.fieldType === 'file') && (
                      <div className="flex flex-col gap-2 pt-1">
                        <input
                          type="file"
                          accept={field.fieldType === 'image' ? 'image/*' : '*'}
                          disabled={uploadingFiles[field.name]}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(field.name, e.target.files[0]);
                            }
                          }}
                          className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#FF9F45] hover:file:bg-orange-100/50"
                        />
                        {uploadingFiles[field.name] && <p className="text-[10px] text-[#FF9F45] animate-pulse">Uploading file...</p>}
                        {value && (
                          <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100">UPLOADED</span>
                            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-orange-500 hover:underline truncate flex-1">{value}</a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location Picker */}
                    {field.fieldType === 'location' && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Latitude, Longitude coordinates"
                          className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                        <button
                          type="button"
                          onClick={() => fetchCurrentLocation(field.name)}
                          className="px-3 bg-orange-50 hover:bg-orange-100/50 text-[#FF9F45] rounded-xl text-xs font-semibold border border-orange-150"
                        >
                          Locate Me
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <p className="text-xs font-normal tracking-[0.1em] text-gray-400">Included</p>
          <h2 className="mt-1 text-xl font-normal text-gray-900">What you get</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.length > 0 ? features.map((feature) => (
              <span key={feature} className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-sm font-normal text-[#FF9F45]">
                <FiCheckCircle /> {feature}
              </span>
            )) : <span className="text-sm text-gray-500 font-normal">No included features listed.</span>}
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <p className="text-xs font-normal tracking-[0.1em] text-gray-400">Process</p>
          <h2 className="mt-1 text-xl font-normal text-gray-900">How it works</h2>
          <div className="mt-4 space-y-3">
            {steps.length > 0 ? steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-[22px] border border-gray-100 bg-linear-to-br from-white to-orange-50/20 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FFB86C] text-sm font-normal text-white">{index + 1}</div>
                <div>
                  <div className="font-normal text-gray-900">{step}</div>
                  <p className="text-sm text-gray-500 font-normal">Smooth and transparent service delivery.</p>
                </div>
              </div>
            )) : <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500 font-normal">No steps listed for this service.</div>}
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-orange-100/20 bg-gradient-to-r from-[#FF9F45] to-[#FFB86C] p-5 text-white shadow-[0_18px_60px_rgba(255,159,69,0.15)]">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/15 p-3"><FiShield /></div>
            <div>
              <p className="text-xs font-normal tracking-[0.1em] text-white/75">Professional badge</p>
              <h3 className="text-xl font-normal">Verified Professional</h3>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/85 font-normal">Certified experts, clean work, and support-backed service experience.</p>
        </section>

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <p className="text-xs font-normal tracking-[0.1em] text-gray-400">Reviews</p>
          <h2 className="mt-1 text-xl font-normal text-gray-900">User feedback</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500 md:col-span-3 font-normal">No reviews available yet.</div>
          </div>
        </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-100/50 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-[28px] border border-orange-100/60 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(255,159,69,0.08)]">
          <div>
            <div className="text-[11px] font-normal tracking-[0.1em] text-gray-400">Price</div>
            <PriceTag price={calculatedPrice} originalPrice={service.originalPrice} className="mt-1" />
          </div>
          <button type="button" onClick={handleAdd} className="rounded-2xl bg-gradient-to-r from-[#FF9F45] to-[#FFB86C] px-5 py-3 text-sm font-normal text-white shadow-lg shadow-orange-100/50 transition-transform hover:scale-[1.02]">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumServiceDetailPage;
