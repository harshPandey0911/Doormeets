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

import { zoneService } from "../../../../services/catalogService";
import { cityService } from "../../services/cityService";
import PaintingRatesSettings from "./pages/PaintingRatesSettings";

const UserCategories = () => {
  const [catalog, setCatalog] = useState(() => ensureIds(loadCatalog()));
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');

  useEffect(() => {
    const handler = () => setCatalog(ensureIds(loadCatalog()));
    window.addEventListener("adminUserAppCatalogUpdated", handler);
    return () => window.removeEventListener("adminUserAppCatalogUpdated", handler);
  }, []);

  // Fetch zones for the parent catalog container
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const zoneRes = await zoneService.getAll();
        if (zoneRes.success) {
          const loadedZones = (zoneRes.zones || zoneRes.data || []).filter(z => z.isActive !== false);
          setZones(loadedZones);
        }
      } catch (error) {
        console.error('Failed to fetch zones:', error);
      }
    };
    fetchZones();
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Routes>
          <Route index element={<Navigate to="/admin/user-categories/home" replace />} />
          <Route path="home" element={<HomePage catalog={catalog} setCatalog={setCatalog} selectedZone={selectedZone} />} />
          <Route path="combined-categories" element={<CombinedCategoriesPage catalog={catalog} setCatalog={setCatalog} selectedZone={selectedZone} zones={zones} />} />
          <Route path="professions" element={<ProfessionsPage selectedZone={selectedZone} />} />
          <Route path="categories" element={<CategoriesPage catalog={catalog} setCatalog={setCatalog} selectedZone={selectedZone} zones={zones} />} />
          <Route path="templates" element={<Navigate to="/admin/user-categories/home" replace />} />
          <Route path="templates/:code/manage" element={<TemplateCatalogManager catalog={catalog} setCatalog={setCatalog} selectedZone={selectedZone} zones={zones} />} />
          <Route path="sections" element={<ServicesPage catalog={catalog} setCatalog={setCatalog} selectedZone={selectedZone} zones={zones} />} />
          <Route path="subcategories" element={<SubCategoriesPage selectedZone={selectedZone} />} />
          <Route path="brands" element={<BrandsPage catalog={catalog} setCatalog={setCatalog} selectedZone={selectedZone} />} />
          <Route path="popular-services" element={<PopularServicesPage catalog={catalog} setCatalog={setCatalog} selectedZone={selectedZone} />} />
          <Route path="vendor-services" element={<VendorServicesPage selectedZone={selectedZone} />} />
          <Route path="vendor-parts" element={<VendorPartsPage selectedZone={selectedZone} />} />
          <Route path="featured-sections" element={<FeaturedSectionsManager zoneId={selectedZone} />} />
          <Route path="loyalty-points" element={<LoyaltyPointsConfig />} />
          <Route path="*" element={<Navigate to="/admin/user-categories/home" replace />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default UserCategories;


