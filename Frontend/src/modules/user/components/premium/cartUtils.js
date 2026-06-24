export const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = String(url).replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

export const buildCartItemData = ({ service, category = null, brand = null }) => {
  const price = service?.discountPrice ?? service?.basePrice ?? service?.price ?? 0;
  return {
    serviceId: service?.id || service?._id,
    categoryId: category?.id || category?._id || service?.categoryId || null,
    title: service?.title || '',
    description: service?.description || '',
    icon: toAssetUrl(service?.icon || service?.image || ''),
    category: category?.title || service?.category || service?.categoryTitle || 'Service',
    categoryTitle: category?.title || service?.category || service?.categoryTitle || 'Service',
    categoryIcon: toAssetUrl(category?.homeIconUrl || category?.iconUrl || category?.icon || ''),
    sectionId: brand?.id || brand?._id || service?.brandId || null,
    sectionTitle: brand?.title || brand?.businessName || service?.brand?.title || '',
    sectionIcon: toAssetUrl(brand?.iconUrl || brand?.icon || service?.brand?.icon || ''),
    price,
    originalPrice: service?.basePrice || null,
    unitPrice: price,
    serviceCount: 1,
    rating: service?.rating || 4.8,
    reviews: service?.reviews || service?.reviewCount || 0,
    vendorId: service?.vendorId || brand?.vendorId || null,
    isPriceDisclosed: service?.isPriceDisclosed !== false,
    serviceType: service?.serviceType || 'package_base',
    workflow: service?.workflow || null,
    card: {
      title: service?.title || '',
      subtitle: service?.description || '',
      price,
      originalPrice: service?.basePrice || null,
      duration: service?.duration || '',
      description: service?.description || '',
      imageUrl: toAssetUrl(service?.icon || service?.image || ''),
      features: service?.features || []
    }
  };
};
