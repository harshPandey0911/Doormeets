import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSliders, FiSave, FiX, FiChevronRight, FiChevronLeft, FiArrowUp, FiArrowDown, FiEye, FiEyeOff } from 'react-icons/fi';
import { MdTimer, MdInventory, MdPhotoCamera, MdRepeat, MdDragHandle } from 'react-icons/md';
import api from '../../../../../services/api';
import { toAssetUrl } from '../utils';

// ────────────────────────────────────────────────────────────────────
// SERVICE TYPE CONFIG
// ────────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  {
    key: 'minute_base',
    label: 'Minute Base Service',
    icon: MdTimer,
    color: 'blue',
    desc: 'Price per minute/hour (Electrician, Plumber)',
    example: '₹5/min, min 30 min'
  },
  {
    key: 'package_base',
    label: 'Package Base Service',
    icon: MdInventory,
    color: 'emerald',
    desc: 'Fixed package pricing (Cleaning, Salon)',
    example: '2BHK — ₹999, 3BHK — ₹1299'
  },
  {
    key: 'image_base',
    label: 'Image Base Service',
    icon: MdPhotoCamera,
    color: 'purple',
    desc: 'User uploads images, gets a quote',
    example: 'Repair estimate, Civil work'
  },
  {
    key: 'dynamic_base',
    label: 'Dynamic / Calculator Base',
    icon: FiSliders,
    color: 'orange',
    desc: 'Price calculated dynamically from user inputs (sq ft, rooms)',
    example: 'sq ft × ₹12'
  },
  {
    key: 'multi_visit',
    label: 'Multi-Visit Service',
    icon: MdRepeat,
    color: 'orange',
    desc: 'Multiple scheduled visits',
    example: 'Pest Control (2 visits), Physiotherapy'
  }
];

// ────────────────────────────────────────────────────────────────────
// PAGE BUILDER BLOCKS CONFIG — 15 blocks from handwritten notes
// ────────────────────────────────────────────────────────────────────
const BLOCK_PALETTE = [
  { key: 'image_gallery',      label: 'Image Gallery',            emoji: '🖼️',  color: '#6366f1' },
  { key: 'banner_slider',      label: 'Banner Image Slider',      emoji: '🎠',  color: '#8b5cf6' },
  { key: 'heading_text',       label: 'Heading & Text Block',     emoji: '📝',  color: '#3b82f6' },
  { key: 'whats_included',     label: "What's Included",          emoji: '✅',  color: '#10b981' },
  { key: 'please_note',        label: 'Please Note',              emoji: '⚠️',  color: '#f59e0b' },
  { key: 'warranty',           label: 'Warranty Block',           emoji: '🛡️',  color: '#0ea5e9' },
  { key: 'faq',                label: 'FAQ',                      emoji: '❓',  color: '#6366f1' },
  { key: 'reviews',            label: 'Reviews',                  emoji: '⭐',  color: '#f59e0b' },
  { key: 'process',            label: 'Process (with/without img)', emoji: '📋',  color: '#14b8a6' },
  { key: 'brands',             label: 'Brands',                   emoji: '🏷️',  color: '#8b5cf6' },
  { key: 'whats_not_included', label: "What's Not Included",      emoji: '❌',  color: '#ef4444' },
  { key: 'rate_card',          label: 'Rate Card Link',           emoji: '💰',  color: '#10b981' },
  { key: 'how_it_works',       label: 'How It Works',             emoji: '🔄',  color: '#3b82f6' },
  { key: 'comparison',         label: 'Comparison Link',          emoji: '⚖️',  color: '#6366f1' },
  { key: 'offer_image',        label: 'Offer Image',              emoji: '🎁',  color: '#ec4899' }
];

// Default data for each block type
const getDefaultBlockData = (blockType) => {
  switch (blockType) {
    case 'image_gallery':    return { images: [] };
    case 'banner_slider':    return { banners: [] };
    case 'heading_text':     return { heading: 'Section Title', text: 'Add your description here...' };
    case 'whats_included':   return { title: "What's Included", items: ['Professional cleaning staff', 'Eco-friendly supplies'] };
    case 'please_note':      return { title: 'Please Note', notes: ['Service requires 2 hours advance booking'] };
    case 'warranty':         return { title: 'Our Guarantee', duration: '30 Days', description: 'We guarantee quality service.' };
    case 'faq':              return { faqs: [{ question: 'How long does the service take?', answer: 'Typically 2-3 hours.' }] };
    case 'reviews':          return { showCount: 5, minRating: 4 };
    case 'process':          return { hasImages: false, title: 'How We Work', steps: [{ title: 'Book Online', desc: 'Select date & time' }, { title: 'Expert Arrives', desc: 'On-time arrival' }] };
    case 'brands':           return { title: 'Brands We Service', brandIds: [] };
    case 'whats_not_included': return { title: "Not Included", items: ['Outside area cleaning', 'Heavy furniture moving'] };
    case 'rate_card':        return { title: 'View Rate Card', linkUrl: '', linkLabel: 'Download PDF' };
    case 'how_it_works':     return { hasImages: false, title: 'How It Works', steps: [{ title: 'Step 1', desc: 'Book the service', imageUrl: '' }] };
    case 'comparison':       return { title: 'Compare Plans', linkUrl: '', linkLabel: 'View Comparison' };
    case 'offer_image':      return { imageUrl: '', altText: 'Special Offer', linkUrl: '' };
    default: return {};
  }
};

