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
      return (stored.role || 'admin') === 'super_admin';
    } catch (e) {
      return false;
    }
  })();

  return (
    <div className="space-y-4">
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


