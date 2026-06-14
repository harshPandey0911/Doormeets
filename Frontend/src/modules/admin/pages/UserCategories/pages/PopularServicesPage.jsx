import React, { useState, useEffect, useMemo } from "react";
import { FiGrid, FiTrash2, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import CardShell from "../components/CardShell";
import ToggleSwitch from "../components/ToggleSwitch";
import { ensureIds, saveCatalog } from "../utils";
import { homeContentService, serviceService, categoryService, publicCatalogService } from "../../../../../services/catalogService";

const PopularServicesPage = ({ catalog, setCatalog, selectedCity }) => {
  const [allServices, setAllServices] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [homeDataLocal, setHomeDataLocal] = useState({ popularServices: [], isPopularServicesVisible: true });

  const home = ensureIds(catalog).home;

  const categories = useMemo(() => {
    return ensureIds(catalog).categories || [];
  }, [catalog]);

  const getCategoryTitle = (id) => {
    const found = categories.find((c) => c.id === id);
    return found?.title || "";
  };

  // Fetch all active services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const params = {};
        if (selectedCity) params.cityId = selectedCity;

        const response = await serviceService.getAll(params);
        if (response.success) {
          setAllServices(response.services || []);
        }
      } catch (error) {
        console.error("Failed to fetch services", error);
      }
    };
    fetchServices();
  }, [selectedCity]);

  // Fetch home content
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const params = {};
        if (selectedCity) params.cityId = selectedCity;

        const homeRes = await homeContentService.get(params);
        if (homeRes.success && homeRes.homeContent) {
          const hc = homeRes.homeContent;
          setHomeDataLocal({
            popularServices: (hc.popularServices || []).map(p => typeof p === 'object' ? (p.id || p._id) : p),
            isPopularServicesVisible: hc.isPopularServicesVisible ?? true
          });
        }
      } catch (error) {
        console.error("Error fetching home content:", error);
      }
    };
    fetchHomeData();
  }, [selectedCity]);

  const syncHomeToBackend = async (updatedLocal) => {
    setIsSyncing(true);
    try {
      const nextHome = {
        ...(home || {}),
        popularServices: updatedLocal.popularServices,
        isPopularServicesVisible: updatedLocal.isPopularServicesVisible
      };

      const payload = {
        banners: nextHome.banners,
        promos: nextHome.promoCarousel,
        curated: nextHome.curatedServices,
        noteworthy: nextHome.newAndNoteworthy,
        booked: nextHome.mostBooked,
        categorySections: nextHome.categorySections,
        popularServices: nextHome.popularServices,
        isPopularServicesVisible: nextHome.isPopularServicesVisible,
        isBannersVisible: nextHome.isBannersVisible,
        isPromosVisible: nextHome.isPromosVisible,
        isCuratedVisible: nextHome.isCuratedVisible,
        isNoteworthyVisible: nextHome.isNoteworthyVisible,
        isBookedVisible: nextHome.isBookedVisible,
        isCategorySectionsVisible: nextHome.isCategorySectionsVisible,
        isCategoriesVisible: nextHome.isCategoriesVisible
      };

      await homeContentService.update(payload, { cityId: selectedCity });
      publicCatalogService.invalidateCache();
      
      // Update globally managed catalog
      const next = ensureIds(catalog);
      next.home = nextHome;
      setCatalog(next);
      saveCatalog(next);

      toast.success('Popular services updated successfully!');
    } catch (error) {
      console.error('Failed to sync home content:', error);
      toast.error('Failed to save changes to server');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleChange = () => {
    const updated = {
      ...homeDataLocal,
      isPopularServicesVisible: !homeDataLocal.isPopularServicesVisible
    };
    setHomeDataLocal(updated);
    syncHomeToBackend(updated);
  };

  const handleAddPopularService = (serviceId) => {
    if (homeDataLocal.popularServices.includes(serviceId)) {
      toast.error("Service is already added");
      return;
    }
    const updated = {
      ...homeDataLocal,
      popularServices: [...homeDataLocal.popularServices, serviceId]
    };
    setHomeDataLocal(updated);
    syncHomeToBackend(updated);
  };

  const handleRemovePopularService = (serviceId) => {
    const updated = {
      ...homeDataLocal,
      popularServices: homeDataLocal.popularServices.filter(id => id !== serviceId)
    };
    setHomeDataLocal(updated);
    syncHomeToBackend(updated);
  };

  return (
    <div className="space-y-4">
      <CardShell icon={FiGrid}>
        <div className="space-y-4">
          <div className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <span>Popular Services</span>
          </div>

          <div className="flex items-center justify-between gap-4 mb-3">
            <ToggleSwitch
              label="Show Popular Services"
              checked={homeDataLocal.isPopularServicesVisible}
              onChange={handleToggleChange}
            />
            <div className="flex items-center gap-3">
              <select
                id="popular-service-select-page"
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  handleAddPopularService(val);
                  e.target.value = "";
                }}
              >
                <option value="">-- Add Popular Service --</option>
                {allServices
                  .filter(s => !homeDataLocal.popularServices.includes(s._id || s.id))
                  .map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.title} ({getCategoryTitle(s.categoryId?._id || s.categoryId)})
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          {homeDataLocal.popularServices.length === 0 ? (
            <div className="text-base text-gray-500">No popular services configured</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-bold text-gray-700 w-12">#</th>
                    <th className="text-left py-2 px-3 text-sm font-bold text-gray-700">Service Name</th>
                    <th className="text-left py-2 px-3 text-sm font-bold text-gray-700">Category</th>
                    <th className="text-center py-2 px-3 text-sm font-bold text-gray-700 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {homeDataLocal.popularServices.map((id, idx) => {
                    const s = allServices.find(srv => (srv._id || srv.id) === id);
                    return (
                      <tr key={id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 text-sm font-semibold text-gray-600">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-sm font-medium text-gray-900">{s ? s.title : "Unknown Service"}</td>
                        <td className="py-2.5 px-3 text-sm text-gray-600">
                          {s ? getCategoryTitle(s.categoryId?._id || s.categoryId) : "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePopularService(id)}
                              disabled={isSyncing}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Remove"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardShell>
    </div>
  );
};

export default PopularServicesPage;
