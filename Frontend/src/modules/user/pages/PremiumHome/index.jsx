import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/premium/Navbar';
import BannerSlider from '../../components/premium/BannerSlider';
import SearchBar from '../../components/premium/SearchBar';
import ServiceCard from '../../components/premium/ServiceCard';
import { useCity } from '../../../../context/CityContext';
import { useCart } from '../../../../context/CartContext';
import { publicCatalogService } from '../../../../services/catalogService';
import userBannerService from '../../../../services/userBannerService';
import CategoryCard from '../../components/common/CategoryCard';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';

const PremiumHome = () => {
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const { cartCount, addToCart } = useCart();

  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cityId = currentCity?._id || currentCity?.id;
        const [homeRes, brandsRes, bannersRes] = await Promise.allSettled([
          publicCatalogService.getHomeData(cityId),
          publicCatalogService.getBrands({ cityId }),
          userBannerService.getActiveBanners()
        ]);

        if (homeRes.status === 'fulfilled' && homeRes.value?.success && Array.isArray(homeRes.value.categories)) {
          const mapped = homeRes.value.categories.map((cat) => ({
            id: cat.id || cat._id,
            title: cat.title,
            slug: cat.slug || cat.title?.toLowerCase().replace(/\s+/g, '-'),
            icon: toAssetUrl(cat.icon || cat.homeIconUrl),
            subtitle: cat.subtitle || 'Premium service',
          }));
          setCategories(mapped);
        }

        if (brandsRes.status === 'fulfilled' && brandsRes.value?.success && Array.isArray(brandsRes.value.brands)) {
          const mapped = brandsRes.value.brands.slice(0, 8).map((brand) => ({
            id: brand.id || brand._id,
            title: brand.title,
            slug: brand.slug,
            rating: brand.rating || 4.8,
            subtitle: brand.type === 'product' ? 'Products & parts' : 'Service partner',
            image: toAssetUrl(brand.iconUrl || brand.icon),
          }));
          setBrands(mapped);
          const services = brandsRes.value.brands
            .filter((brand) => brand.type === 'service')
            .slice(0, 6)
            .map((brand, index) => ({
              id: brand.id || brand._id || `brand-service-${index}`,
              title: brand.title,
              description: brand.description || brand.subtitle || 'Expert service at your doorstep.',
              image: toAssetUrl(brand.iconUrl || brand.icon),
              rating: brand.rating || 4.8,
              reviews: brand.reviewCount || 120,
              price: brand.price || brand.startingPrice || 199,
              originalPrice: brand.originalPrice || null,
              features: brand.features || ['Verified expert', 'Fast booking', 'Warranty'],
            }));
          setFeaturedServices(services);
        }

        if (bannersRes.status === 'fulfilled' && bannersRes.value?.success && Array.isArray(bannersRes.value.data)) {
          const mapped = bannersRes.value.data.map((banner) => ({
            id: banner._id || banner.id,
            title: banner.title || 'Premium home services',
            subtitle: banner.subtitle || banner.description || 'Professional, reliable and fast.',
            buttonText: banner.buttonText || 'Explore',
            image: toAssetUrl(banner.imageUrl || banner.image || banner.bannerUrl),
            accent: banner.accent || 'from-purple-600 via-fuchsia-500 to-indigo-500'
          }));
          setBanners(mapped);
        }
      } catch (error) {
        console.error('PremiumHome load error', error);
      }
    };

    loadData();
  }, [currentCity]);

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories;
    const value = query.toLowerCase();
    return categories.filter((item) => item.title.toLowerCase().includes(value));
  }, [categories, query]);

  const filteredServices = useMemo(() => {
    if (!query.trim()) return featuredServices;
    const value = query.toLowerCase();
    return featuredServices.filter((item) =>
      item.title.toLowerCase().includes(value) || item.description.toLowerCase().includes(value)
    );
  }, [featuredServices, query]);

  const handleAdd = async (service) => {
    const response = await addToCart(buildCartItemData({ service, category: categories[0], brand: brands[0] }));
    if (response?.success) {
      navigate('/user/cart');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f7f1ff_0%,#ffffff_40%,#ffffff_100%)] text-gray-900">
      <Navbar locationLabel={currentCity?.name || 'Select location'} cartCount={cartCount} onSearchClick={() => { }} onLocationClick={() => navigate('/user/account')} />

      <main className="mx-auto max-w-7xl pb-28 pt-[70px]">
        <div className="px-4 pt-4 md:px-6">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {banners.length > 0 ? <BannerSlider banners={banners} onCtaClick={(banner) => navigate('/user/category/electricity', { state: { source: banner } })} /> : null}

        <section className="px-4 pt-6 md:px-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Service Categories</h2>
              <p className="text-sm text-gray-500">Premium Home Services</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {filteredCategories.map((category, index) => (
              <CategoryCard
                key={category.id || category.slug || index}
                title={category.title}
                icon={<img src={category.icon} alt={category.title} className="h-11 w-11 object-contain" />}
                onClick={() => navigate(`/user/category/${category.slug || category.id}`, { state: { category } })}
                index={index}
              />
            ))}
          </div>
          {filteredCategories.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">No categories available right now.</div> : null}
        </section>

        <section className="px-4 pt-8 md:px-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Popular Brands</h2>
              <p className="text-sm text-gray-500">LG, Samsung, Voltas and more</p>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {brands.map((brand, index) => (
              <div key={brand.id || index} className="shrink-0">
                <button type="button" onClick={() => navigate(`/user/brand/${brand.slug || brand.title.toLowerCase()}`, { state: { vendor: brand } })} className="rounded-3xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-transform hover:-translate-y-1">
                  <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-purple-50 to-white overflow-hidden">
                    {brand.image ? <img src={brand.image} alt={brand.title} className="h-10 w-10 object-contain" /> : <span className="text-xl font-black text-purple-700">{brand.title[0]}</span>}
                  </div>
                  <div className="text-sm font-bold text-gray-900">{brand.title}</div>
                  <div className="text-xs text-gray-500">{brand.subtitle}</div>
                </button>
              </div>
            ))}
          </div>
          {brands.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">No brands available right now.</div> : null}
        </section>

        <section className="px-4 pt-8 md:px-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">Trending Services</h2>
              <p className="text-sm text-gray-500">Quick add with premium styling</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                quantity={0}
                onAdd={handleAdd}
                onOpen={() => navigate(`/user/service/${service.id}`, { state: { service } })}
              />
            ))}
          </div>
          {filteredServices.length === 0 ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">No services available right now.</div> : null}
        </section>
      </main>
    </div>
  );
};

export default PremiumHome;
