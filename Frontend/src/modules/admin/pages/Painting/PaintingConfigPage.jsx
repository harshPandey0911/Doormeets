import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTag, FiSliders, FiLayout, FiDollarSign, FiMonitor } from 'react-icons/fi';
import PaintBrandsPage from './PaintBrandsPage';
import PaintProductsPage from './PaintProductsPage';
import PropertyLayoutsPage from './PropertyLayoutsPage';
import PaintingRatesSettings from '../UserCategories/pages/PaintingRatesSettings';
import PaintingPageWizard from './PaintingPageWizard';

const PaintingConfigPage = ({ defaultTab = 'brands' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const tabItems = [
    { id: 'brands', label: 'Paint Brands', icon: FiTag },
    { id: 'products', label: 'Paint Products', icon: FiSliders },
    { id: 'layouts', label: 'Property Layouts', icon: FiLayout },
    { id: 'rates', label: 'Labour Rates', icon: FiDollarSign },
    { id: 'page-builder', label: 'Page Builder', icon: FiMonitor }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl">
            <FiSliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-sans">Painting Configuration</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage master catalog layouts, pricing matrices, products, and brands.</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-1.5">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10 scale-[1.02]'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
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
        {activeTab === 'brands' && <PaintBrandsPage isNested={true} />}
        {activeTab === 'products' && <PaintProductsPage isNested={true} />}
        {activeTab === 'layouts' && <PropertyLayoutsPage />}
        {activeTab === 'rates' && <PaintingRatesSettings />}
        {activeTab === 'page-builder' && <PaintingPageWizard />}
      </motion.div>
    </div>
  );
};

export default PaintingConfigPage;
