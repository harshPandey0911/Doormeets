import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiClock, FiHeart, FiShare2, FiShield, FiStar } from 'react-icons/fi';
import Navbar from '../../components/premium/Navbar';
import ServiceCard from '../../components/premium/ServiceCard';
import PriceTag from '../../components/premium/PriceTag';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCity } from '../../../../context/CityContext';
import { useCart } from '../../../../context/CartContext';
import { publicCatalogService } from '../../../../services/catalogService';
import { bookingService } from '../../../../services/bookingService';
import { toast } from 'react-hot-toast';

const PremiumBrandPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCity } = useCity();
  const { cartCount, addToCart } = useCart();

  const [brand, setBrand] = useState(location.state?.vendor || null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const brandRes = await publicCatalogService.getBrandBySlug(slug, currentCity?._id || currentCity?.id);
        if (brandRes?.success) {
          setBrand(brandRes.brand || brandRes.data || brandRes);
        }
      } catch (error) {
        console.error('Brand load error', error);
      }
    };

    if (!brand) loadBrand();
  }, [brand, currentCity, slug]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        if (!brand) return;
        const brandId = brand.id || brand._id;
        const serviceRes = await publicCatalogService.getServices({ brandId, cityId: currentCity?._id || currentCity?.id });
        if (serviceRes?.success && Array.isArray(serviceRes.services)) {
          setServices(serviceRes.services.map((service, index) => ({
            id: service.id || service._id || `brand-service-${index}`,
            title: service.title,
            description: service.description || 'Premium service by verified professionals.',
            image: toAssetUrl(service.icon || service.image),
            rating: service.rating || 4.8,
            reviews: service.reviewCount || 120,
            price: service.discountPrice || service.basePrice || service.price || 0,
            originalPrice: service.basePrice || null,
            features: service.features || [],
            vendorId: service.vendorId || brand.vendorId,
            brandId
          })));
        } else {
          setServices([]);
        }

        try {
          const ratingRes = await bookingService.getRatings({ brandId });
          const ratingList = ratingRes?.data || ratingRes?.reviews || ratingRes?.ratings || [];
          if (Array.isArray(ratingList) && ratingList.length) {
            setReviews(ratingList.map((item, index) => ({
              id: item.id || item._id || `review-${index}`,
              name: item.userName || item.user?.name || item.customerName || 'User',
              rating: item.rating || 5,
              comment: item.comment || item.review || item.message || 'Great service',
            })));
          }
        } catch (ratingError) {
          setReviews([]);
        }
      } catch (error) {
        console.error('Brand services load error', error);
        setServices([]);
        setReviews([]);
      }
    };

    loadServices();
  }, [brand, currentCity]);

  const heroImage = brand?.coverImage || brand?.image || services[0]?.image || '';
  const topServices = services.slice(0, 2);

  const handleAdd = async (service) => {
    const response = await addToCart(buildCartItemData({ service, brand }));
    if (response?.success) {
      toast.success('Added to cart');
    }
  };

  const serviceCards = useMemo(() => services, [services]);

  if (!brand) {
    return <div className="min-h-screen bg-white p-6">Loading brand...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f7f1ff_0%,#ffffff_40%,#ffffff_100%)] pb-24">
      <Navbar locationLabel={currentCity?.name || 'Select location'} cartCount={cartCount} onSearchClick={() => {}} onLocationClick={() => navigate('/user/home')} />

      <div className="mx-auto max-w-7xl px-4 pt-[80px] pb-4 md:px-6">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-sm border border-gray-100">
          <FiArrowLeft /> Back
        </button>

        <div className="overflow-hidden rounded-4xl border border-gray-100 bg-white shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
          <div className="relative h-72 md:h-96">
            {heroImage ? (
              <img src={heroImage} alt={brand.title || brand.businessName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-50 to-white text-gray-400">No brand image available</div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute left-5 top-5 flex gap-2 text-white">
              <button className="rounded-full bg-black/25 p-3 backdrop-blur">
                <FiHeart />
              </button>
              <button className="rounded-full bg-black/25 p-3 backdrop-blur">
                <FiShare2 />
              </button>
            </div>
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Brand page</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">{brand.title || brand.businessName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85 md:text-base">{brand.description || brand.tagline || 'Premium service partner with trusted technicians and transparent pricing.'}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-sm font-bold backdrop-blur"><FiStar className="text-amber-300" /> {brand.rating || 4.8}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-sm font-bold backdrop-blur"><FiClock /> 30-45 min</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-sm font-bold backdrop-blur"><FiShield /> Verified</span>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-[30px] border border-purple-100 bg-white p-5 shadow-[0_18px_60px_rgba(124,58,237,0.08)]">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-400">Top services</p>
              <h2 className="text-xl font-black text-gray-900">Starts from</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topServices.map((service) => (
              <button key={service.id} type="button" onClick={() => navigate(`/user/service/${service.id}`, { state: { service, brand } })} className="rounded-3xl border border-gray-100 bg-linear-to-br from-white to-purple-50 p-4 text-left shadow-sm transition hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white border border-purple-100">
                    <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-gray-900 line-clamp-1">{service.title}</div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2">{service.description}</div>
                    <PriceTag price={service.price} originalPrice={service.originalPrice} className="mt-2" />
                  </div>
                </div>
                <div className="mt-3 inline-flex rounded-2xl bg-linear-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-purple-200">View details</div>
              </button>
            ))}
          </div>
          {topServices.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">No services available for this brand.</div> : null}
        </section>

        <section className="mt-6 space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">All services</p>
            <h2 className="text-xl font-black text-gray-900">Choose and add</h2>
          </div>
          <div className="grid gap-4">
            {serviceCards.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                quantity={0}
                onAdd={handleAdd}
                onOpen={() => navigate(`/user/service/${service.id}`, { state: { service, brand } })}
              />
            ))}
          </div>
          {serviceCards.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">No services available right now.</div> : null}
        </section>

        <section className="mt-8 rounded-[30px] border border-gray-100 bg-white p-5 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Reviews</p>
            <h2 className="text-xl font-black text-gray-900">What users say</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-3xl border border-gray-100 bg-linear-to-br from-white to-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-black text-gray-900">{review.name}</div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"><FiStar /> {review.rating}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
          {reviews.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500">No reviews available yet.</div> : null}
        </section>
      </div>
    </div>
  );
};

export default PremiumBrandPage;
