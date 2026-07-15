import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiGrid, FiList, FiSliders, FiDollarSign, FiTag, FiLayout, FiToggleLeft, FiToggleRight, FiChevronUp, FiChevronDown, FiSave, FiClock, FiPackage, FiCamera, FiRefreshCw, FiFeather, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";
import api from "../../../../../services/api";
import CategoriesPage from "./CategoriesPage";
import SubCategoriesPage from "./SubCategoriesPage";
import BrandsPage from "./BrandsPage";
import ServicesPage from "./ServicesPage";
import PricingMatrixPage from "./PricingMatrixPage";

const TemplateCatalogManager = ({ catalog, setCatalog, selectedCity, cities }) => {
  const { code } = useParams();
  console.log("TemplateCatalogManager mount - code:", code);
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories"); // categories, subcategories, brands, services, pricing, layout
  console.log("TemplateCatalogManager state - template:", template, "loading:", loading, "activeTab:", activeTab);
  const [saving, setSaving] = useState(false);

  const handleSaveLayout = async () => {
    if (!template) return;
    try {
      setSaving(true);
      const res = await api.put(`/admin/category-templates/${template._id}`, {
        schema: template.schema,
        blocks: template.blocks
      });
      if (res.data.success) {
        toast.success(`Layout updated successfully`);
        setTemplate(res.data.template);
      }
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save layout configuration');
    } finally {
      setSaving(false);
    }
  };

  const moveBlock = (index, direction) => {
    if (!template || !template.blocks) return;
    const blocks = [...template.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const tempVal = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = tempVal;

    setTemplate({
      ...template,
      blocks
    });
  };

  const toggleBlock = (index) => {
    if (!template || !template.blocks) return;
    const blocks = [...template.blocks];
    blocks[index] = {
      ...blocks[index],
      enabled: !blocks[index].enabled
    };
    setTemplate({
      ...template,
      blocks
    });
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/category-templates/${code}`);
        if (res.data.success) {
          setTemplate(res.data.template);
        }
      } catch (err) {
        console.error("Error fetching template details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm space-y-4">
        <p className="text-gray-500 font-semibold">Template not found or has been disabled.</p>
        <button
          onClick={() => navigate("/admin/user-categories/home")}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto"
        >
          <FiArrowLeft /> Back to Templates
        </button>
      </div>
    );
  }

  const tabItems = [
    { id: "categories", label: "Categories", icon: FiGrid },
    { id: "subcategories", label: "Subcategories", icon: FiList },
    { id: "brands", label: "Brands", icon: FiTag },
    { id: "services", label: "Services", icon: FiSliders },
    { id: "pricing", label: "Price Matrix", icon: FiDollarSign }
  ].filter(tab => {
    if (template.code === "IMAGE_CONSULTANT") {
      return tab.id !== "brands" && tab.id !== "subcategories" && tab.id !== "pricing";
    }
    if (template.code === "SERVICE_PAGE") {
      return tab.id !== "pricing";
    }
    return true;
  });

  if (template.code === "SERVICE_PAGE") {
    tabItems.push({ id: "layout", label: "Page Layout", icon: FiLayout });
  }

  // Map template keys to SVG icon components
  const templateIcons = {
    MINUTE_BASED: { Icon: FiClock, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    NORMAL_SERVICE: { Icon: FiSliders, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
    SUBSCRIPTION_BASED: { Icon: FiCheckCircle, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
    PACKAGE_BASED: { Icon: FiPackage, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    IMAGE_CONSULTANT: { Icon: FiCamera, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
    MULTI_VISIT: { Icon: FiRefreshCw, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
    SERVICE_PAGE: { Icon: FiFeather, color: "text-pink-600", bg: "bg-pink-50 border-pink-100" }
  };
  const templateMeta = templateIcons[template.code] || { Icon: FiLayout, color: "text-gray-600", bg: "bg-gray-50 border-gray-100" };
  const TemplateIcon = templateMeta.Icon;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/user-categories/home")}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors border border-gray-200"
            title="Back to Templates"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg border flex items-center justify-center ${templateMeta.bg}`}>
                <TemplateIcon className={`w-5 h-5 ${templateMeta.color}`} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700">
                {template.code.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Manage categories, services, and pricing specific to this template.</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white p-2 rounded-2xl border border-gray-150 shadow-sm flex flex-wrap gap-1.5">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10 scale-[1.02]"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Workspace Panel */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === "categories" && (
          <CategoriesPage
            catalog={catalog}
            setCatalog={setCatalog}
            selectedCity={selectedCity}
            cities={cities}
            filterTemplateId={template._id}
            filterTemplateCode={template.code}
          />
        )}
        {activeTab === "subcategories" && (
          <SubCategoriesPage
            selectedCity={selectedCity}
            filterTemplateId={template._id}
          />
        )}
        {activeTab === "brands" && (
          <BrandsPage
            catalog={catalog}
            setCatalog={setCatalog}
            selectedCity={selectedCity}
            filterTemplateId={template._id}
          />
        )}
        {activeTab === "services" && (
          <ServicesPage
            catalog={catalog}
            setCatalog={setCatalog}
            selectedCity={selectedCity}
            cities={cities}
            filterTemplateId={template._id}
          />
        )}
        {activeTab === "pricing" && (
          <PricingMatrixPage
            selectedCity={selectedCity}
            filterTemplateId={template._id}
            filterTemplateCode={template.code}
          />
        )}
        {activeTab === "layout" && template.code === "SERVICE_PAGE" && (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Drag & Drop Blocks Order</h3>
                <p className="text-xs text-gray-500 mt-1">Use Up/Down arrows to reorder blocks displayed on the category service page.</p>
              </div>
              <button
                onClick={handleSaveLayout}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <FiSave />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
            <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
              {(template.blocks || []).map((block, idx) => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border bg-white shadow-sm transition-all ${
                    block.enabled ? 'border-gray-200' : 'opacity-60 border-dashed border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleBlock(idx)}
                      className="text-xl transition-colors focus:outline-none"
                      title={block.enabled ? 'Disable block' : 'Enable block'}
                    >
                      {block.enabled ? (
                        <FiToggleRight className="text-green-500" />
                      ) : (
                        <FiToggleLeft className="text-gray-400" />
                      )}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{block.name}</div>
                      <div className="text-xs text-gray-400">ID: {block.id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveBlock(idx, 'up')}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-500 transition-colors"
                    >
                      <FiChevronUp />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (template.blocks || []).length - 1}
                      onClick={() => moveBlock(idx, 'down')}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent text-gray-500 transition-colors"
                    >
                      <FiChevronDown />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TemplateCatalogManager;
