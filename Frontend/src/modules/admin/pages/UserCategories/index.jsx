import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ensureIds, loadCatalog } from "./utils";
import HomePage from "./pages/HomePage";
import ProfessionsPage from "./pages/ProfessionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import CombinedCategoriesPage from "./pages/CombinedCategoriesPage";
import ServicesPage from "./pages/ServicesPage";
import BrandsPage from "./pages/BrandsPage";
import SubCategoriesPage from "./pages/SubCategoriesPage";
import PricingMatrixPage from "./pages/PricingMatrixPage";
import VendorServicesPage from "./pages/VendorServicesPage";
import VendorPartsPage from "./pages/VendorPartsPage";
import FeaturedSectionsManager from "../Services/FeaturedSectionsManager";

import TemplateCatalogManager from "./pages/TemplateCatalogManager";
import PopularServicesPage from "./pages/PopularServicesPage";
import LoyaltyPointsConfig from "./pages/LoyaltyPointsConfig";

import { cityService } from "../../services/cityService";
import PaintingRatesSettings from "./pages/PaintingRatesSettings";

const UserCategories = () => {
  const [catalog, setCatalog] = useState(() => ensureIds(loadCatalog()));
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('6a153cdfb02e3f00051d6156');

  useEffect(() => {
    const handler = () => setCatalog(ensureIds(loadCatalog()));
    window.addEventListener("adminUserAppCatalogUpdated", handler);
    return () => window.removeEventListener("adminUserAppCatalogUpdated", handler);
  }, []);

  // Fetch cities once for the parent container
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await cityService.getAll();
        if (response.success) {
          const loadedCities = (response.cities || []).filter(city => city.isActive);
          setCities(loadedCities);
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    };
    fetchCities();
  }, []);

  // Get admin role to control UI visibility
  const isAdminSuper = (() => {
    try {
      const storedData = sessionStorage.getItem('adminData') || localStorage.getItem('adminData');
      const stored = JSON.parse(storedData || '{}');
      const r = (stored.role || '').toLowerCase();
      return r === 'super_admin' || r === 'superadmin';
    } catch (e) {
      return false;
    }
  })();

  return (
    <div className="space-y-4">
      {/* City Scope Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-base font-extrabold text-gray-900">Catalog Management</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Filter services, pricing matrix, and category layouts by selecting a target city.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">City Scope:</span>
          <select
            value={selectedCity || ''}
            onChange={(e) => setSelectedCity(e.target.value || null)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs font-extrabold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[180px] shadow-2xs hover:bg-gray-100"
          >
            <option value="">All Cities (Global View)</option>
            {cities.map((city) => (
              <option key={city._id || city.id} value={city._id || city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Routes>
          <Route index element={<Navigate to="/admin/user-categories/home" replace />} />
          <Route path="home" element={<HomePage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
          <Route path="combined-categories" element={<CombinedCategoriesPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} cities={cities} />} />
          <Route path="professions" element={<ProfessionsPage selectedCity={selectedCity} />} />
          <Route path="categories" element={<CategoriesPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} cities={cities} />} />
          <Route path="templates" element={<Navigate to="/admin/user-categories/home" replace />} />
          <Route path="templates/:code/manage" element={<TemplateCatalogManager catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} cities={cities} />} />
          <Route path="sections" element={<ServicesPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} cities={cities} />} />
          <Route path="subcategories" element={<SubCategoriesPage selectedCity={selectedCity} />} />
          <Route path="brands" element={<BrandsPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
          <Route path="popular-services" element={<PopularServicesPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
          <Route path="vendor-services" element={<VendorServicesPage selectedCity={selectedCity} />} />
          <Route path="vendor-parts" element={<VendorPartsPage selectedCity={selectedCity} />} />
          <Route path="featured-sections" element={<FeaturedSectionsManager cityId={selectedCity} />} />
          <Route path="loyalty-points" element={<LoyaltyPointsConfig />} />
          <Route path="*" element={<Navigate to="/admin/user-categories/home" replace />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default UserCategories;


