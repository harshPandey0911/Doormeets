import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiInfo, FiChevronDown, 
  FiPlusCircle, FiCopy, FiMove, FiCheck, FiSettings, FiEye, 
  FiFolder, FiPlay, FiList, FiAlertTriangle, FiClock
} from 'react-icons/fi';
import api from '../../../../services/api';

const CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Hospitality', 'Custom'];

const DEFAULT_ROOM_LIBRARY = [
  { code: 'LIVING_ROOM', name: 'Living Room', type: 'Living' },
  { code: 'BEDROOM', name: 'Bedroom', type: 'Bed' },
  { code: 'MASTER_BEDROOM', name: 'Master Bedroom', type: 'Bed' },
  { code: 'GUEST_BEDROOM', name: 'Guest Bedroom', type: 'Bed' },
  { code: 'KITCHEN', name: 'Kitchen', type: 'Kitchen' },
  { code: 'DINING_ROOM', name: 'Dining Room', type: 'Living' },
  { code: 'BATHROOM', name: 'Bathroom', type: 'Toilet' },
  { code: 'POWDER_ROOM', name: 'Powder Room', type: 'Toilet' },
  { code: 'BALCONY', name: 'Balcony', type: 'Exterior' },
  { code: 'TERRACE', name: 'Terrace', type: 'Exterior' },
  { code: 'PASSAGE', name: 'Passage', type: 'Living' },
  { code: 'GARAGE', name: 'Garage', type: 'Exterior' }
];

const DEFAULT_FEATURE_LIBRARY = [
  { code: 'SUPPORTS_CEILING', name: 'Paint Ceiling', type: 'checkbox', formulaKey: 'RECTANGLE' },
  { code: 'SUPPORTS_DOORS', name: 'Paint Doors', type: 'checkbox', formulaKey: 'RECTANGLE' },
  { code: 'SUPPORTS_WINDOWS', name: 'Paint Windows', type: 'checkbox', formulaKey: 'RECTANGLE' },
  { code: 'SUPPORTS_GRILLS', name: 'Paint Grills', type: 'checkbox', formulaKey: 'RECTANGLE' },
  { code: 'SUPPORTS_TEXTURE', name: 'Texture Walls', type: 'checkbox', formulaKey: 'WALL' },
  { code: 'SUPPORTS_FEATURE_WALL', name: 'Feature Wall', type: 'checkbox', formulaKey: 'WALL' },
  { code: 'SUPPORTS_REPAIRS', name: 'Wall Repairs Check', type: 'checkbox', formulaKey: 'WALL' }
];

const PropertyLayoutsPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'builder', 'preview'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Search and Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form Editor State
  const [templateForm, setTemplateForm] = useState({
    name: '',
    code: '',
    description: '',
    category: 'Residential',
    displayOrder: 0,
    isDefault: false,
    defaultScope: 'BOTH',
    rooms: [],
    exteriorZones: []
  });
  
  // Custom Live Simulator State
  const [simRooms, setSimRooms] = useState([]);
  const [simOutputs, setSimOutputs] = useState({
    interiorArea: 0,
    exteriorArea: 0,
    ceilingArea: 0,
    balconyArea: 0,
    totalArea: 0
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/painting/templates');
      if (res.data?.success) {
        setTemplates(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates from server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setTemplateForm({
      name: '',
      code: '',
      description: '',
      category: 'Residential',
      displayOrder: templates.length + 1,
      isDefault: false,
      defaultScope: 'BOTH',
      rooms: [
        { name: 'Living Room', roomCode: 'LIVING_ROOM', required: true, features: DEFAULT_FEATURE_LIBRARY.map(f => ({ featureCode: f.code, enabled: true })) },
        { name: 'Bedroom', roomCode: 'BEDROOM', required: true, features: DEFAULT_FEATURE_LIBRARY.map(f => ({ featureCode: f.code, enabled: true })) },
        { name: 'Kitchen', roomCode: 'KITCHEN', required: false, features: DEFAULT_FEATURE_LIBRARY.map(f => ({ featureCode: f.code, enabled: true })) },
        { name: 'Bathroom', roomCode: 'BATHROOM', required: false, features: DEFAULT_FEATURE_LIBRARY.map(f => ({ featureCode: f.code, enabled: false })) }
      ],
      exteriorZones: [
        { name: 'Front Elevation', type: 'Elevation', supportsMeasurements: true }
      ]
    });
    setSelectedTemplate(null);
    setActiveTab('builder');
  };

  const handleEditTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setTemplateForm({
      ...tmpl,
      rooms: tmpl.rooms || [],
      exteriorZones: tmpl.exteriorZones || []
    });
    setActiveTab('builder');
  };

  const handleDuplicateTemplate = async (tmpl) => {
    try {
      const res = await api.post(`/admin/painting/templates/${tmpl._id}/duplicate`);
      if (res.data?.success) {
        toast.success('Template duplicated successfully');
        fetchTemplates();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (tmpl) => {
    if (!window.confirm(`Are you sure you want to soft delete the "${tmpl.name}" template?`)) return;
    try {
      const res = await api.delete(`/admin/painting/templates/${tmpl._id}`);
      if (res.data?.success) {
        toast.success('Template archived successfully');
        fetchTemplates();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete template');
    }
  };

  const handleAddRoomToForm = (roomLibItem) => {
    const newRoom = {
      name: roomLibItem.name,
      roomCode: roomLibItem.code,
      required: false,
      features: DEFAULT_FEATURE_LIBRARY.map(f => ({
        featureCode: f.code,
        enabled: true
      }))
    };
    setTemplateForm(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom]
    }));
    toast.success(`${roomLibItem.name} added to template`);
  };

  const handleRemoveRoomFromForm = (idx) => {
    setTemplateForm(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== idx)
    }));
  };

  const handleRoomFeatureToggle = (roomIdx, featCode) => {
    const updatedRooms = [...templateForm.rooms];
    const room = { ...updatedRooms[roomIdx] };
    room.features = room.features.map(f => 
      f.featureCode === featCode ? { ...f, enabled: !f.enabled } : f
    );
    updatedRooms[roomIdx] = room;
    setTemplateForm(prev => ({ ...prev, rooms: updatedRooms }));
  };

  const handleRoomRequiredToggle = (roomIdx) => {
    const updatedRooms = [...templateForm.rooms];
    updatedRooms[roomIdx].required = !updatedRooms[roomIdx].required;
    setTemplateForm(prev => ({ ...prev, rooms: updatedRooms }));
  };

  const handleAddExteriorZone = () => {
    const newZone = { name: 'New Wall Elevation', type: 'Elevation', supportsMeasurements: true };
    setTemplateForm(prev => ({
      ...prev,
      exteriorZones: [...prev.exteriorZones, newZone]
    }));
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.code.trim()) {
      toast.error('Template Name and Unique Code are required');
      return;
    }

    if (templateForm.rooms.length === 0) {
      toast.error('Please configure at least one room blueprint in the template');
      return;
    }

    try {
      const payload = { ...templateForm, changeSummary: 'Modified layout structural definition' };
      let res;
      if (selectedTemplate) {
        res = await api.put(`/admin/painting/templates/${selectedTemplate._id}`, payload);
      } else {
        res = await api.post('/admin/painting/templates', payload);
      }

      if (res.data?.success) {
        toast.success(selectedTemplate ? 'Template updated successfully' : 'Template created successfully');
        fetchTemplates();
        setActiveTab('list');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save property template');
    }
  };

  const handlePublishToggle = async (tmpl) => {
    try {
      const targetStatus = tmpl.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      const res = await api.put(`/admin/painting/templates/${tmpl._id}`, {
        status: targetStatus
      });
      if (res.data?.success) {
        toast.success(`Template status updated to ${targetStatus}`);
        fetchTemplates();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to change status');
    }
  };

  // Live Simulator Logic
  const handleOpenPreview = (tmpl) => {
    setSelectedTemplate(tmpl);
    const roomsCopy = (tmpl.rooms || []).map(r => ({
      name: r.name,
      roomCode: r.roomCode,
      features: r.features,
      length: 12,
      width: 10,
      height: 10,
      doorsCount: 1,
      windowsCount: 1,
      paintCeiling: true,
      paintWalls: true
    }));
    setSimRooms(roomsCopy);
    setActiveTab('preview');
  };

  useEffect(() => {
    if (activeTab !== 'preview') return;
    
    let totalInt = 0;
    let totalCeil = 0;
    let totalExt = 0;

    simRooms.forEach(room => {
      const l = Number(room.length) || 0;
      const w = Number(room.width) || 0;
      const h = Number(room.height) || 0;
      
      const perimeter = 2 * (l + w);
      let wallArea = perimeter * h;
      
      // Subtract door & window areas (estimations: Door 21 sqft, Window 12 sqft)
      const doorDeductions = (room.doorsCount || 0) * 21;
      const windowDeductions = (room.windowsCount || 0) * 12;
      wallArea = Math.max(0, wallArea - doorDeductions - windowDeductions);

      if (room.paintWalls) {
        if (room.roomCode === 'BALCONY') {
          totalExt += wallArea;
        } else {
          totalInt += wallArea;
        }
      }

      if (room.paintCeiling) {
        totalCeil += l * w;
      }
    });

    setSimOutputs({
      interiorArea: totalInt,
      exteriorArea: totalExt,
      ceilingArea: totalCeil,
      balconyArea: 0,
      totalArea: totalInt + totalCeil + totalExt
    });
  }, [simRooms, activeTab]);

  const handleSimValueChange = (idx, field, val) => {
    const updated = [...simRooms];
    updated[idx][field] = val;
    setSimRooms(updated);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-6">
      
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-gray-150 pb-5">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>📋</span> Property Template Configurator
          </h3>
          <p className="text-xs text-gray-500 mt-1 font-semibold">
            Define platform layout blueprints dynamically, eliminating hardcoded property configurations.
          </p>
        </div>
        
        {activeTab === 'list' ? (
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> Create Property Template
          </button>
        ) : (
          <button 
            onClick={() => setActiveTab('list')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <FiX className="w-4 h-4" /> Exit Editor
          </button>
        )}
      </div>

      {/* Main workspace routing */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="text"
              placeholder="Search blueprint name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-semibold text-gray-700 bg-gray-50/50"
            />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold bg-white text-gray-600 outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold bg-white text-gray-600 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          {/* Grid Layout of Template Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-400">Fetching configurations...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl">
              <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-bold text-sm">No templates configured matching the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(tmpl => (
                <div key={tmpl._id} className="p-5 border border-gray-150 rounded-2xl space-y-4 hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between bg-white relative">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-gray-100 rounded-md text-gray-500 font-sans">
                        {tmpl.category}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        tmpl.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        tmpl.status === 'REVIEW' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {tmpl.status}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-gray-800 tracking-tight mt-3">{tmpl.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 font-mono mt-0.5">Code: {tmpl.code} • Version: {tmpl.version}</p>
                    <p className="text-xs text-gray-400 mt-2 font-semibold line-clamp-2">{tmpl.description || 'No description provided.'}</p>
                    
                    <div className="flex gap-4 mt-4 select-none">
                      <div className="text-center bg-gray-50 p-2 rounded-xl flex-1 border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block text-[9px]">Rooms</span>
                        <span className="text-lg font-black text-gray-700">{tmpl.rooms?.length || 0}</span>
                      </div>
                      <div className="text-center bg-gray-50 p-2 rounded-xl flex-1 border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block text-[9px]">Exteriors</span>
                        <span className="text-lg font-black text-gray-700">{tmpl.exteriorZones?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex gap-2">
                    <button 
                      onClick={() => handleEditTemplate(tmpl)}
                      className="flex-1 py-2 px-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Edit Blueprint"
                    >
                      <FiEdit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => handleOpenPreview(tmpl)}
                      className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Simulate Wizard Preview"
                    >
                      <FiEye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button 
                      onClick={() => handlePublishToggle(tmpl)}
                      className={`px-3 py-2 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                        tmpl.status === 'PUBLISHED' 
                          ? 'border-red-200 text-red-600 hover:bg-red-50' 
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {tmpl.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      onClick={() => handleDuplicateTemplate(tmpl)}
                      className="p-2 border border-gray-200 text-gray-400 hover:text-gray-600 rounded-xl transition-all cursor-pointer"
                      title="Duplicate"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(tmpl)}
                      className="p-2 border border-red-100 text-red-400 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Archive"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor & Drag/Drop Room Builder UI Workspace */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Side Libraries (Room & Feature Definable lists) */}
          <div className="space-y-6">
            
            {/* Template Info Card */}
            <div className="p-5 border border-gray-150 rounded-2xl bg-gray-50/50 space-y-4">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2">Blueprint Config</h4>
              <div className="space-y-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-400 uppercase text-[9px]">Template Name</label>
                  <input 
                    type="text"
                    value={templateForm.name}
                    onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="border border-gray-200 rounded-lg p-2 bg-white text-gray-700 font-semibold outline-none focus:border-blue-500"
                    placeholder="e.g. 2 BHK Standard"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-400 uppercase text-[9px]">Unique Layout Code</label>
                  <input 
                    type="text"
                    value={templateForm.code}
                    onChange={e => setTemplateForm({ ...templateForm, code: e.target.value })}
                    className="border border-gray-200 rounded-lg p-2 bg-white text-gray-700 font-mono outline-none focus:border-blue-500"
                    placeholder="e.g. 2BHK"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-400 uppercase text-[9px]">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="border border-gray-200 rounded-lg p-2 bg-white text-gray-700 font-semibold outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Room Library Sidebar */}
            <div className="p-5 border border-gray-150 rounded-2xl bg-white space-y-4 shadow-sm">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2">Room Library Sidebar</h4>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Click a room below to append it to the Property Blueprint.</p>
              
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_ROOM_LIBRARY.map(room => (
                  <button
                    key={room.code}
                    onClick={() => handleAddRoomToForm(room)}
                    className="p-2.5 border border-gray-100 hover:border-blue-500 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 text-left rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm"
                  >
                    <span className="text-xs">➕</span>
                    <span className="truncate">{room.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Builder Center Workspace */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Rooms list builder workspace */}
            <div className="p-6 border border-gray-150 rounded-2xl bg-white space-y-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h4 className="text-base font-black text-gray-800 tracking-tight">Property Layout Designer</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Customize rooms, mandate validation parameters, and reorder rooms.</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  {templateForm.rooms?.length || 0} Blueprint Rooms
                </span>
              </div>

              {templateForm.rooms.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  <FiList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 font-bold text-sm">Design layout is empty. Click Room Library cards to build the structure.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templateForm.rooms.map((room, idx) => (
                    <div key={idx} className="p-4 border-2 border-gray-150 rounded-xl space-y-3 bg-gray-50/30 relative">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="cursor-grab p-1 hover:bg-gray-200 rounded text-gray-400">
                            <FiMove className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-gray-400 font-mono">#{idx+1}</span>
                          <span className="font-extrabold text-gray-800 text-sm">{room.name}</span>
                          <span className="text-[9px] font-bold text-gray-400 font-mono">({room.roomCode})</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 select-none cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={room.required}
                              onChange={() => handleRoomRequiredToggle(idx)}
                              className="rounded border-gray-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>Required</span>
                          </label>

                          <button 
                            onClick={() => handleRemoveRoomFromForm(idx)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded transition-all cursor-pointer"
                            title="Remove Room"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Feature support checklists */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                        {DEFAULT_FEATURE_LIBRARY.map(f => {
                          const isEnabled = room.features?.find(x => x.featureCode === f.code)?.enabled;
                          return (
                            <button
                              key={f.code}
                              type="button"
                              onClick={() => handleRoomFeatureToggle(idx, f.code)}
                              className={`p-1.5 border rounded-lg text-[10px] font-bold tracking-wider text-center transition-all cursor-pointer ${
                                isEnabled 
                                  ? 'border-blue-200 bg-blue-50 text-blue-600' 
                                  : 'border-gray-100 bg-white text-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              {f.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exterior configuration section */}
            <div className="p-6 border border-gray-150 rounded-2xl bg-white space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-base font-black text-gray-800 tracking-tight">Exterior Blueprint Layouts</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Configure external walls, boundaries, elevations, or garage zones.</p>
                </div>
                <button
                  onClick={handleAddExteriorZone}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-gray-200"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Add Wall Elevation
                </button>
              </div>

              {templateForm.exteriorZones.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No exterior blueprint zones configured.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templateForm.exteriorZones.map((zone, idx) => (
                    <div key={idx} className="p-3.5 border border-gray-150 rounded-xl flex justify-between items-center bg-gray-50/20">
                      <div>
                        <input 
                          type="text"
                          value={zone.name}
                          onChange={e => {
                            const updated = [...templateForm.exteriorZones];
                            updated[idx].name = e.target.value;
                            setTemplateForm(prev => ({ ...prev, exteriorZones: updated }));
                          }}
                          className="border-b border-dashed border-gray-300 font-extrabold text-gray-800 text-xs outline-none bg-transparent focus:border-blue-500"
                        />
                        <span className="text-[9px] font-bold text-gray-400 font-mono block mt-1">Type: {zone.type}</span>
                      </div>
                      <button
                        onClick={() => {
                          setTemplateForm(prev => ({
                            ...prev,
                            exteriorZones: prev.exteriorZones.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="p-1 hover:bg-red-50 text-red-500 rounded transition-all"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Buttons Panel */}
            <div className="p-4 bg-gray-900 rounded-2xl flex items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-relaxed">
                  Published changes will instantly apply to new consultation drafts.
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <FiSave className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator / Inspection Wizard Preview */}
      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Interactive Inspection Simulator forms */}
          <div className="lg:col-span-2 space-y-6 border border-gray-150 rounded-2xl p-6 bg-white shadow-sm">
            <div>
              <h4 className="text-base font-black text-gray-800 tracking-tight flex items-center gap-1.5">
                <FiPlay className="w-4 h-4 text-blue-600" /> Vendor Inspection Simulator
              </h4>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5 leading-relaxed">
                Mock entries below to evaluate gross and net surface computations derived from blueprint settings.
              </p>
            </div>

            <div className="space-y-4">
              {simRooms.map((room, idx) => (
                <div key={idx} className="p-5 border border-gray-150 rounded-2xl space-y-4 bg-gray-50/20">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Room: {room.name}</span>
                    <div className="flex gap-4">
                      {room.features?.find(f => f.featureCode === 'SUPPORTS_CEILING')?.enabled && (
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={room.paintCeiling}
                            onChange={() => handleSimValueChange(idx, 'paintCeiling', !room.paintCeiling)}
                            className="rounded text-blue-600 border-gray-200 w-3.5 h-3.5"
                          />
                          <span>Paint Ceiling</span>
                        </label>
                      )}
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={room.paintWalls}
                          onChange={() => handleSimValueChange(idx, 'paintWalls', !room.paintWalls)}
                          className="rounded text-blue-600 border-gray-200 w-3.5 h-3.5"
                        />
                        <span>Paint Walls</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-400 uppercase text-[9px]">Length (ft)</label>
                      <input 
                        type="number" 
                        value={room.length}
                        onChange={e => handleSimValueChange(idx, 'length', e.target.value)}
                        className="border border-gray-250 rounded-xl p-2 bg-white text-gray-800 text-center font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-400 uppercase text-[9px]">Width (ft)</label>
                      <input 
                        type="number" 
                        value={room.width}
                        onChange={e => handleSimValueChange(idx, 'width', e.target.value)}
                        className="border border-gray-250 rounded-xl p-2 bg-white text-gray-800 text-center font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-400 uppercase text-[9px]">Height (ft)</label>
                      <input 
                        type="number" 
                        value={room.height}
                        onChange={e => handleSimValueChange(idx, 'height', e.target.value)}
                        className="border border-gray-250 rounded-xl p-2 bg-white text-gray-800 text-center font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-400 uppercase text-[9px]">Doors Count</label>
                      <input 
                        type="number" 
                        value={room.doorsCount}
                        onChange={e => handleSimValueChange(idx, 'doorsCount', e.target.value)}
                        className="border border-gray-250 rounded-xl p-2 bg-white text-gray-800 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Live Summary Panel */}
          <div className="space-y-6">
            <div className="p-5 border border-gray-150 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 text-white space-y-4 shadow-lg sticky top-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block border-b border-white/10 pb-2">
                Live Simulator Totals
              </span>

              <div className="space-y-3.5 text-sm font-semibold">
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Interior Walls:</span>
                  <span className="font-extrabold text-base">{simOutputs.interiorArea.toFixed(2)} sq.ft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Ceiling Surface:</span>
                  <span className="font-extrabold text-base">{simOutputs.ceilingArea.toFixed(2)} sq.ft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Exterior/Balconies:</span>
                  <span className="font-extrabold text-base">{simOutputs.exteriorArea.toFixed(2)} sq.ft</span>
                </div>

                <div className="h-px bg-white/10 my-4" />

                <div>
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-0.5">Grand Paintable Area</span>
                  <span className="text-3xl font-black">{simOutputs.totalArea.toFixed(2)} sq.ft</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyLayoutsPage;
