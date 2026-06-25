import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ensureIds, loadCatalog } from "./utils";
import HomePage from "./pages/HomePage";
import ProfessionsPage from "./pages/ProfessionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import ServicesPage from "./pages/ServicesPage";
import BrandsPage from "./pages/BrandsPage";
import SubCategoriesPage from "./pages/SubCategoriesPage";
import PricingMatrixPage from "./pages/PricingMatrixPage";
import VendorServicesPage from "./pages/VendorServicesPage";
import VendorPartsPage from "./pages/VendorPartsPage";
import FeaturedSectionsManager from "../Services/FeaturedSectionsManager";

import TemplateCatalogManager from "./pages/TemplateCatalogManager";
import PopularServicesPage from "./pages/PopularServicesPage";

import { cityService } from "../../services/cityService";

const UserCategories = () => {
  const [catalog, setCatalog] = useState(() => ensureIds(loadCatalog()));
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

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

          // Auto-select default or first city if none selected
          if (!selectedCity && loadedCities.length > 0) {
            const defaultCity = loadedCities.find(c => c.isDefault);
            // Handle potentially different ID formats
            const cityId = defaultCity
              ? (defaultCity._id || defaultCity.id)
              : (loadedCities[0]._id || loadedCities[0].id);

            if (cityId) {
              // If the logged-in admin is a city_admin, prefer the persisted adminSelectedCity
              try {
                const storedAdmin = JSON.parse(sessionStorage.getItem('adminData') || localStorage.getItem('adminData') || '{}');
                if (storedAdmin.role === 'city_admin') {
                  const adminSelected = localStorage.getItem('adminSelectedCity');
                  if (adminSelected) {
                    setSelectedCity(adminSelected);
                  } else {
                    setSelectedCity(cityId);
                  }
                } else {
                  // For super admin, default to global '' (All Cities)
                  setSelectedCity('');
                }
              } catch (e) {
                setSelectedCity('');
              }
            }
          }
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
      return (stored.role || 'admin') === 'super_admin';
    } catch (e) {
      return false;
    }
  })();

  return (
    <div className="space-y-4">
      {/* Global City Filter Header - Restored for Super Admin */}
      {isAdminSuper && cities.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">City Selection</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a city to manage its catalog and features</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Current City:</span>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                try {
                  const storedAdmin = JSON.parse(sessionStorage.getItem('adminData') || localStorage.getItem('adminData') || '{}');
                  if (storedAdmin && storedAdmin.role === 'city_admin') {
                    localStorage.setItem('adminSelectedCity', e.target.value);
                  }
                } catch (err) {}
              }}
              className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block p-2.5 font-semibold outline-none"
            >
              <option value="">All Cities / Global</option>
              {cities.map((city) => (
                <option key={city._id || city.id} value={city._id || city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Routes>
          <Route index element={<Navigate to="/admin/user-categories/home" replace />} />
          <Route path="home" element={<HomePage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
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
          <Route path="*" element={<Navigate to="/admin/user-categories/home" replace />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default UserCategories;


