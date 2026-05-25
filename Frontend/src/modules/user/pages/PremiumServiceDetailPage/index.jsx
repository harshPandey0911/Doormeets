import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiShare2, FiShield, FiStar, FiClock, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/premium/Navbar';
import BottomCheckoutBar from '../../components/premium/BottomCheckoutBar';
import PriceTag from '../../components/premium/PriceTag';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCart } from '../../../../context/CartContext';

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

  const handleAdd = async () => {
    if (!service) return;
    const response = await addToCart(buildCartItemData({ service, category, brand }));
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f7f1ff_0%,#ffffff_40%,#ffffff_100%)] pb-28">
      <Navbar locationLabel="Premium service" cartCount={cartCount} onSearchClick={() => {}} onLocationClick={() => navigate('/user/home')} />

      <div className="mx-auto max-w-4xl px-4 py-4 md:px-6">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-sm border border-gray-100">
          <FiArrowLeft /> Back
        </button>

        <div className="overflow-hidden rounded-4xl border border-gray-100 bg-white shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
          <div className="relative h-80 md:h-[460px]">
            <img src={service.image ? toAssetUrl(service.image) : service.image} alt={service.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute left-5 top-5 flex gap-2 text-white">
              <button className="rounded-full bg-black/25 p-3 backdrop-blur"><FiHeart /></button>
              <button className="rounded-full bg-black/25 p-3 backdrop-blur"><FiShare2 /></button>
            </div>
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Service detail</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">{service.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-white/90">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 backdrop-blur"><FiStar className="text-amber-300" /> {service.rating || 4.8}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 backdrop-blur"><FiClock /> 45 mins</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 backdrop-blur"><FiShield /> Verified</span>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <PriceTag price={service.price} originalPrice={service.originalPrice} />
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Save up to {service.originalPrice ? Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100) : 25}%</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-gray-600">{service.description}</p>
        </section>

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Included</p>
          <h2 className="mt-1 text-xl font-black text-gray-900">What you get</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.length > 0 ? features.map((feature) => (
              <span key={feature} className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-2 text-sm font-bold text-purple-700">
                <FiCheckCircle /> {feature}
              </span>
            )) : <span className="text-sm text-gray-500">No included features listed.</span>}
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Process</p>
          <h2 className="mt-1 text-xl font-black text-gray-900">How it works</h2>
          <div className="mt-4 space-y-3">
            {steps.length > 0 ? steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-[22px] border border-gray-100 bg-linear-to-br from-white to-purple-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-purple-600 to-fuchsia-500 text-sm font-black text-white">{index + 1}</div>
                <div>
                  <div className="font-black text-gray-900">{step}</div>
                  <p className="text-sm text-gray-500">Smooth and transparent service delivery.</p>
                </div>
              </div>
            )) : <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">No steps listed for this service.</div>}
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-purple-100 bg-linear-to-r from-purple-600 to-fuchsia-500 p-5 text-white shadow-[0_18px_60px_rgba(124,58,237,0.18)]">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/15 p-3"><FiShield /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Professional badge</p>
              <h3 className="text-xl font-black">Verified Professional</h3>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/85">Certified experts, clean work, and support-backed service experience.</p>
        </section>

        <section className="mt-6 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Reviews</p>
          <h2 className="mt-1 text-xl font-black text-gray-900">User feedback</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500 md:col-span-3">No reviews available yet.</div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-[28px] border border-purple-100 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(124,58,237,0.12)]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Price</div>
            <PriceTag price={service.price} originalPrice={service.originalPrice} className="mt-1" />
          </div>
          <button type="button" onClick={handleAdd} className="rounded-2xl bg-linear-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-200 transition-transform hover:scale-[1.02]">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumServiceDetailPage;
