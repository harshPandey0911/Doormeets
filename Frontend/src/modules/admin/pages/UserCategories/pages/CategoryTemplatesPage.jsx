import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLayout, FiCheckCircle, FiSave, FiList, FiChevronUp, FiChevronDown, FiToggleLeft, FiToggleRight, FiSliders, FiEye, FiClock, FiPackage, FiCamera, FiRefreshCw, FiFeather } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import CardShell from '../components/CardShell';
import { categoryTemplateService } from '../../../../../services/catalogService';
import api from '../../../../../services/api';

const CategoryTemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, builder

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res, catRes] = await Promise.all([
        categoryTemplateService.getAll(),
        api.get('/admin/categories').catch(() => ({ data: { categories: [] } }))
      ]);
      if (res.success) {
        setTemplates(res.templates || []);
        if (res.templates && res.templates.length > 0) {
          setSelectedTemplate(res.templates[0]);
        }
      }
      if (catRes?.data?.success) {
        setCategories(catRes.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load templates metadata:', error);
      toast.error('Failed to load templates data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    try {
      setSaving(true);
      const res = await categoryTemplateService.update(selectedTemplate._id, {
        schema: selectedTemplate.schema,
        blocks: selectedTemplate.blocks
      });
      if (res.success) {
        toast.success(`${selectedTemplate.name} updated successfully`);
        setTemplates(prev => prev.map(t => t._id === selectedTemplate._id ? res.template : t));
      }
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save template configuration');
    } finally {
      setSaving(false);
    }
  };

  const moveBlock = (index, direction) => {
    if (!selectedTemplate || !selectedTemplate.blocks) return;
    const blocks = [...selectedTemplate.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    setSelectedTemplate({
      ...selectedTemplate,
      blocks
    });
  };

  const toggleBlock = (index) => {
    if (!selectedTemplate || !selectedTemplate.blocks) return;
    const blocks = [...selectedTemplate.blocks];
    blocks[index] = {
      ...blocks[index],
      enabled: !blocks[index].enabled
    };
    setSelectedTemplate({
      ...selectedTemplate,
      blocks
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Descriptions and details for templates card grid
  const templateMetadata = {
    MINUTE_BASED: {
      desc: "Ideal for services charged based on time spent. Customer pays per minute/hour.",
      examples: "Electrician, Plumber, Handyman, AC Repair",
      Icon: FiClock,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100"
    },
    PACKAGE_BASED: {
      desc: "Standard fixed packages with duration and pricing options. Flat rate checkout flow.",
      examples: "Home Deep Cleaning, Pest Control, Car Wash",
      Icon: FiPackage,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100"
    },
    IMAGE_CONSULTANT: {
      desc: "For consultation bookings where users upload photos first and get quote values later.",
      examples: "Skin Consultant, Tailoring Estimates, Civil repairs",
      Icon: FiCamera,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100"
    },
    MULTI_VISIT: {
      desc: "Visit-based workflows. Automatically offsets follow-ups on specific schedules.",
      examples: "Pest Control multi-visit, Physiotherapy packages",
      Icon: FiRefreshCw,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-100"
    },
    SERVICE_PAGE: {
      desc: "Aesthetic customizable package service page with full content blocks builder.",
      examples: "Premium Salon for Women, Full Body Checkup",
      Icon: FiFeather,
      color: "text-pink-600",
      bg: "bg-pink-50 border-pink-100"
    }
  };

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Template Zone</h2>
        <p className="text-xs text-gray-500 mt-1">Configure layout definitions or manage dynamic item catalogs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => {
          const meta = templateMetadata[t.code] || { desc: "Custom template", examples: "", Icon: FiLayout, color: "text-gray-600", bg: "bg-gray-50 border-gray-100" };
          // Count categories belonging to this template
          const catCount = categories.filter(c => c.templateId === t._id).length;
          const MetaIcon = meta.Icon;

          return (
            <div key={t._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <MetaIcon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{t.name}</h3>
                    <span className="text-[9px] font-black uppercase bg-gray-100 border border-gray-200 text-gray-500 tracking-wider px-2 py-0.5 rounded mt-1 inline-block">
                      {t.code.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 leading-relaxed min-h-[36px]">{meta.desc}</p>
                
                <div className="pt-3 flex justify-between items-center text-xs border-t border-gray-100">
                  <span className="text-gray-400 font-semibold">Categories Assigned:</span>
                  <span className="font-bold text-gray-700">{catCount} Categories</span>
                </div>
                
                {meta.examples && (
                  <div className="text-[10px] text-gray-400 pt-1">
                    <span className="font-bold text-gray-500">Examples:</span> {meta.examples}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/admin/user-categories/templates/${t.code}/manage`)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                >
                  <FiSliders className="w-3.5 h-3.5" />
                  <span>Manage Catalog</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTemplatesPage;
