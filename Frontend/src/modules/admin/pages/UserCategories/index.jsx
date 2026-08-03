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
      {/* Zone Scope Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-base font-extrabold text-gray-900">Catalog Management</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Filter services, pricing matrix, and category layouts by selecting a target geofence Zone.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Zone Scope:</span>
          <select
            value={selectedZone || ''}
            onChange={(e) => setSelectedZone(e.target.value || null)}
            className="px-3 py-2 border border-purple-200 rounded-xl bg-purple-50/50 text-xs font-extrabold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer min-w-[180px] shadow-2xs hover:bg-purple-100/50"
          >
            <option value="">All Zones (Global View)</option>
            {zones.map((zone) => (
              <option key={zone._id || zone.id} value={zone._id || zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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


