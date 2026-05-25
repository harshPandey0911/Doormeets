import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { publicCatalogService } from '../../../services/catalogService';
import reviewService from '../../../services/reviewService';
import { FiArrowLeft } from 'react-icons/fi';
import { useCart } from '../../../../context/CartContext';
import { toast } from 'react-hot-toast';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const BrandPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialVendor = location.state?.vendor || null;

  const [brand, setBrand] = useState(initialVendor);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  const handleAdd = async (service) => {
    if (!service) return;
    try {
      const price = service.discountPrice || service.basePrice || service.price || 0;
      const cartItemData = {
        serviceId: service.id || service._id,
        categoryId: service.categoryId || brand.categoryId || brand.category?._id || null,
        title: service.title,
        description: service.description || '',
        icon: toAssetUrl(service.icon || service.image || ''),
        category: brand.category?.title || '',
        categoryTitle: brand.category?.title || '',
        categoryIcon: toAssetUrl(brand.category?.homeIconUrl || brand.category?.iconUrl || ''),
        sectionId: brand.id || brand._id || null,
        sectionTitle: brand.title || brand.businessName || '',
        sectionIcon: toAssetUrl(brand.icon || ''),
        price: price,
        originalPrice: service.basePrice || null,
        unitPrice: price,
        serviceCount: 1,
        vendorId: brand.vendorId || brand._id || null,
        isPriceDisclosed: service.isPriceDisclosed !== false,
        card: {
          title: service.title,
          subtitle: service.description || '',
          price: price,
          originalPrice: service.basePrice || null,
          duration: service.duration || '',
          description: service.description || '',
          imageUrl: toAssetUrl(service.icon || service.image || ''),
          features: service.features || []
        }
      };

      const response = await addToCart(cartItemData);
      if (response?.success) {
        toast.success('Added to cart');
      } else {
        toast.error(response?.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Add to cart failed', err);
      toast.error('Failed to add to cart');
    }
  };

  useEffect(() => {
    if (!brand && slug) fetchBrand();
    if (brand) fetchServices();
  }, [brand, slug]);

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const res = await publicCatalogService.getBrandBySlug(slug);
      if (res && res.success) {
        setBrand(res.brand || res.data || res);
      }
    } catch (err) {
      console.error('Failed to load brand:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const bId = brand.id || brand._id;
      const res = await publicCatalogService.getServices({ brandId: bId });
      if (res && res.success) setServices(res.services || res.data || []);

      // Try fetching reviews (admin review service)
      try {
        const revRes = await reviewService.getAllReviews({ brandId: bId, limit: 20 });
        if (revRes && revRes.success) setReviews(revRes.data || revRes.reviews || revRes.reviewsList || []);
      } catch (e) {
        // ignore if admin endpoint not accessible
      }
    } catch (err) {
      console.error('Failed to load services for brand:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!brand) return <div className="p-6">Loading brand...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 border-b">
        <button onClick={() => navigate(-1)} className="flex items-center gap-3">
          <FiArrowLeft className="w-5 h-5" />
          <span className="font-bold">Back</span>
        </button>
      </div>

      <div className="p-4">
        <div className="rounded-xl overflow-hidden mb-4">
          {brand.coverImage ? (
            <img src={toAssetUrl(brand.coverImage)} alt={brand.title || brand.businessName} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-56 bg-gray-100 flex items-center justify-center">No Image</div>
          )}
        </div>

        <h1 className="text-xl font-bold mb-2">{brand.title || brand.businessName}</h1>
        <p className="text-sm text-gray-500 mb-4">{brand.tagline || brand.description || ''}</p>

        {/* Show first two services side-by-side */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {services.slice(0,2).map(s => (
            <div key={s.id || s._id} className="p-3 border rounded-xl bg-white">
              <div className="font-bold text-sm mb-2">{s.title}</div>
              <div className="text-sm text-gray-600">₹{s.discountPrice || s.basePrice || '—'}</div>
            </div>
          ))}
        </div>

        {/* Full services list */}
        <div className="space-y-3 mb-6">
          {services.map(s => (
            <div key={s.id || s._id} className="p-3 border rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold">{s.title}</div>
                <div className="text-sm text-gray-500">{s.description || ''}</div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="font-bold">₹{s.discountPrice || s.basePrice || '—'}</div>
                <button onClick={() => handleAdd(s)} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-bold">Add</button>
              </div>
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-lg font-bold mb-3">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-sm text-gray-500">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id || r._id} className="p-3 border rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold">{r.userName || r.user?.name || 'User'}</div>
                    <div className="text-sm text-gray-500">{r.rating || 0}★</div>
                  </div>
                  <div className="text-sm text-gray-700">{r.comment || r.message || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandPage;
