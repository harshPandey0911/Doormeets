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
                  setSelectedCity(cityId);
                }
              } catch (e) {
                setSelectedCity(cityId);
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
      {/* Global City Filter Header - Visible only to Super Admin */}
      {/* Global City Filter Header - Removed per user request */}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Routes>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
          <Route path="professions" element={<ProfessionsPage />} />
          <Route path="categories" element={<CategoriesPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
          <Route path="sections" element={<ServicesPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
          <Route path="subcategories" element={<SubCategoriesPage selectedCity={selectedCity} />} />
          <Route path="pricing" element={<PricingMatrixPage selectedCity={selectedCity} />} />
          <Route path="brands" element={<BrandsPage catalog={catalog} setCatalog={setCatalog} selectedCity={selectedCity} />} />
          <Route path="vendor-services" element={<VendorServicesPage />} />
          <Route path="vendor-parts" element={<VendorPartsPage />} />
          <Route path="*" element={<Navigate to="home" replace />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default UserCategories;