// ────────────────────────────────────────────────────────────────────
// TEMPLATES (same as before but with serviceType added)
// ────────────────────────────────────────────────────────────────────
const TEMPLATES = {
  home_cleaning: {
    serviceType: 'package_base',
    packages: [
      { title: '1 BHK Cleaning', description: 'Full home cleaning for 1 BHK', price: 699, originalPrice: 999, duration: '2-3 hours', isPopular: false, isActive: true },
      { title: '2 BHK Cleaning', description: 'Full home cleaning for 2 BHK', price: 999, originalPrice: 1399, duration: '3-4 hours', isPopular: true, isActive: true },
      { title: '3 BHK Cleaning', description: 'Full home cleaning for 3 BHK', price: 1399, originalPrice: 1899, duration: '4-5 hours', isPopular: false, isActive: true }
    ],
    fields: [
      { label: 'Number of Rooms', name: 'rooms', fieldType: 'dropdown', options: ['1', '2', '3', '4', '5+'], order: 1, isRequired: true },
      { label: 'Cleaning Method', name: 'cleaning_method', fieldType: 'dropdown', options: ['Standard Mop', 'Vacuum', 'Deep Clean Machine'], order: 2, isRequired: true },
      { label: 'Upload Room Images', name: 'room_images', fieldType: 'image', order: 3 }
    ],
    workflow: { workflowType: 'single_visit', totalVisits: 1, frequency: 'none' },
    steps: [],
    rules: [],
    pageBlocks: ['banner_slider', 'whats_included', 'process', 'faq', 'warranty', 'reviews']
  },
  pest_control: {
    serviceType: 'multi_visit',
    packages: [],
    fields: [
      { label: 'Property Type', name: 'property_type', fieldType: 'dropdown', options: ['1 BHK', '2 BHK', '3 BHK', 'Villa/Independent'], order: 1, isRequired: true },
      { label: 'Infestation Level', name: 'infestation', fieldType: 'radio', options: ['Low', 'Medium', 'High'], order: 2, isRequired: true }
    ],
    workflow: { workflowType: 'multi_visit', totalVisits: 2, frequency: 'none' },
    steps: [
      { title: 'Initial Pest Treatment', daysAfterPreviousVisit: 0, schedulingType: 'auto_offset' },
      { title: 'Follow-up & Prevention', daysAfterPreviousVisit: 15, schedulingType: 'auto_offset' }
    ],
    rules: [],
    pageBlocks: ['banner_slider', 'heading_text', 'whats_included', 'process', 'please_note', 'faq', 'warranty', 'reviews']
  },
  massage: {
    serviceType: 'minute_base',
    pricePerMinute: 10,
    minimumMinutes: 60,
    packages: [],
    fields: [
      { label: 'Duration (Minutes)', name: 'duration', fieldType: 'radio', options: ['60', '90', '120'], order: 1, isRequired: true },
      { label: 'Oil Type', name: 'oil_type', fieldType: 'dropdown', options: ['Aromatherapy', 'Coconut', 'Mustard'], order: 2, isRequired: false }
    ],
    workflow: { workflowType: 'single_visit', totalVisits: 1, frequency: 'none' },
    steps: [],
    rules: [],
    pageBlocks: ['banner_slider', 'whats_included', 'process', 'please_note', 'reviews']
  },
  amc: {
    serviceType: 'multi_visit',
    packages: [],
    fields: [
      { label: 'Appliance Brand/Model', name: 'appliance_brand', fieldType: 'text', order: 1, isRequired: true },
      { label: 'Appliance Serial Photo', name: 'serial_photo', fieldType: 'image', order: 2, isRequired: false }
    ],
    workflow: { workflowType: 'recurring', totalVisits: 12, frequency: 'monthly' },
    steps: [],
    rules: [],
    pageBlocks: ['banner_slider', 'heading_text', 'whats_included', 'please_note', 'faq', 'reviews']
  }
};

// Helper to edit array of items
const EditableList = ({ items = [], onChange: onListChange, placeholder = 'Add item...' }) => {
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none';
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} placeholder={placeholder} value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onListChange(n); }} />
          <button type="button" onClick={() => onListChange(items.filter((_, idx) => idx !== i))} className="text-red-500 font-bold px-2">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onListChange([...items, ''])} className="text-blue-600 text-xs font-bold hover:underline">+ Add Item</button>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// BLOCK EDITOR COMPONENTS (inline for all 15 types)
// ────────────────────────────────────────────────────────────────────
const BlockDataEditor = ({ block, onChange }) => {
  const { blockType, data } = block;

  const update = (key, val) => onChange({ ...data, [key]: val });

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none';
  const labelCls = 'block text-xs font-bold text-gray-600 mb-1';


  const [uploading, setUploading] = useState(false);

  const ImageUploadList = ({ items = [], onChange: onListChange, folderName = 'service_blocks' }) => {
    const handleFileUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setUploading(true);
        const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
        const url = await uploadToCloudinary(file, folderName);
        if (url) {
          onListChange([...items, url]);
        }
      } catch (err) {
        console.error('Upload failed', err);
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item && item.startsWith('http') ? (
              <img src={item} alt="" className="w-10 h-10 object-cover rounded-md border shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-md border shrink-0 flex items-center justify-center text-xs text-gray-400">URL</div>
            )}
            <input className={inputCls} value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onListChange(n); }} placeholder="https://..." />
            <button type="button" onClick={() => onListChange(items.filter((_, idx) => idx !== i))} className="text-red-500 font-bold px-2">✕</button>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onListChange([...items, ''])} className="text-blue-600 text-xs font-bold hover:underline">+ Add URL</button>
          <span className="text-gray-300">|</span>
          <label className={`text-purple-600 text-xs font-bold hover:underline cursor-pointer flex items-center gap-1 ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? 'Uploading...' : '+ Upload to Cloudinary'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>
    );
  };

  switch (blockType) {
    case 'image_gallery':
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Add image URLs for the gallery. You can upload images directly.</p>
          <ImageUploadList items={data.images || []} onChange={v => update('images', v)} folderName="service_gallery" />
        </div>
      );

    case 'banner_slider':
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Add banner image URLs for the slider.</p>
          <ImageUploadList items={data.banners || []} onChange={v => update('banners', v)} folderName="service_banners" />
        </div>
      );

    case 'heading_text':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Heading</label><input className={inputCls} value={data.heading || ''} onChange={e => update('heading', e.target.value)} /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={3} value={data.text || ''} onChange={e => update('text', e.target.value)} /></div>
        </div>
      );

    case 'whats_included':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title || "What's Included"} onChange={e => update('title', e.target.value)} /></div>
          <label className={labelCls}>Items</label>
          <EditableList items={data.items || []} onChange={v => update('items', v)} placeholder="e.g. Professional staff" />
        </div>
      );

    case 'please_note':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Title</label><input className={inputCls} value={data.title || 'Please Note'} onChange={e => update('title', e.target.value)} /></div>
          <label className={labelCls}>Notes</label>
          <EditableList items={data.notes || []} onChange={v => update('notes', v)} placeholder="e.g. Advance booking required" />
        </div>
      );

    case 'warranty':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Title</label><input className={inputCls} value={data.title || ''} onChange={e => update('title', e.target.value)} /></div>
          <div><label className={labelCls}>Duration</label><input className={inputCls} value={data.duration || ''} onChange={e => update('duration', e.target.value)} placeholder="e.g. 30 Days" /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={data.description || ''} onChange={e => update('description', e.target.value)} /></div>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-3">
          {(data.faqs || []).map((faq, i) => (
            <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2 bg-gray-50">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-indigo-600">Q{i + 1}</span>
                <button type="button" onClick={() => update('faqs', (data.faqs || []).filter((_, idx) => idx !== i))} className="text-red-500 text-xs font-bold">Remove</button>
              </div>
              <input className={inputCls} value={faq.question} placeholder="Question" onChange={e => { const f = [...(data.faqs || [])]; f[i] = { ...f[i], question: e.target.value }; update('faqs', f); }} />
              <textarea className={inputCls} rows={2} value={faq.answer} placeholder="Answer" onChange={e => { const f = [...(data.faqs || [])]; f[i] = { ...f[i], answer: e.target.value }; update('faqs', f); }} />
            </div>
          ))}
          <button type="button" onClick={() => update('faqs', [...(data.faqs || []), { question: '', answer: '' }])} className="text-blue-600 text-xs font-bold hover:underline">+ Add FAQ</button>
        </div>
      );

    case 'reviews':
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Reviews are pulled automatically from your booking data. Configure display settings:</p>
          <div><label className={labelCls}>Show Count</label><input type="number" className={inputCls} value={data.showCount || 5} onChange={e => update('showCount', parseInt(e.target.value) || 5)} /></div>
          <div><label className={labelCls}>Minimum Rating (1-5)</label><input type="number" min={1} max={5} className={inputCls} value={data.minRating || 4} onChange={e => update('minRating', parseInt(e.target.value) || 4)} /></div>
        </div>
      );

    case 'process':
    case 'how_it_works':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title || ''} onChange={e => update('title', e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={data.hasImages || false} onChange={e => update('hasImages', e.target.checked)} id={`hasImg-${blockType}`} />
            <label htmlFor={`hasImg-${blockType}`} className="text-xs font-semibold text-gray-700">Include Images in Steps</label>
          </div>
          {(data.steps || []).map((step, i) => (
            <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-2 bg-gray-50">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-indigo-600">Step {i + 1}</span>
                <button type="button" onClick={() => update('steps', (data.steps || []).filter((_, idx) => idx !== i))} className="text-red-500 text-xs">Remove</button>
              </div>
              <input className={inputCls} value={step.title} placeholder="Step title" onChange={e => { const s = [...(data.steps || [])]; s[i] = { ...s[i], title: e.target.value }; update('steps', s); }} />
              <input className={inputCls} value={step.desc} placeholder="Step description" onChange={e => { const s = [...(data.steps || [])]; s[i] = { ...s[i], desc: e.target.value }; update('steps', s); }} />
              {data.hasImages && <input className={inputCls} value={step.imageUrl || ''} placeholder="Step image URL" onChange={e => { const s = [...(data.steps || [])]; s[i] = { ...s[i], imageUrl: e.target.value }; update('steps', s); }} />}
            </div>
          ))}
          <button type="button" onClick={() => update('steps', [...(data.steps || []), { title: '', desc: '', imageUrl: '' }])} className="text-blue-600 text-xs font-bold hover:underline">+ Add Step</button>
        </div>
      );

    case 'brands':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title || 'Brands We Service'} onChange={e => update('title', e.target.value)} /></div>
          <p className="text-xs text-gray-500">Brands are linked from the Brands section. Enter Brand IDs to display:</p>
          <EditableList items={data.brandIds || []} onChange={v => update('brandIds', v)} placeholder="Brand ID..." />
        </div>
      );

    case 'whats_not_included':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title || "Not Included"} onChange={e => update('title', e.target.value)} /></div>
          <label className={labelCls}>Items</label>
          <EditableList items={data.items || []} onChange={v => update('items', v)} placeholder="e.g. Outside area cleaning" />
        </div>
      );

    case 'rate_card':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Button Label</label><input className={inputCls} value={data.linkLabel || 'View Rate Card'} onChange={e => update('linkLabel', e.target.value)} /></div>
          <div><label className={labelCls}>Link URL (PDF or page)</label><input className={inputCls} value={data.linkUrl || ''} placeholder="https://..." onChange={e => update('linkUrl', e.target.value)} /></div>
        </div>
      );

    case 'comparison':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title || 'Compare Plans'} onChange={e => update('title', e.target.value)} /></div>
          <div><label className={labelCls}>Button Label</label><input className={inputCls} value={data.linkLabel || 'View Comparison'} onChange={e => update('linkLabel', e.target.value)} /></div>
          <div><label className={labelCls}>Link URL</label><input className={inputCls} value={data.linkUrl || ''} placeholder="https://..." onChange={e => update('linkUrl', e.target.value)} /></div>
        </div>
      );

    case 'offer_image':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Offer Image URL</label><input className={inputCls} value={data.imageUrl || ''} placeholder="https://image-url..." onChange={e => update('imageUrl', e.target.value)} /></div>
          <div><label className={labelCls}>Alt Text</label><input className={inputCls} value={data.altText || ''} placeholder="Special Offer" onChange={e => update('altText', e.target.value)} /></div>
          <div><label className={labelCls}>Link on click (optional)</label><input className={inputCls} value={data.linkUrl || ''} placeholder="https://..." onChange={e => update('linkUrl', e.target.value)} /></div>
        </div>
      );

    default:
      return <p className="text-xs text-gray-400">No editor for this block type.</p>;
  }
};

// ────────────────────────────────────────────────────────────────────
// PAGE BUILDER COMPONENT
// ────────────────────────────────────────────────────────────────────
const ServicePageBuilder = ({ blocks, setBlocks }) => {
  const [expandedBlockId, setExpandedBlockId] = useState(null);

  const addBlock = (blockType) => {
    const newBlock = {
      _tempId: Date.now() + '_' + Math.random(),
      blockType,
      order: blocks.length,
      isVisible: true,
      data: getDefaultBlockData(blockType)
    };
    setBlocks([...blocks, newBlock]);
    setExpandedBlockId(newBlock._tempId);
  };

  const removeBlock = (idx) => setBlocks(blocks.filter((_, i) => i !== idx));

  const moveUp = (idx) => {
    if (idx === 0) return;
    const n = [...blocks];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    setBlocks(n.map((b, i) => ({ ...b, order: i })));
  };

  const moveDown = (idx) => {
    if (idx === blocks.length - 1) return;
    const n = [...blocks];
    [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
    setBlocks(n.map((b, i) => ({ ...b, order: i })));
  };

  const toggleVisibility = (idx) => {
    const n = [...blocks];
    n[idx] = { ...n[idx], isVisible: !n[idx].isVisible };
    setBlocks(n);
  };

  const updateBlockData = (idx, data) => {
    const n = [...blocks];
    n[idx] = { ...n[idx], data };
    setBlocks(n);
  };

  const getBlockInfo = (blockType) => BLOCK_PALETTE.find(b => b.key === blockType) || { label: blockType, emoji: '📦', color: '#888' };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT: Block Palette */}
      <div className="w-full lg:w-56 shrink-0">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 sticky top-0">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">Available Blocks</p>
          {BLOCK_PALETTE.map(block => (
            <button
              key={block.key}
              type="button"
              onClick={() => addBlock(block.key)}
              className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm"
            >
              <span className="text-base">{block.emoji}</span>
              <span className="text-gray-700">{block.label}</span>
              <span className="ml-auto text-gray-400 font-black text-base">+</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Canvas */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Service Page Canvas</p>
          <span className="text-xs text-gray-400">{blocks.length} blocks added</span>
        </div>

        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
            <span className="text-4xl mb-3">🧱</span>
            <p className="text-sm font-semibold">Click blocks on the left to add them here</p>
            <p className="text-xs mt-1">You can reorder and edit each block</p>
          </div>
        )}

        {blocks.map((block, idx) => {
          const info = getBlockInfo(block.blockType);
          const isExpanded = expandedBlockId === (block._tempId || block._id || idx);
          return (
            <div
              key={block._tempId || block._id || idx}
              className={`border rounded-xl overflow-hidden transition-all ${block.isVisible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}
            >
              {/* Block Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedBlockId(isExpanded ? null : (block._tempId || block._id || idx))}
              >
                <MdDragHandle className="text-gray-300 text-xl shrink-0" />
                <span className="text-base">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{info.label}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={e => { e.stopPropagation(); moveUp(idx); }} disabled={idx === 0} className="p-1 rounded text-gray-400 hover:text-blue-600 disabled:opacity-30"><FiArrowUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); moveDown(idx); }} disabled={idx === blocks.length - 1} className="p-1 rounded text-gray-400 hover:text-blue-600 disabled:opacity-30"><FiArrowDown className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); toggleVisibility(idx); }} className={`p-1 rounded ${block.isVisible ? 'text-gray-400 hover:text-gray-600' : 'text-orange-400 hover:text-orange-600'}`}>{block.isVisible ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}</button>
                  <button type="button" onClick={e => { e.stopPropagation(); removeBlock(idx); }} className="p-1 rounded text-gray-300 hover:text-red-500"><FiX className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {/* Block Body */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/60">
                  <BlockDataEditor
                    block={block}
                    onChange={(newData) => updateBlockData(idx, newData)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// MAIN SERVICES PAGE COMPONENT
// ────────────────────────────────────────────────────────────────────
const ServicesPage = ({ selectedCity, cities = [], filterTemplateId }) => {
  const [services, setServices] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [activeStep, setActiveStep] = useState(0); // 0-4
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    title: '',
    description: '',
    iconUrl: '',
    status: 'active',
    templateType: '',
    allCities: true,
    cityIds: []
  });

  // Service type state
  const [serviceType, setServiceType] = useState('package_base');
  // Minute base
  const [pricePerMinute, setPricePerMinute] = useState('');
  const [minimumMinutes, setMinimumMinutes] = useState(30);
  // Package base
  const [packages, setPackages] = useState([]);
  // Image base
  const [quoteInstructions, setQuoteInstructions] = useState('');
  const [maxImageUploads, setMaxImageUploads] = useState(5);
  // Variants (optional add-ons)
  const [variants, setVariants] = useState([]);

  // Builder States
  const [features, setFeatures] = useState([]);
  const [steps, setSteps] = useState([]);
  const [builderFields, setBuilderFields] = useState([]);
  const [builderWorkflow, setBuilderWorkflow] = useState({ workflowType: 'single_visit', totalVisits: 1, frequency: 'none' });
  const [builderWorkflowSteps, setBuilderWorkflowSteps] = useState([]);
  const [builderRules, setBuilderRules] = useState([]);
  const [pageBlocks, setPageBlocks] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [srvRes, subRes, catRes, tempRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/subcategories'),
        api.get('/admin/categories'),
        api.get('/admin/category-templates').catch(() => ({ data: { templates: [] } }))
      ]);
      setServices(srvRes.data.services || []);
      setSubCategories(subRes.data.data || subRes.data.subCategories || []);
      setCategories(catRes.data.categories || catRes.data.data || []);
      setTemplates(tempRes.data?.templates || tempRes.data?.data || []);
    } catch (error) { console.error('Error fetching data:', error); }
    setLoading(false);
  };

  const resetBuilderState = () => {
    setServiceType('package_base');
    setPricePerMinute('');
    setMinimumMinutes(30);
    setPackages([]);
    setQuoteInstructions('');
    setMaxImageUploads(5);
    setFeatures([]);
    setSteps([]);
    setBuilderFields([]);
    setBuilderWorkflow({ workflowType: 'single_visit', totalVisits: 1, frequency: 'none' });
    setBuilderWorkflowSteps([]);
    setBuilderRules([]);
    setPageBlocks([]);
    setVariants([]);
  };

  const handleCategoryChange = (catId) => {
    setFormData(prev => ({ ...prev, categoryId: catId, subCategoryId: '' }));
    setActiveStep(0);
    if (!catId) {
      resetBuilderState();
      return;
    }

    const selectedCat = categories.find(c => (c.id || c._id) === catId);
    if (selectedCat) {
      const template = templates.find(t => (t._id || t.id) === selectedCat.templateId);
      if (template) {
        let derivedType = 'package_base';
        if (template.code === 'MINUTE_BASED') derivedType = 'minute_base';
        else if (template.code === 'PACKAGE_BASED' || template.code === 'SERVICE_PAGE') derivedType = 'package_base';
        else if (template.code === 'IMAGE_CONSULTANT') derivedType = 'image_base';
        else if (template.code === 'MULTI_VISIT') derivedType = 'multi_visit';

        setServiceType(derivedType);

        if (template.code === 'SERVICE_PAGE' && template.blocks) {
          setPageBlocks(template.blocks.map((b, i) => ({
            _tempId: Date.now() + '_' + i,
            blockType: b.blockType || b.id,
            order: i,
            isVisible: b.enabled !== false,
            data: b.data || getDefaultBlockData(b.blockType || b.id || '')
          })));
        } else {
          setPageBlocks([]);
        }
      } else {
        setServiceType('package_base');
        setPageBlocks([]);
      }
    }
  };

  const handleOpenWizard = async (srv = null) => {
    setCurrentService(srv);
    setActiveStep(0);
    if (srv) {
      setFormData({
        categoryId: srv.categoryId?._id || srv.categoryId || '',
        subCategoryId: srv.subCategoryId?._id || srv.subCategoryId || '',
        title: srv.title,
        description: srv.description || '',
        iconUrl: srv.iconUrl || '',
        status: srv.status,
        templateType: '',
        allCities: !srv.cityIds || srv.cityIds.length === 0,
        cityIds: srv.cityIds ? srv.cityIds.map(id => (typeof id === 'object' ? (id._id || id.id || String(id)) : String(id))) : []
      });
      setServiceType(srv.serviceType || 'package_base');
      setPricePerMinute(srv.pricePerMinute || '');
      setMinimumMinutes(srv.minimumMinutes || 30);
      setPackages(srv.packages || []);
      setVariants(srv.variants || []);
      setFeatures(srv.features || []);
      setSteps(srv.steps || []);
      setQuoteInstructions(srv.quoteInstructions || '');
      setMaxImageUploads(srv.maxImageUploads || 5);
      try {
        const [fieldsRes, workflowRes, pricingRes, blocksRes] = await Promise.all([
          api.get(`/admin/services/${srv._id}/fields`),
          api.get(`/admin/services/${srv._id}/workflow`),
          api.get(`/admin/services/${srv._id}/pricing`),
          api.get(`/admin/services/${srv._id}/page-blocks`)
        ]);
        setBuilderFields((fieldsRes.data.fields || []).map(f => ({ ...f, options: Array.isArray(f.options) ? f.options.join(', ') : (f.options || '') })));
        if (workflowRes.data.workflow) {
          setBuilderWorkflow({ workflowType: workflowRes.data.workflow.workflowType, totalVisits: workflowRes.data.workflow.totalVisits, frequency: workflowRes.data.workflow.frequency });
          setBuilderWorkflowSteps(workflowRes.data.steps || []);
        } else {
          setBuilderWorkflow({ workflowType: 'single_visit', totalVisits: 1, frequency: 'none' });
          setBuilderWorkflowSteps([]);
        }
        setBuilderRules(pricingRes.data.rules || []);
        setPageBlocks((blocksRes.data.blocks || []).map((b, i) => ({ ...b, _tempId: b._id || (Date.now() + '_' + i) })));
      } catch (err) { console.error('Failed to load sub-details:', err); }
    } else {
      const defaultCityIds = selectedCity ? [selectedCity] : [];
      const defaultCatId = filterTemplateId
        ? (categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?._id || categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?.id || '')
        : '';
      setFormData({ categoryId: defaultCatId, subCategoryId: '', title: '', description: '', iconUrl: '', status: 'active', templateType: '', allCities: !selectedCity, cityIds: defaultCityIds });
      resetBuilderState();
      if (defaultCatId) {
        handleCategoryChange(defaultCatId);
      }
    }
    setIsModalOpen(true);
  };

  const handleTemplateChange = (template) => {
    setFormData(prev => ({ ...prev, templateType: template }));
    if (template && TEMPLATES[template]) {
      const t = TEMPLATES[template];
      setServiceType(t.serviceType || 'package_base');
      setPricePerMinute(t.pricePerMinute || '');
      setMinimumMinutes(t.minimumMinutes || 30);
      setPackages(t.packages || []);
      setBuilderFields((t.fields || []).map(f => ({ ...f, options: Array.isArray(f.options) ? f.options.join(', ') : (f.options || '') })));
      setBuilderWorkflow(t.workflow);
      setBuilderWorkflowSteps(t.steps);
      setBuilderRules(t.rules);
      // Auto-add page blocks from template
      if (t.pageBlocks) {
        setPageBlocks(t.pageBlocks.map((blockType, i) => ({
          _tempId: Date.now() + '_' + i,
          blockType,
          order: i,
          isVisible: true,
          data: getDefaultBlockData(blockType)
        })));
      }
    } else {
      resetBuilderState();
    }
  };

  const handleSubmit = async () => {
    if (!formData.categoryId) { alert('Please select a Category'); setActiveStep(0); return; }
    if (!formData.title?.trim()) { alert('Please enter a Service Title'); setActiveStep(0); return; }

    const finalCityIds = formData.allCities ? [] : formData.cityIds;
    const payload = {
      ...formData,
      cityIds: finalCityIds,
      serviceType,
      pricePerMinute: serviceType === 'minute_base' ? pricePerMinute : null,
      minimumMinutes: serviceType === 'minute_base' ? minimumMinutes : 30,
      packages: serviceType === 'package_base' ? packages : [],
      quoteInstructions: serviceType === 'image_base' ? quoteInstructions : null,
      maxImageUploads: serviceType === 'image_base' ? maxImageUploads : 5,
      variants,
      features,
      steps,
      fields: builderFields.map(f => ({ ...f, options: typeof f.options === 'string' ? f.options.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(f.options) ? f.options : []) })),
      workflow: { ...builderWorkflow, steps: builderWorkflowSteps },
      rules: builderRules,
      pageBlocks: pageBlocks.map((b, i) => ({ blockType: b.blockType, order: i, isVisible: b.isVisible, data: b.data }))
    };

    try {
      if (currentService) {
        await api.put(`/admin/services/${currentService._id}`, payload);
        // Also save page blocks separately
        await api.put(`/admin/services/${currentService._id}/page-blocks`, {
          blocks: pageBlocks.map((b, i) => ({ blockType: b.blockType, order: i, isVisible: b.isVisible, data: b.data }))
        });
        alert('Service updated successfully!');
      } else {
        await api.post('/admin/services', payload);
        alert('Service created successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        alert(`Validation failed:\n${error.response.data.errors.map(e => e.msg).join('\n')}`);
      } else {
        alert(error.response?.data?.message || 'Error saving service');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try { await api.delete(`/admin/services/${id}`); fetchData(); }
      catch { alert('Error deleting service'); }
    }
  };

  // ── Field builder ops
  const addField = () => setBuilderFields([...builderFields, { label: 'New Field', name: 'new_field_' + Date.now(), fieldType: 'text', isRequired: false, options: '', defaultValue: '', order: builderFields.length + 1 }]);
  const updateField = (i, k, v) => { const u = [...builderFields]; u[i][k] = v; setBuilderFields(u); };
  const removeField = (i) => setBuilderFields(builderFields.filter((_, idx) => idx !== i));

  // ── Workflow ops
  const addWorkflowStep = () => {
    const nextIdx = builderWorkflowSteps.length;
    setBuilderWorkflowSteps([...builderWorkflowSteps, {
      title: `Visit #${nextIdx + 1}`,
      daysAfterPreviousVisit: nextIdx === 0 ? 0 : 15,
      schedulingType: 'auto_offset'
    }]);
    setBuilderWorkflow(prev => ({ ...prev, totalVisits: nextIdx + 1 }));
  };
  const updateWorkflowStep = (i, k, v) => { const u = [...builderWorkflowSteps]; u[i][k] = v; setBuilderWorkflowSteps(u); };
  const removeWorkflowStep = (i) => {
    const nextSteps = builderWorkflowSteps.filter((_, idx) => idx !== i);
    setBuilderWorkflowSteps(nextSteps);
    setBuilderWorkflow(prev => ({ ...prev, totalVisits: nextSteps.length }));
  };


  // ── Pricing ops
  const addPricingRule = (type = 'conditional') => {
    if (type === 'formula') { if (builderRules.some(r => r.ruleType === 'formula')) { alert('Only one formula rule allowed'); return; } setBuilderRules([...builderRules, { ruleType: 'formula', formulaString: 'basePrice + 100' }]); }
    else setBuilderRules([...builderRules, { ruleType: 'conditional', fieldName: '', operator: 'equals', value: '', priceModifierType: 'add', modifierValue: 0 }]);
  };
  const updatePricingRule = (i, k, v) => { const u = [...builderRules]; u[i][k] = v; setBuilderRules(u); };
  const removePricingRule = (i) => setBuilderRules(builderRules.filter((_, idx) => idx !== i));
  // ── Package ops
  const addPackage = () => setPackages([...packages, { title: 'New Package', description: '', price: 0, originalPrice: null, duration: '', isPopular: false, isActive: true }]);
  const updatePackage = (i, k, v) => { const u = [...packages]; u[i][k] = v; setPackages(u); };
  const removePackage = (i) => setPackages(packages.filter((_, idx) => idx !== i));

  // ── Variant ops
  const addVariant = () => setVariants([...variants, { title: '', extraPrice: 0, description: '', isActive: true }]);
  const updateVariant = (i, k, v) => { const u = [...variants]; u[i][k] = v; setVariants(u); };
  const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i));

  const getSteps = () => {
    const selectedCat = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
    const template = selectedCat ? templates.find(t => (t._id || t.id) === selectedCat.templateId) : null;

    const baseSteps = [
      { title: 'Basic Info', key: 'basic' },
      { title: 'Configuration', key: 'type' }
    ];

    if (template && template.code === 'SERVICE_PAGE') {
      baseSteps.push({ title: 'Page Builder', key: 'page' });
    }

    baseSteps.push({ title: 'Workflow & Pricing', key: 'workflow' });

    return baseSteps.map((step, idx) => ({
      ...step,
      title: `${idx + 1}. ${step.title}`
    }));
  };

  const filteredServices = selectedCity
    ? services.filter(srv => {
        const srvCityIds = srv.cityIds || [];
        if (srvCityIds.length === 0) return false; // Strict match: hide "All Cities" if a specific city is selected
        const isAllowed = srvCityIds.some(id => String(id) === String(selectedCity) || (id._id && String(id._id) === String(selectedCity)));
        if (!isAllowed) return false;
        
        const catId = srv.categoryId?._id || srv.categoryId;
        const category = categories.find(c => (c.id === catId || c._id === catId));
        if (!category) return true;
        const catCityIds = category.cityIds || [];
        if (catCityIds.length === 0) return false; // Strict match: hide if parent category is "All Cities"
        return catCityIds.some(id => String(id) === String(selectedCity) || (id._id && String(id._id) === String(selectedCity)));
      })
    : services;

  const finalFilteredServices = filterTemplateId
    ? filteredServices.filter(srv => {
        const catId = srv.categoryId?._id || srv.categoryId;
        const category = categories.find(c => (c.id === catId || c._id === catId));
        return category && String(category.templateId || category.template) === String(filterTemplateId);
      })
    : filteredServices;

  const filteredCategoriesForForm = filterTemplateId
    ? categories.filter(c => String(c.templateId || c.template) === String(filterTemplateId))
    : categories;

  const typeColors = { minute_base: 'bg-blue-100 text-blue-700', package_base: 'bg-emerald-100 text-emerald-700', image_base: 'bg-purple-100 text-purple-700', multi_visit: 'bg-orange-100 text-orange-700' };
  const typeLabels = { minute_base: '⏱ Minute Base', package_base: '📦 Package', image_base: '📸 Image Quote', multi_visit: '🔄 Multi-Visit' };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Services</h2>
          <p className="text-sm text-gray-500">Manage services — packages, pricing and page design</p>
        </div>
        <button onClick={() => handleOpenWizard(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 font-semibold transition-colors">
          <FiPlus /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                <th className="p-4 font-semibold text-gray-600 text-sm">Title</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Category &gt; SubCategory</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Type</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {finalFilteredServices.map((srv) => (
                <tr key={srv._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{srv.title}</td>
                  <td className="p-4 text-gray-600 text-sm">{srv.categoryId?.title || 'Unknown'} &gt; {srv.subCategoryId?.title || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${typeColors[srv.serviceType] || 'bg-gray-100 text-gray-600'}`}>
                      {typeLabels[srv.serviceType] || '📦 Package'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${srv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{srv.status}</span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenWizard(srv)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-1 font-bold text-xs"><FiSliders /> Configure</button>
                    <button onClick={() => handleDelete(srv._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
              {finalFilteredServices.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No services found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── UNIFIED WIZARD MODAL ── */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden my-8">

            {/* Modal Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-gray-800">{currentService ? 'Edit Service Configuration' : 'Create New Service'}</h3>
                <p className="text-sm text-gray-500">Service builder with designable page</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col md:flex-row" style={{ height: '600px' }}>
              {/* Sidebar */}
              <div className="w-full md:w-52 bg-gray-50 border-r border-gray-150 p-4 space-y-1 shrink-0">
                {getSteps().map((step, idx) => (
                  <button key={idx} onClick={() => setActiveStep(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-between ${activeStep === idx ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <span>{step.title}</span>
                    {idx < activeStep && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>
                ))}
              </div>

              {/* Step Content */}
              {(() => {
                const wizardSteps = getSteps();
                const safeActiveStep = activeStep >= wizardSteps.length ? wizardSteps.length - 1 : activeStep;
                const currentStepKey = wizardSteps[safeActiveStep]?.key;

                return (
                  <div className="flex-1 p-6 overflow-y-auto bg-white">

                    {/* ── STEP 1: BASIC INFO ── */}
                    {currentStepKey === 'basic' && (
                      <div className="space-y-4">
                        <h4 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Step 1: Service Basics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400"
                              value={formData.categoryId} onChange={e => handleCategoryChange(e.target.value)}>
                              <option value="">Select Category</option>
                              {filteredCategoriesForForm.map(cat => (<option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>))}
                            </select>
                            {(() => {
                              const selectedCat = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                              if (!selectedCat) return null;
                              const template = templates.find(t => (t._id || t.id) === selectedCat.templateId);
                              return (
                                <div className="mt-1.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold">
                                    📋 Inherited Template: <span className="underline">{template ? template.name : 'No template configured'}</span>
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                      {(() => {
                        const selectedCat = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                        if (!selectedCat || selectedCat.hasSubCategory === false) return null;
                        return (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">SubCategory</label>
                            <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400"
                                value={formData.subCategoryId} onChange={e => setFormData({ ...formData, subCategoryId: e.target.value })}>
                              <option value="">Select SubCategory</option>
                              {subCategories.filter(sub => !formData.categoryId || sub.categoryId?._id === formData.categoryId || sub.categoryId === formData.categoryId).map(sub => (
                                <option key={sub._id} value={sub._id}>{sub.title}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Service Title *</label>
                      <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Room Deep Cleaning" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                      <textarea className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Explain this service..." />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Service Image</label>
                      <div className="flex items-center gap-4 border border-dashed border-gray-200 p-4 rounded-xl bg-gray-50/50">
                        {formData.iconUrl ? (
                          <div className="relative w-20 h-20 bg-white border border-gray-150 rounded-lg overflow-hidden shrink-0 shadow-sm group">
                            <img src={formData.iconUrl.startsWith('http') ? formData.iconUrl : toAssetUrl(formData.iconUrl)} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, iconUrl: '' })}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-white border-2 border-dashed border-gray-200 rounded-lg shrink-0 flex items-center justify-center text-gray-400 text-xs font-semibold">
                            No Image
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              id="service-image-file"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setUploadingImage(true);
                                  const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
                                  const url = await uploadToCloudinary(file, 'services');
                                  if (url) {
                                    setFormData(prev => ({ ...prev, iconUrl: url }));
                                  }
                                } catch (err) {
                                  alert('Upload failed: ' + err.message);
                                } finally {
                                  setUploadingImage(false);
                                }
                              }}
                            />
                            <label
                              htmlFor="service-image-file"
                              className={`px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              {uploadingImage ? 'Uploading...' : 'Upload Image'}
                            </label>
                            <span className="text-xs text-gray-455 font-semibold">Or enter URL directly:</span>
                          </div>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-400"
                            value={formData.iconUrl}
                            onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400"
                          value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">What you get (Features)</label>
                        <p className="text-xs text-gray-500 mb-2">List the items included in this service</p>
                        <EditableList items={features} onChange={setFeatures} placeholder="e.g. 30 Mins full body massage" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">How it works (Process Steps)</label>
                        <p className="text-xs text-gray-500 mb-2">List the steps involved in service delivery</p>
                        <EditableList items={steps} onChange={setSteps} placeholder="e.g. Therapist arrives with products" />
                      </div>
                    </div>

                    {/* City Availability */}
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <label className="block text-base font-bold text-gray-900 mb-3">🏙️ City Availability</label>
                      <div className="flex items-center gap-3 mb-3">
                        <input id="allCitiesToggle" type="checkbox" checked={formData.allCities}
                          onChange={e => setFormData(p => ({ ...p, allCities: e.target.checked, cityIds: e.target.checked ? [] : p.cityIds }))}
                          className="h-4 w-4 accent-green-600" />
                        <label htmlFor="allCitiesToggle" className="text-sm font-semibold text-gray-800">Available in All Cities</label>
                      </div>
                      {!formData.allCities && (
                        <div className="flex flex-wrap gap-2">
                          {cities.map(city => {
                            const cid = city._id || city.id;
                            const isSelected = formData.cityIds.includes(cid);
                            return (
                              <button key={cid} type="button"
                                onClick={() => setFormData(p => ({ ...p, cityIds: isSelected ? p.cityIds.filter(id => id !== cid) : [...p.cityIds, cid] }))}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isSelected ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                {city.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: SERVICE CONFIGURATION ── */}
                {currentStepKey === 'type' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Step 2: Service Configuration</h4>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="text-2xl">⚙️</div>
                      <div>
                        <h5 className="font-bold text-blue-900 text-sm">Inherited Service Configuration</h5>
                        <p className="text-xs text-blue-700 mt-0.5">
                          This service is configured as <span className="font-extrabold uppercase">{serviceType.replace(/_/g, ' ')}</span>, automatically inherited from its category template.
                        </p>
                      </div>
                    </div>

                    {/* All pricing is managed in Pricing Matrix tab */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                      <div className="text-2xl mt-0.5">💰</div>
                      <div>
                        <h5 className="font-bold text-green-800 text-sm">Configure Pricing in the Pricing Matrix tab</h5>
                        <p className="text-xs text-green-700 mt-1">
                          All pricing for this service (price per minute, fixed rates, GST, commissions) is managed from the <strong>Pricing Matrix</strong> tab — a single consistent source of truth for all prices across templates.
                        </p>
                        <p className="text-xs text-green-600 mt-1.5 font-semibold">
                          After saving this service → go to Pricing Matrix → Add Pricing Config
                        </p>
                      </div>
                    </div>

                    {/* ── SERVICE VARIANTS ── */}
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-sm font-bold text-gray-800">🎨 Service Variants (Optional Add-ons)</h5>
                          <p className="text-xs text-gray-500 mt-0.5">Add optional upgrades shown on the service page — e.g. Male Therapist, Aromatherapy Oil, Premium Oil.</p>
                        </div>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 flex items-center gap-1"
                        >
                          <FiPlus /> Add Variant
                        </button>
                      </div>

                      {variants.length === 0 && (
                        <div className="text-center py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                          No variants yet. Click "Add Variant" to create one.
                        </div>
                      )}

                      {variants.map((variant, idx) => (
                        <div key={idx} className="p-3 border border-violet-100 rounded-xl bg-violet-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-violet-700">Variant #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.isActive !== false}
                                  onChange={e => updateVariant(idx, 'isActive', e.target.checked)}
                                  className="accent-violet-600"
                                />
                                Active
                              </label>
                              <button
                                type="button"
                                onClick={() => removeVariant(idx)}
                                className="text-red-500 text-xs font-bold hover:text-red-700"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">Variant Title *</label>
                              <input
                                type="text"
                                placeholder="e.g. Male Therapist"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400"
                                value={variant.title}
                                onChange={e => updateVariant(idx, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">Extra Price (₹)</label>
                              <input
                                type="number"
                                min={0}
                                placeholder="0"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400"
                                value={variant.extraPrice}
                                onChange={e => updateVariant(idx, 'extraPrice', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Description (optional)</label>
                            <input
                              type="text"
                              placeholder="Short description shown to the user"
                              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400"
                              value={variant.description || ''}
                              onChange={e => updateVariant(idx, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}





                {/* ── STEP 4: PAGE BUILDER ── */}
                {currentStepKey === 'page' && (
                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <h4 className="text-base font-bold text-gray-800">Step 4: Design Your Service Page</h4>
                      <p className="text-xs text-gray-500 mt-1">Add, edit and reorder the 15 content blocks that appear on your service page in the user app.</p>
                    </div>
                    <ServicePageBuilder blocks={pageBlocks} setBlocks={setPageBlocks} />
                  </div>
                )}

                {/* ── STEP 5: WORKFLOW & PRICING ── */}
                {currentStepKey === 'workflow' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Step 5: Scheduling Workflow</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div><label className="block text-xs font-semibold text-gray-700 mb-1">Workflow Type</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                          value={builderWorkflow.workflowType} onChange={e => {
                            const val = e.target.value;
                            setBuilderWorkflow(prev => ({ ...prev, workflowType: val }));
                            if (val === 'multi_visit' && builderWorkflowSteps.length === 0) {
                              const count = builderWorkflow.totalVisits || 2;
                              const initialSteps = [];
                              for (let i = 0; i < count; i++) {
                                initialSteps.push({
                                  title: `Visit #${i + 1}`,
                                  daysAfterPreviousVisit: i === 0 ? 0 : 15,
                                  schedulingType: 'auto_offset'
                                });
                              }
                              setBuilderWorkflowSteps(initialSteps);
                            }
                          }}>
                          <option value="single_visit">Single Visit</option>
                          <option value="multi_visit">Multi-Visit</option>
                          <option value="recurring">Recurring (AMC)</option>
                        </select></div>
                      {builderWorkflow.workflowType !== 'single_visit' && (
                        <div><label className="block text-xs font-semibold text-gray-700 mb-1">Total Visits</label>
                          <input type="number" min={1} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                            value={builderWorkflow.totalVisits} onChange={e => {
                              const count = parseInt(e.target.value) || 1;
                              setBuilderWorkflow(prev => ({ ...prev, totalVisits: count }));
                              if (builderWorkflow.workflowType === 'multi_visit') {
                                setBuilderWorkflowSteps(prev => {
                                  const currentSteps = [...prev];
                                  if (currentSteps.length < count) {
                                    for (let i = currentSteps.length; i < count; i++) {
                                      currentSteps.push({
                                        title: `Visit #${i + 1}`,
                                        daysAfterPreviousVisit: i === 0 ? 0 : 15,
                                        schedulingType: 'auto_offset'
                                      });
                                    }
                                  } else if (currentSteps.length > count) {
                                    return currentSteps.slice(0, count);
                                  }
                                  return currentSteps;
                                });
                              }
                            }} /></div>
                      )}
                      {builderWorkflow.workflowType === 'recurring' && (
                        <div><label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                          <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                            value={builderWorkflow.frequency} onChange={e => setBuilderWorkflow({ ...builderWorkflow, frequency: e.target.value })}>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select></div>
                      )}
                    </div>

                    {builderWorkflow.workflowType === 'multi_visit' && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700">Visit Schedule</span>
                          <button onClick={addWorkflowStep} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">+ Add Visit</button>
                        </div>
                        {builderWorkflowSteps.map((step, idx) => (
                          <div key={idx} className="p-3 border border-gray-150 rounded-lg bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-xs font-extrabold text-indigo-600">Visit #{idx + 1}</span>
                            <div className="flex gap-2 items-center flex-wrap">
                              <input type="text" placeholder="e.g. Follow-up treatment" className="p-2 border border-gray-300 rounded-lg text-xs bg-white w-44" value={step.title} onChange={e => updateWorkflowStep(idx, 'title', e.target.value)} />
                              <input type="number" placeholder="Days offset" className="p-2 border border-gray-300 rounded-lg text-xs bg-white w-20" value={step.daysAfterPreviousVisit} onChange={e => updateWorkflowStep(idx, 'daysAfterPreviousVisit', parseInt(e.target.value) || 0)} />
                              <span className="text-[10px] text-gray-500">days offset</span>
                              <select className="p-2 border border-gray-300 rounded-lg text-xs bg-white" value={step.schedulingType} onChange={e => updateWorkflowStep(idx, 'schedulingType', e.target.value)}>
                                <option value="auto_offset">Auto Date Offset</option>
                                <option value="custom_scheduling">User Picks Date</option>
                              </select>
                            </div>
                            <button onClick={() => removeWorkflowStep(idx)} className="text-xs font-bold text-red-600 hover:text-red-800">Delete</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pricing Rules */}
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-base font-bold text-gray-800">Pricing Engine</h4>
                        <div className="flex gap-2">
                          <button onClick={() => addPricingRule('formula')} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">Add Formula</button>
                          <button onClick={() => addPricingRule('conditional')} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">Add Condition</button>
                        </div>
                      </div>
                      {builderRules.map((rule, idx) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-600">Rule #{idx + 1} ({rule.ruleType === 'formula' ? 'Math Formula' : 'Condition'})</span>
                            <button onClick={() => removePricingRule(idx)} className="text-xs font-bold text-red-600">Delete</button>
                          </div>
                          {rule.ruleType === 'formula' ? (
                            <div><label className="block text-[10px] font-bold text-gray-700">Formula</label>
                              <input type="text" placeholder="e.g. basePrice + (rooms * 500)" className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono bg-white" value={rule.formulaString} onChange={e => updatePricingRule(idx, 'formulaString', e.target.value)} /></div>
                          ) : (
                            <div className="grid grid-cols-5 gap-2">
                              <input type="text" placeholder="Field name" className="p-2 border border-gray-300 rounded-lg text-xs bg-white" value={rule.fieldName} onChange={e => updatePricingRule(idx, 'fieldName', e.target.value)} />
                              <select className="p-2 border border-gray-300 rounded-lg text-xs bg-white" value={rule.operator} onChange={e => updatePricingRule(idx, 'operator', e.target.value)}>
                                <option value="equals">Equals</option>
                              </select>
                              <input type="text" placeholder="Value" className="p-2 border border-gray-300 rounded-lg text-xs bg-white" value={rule.value} onChange={e => updatePricingRule(idx, 'value', e.target.value)} />
                              <select className="p-2 border border-gray-300 rounded-lg text-xs bg-white" value={rule.priceModifierType} onChange={e => updatePricingRule(idx, 'priceModifierType', e.target.value)}>
                                <option value="add">Add (+)</option>
                                <option value="multiply">Multiply (*)</option>
                                <option value="fixed">Fixed (=)</option>
                              </select>
                              <input type="number" placeholder="Amount" className="p-2 border border-gray-300 rounded-lg text-xs bg-white" value={rule.modifierValue} onChange={e => updatePricingRule(idx, 'modifierValue', parseFloat(e.target.value) || 0)} />
                            </div>
                          )}
                        </div>
                      ))}
                      {builderRules.length === 0 && <div className="text-center py-4 text-gray-400 text-sm">No pricing rules yet.</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-150 flex justify-between items-center">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 font-bold text-sm">Cancel</button>
              <div className="flex gap-2">
                {activeStep > 0 && (
                  <button type="button" onClick={() => setActiveStep(activeStep - 1)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 flex items-center gap-1 font-bold text-sm">
                    <FiChevronLeft /> Back
                  </button>
                )}
                {activeStep < getSteps().length - 1 ? (
                  <button type="button" onClick={() => setActiveStep(activeStep + 1)} className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-1 font-bold text-sm">
                    Next <FiChevronRight />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md flex items-center gap-1.5 font-bold text-sm">
                    <FiSave /> Save Service
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default ServicesPage;
