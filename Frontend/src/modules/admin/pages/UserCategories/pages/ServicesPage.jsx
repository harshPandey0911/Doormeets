import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSliders, FiSave, FiX, FiChevronRight, FiChevronLeft, FiArrowUp, FiArrowDown, FiEye, FiEyeOff, FiUpload, FiCamera } from 'react-icons/fi';
import { MdTimer, MdInventory, MdPhotoCamera, MdRepeat, MdDragHandle } from 'react-icons/md';
import api from '../../../../../services/api';
import { toast } from 'react-hot-toast';
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
  { key: 'banner_slider',      label: 'Service Images / Videos',  emoji: '🎠',  color: '#8b5cf6' },
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
  { key: 'offer_image',        label: 'Offer Image',              emoji: '🎁',  color: '#ec4899' },
  { key: 'before_after',       label: 'Before & After Image',     emoji: '🔄',  color: '#e11d48' }
];

// Default data for each block type
const getDefaultBlockData = (blockType) => {
  switch (blockType) {
    case 'image_gallery':    return { images: [] };
    case 'before_after':     return { beforeImage: '', afterImage: '', title: 'Before & After' };
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

  const MediaUploadList = ({ items = [], onChange: onListChange }) => {
    const handleFileUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      try {
        setUploading(true);
        const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
        const url = await uploadToCloudinary(file, 'service_banners');
        if (url) {
          onListChange([...items, { url, type: fileType }]);
        }
      } catch (err) {
        console.error('Upload failed', err);
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="space-y-3">
        {items.map((item, i) => {
          const itemUrl = typeof item === 'object' ? item.url : item;
          const itemType = typeof item === 'object' ? (item.type || 'image') : 'image';
          
          return (
            <div key={i} className="flex flex-col p-3 border border-gray-200 rounded-xl bg-white shadow-sm gap-2">
              <div className="flex items-center gap-2">
                {itemType === 'video' ? (
                  <div className="w-10 h-10 bg-purple-50 rounded-md border shrink-0 flex items-center justify-center text-lg">🎥</div>
                ) : (
                  itemUrl && itemUrl.startsWith('http') ? (
                    <img src={itemUrl} alt="" className="w-10 h-10 object-cover rounded-md border shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-50 rounded-md border shrink-0 flex items-center justify-center text-xs text-gray-400">URL</div>
                  )
                )}
                <div className="flex-1 min-w-0">
                  <input
                    className={inputCls}
                    value={itemUrl}
                    onChange={e => {
                      const n = [...items];
                      n[i] = typeof item === 'object' ? { ...item, url: e.target.value } : { url: e.target.value, type: 'image' };
                      onListChange(n);
                    }}
                    placeholder="https://..."
                  />
                </div>
                <button type="button" onClick={() => onListChange(items.filter((_, idx) => idx !== i))} className="text-red-500 font-bold px-2">✕</button>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span className="text-gray-400">Type:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`media-type-${i}`}
                    checked={itemType === 'image'}
                    onChange={() => {
                      const n = [...items];
                      n[i] = typeof item === 'object' ? { ...item, type: 'image' } : { url: item, type: 'image' };
                      onListChange(n);
                    }}
                  />
                  Image
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`media-type-${i}`}
                    checked={itemType === 'video'}
                    onChange={() => {
                      const n = [...items];
                      n[i] = typeof item === 'object' ? { ...item, type: 'video' } : { url: item, type: 'video' };
                      onListChange(n);
                    }}
                  />
                  Video
                </label>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onListChange([...items, { url: '', type: 'image' }])} className="text-blue-600 text-xs font-bold hover:underline">+ Add URL</button>
          <span className="text-gray-300">|</span>
          <label className={`text-purple-600 text-xs font-bold hover:underline cursor-pointer flex items-center gap-1 ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? 'Uploading...' : '+ Upload Image/Video to Cloudinary'}
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>
    );
  };

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
    case 'before_after':
      return (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Section Title</label>
            <input className={inputCls} value={data.title || ''} onChange={e => update('title', e.target.value)} placeholder="e.g. Before & After Result" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border border-gray-200 rounded-xl bg-white shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Before Image</span>
              {data.beforeImage && data.beforeImage.startsWith('http') ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img src={data.beforeImage} alt="Before" className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-black/75 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">Before</span>
                </div>
              ) : (
                <div className="aspect-video bg-gray-50 border rounded-lg flex items-center justify-center text-xs text-gray-400">No Image Uploaded</div>
              )}
              <input className={inputCls} value={data.beforeImage || ''} onChange={e => update('beforeImage', e.target.value)} placeholder="Before Image URL (https://...)" />
              <label className={`text-purple-600 text-xs font-bold hover:underline cursor-pointer flex items-center gap-1 ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? 'Uploading...' : '+ Upload Before Image'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploading(true);
                    const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
                    const url = await uploadToCloudinary(file, 'service_blocks');
                    if (url) update('beforeImage', url);
                  } catch (err) {
                    console.error('Upload failed', err);
                  } finally {
                    setUploading(false);
                  }
                }} />
              </label>
            </div>

            <div className="p-3 border border-gray-200 rounded-xl bg-white shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-700 block">After Image</span>
              {data.afterImage && data.afterImage.startsWith('http') ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img src={data.afterImage} alt="After" className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-black/75 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">After</span>
                </div>
              ) : (
                <div className="aspect-video bg-gray-50 border rounded-lg flex items-center justify-center text-xs text-gray-400">No Image Uploaded</div>
              )}
              <input className={inputCls} value={data.afterImage || ''} onChange={e => update('afterImage', e.target.value)} placeholder="After Image URL (https://...)" />
              <label className={`text-purple-600 text-xs font-bold hover:underline cursor-pointer flex items-center gap-1 ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? 'Uploading...' : '+ Upload After Image'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploading(true);
                    const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
                    const url = await uploadToCloudinary(file, 'service_blocks');
                    if (url) update('afterImage', url);
                  } catch (err) {
                    console.error('Upload failed', err);
                  } finally {
                    setUploading(false);
                  }
                }} />
              </label>
            </div>
          </div>
        </div>
      );

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
          <p className="text-xs text-gray-500">Add images and videos for the service images slider at the top of the detail page.</p>
          <MediaUploadList items={data.banners || []} onChange={v => update('banners', v)} />
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
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title ?? "What's Included"} onChange={e => update('title', e.target.value)} /></div>
          <label className={labelCls}>Items</label>
          <EditableList items={data.items || []} onChange={v => update('items', v)} placeholder="e.g. Professional staff" />
        </div>
      );

    case 'please_note':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Title</label><input className={inputCls} value={data.title ?? 'Please Note'} onChange={e => update('title', e.target.value)} /></div>
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
              {data.hasImages && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex gap-2">
                    <input className={inputCls} value={step.imageUrl || ''} placeholder="Step image URL" onChange={e => { const s = [...(data.steps || [])]; s[i] = { ...s[i], imageUrl: e.target.value }; update('steps', s); }} />
                    <label className="px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-gray-700 dark:text-zinc-300 cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-center shrink-0">
                      <span>Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            toast.loading('Uploading step image...', { id: 'step-upload' });
                            const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
                            const url = await uploadToCloudinary(file, 'service_blocks');
                            const s = [...(data.steps || [])];
                            s[i] = { ...s[i], imageUrl: url };
                            update('steps', s);
                            toast.success('Uploaded step image successfully!', { id: 'step-upload' });
                          } catch (err) {
                            console.error(err);
                            toast.error('Upload failed', { id: 'step-upload' });
                          }
                        }} 
                      />
                    </label>
                  </div>
                  {step.imageUrl && (
                    <div className="w-14 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white">
                      <img src={step.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={() => update('steps', [...(data.steps || []), { title: '', desc: '', imageUrl: '' }])} className="text-blue-600 text-xs font-bold hover:underline">+ Add Step</button>
        </div>
      );

    case 'brands':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title ?? 'Brands We Service'} onChange={e => update('title', e.target.value)} /></div>
          <p className="text-xs text-gray-500">Brands are linked from the Brands section. Enter Brand IDs to display:</p>
          <EditableList items={data.brandIds || []} onChange={v => update('brandIds', v)} placeholder="Brand ID..." />
        </div>
      );

    case 'whats_not_included':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title ?? "Not Included"} onChange={e => update('title', e.target.value)} /></div>
          <label className={labelCls}>Items</label>
          <EditableList items={data.items || []} onChange={v => update('items', v)} placeholder="e.g. Outside area cleaning" />
        </div>
      );

    case 'rate_card':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Button Label</label><input className={inputCls} value={data.linkLabel ?? 'View Rate Card'} onChange={e => update('linkLabel', e.target.value)} /></div>
          <div><label className={labelCls}>Link URL (PDF or page)</label><input className={inputCls} value={data.linkUrl || ''} placeholder="https://..." onChange={e => update('linkUrl', e.target.value)} /></div>
        </div>
      );

    case 'comparison':
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Section Title</label><input className={inputCls} value={data.title ?? 'Compare Plans'} onChange={e => update('title', e.target.value)} /></div>
          <div><label className={labelCls}>Button Label</label><input className={inputCls} value={data.linkLabel ?? 'View Comparison'} onChange={e => update('linkLabel', e.target.value)} /></div>
          <div><label className={labelCls}>Link URL</label><input className={inputCls} value={data.linkUrl || ''} placeholder="https://..." onChange={e => update('linkUrl', e.target.value)} /></div>
        </div>
      );

    case 'offer_image':
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Offer Image URL</label>
            <div className="flex gap-2">
              <input className={inputCls} value={data.imageUrl || ''} placeholder="https://image-url..." onChange={e => update('imageUrl', e.target.value)} />
              <label className="px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-gray-700 dark:text-zinc-300 cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-center shrink-0">
                <span>Upload</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      toast.loading('Uploading offer image...', { id: 'offer-upload' });
                      const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
                      const url = await uploadToCloudinary(file, 'service_blocks');
                      update('imageUrl', url);
                      toast.success('Uploaded offer image successfully!', { id: 'offer-upload' });
                    } catch (err) {
                      console.error(err);
                      toast.error('Upload failed', { id: 'offer-upload' });
                    }
                  }} 
                />
              </label>
            </div>
            {data.imageUrl && (
              <div className="mt-2 w-32 aspect-[3/1] rounded-lg overflow-hidden border border-gray-200 bg-white">
                <img src={data.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
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
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [activeStep, setActiveStep] = useState(0); // 0-4
  const [uploadingImage, setUploadingImage] = useState(false);

  // Pricing Config States
  const [pricingConfigs, setPricingConfigs] = useState([]);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [editingPricingConfigIdx, setEditingPricingConfigIdx] = useState(null);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [pricingForm, setPricingForm] = useState({
    cityId: '',
    brandId: '',
    variantId: '',
    subCategoryId: '',
    customerPrice: '',
    originalPrice: '',
    pricePerMinute: '',
    minimumMinutes: 30,
    validityDays: 30,
    visitsCredits: 4,
    gstPercentage: 18,
    gstIncluded: true,
    platformCommission: 20,
    l1Commission: 10,
    l2Commission: 15,
    l3Commission: 20,
    isActive: true,
    packageTitle: ''
  });

  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    title: '',
    description: '',
    iconUrl: '',
    status: 'active',
    templateType: '',
    allCities: true,
    cityIds: [],
    rating: 4.5,
    reviewCount: '1.2k'
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
      const url = await uploadToCloudinary(file, 'service_icons');
      if (url) {
        setFormData(prev => ({ ...prev, iconUrl: url }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Image upload failed');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVariantImageUpload = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    try {
      const { uploadToCloudinary } = await import('../../../../../utils/cloudinaryUpload');
      const url = await uploadToCloudinary(file, 'variant_icons');
      if (url) {
        updateVariant(idx, 'iconUrl', url);
        toast.success('Add-on image uploaded successfully');
      } else {
        toast.error('Image upload failed');
      }
    } catch (err) {
      console.error('Add-on image upload failed:', err);
      toast.error('Image upload failed');
    }
  };

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
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

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
      const [srvRes, subRes, catRes, tempRes, brndRes, settingsRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/subcategories'),
        api.get('/admin/categories'),
        api.get('/admin/category-templates').catch(() => ({ data: { templates: [] } })),
        api.get('/admin/brands').catch(() => ({ data: { brands: [] } })),
        api.get('/admin/settings').catch(() => null)
      ]);
      setServices(srvRes.data.services || []);
      setSubCategories(subRes.data.data || subRes.data.subCategories || []);
      setCategories(catRes.data.categories || catRes.data.data || []);
      setTemplates(tempRes.data?.templates || tempRes.data?.data || []);
      setBrands(brndRes.data?.brands || brndRes.data?.data || []);
      if (settingsRes?.data?.success) {
        setGlobalSettings(settingsRes.data.settings);
      }
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
        else if (template.code === 'SUBSCRIPTION_BASED') derivedType = 'subscription_base';
        else if (template.code === 'PACKAGE_BASED' || template.code === 'SERVICE_PAGE' || template.code === 'NORMAL_SERVICE') derivedType = 'package_base';
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
        cityIds: srv.cityIds ? srv.cityIds.map(id => (typeof id === 'object' ? (id._id || id.id || String(id)) : String(id))) : [],
        rating: srv.rating || 4.5,
        reviewCount: srv.reviewCount || '1.2k'
      });
      // Derive serviceType from category template to make sure it is accurate
      const srvCatId = srv.categoryId?._id || srv.categoryId || '';
      const selectedCat = categories.find(c => (c.id || c._id) === srvCatId);
      let derivedType = srv.serviceType || 'package_base';
      if (selectedCat) {
        const template = templates.find(t => (t._id || t.id) === selectedCat.templateId);
        if (template) {
          if (template.code === 'MINUTE_BASED') derivedType = 'minute_base';
          else if (template.code === 'SUBSCRIPTION_BASED') derivedType = 'subscription_base';
          else if (template.code === 'PACKAGE_BASED' || template.code === 'SERVICE_PAGE' || template.code === 'NORMAL_SERVICE') derivedType = 'package_base';
          else if (template.code === 'IMAGE_CONSULTANT') derivedType = 'image_base';
          else if (template.code === 'MULTI_VISIT') derivedType = 'multi_visit';
        }
      }
      setServiceType(derivedType);
      setPricePerMinute(srv.pricePerMinute || '');
      setMinimumMinutes(srv.minimumMinutes || 30);
      setPackages(srv.packages || []);
      setVariants(srv.variants || []);
      setFeatures(srv.features || []);
      setSteps(srv.steps || []);
      setQuoteInstructions(srv.quoteInstructions || '');
      setMaxImageUploads(srv.maxImageUploads || 5);
      try {
        const [fieldsRes, workflowRes, pricingRes, blocksRes, prcRes] = await Promise.all([
          api.get(`/admin/services/${srv._id}/fields`),
          api.get(`/admin/services/${srv._id}/workflow`),
          api.get(`/admin/services/${srv._id}/pricing`),
          api.get(`/admin/services/${srv._id}/page-blocks`),
          api.get(`/admin/pricing?serviceId=${srv._id}`).catch(() => ({ data: { data: [] } }))
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
        setPricingConfigs(prcRes.data.data || prcRes.data.pricings || []);
      } catch (err) { console.error('Failed to load sub-details:', err); }
    } else {
      const defaultCityIds = selectedCity ? [selectedCity] : [];
      const defaultCatId = filterTemplateId
        ? (categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?._id || categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?.id || '')
        : '';
      setFormData({ categoryId: defaultCatId, subCategoryId: '', title: '', description: '', iconUrl: '', status: 'active', templateType: '', allCities: !selectedCity, cityIds: defaultCityIds });
      resetBuilderState();
      setPricingConfigs([]);
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

    const firstBanner = pageBlocks.find(b => b.blockType === 'banner_slider')?.data?.banners?.[0];
    const firstBannerUrl = typeof firstBanner === 'object' ? firstBanner.url : firstBanner;

    const finalCityIds = formData.allCities ? [] : formData.cityIds;
    const payload = {
      ...formData,
      iconUrl: firstBannerUrl || formData.iconUrl || '',
      cityIds: finalCityIds,
      serviceType,
      pricePerMinute: serviceType === 'minute_base' ? pricePerMinute : null,
      minimumMinutes: serviceType === 'minute_base' ? minimumMinutes : 30,
      packages: (serviceType === 'package_base' || serviceType === 'subscription_base') ? packages.filter(p => p.title && p.title.trim()) : [],
      quoteInstructions: serviceType === 'image_base' ? quoteInstructions : null,
      maxImageUploads: serviceType === 'image_base' ? maxImageUploads : 5,
      variants: (variants || []).filter(v => v.title && v.title.trim()),
      features: (features || []).filter(f => f && f.trim()),
      steps: (steps || []).filter(s => s && (typeof s === 'string' ? s.trim() : (s.title && s.title.trim()))),
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
        const createdRes = await api.post('/admin/services', payload);
        const newService = createdRes.data.service;
        if (newService && pricingConfigs.length > 0) {
          await Promise.all(
            pricingConfigs.map(config => {
              const { _tempId, ...configPayload } = config;
              let finalVariantId = configPayload.variantId || null;
              if (finalVariantId && typeof finalVariantId === 'string' && Array.isArray(newService.variants)) {
                const matchedVar = newService.variants.find(v => v.title === finalVariantId);
                if (matchedVar) {
                  finalVariantId = matchedVar._id;
                }
              }
              return api.post('/admin/pricing', {
                ...configPayload,
                variantId: finalVariantId,
                categoryId: formData.categoryId,
                subCategoryId: formData.subCategoryId || null,
                serviceId: newService._id
              });
            })
          );
        }
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
  const addVariant = () => setVariants([...variants, { title: '', extraPrice: 0, vendorPayout: 0, description: '', isActive: true }]);
  const updateVariant = (i, k, v) => { const u = [...variants]; u[i][k] = v; setVariants(u); };
  const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i));

  // ── Pricing Matrix Operations
  const handleOpenPricingForm = (config = null, idx = null) => {
    const globalPlat = globalSettings?.commissionPercentage ?? 20;
    const globalL1 = globalSettings?.commissionRates?.level1 ?? 10;
    const globalL2 = globalSettings?.commissionRates?.level2 ?? 15;
    const globalL3 = globalSettings?.commissionRates?.level3 ?? 20;

    if (config) {
      setEditingPricingConfigIdx(idx);
      setPricingForm({
        _tempId: config._tempId || null,
        _id: config._id || null,
        cityId: config.cityId?._id || config.cityId || '',
        brandId: config.brandId?._id || config.brandId || '',
        variantId: config.variantId || '',
        subCategoryId: config.subCategoryId?._id || config.subCategoryId || '',
        customerPrice: config.customerPrice || '',
        originalPrice: config.originalPrice || '',
        pricePerMinute: config.pricePerMinute || '',
        minimumMinutes: config.minimumMinutes || 30,
        validityDays: config.validityDays || 30,
        visitsCredits: config.visitsCredits || 4,
        gstPercentage: config.gstPercentage ?? 18,
        gstIncluded: config.gstIncluded ?? true,
        platformCommission: globalPlat,
        l1Commission: globalL1,
        l2Commission: globalL2,
        l3Commission: globalL3,
        isActive: config.isActive ?? true,
        packageTitle: config.packageTitle || '',
        codEnabled: config.codEnabled ?? true,
        codAdvanceAmount: config.codAdvanceAmount ?? 0,
        vendorPayoutBase: config.vendorPayoutBase ?? 0,
        vendorPayoutExtra: config.vendorPayoutExtra ?? 0
      });
    } else {
      setEditingPricingConfigIdx(null);
      setPricingForm({
        cityId: '',
        brandId: '',
        variantId: '',
        subCategoryId: '',
        customerPrice: '',
        originalPrice: '',
        pricePerMinute: '',
        minimumMinutes: 30,
        validityDays: 30,
        visitsCredits: 4,
        gstPercentage: 18,
        gstIncluded: true,
        platformCommission: globalPlat,
        l1Commission: globalL1,
        l2Commission: globalL2,
        l3Commission: globalL3,
        isActive: true,
        packageTitle: '',
        codEnabled: true,
        codAdvanceAmount: 0,
        vendorPayoutBase: 0,
        vendorPayoutExtra: 0
      });
    }
    setIsPricingModalOpen(true);
  };

  // ── Live pricing split calculations (mirrors PricingMatrixPage logic)
  const getInlinePricingCalcs = () => {
    const cp = Number(pricingForm.customerPrice) || 0;
    const gstPct = Number(globalSettings?.serviceGstPercentage ?? 18);
    const gstInc = true; // GST is included in price
    const pCommPct = Number(globalSettings?.commissionPercentage ?? 25);
    const l1Pct = Number(globalSettings?.commissionRates?.level1 ?? 0);
    const l2Pct = Number(globalSettings?.commissionRates?.level2 ?? 0);
    const l3Pct = Number(globalSettings?.commissionRates?.level3 ?? 0);

    const vPayoutBase = Number(pricingForm.vendorPayoutBase) || 0;
    const vSgstPct = Number(globalSettings?.vendorSgstPercentage ?? 2.5);
    const vCgstPct = Number(globalSettings?.vendorCgstPercentage ?? 2.5);
    const vTdsPct = 0; // TDS is removed entirely u/s request "Vendor TDS (%) hatao"

    // 1. Vendor Payout Breakdown
    const sgstAmount = vPayoutBase * (vSgstPct / 100);
    const cgstAmount = vPayoutBase * (vCgstPct / 100);
    const tdsAmount = vPayoutBase * (vTdsPct / 100);
    
    // Remaining Base after taxes & TDS
    const remainingBase = Math.max(0, vPayoutBase - sgstAmount - cgstAmount - tdsAmount);
    
    // Platform Commission is deducted from remainingBase using Platform Commission (%) from settings
    const platformCommissionAmount = remainingBase * (pCommPct / 100);
    const netVendorShare = Math.max(0, remainingBase - platformCommissionAmount);

    // 2. Admin/Company Gross Margin (includes platform commission)
    const customerShareMargin = Math.max(0, cp - vPayoutBase);
    const marginGstAmount = customerShareMargin * (gstPct / 100);
    const marginTaxableBase = customerShareMargin - marginGstAmount;

    const adminGrossMargin = customerShareMargin + platformCommissionAmount;
    const adminTaxableBase = marginTaxableBase + platformCommissionAmount;
    const adminGstAmount = marginGstAmount;

    const l1CommAmount = remainingBase * (l1Pct / 100);
    const l2CommAmount = remainingBase * (l2Pct / 100);
    const l3CommAmount = remainingBase * (l3Pct / 100);
    const payoutL1 = Math.max(0, remainingBase - platformCommissionAmount - l1CommAmount);
    const payoutL2 = Math.max(0, remainingBase - platformCommissionAmount - l2CommAmount);
    const payoutL3 = Math.max(0, remainingBase - platformCommissionAmount - l3CommAmount);
    const profitL1 = marginTaxableBase + platformCommissionAmount + l1CommAmount;
    const profitL2 = marginTaxableBase + platformCommissionAmount + l2CommAmount;
    const profitL3 = marginTaxableBase + platformCommissionAmount + l3CommAmount;

    return {
      taxableAmount: adminTaxableBase + remainingBase,
      gstAmount: adminGstAmount + sgstAmount + cgstAmount,
      cgstAmount: (adminGstAmount / 2) + cgstAmount,
      sgstAmount: (adminGstAmount / 2) + sgstAmount,
      platformCommissionAmount,
      vendorShare: netVendorShare,
      l1CommAmount, l2CommAmount, l3CommAmount, payoutL1, payoutL2, payoutL3,
      profitL1, profitL2, profitL3, totalCustomerPay: cp, platformTaxableBase: adminTaxableBase, vendorTaxableBase: remainingBase,
      adminGrossMargin, adminTaxableBase, adminGstAmount, tdsAmount, remainingBase,
      marginTaxableBase
    };
  };

  const handleSavePricingConfig = async (e) => {
    e.preventDefault();
    const isMinuteBased = serviceType === 'minute_base';
    const isSubscription = serviceType === 'subscription_base';
    
    if (pricingForm.customerPrice === '' || pricingForm.customerPrice === null) {
      alert("Price/Base charge is required");
      return;
    }

    if (Number(pricingForm.vendorPayoutBase || 0) > Number(pricingForm.customerPrice || 0)) {
      alert(`Vendor Payout Base (₹${pricingForm.vendorPayoutBase}) cannot be greater than Customer Price (₹${pricingForm.customerPrice})`);
      return;
    }

    if (isMinuteBased && Number(pricingForm.vendorPayoutExtra || 0) > Number(pricingForm.pricePerMinute || 0)) {
      alert(`Vendor Payout Extra (₹${pricingForm.vendorPayoutExtra}) cannot be greater than Extra Price (₹${pricingForm.pricePerMinute})`);
      return;
    }

    const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
    
    let resolvedVariantId = pricingForm.variantId || null;
    if (resolvedVariantId && typeof resolvedVariantId === 'string' && resolvedVariantId.length > 0) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(resolvedVariantId);
      if (!isObjectId) {
        const matchedVar = variants.find(v => v.title === resolvedVariantId || v._id === resolvedVariantId || v.id === resolvedVariantId);
        if (matchedVar) {
          resolvedVariantId = matchedVar._id || matchedVar.id || resolvedVariantId;
        }
      }
    }

    const payload = {
      categoryId: formData.categoryId,
      subCategoryId: pricingForm.subCategoryId || formData.subCategoryId || null,
      brandId: (selectedCategory?.enableBrands !== false && serviceType !== 'image_base' && pricingForm.brandId) ? pricingForm.brandId : null,
      cityId: pricingForm.cityId || null,
      variantId: resolvedVariantId,
      customerPrice: Number(pricingForm.customerPrice || 0),
      originalPrice: Number(pricingForm.originalPrice || 0) || null,
      pricePerMinute: isMinuteBased ? Number(pricingForm.pricePerMinute || 0) : null,
      minimumMinutes: isMinuteBased ? Number(pricingForm.minimumMinutes || 30) : null,
      validityDays: isSubscription ? Number(pricingForm.validityDays || 30) : null,
      visitsCredits: isSubscription ? Number(pricingForm.visitsCredits || 4) : null,
      packageTitle: isSubscription ? pricingForm.packageTitle || null : null,
      pricingType: isMinuteBased ? 'per_minute' : (isSubscription ? 'subscription' : 'fixed'),
      gstPercentage: Number(globalSettings?.serviceGstPercentage ?? 18),
      gstIncluded: true,
      platformCommission: Number(globalSettings?.commissionPercentage ?? 25),
      l1Commission: Number(globalSettings?.commissionRates?.level1 ?? 0),
      l2Commission: Number(globalSettings?.commissionRates?.level2 ?? 0),
      l3Commission: Number(globalSettings?.commissionRates?.level3 ?? 0),
      isActive: !!pricingForm.isActive,
      vendorPayoutBase: Number(pricingForm.vendorPayoutBase || 0),
      vendorPayoutExtra: isMinuteBased ? Number(pricingForm.vendorPayoutExtra || 0) : 0,
      vendorSgstPercentage: Number(globalSettings?.vendorSgstPercentage ?? 2.5),
      vendorCgstPercentage: Number(globalSettings?.vendorCgstPercentage ?? 2.5),
      vendorTdsPercentage: 0,
      commissionPercentage: Number(globalSettings?.commissionPercentage ?? 25),
      codEnabled: pricingForm.codEnabled !== false,
      codAdvanceAmount: Number(pricingForm.codAdvanceAmount || 0)
    };

    if (currentService) {
      try {
        if (pricingForm._id) {
          await api.put(`/admin/pricing/${pricingForm._id}`, { ...payload, serviceId: currentService._id });
        } else {
          await api.post('/admin/pricing', { ...payload, serviceId: currentService._id });
        }
        const prcRes = await api.get(`/admin/pricing?serviceId=${currentService._id}`);
        setPricingConfigs(prcRes.data.data || prcRes.data.pricings || []);
        setIsPricingModalOpen(false);
        setEditingPricingConfigIdx(null);
      } catch (err) {
        alert(err.response?.data?.message || 'Error saving pricing configuration');
      }
    } else {
      if (editingPricingConfigIdx !== null) {
        const updated = [...pricingConfigs];
        updated[editingPricingConfigIdx] = {
          ...pricingForm,
          ...payload
        };
        setPricingConfigs(updated);
      } else {
        setPricingConfigs([
          ...pricingConfigs,
          {
            ...payload,
            _tempId: 'temp_' + Date.now()
          }
        ]);
      }
      setIsPricingModalOpen(false);
      setEditingPricingConfigIdx(null);
    }
  };

  const handleDeletePricingConfig = async (idx) => {
    if (!window.confirm("Are you sure you want to delete this pricing configuration?")) return;
    const config = pricingConfigs[idx];
    if (currentService && config._id) {
      try {
        await api.delete(`/admin/pricing/${config._id}`);
        const prcRes = await api.get(`/admin/pricing?serviceId=${currentService._id}`);
        setPricingConfigs(prcRes.data.data || prcRes.data.pricings || []);
      } catch (err) {
        alert("Error deleting pricing config");
      }
    } else {
      setPricingConfigs(pricingConfigs.filter((_, i) => i !== idx));
    }
  };

  const selectedCat = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
  const selectedTemplate = selectedCat ? templates.find(t => (t._id === selectedCat.templateId || t.id === selectedCat.templateId || t.code === selectedCat.template)) : null;
  const isNormalService = selectedTemplate ? selectedTemplate.code === 'NORMAL_SERVICE' : true; // default to true if template not loaded
  const isPricingMatrixEnabled = selectedTemplate ? (selectedTemplate.code === 'NORMAL_SERVICE' || selectedTemplate.code === 'MINUTE_BASED') : true;

  const getSteps = () => {
    const baseSteps = [
      { title: 'Basic Info', key: 'basic' },
      { title: 'Configuration', key: 'type' },
      { title: 'Page Builder', key: 'page' }
    ];

    // Minute-based, Package-based & Image-based services don't need scheduling workflow
    if (serviceType !== 'minute_base' && serviceType !== 'package_base' && serviceType !== 'image_base' && serviceType !== 'subscription_base') {
      baseSteps.push({ title: 'Scheduling Workflow', key: 'workflow' });
    }

    if (isPricingMatrixEnabled) {
      baseSteps.push({ title: 'Pricing Matrix', key: 'pricing_matrix' });
    }

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

  const typeColors = { minute_base: 'bg-blue-100 text-blue-700', package_base: 'bg-emerald-100 text-emerald-700', image_base: 'bg-purple-100 text-purple-700', multi_visit: 'bg-orange-100 text-orange-700', subscription_base: 'bg-violet-100 text-violet-700' };
  const typeLabels = { minute_base: '⏱ Minute Base', package_base: '📦 Package', image_base: '📸 Image Quote', multi_visit: '🔄 Multi-Visit', subscription_base: '💳 Subscription' };

  const getServiceTypeInfo = (srv) => {
    const catId = srv.categoryId?._id || srv.categoryId;
    const category = categories.find(c => (c.id === catId || c._id === catId));
    if (category) {
      const template = templates.find(t => (t._id === category.templateId || t.id === category.templateId || t.code === category.template));
      if (template) {
        if (template.code === 'NORMAL_SERVICE') {
          return {
            label: '🛠️ Normal Service',
            color: 'bg-indigo-100 text-indigo-700'
          };
        }
        if (template.code === 'MINUTE_BASED') {
          return {
            label: '⏱ Minute Base',
            color: 'bg-blue-100 text-blue-700'
          };
        }
        if (template.code === 'PACKAGE_BASED' || template.code === 'SERVICE_PAGE') {
          return {
            label: '📦 Package',
            color: 'bg-emerald-100 text-emerald-700'
          };
        }
        if (template.code === 'IMAGE_CONSULTANT') {
          return {
            label: '📸 Image Quote',
            color: 'bg-purple-100 text-purple-700'
          };
        }
        if (template.code === 'MULTI_VISIT') {
          return {
            label: '🔄 Multi-Visit',
            color: 'bg-orange-100 text-orange-700'
          };
        }
        if (template.code === 'SUBSCRIPTION_BASED') {
          return {
            label: '💳 Subscription',
            color: 'bg-violet-100 text-violet-700'
          };
        }
      }
    }
    return {
      label: typeLabels[srv.serviceType] || '📦 Package',
      color: typeColors[srv.serviceType] || 'bg-gray-100 text-gray-600'
    };
  };

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
                <th className="p-4 font-semibold text-gray-600 text-sm">Price</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {finalFilteredServices.map((srv) => {
                const typeInfo = getServiceTypeInfo(srv);
                return (
                  <tr key={srv._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{srv.title}</td>
                    <td className="p-4 text-gray-600 text-sm">{srv.categoryId?.title || 'Unknown'} &gt; {srv.subCategoryId?.title || '—'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-sm text-gray-800">
                      {srv.serviceType === 'package_base' ? (
                        <span className="text-emerald-600 font-bold">
                          Starting from ₹{srv.finalCustomerPrice !== undefined && srv.finalCustomerPrice !== null ? srv.finalCustomerPrice : (srv.basePrice !== undefined && srv.basePrice !== null ? srv.basePrice : 0)}
                        </span>
                      ) : srv.finalCustomerPrice !== undefined && srv.finalCustomerPrice !== null ? (
                        <span className="text-emerald-600 font-bold">₹{srv.finalCustomerPrice}</span>
                      ) : srv.basePrice !== undefined && srv.basePrice !== null ? (
                        <span className="text-emerald-600 font-bold">₹{srv.basePrice}</span>
                      ) : srv.serviceType === 'image_base' ? (
                        <span className="text-purple-600 font-semibold italic text-[11px]">Quote / Addon based</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${srv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{srv.status}</span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleOpenWizard(srv)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-1 font-bold text-xs"><FiSliders /> Configure</button>
                      <button onClick={() => handleDelete(srv._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              })}
              {finalFilteredServices.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No services found.</td></tr>
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Service Icon / Image</label>
                      <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                        {formData.iconUrl ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <img src={toAssetUrl(formData.iconUrl)} alt="Service icon" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, iconUrl: '' }))}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                            <FiCamera className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            id="service-icon-upload"
                            className="hidden"
                          />
                          <label
                            htmlFor="service-icon-upload"
                            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-700 cursor-pointer shadow-sm inline-flex items-center gap-1.5 transition-all"
                          >
                            <FiUpload className="w-3.5 h-3.5" />
                            {uploadingImage ? 'Uploading...' : 'Choose Image'}
                          </label>
                          <p className="text-[10px] text-gray-400 mt-1.5">Recommended size: 256x256 px. Max size: 5MB.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                        <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400"
                          value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
                          value={formData.rating}
                          onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g. 4.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Review Count (Display Text)</label>
                        <input
                          type="text"
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
                          value={formData.reviewCount}
                          onChange={e => setFormData({ ...formData, reviewCount: e.target.value })}
                          placeholder="e.g. 1.2k"
                        />
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
                    {isPricingMatrixEnabled ? (
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
                    ) : (
                      <>
                        {/* Minute based pricing configuration */}
                        {serviceType === 'minute_base' && (
                          <div className="grid grid-cols-2 gap-4 border border-blue-100 bg-blue-50/20 p-4 rounded-xl">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Base Price / Price Per Minute (₹) *</label>
                              <input
                                type="number"
                                min={0}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-bold outline-none"
                                value={pricePerMinute}
                                onChange={e => setPricePerMinute(e.target.value)}
                                placeholder="e.g. 10"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Duration (Minutes) *</label>
                              <input
                                type="number"
                                min={1}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-semibold outline-none"
                                value={minimumMinutes}
                                onChange={e => setMinimumMinutes(parseInt(e.target.value) || 30)}
                                placeholder="e.g. 30"
                                required
                              />
                            </div>
                          </div>
                        )}

                        {/* Package based pricing configuration */}
                        {serviceType === 'package_base' && (
                          <div className="pt-4 border-t space-y-4">
                            <div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                              <div>
                                <h5 className="text-sm font-bold text-gray-800">📦 Packages</h5>
                                <p className="text-xs text-gray-500 mt-0.5">Manage pricing packages for this service.</p>
                              </div>
                              <button
                                type="button"
                                onClick={addPackage}
                                className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 flex items-center gap-1"
                              >
                                <FiPlus /> Add Package
                              </button>
                            </div>

                            {packages.length === 0 && (
                              <div className="text-center py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                                No packages yet. Click "Add Package" to create one.
                              </div>
                            )}

                            <div className="space-y-4">
                              {packages.map((pkg, idx) => (
                                <div key={idx} className="p-4 border border-violet-150 rounded-xl bg-violet-50/30 space-y-3">
                                  <div className="flex justify-between items-center pb-2 border-b border-violet-100">
                                    <span className="text-xs font-bold text-violet-700">Package #{idx + 1}</span>
                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={pkg.isActive !== false}
                                          onChange={e => updatePackage(idx, 'isActive', e.target.checked)}
                                          className="accent-violet-600"
                                        />
                                        Active
                                      </label>
                                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={!!pkg.isPopular}
                                          onChange={e => updatePackage(idx, 'isPopular', e.target.checked)}
                                          className="accent-violet-600"
                                        />
                                        Popular
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => removePackage(idx)}
                                        className="text-red-500 text-xs font-bold hover:text-red-700 ml-2"
                                      >
                                        ✕ Remove
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Package Title *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 1 BHK Cleaning"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                        value={pkg.title}
                                        onChange={e => updatePackage(idx, 'title', e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Duration *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 2-3 hours"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                        value={pkg.duration || ''}
                                        onChange={e => updatePackage(idx, 'duration', e.target.value)}
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Price (₹) *</label>
                                      <input
                                        type="number"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none font-semibold"
                                        value={pkg.price}
                                        onChange={e => updatePackage(idx, 'price', parseFloat(e.target.value) || 0)}
                                        required
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Original Price (₹) (optional)</label>
                                      <input
                                        type="number"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                        value={pkg.originalPrice || ''}
                                        onChange={e => updatePackage(idx, 'originalPrice', e.target.value ? parseFloat(e.target.value) : null)}
                                        placeholder="Strike-through original price"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Short Description *</label>
                                    <textarea
                                      placeholder="What's included in this package..."
                                      rows={2}
                                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                      value={pkg.description || ''}
                                      onChange={e => updatePackage(idx, 'description', e.target.value)}
                                      required
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── SERVICE VARIANTS ── */}
                    {serviceType === 'image_base' ? (
                      <div className="pt-4 border-t space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                          <div>
                            <h5 className="text-sm font-bold text-gray-800">📸 Addon Categories & Services</h5>
                            <p className="text-xs text-gray-500 mt-0.5">Group your addons/services into categories (e.g., Hair Care, Facial) and set prices/commissions for booking.</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="New category name..."
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-violet-400 bg-white text-gray-800 font-medium"
                              value={newCatName}
                              onChange={e => setNewCatName(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                let cat = newCatName.trim();
                                if (!cat) {
                                  let i = 1;
                                  while (variants.some(v => v.category === `Category ${i}`)) {
                                    i++;
                                  }
                                  cat = `Category ${i}`;
                                }
                                setVariants([...variants, { title: '', category: cat, extraPrice: 0, vendorPayout: 0, description: '', isActive: true }]);
                                setNewCatName('');
                              }}
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                            >
                              <FiPlus /> Add Category
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const categoriesMap = {};
                          variants.forEach((v, idx) => {
                            const cat = v.category || 'Uncategorized';
                            if (!categoriesMap[cat]) categoriesMap[cat] = [];
                            categoriesMap[cat].push({ variant: v, originalIndex: idx });
                          });

                          const categoryNames = Object.keys(categoriesMap);

                          if (variants.length === 0) {
                            return (
                              <div className="text-center py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                                No addon categories yet. Enter a name above to create one.
                              </div>
                            );
                          }

                          return categoryNames.map(catName => (
                            <div key={catName} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                              <div className="flex justify-between items-center border-b pb-2 bg-gray-50 -mx-4 -mt-4 p-3 rounded-t-xl">
                                <div className="flex items-center gap-2">
                                  {editingCategory === catName ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-violet-400 outline-none font-semibold text-gray-800"
                                        value={editingCategoryValue}
                                        onChange={e => setEditingCategoryValue(e.target.value)}
                                        placeholder="Category name..."
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (editingCategoryValue.trim() && editingCategoryValue.trim() !== catName) {
                                            const updated = variants.map(v => v.category === catName ? { ...v, category: editingCategoryValue.trim() } : v);
                                            setVariants(updated);
                                          }
                                          setEditingCategory(null);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-xs font-bold px-1.5 py-0.5 rounded border border-green-200 bg-green-50"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCategory(null)}
                                        className="text-gray-500 hover:text-gray-700 text-xs font-bold px-1.5 py-0.5 rounded border border-gray-200 bg-white"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-gray-800">📁 {catName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCategory(catName);
                                          setEditingCategoryValue(catName);
                                        }}
                                        className="text-gray-400 hover:text-violet-600 text-xs flex items-center gap-0.5"
                                      >
                                        ✏️ Rename
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVariants([...variants, { title: '', category: catName, extraPrice: 0, vendorPayout: 0, description: '', isActive: true }]);
                                    }}
                                    className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-0.5"
                                  >
                                    <FiPlus /> Add Addon
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete category "${catName}" and all its addons?`)) {
                                        setVariants(variants.filter(v => v.category !== catName));
                                      }
                                    }}
                                    className="text-xs font-bold text-red-500 hover:text-red-700"
                                  >
                                    ✕ Delete Category
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3 pt-2">
                                {categoriesMap[catName].map(({ variant, originalIndex }) => (
                                  <div key={originalIndex} className="p-3 border border-violet-100 rounded-xl bg-violet-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-violet-700">Addon #{categoriesMap[catName].findIndex(x => x.originalIndex === originalIndex) + 1}</span>
                                      <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={variant.isActive !== false}
                                            onChange={e => updateVariant(originalIndex, 'isActive', e.target.checked)}
                                            className="accent-violet-600"
                                          />
                                          Active
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => removeVariant(originalIndex)}
                                          className="text-red-500 text-xs font-bold hover:text-red-700"
                                        >
                                          ✕ Remove
                                        </button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Addon Name *</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Hair Wash"
                                          className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400"
                                          value={variant.title}
                                          onChange={e => updateVariant(originalIndex, 'title', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Customer Price (₹) *</label>
                                        <input
                                          type="number"
                                          min={0}
                                          placeholder="0"
                                          className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400 font-bold text-gray-800"
                                          value={variant.extraPrice}
                                          onChange={e => updateVariant(originalIndex, 'extraPrice', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">GST %</label>
                                        <input
                                          type="number"
                                          min={0}
                                          className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                          value={variant.gstPercentage ?? 18}
                                          onChange={e => updateVariant(originalIndex, 'gstPercentage', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">GST Type</label>
                                        <select
                                          className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                          value={variant.gstIncluded !== false ? 'true' : 'false'}
                                          onChange={e => updateVariant(originalIndex, 'gstIncluded', e.target.value === 'true')}
                                        >
                                          <option value="true">Included</option>
                                          <option value="false">Excluded</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Platform Comm %</label>
                                        <input
                                          type="number"
                                          min={0} max={100}
                                          className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                          value={variant.platformCommission ?? 20}
                                          onChange={e => updateVariant(originalIndex, 'platformCommission', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-emerald-600 mb-1">Vendor Payout (₹)</label>
                                        <input
                                          type="number"
                                          min={0}
                                          className="w-full p-2 border border-emerald-300 rounded-lg text-[10px] bg-white outline-none font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-400"
                                          value={variant.vendorPayout ?? 0}
                                          onChange={e => updateVariant(originalIndex, 'vendorPayout', parseFloat(e.target.value) || 0)}
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">L1 Comm %</label>
                                        <input
                                          type="number"
                                          min={0} max={100}
                                          className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                          value={variant.l1Commission ?? 10}
                                          onChange={e => updateVariant(originalIndex, 'l1Commission', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">L2 Comm %</label>
                                        <input
                                          type="number"
                                          min={0} max={100}
                                          className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                          value={variant.l2Commission ?? 15}
                                          onChange={e => updateVariant(originalIndex, 'l2Commission', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">L3 Comm %</label>
                                        <input
                                          type="number"
                                          min={0} max={100}
                                          className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                          value={variant.l3Commission ?? 20}
                                          onChange={e => updateVariant(originalIndex, 'l3Commission', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Description (optional)</label>
                                        <input
                                          type="text"
                                          placeholder="Short description shown to the user"
                                          className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400"
                                          value={variant.description || ''}
                                          onChange={e => updateVariant(originalIndex, 'description', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Addon Icon / Image</label>
                                        <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg bg-white">
                                          {variant.iconUrl ? (
                                            <div className="relative w-8 h-8 rounded border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                                              <img src={toAssetUrl(variant.iconUrl)} alt="Addon icon" className="w-full h-full object-cover" />
                                              <button
                                                type="button"
                                                onClick={() => updateVariant(originalIndex, 'iconUrl', '')}
                                                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                              >
                                                <FiX className="w-2 h-2" />
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="w-8 h-8 rounded border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400 shrink-0">
                                              <FiCamera className="w-4 h-4" />
                                            </div>
                                          )}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleVariantImageUpload(originalIndex, e)}
                                            id={`addon-img-${originalIndex}`}
                                            className="hidden"
                                          />
                                          <label
                                            htmlFor={`addon-img-${originalIndex}`}
                                            className="px-2.5 py-1.5 bg-gray-150 hover:bg-gray-200 rounded-md text-[9px] font-bold text-gray-700 cursor-pointer shadow-sm flex items-center gap-1 transition-all"
                                          >
                                            <FiUpload className="w-2.5 h-2.5" />
                                            Choose
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : serviceType === 'subscription_base' ? (
                      <div className="pt-4 border-t space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                          <div>
                            <h5 className="text-sm font-bold text-gray-800">💳 Subscription Plans</h5>
                            <p className="text-xs text-gray-500 mt-0.5">Manage subscription packages (Monthly, Quarterly, Yearly) with predefined benefits.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPackages([
                                ...packages,
                                {
                                  title: 'Monthly Plan',
                                  description: '',
                                  price: 999,
                                  originalPrice: 1499,
                                  duration: '30 Days',
                                  visitsCredits: 4,
                                  bookingDiscount: 10,
                                  freeInspection: true,
                                  prioritySupport: true,
                                  memberPricing: true,
                                  isPopular: false,
                                  isActive: true
                                }
                              ]);
                            }}
                            className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 flex items-center gap-1"
                          >
                            <FiPlus /> Add Subscription Plan
                          </button>
                        </div>

                        {packages.length === 0 && (
                          <div className="text-center py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                            No subscription plans yet. Click "Add Subscription Plan" to create one.
                          </div>
                        )}

                        <div className="space-y-4">
                          {packages.map((plan, idx) => (
                            <div key={idx} className="p-4 border border-violet-150 rounded-xl bg-violet-50/30 space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-violet-100">
                                <span className="text-xs font-bold text-violet-700">Plan #{idx + 1}</span>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={plan.isActive !== false}
                                      onChange={e => updatePackage(idx, 'isActive', e.target.checked)}
                                      className="accent-violet-600"
                                    />
                                    Active
                                  </label>
                                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!plan.isPopular}
                                      onChange={e => updatePackage(idx, 'isPopular', e.target.checked)}
                                      className="accent-violet-600"
                                    />
                                    Popular
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removePackage(idx)}
                                    className="text-red-500 text-xs font-bold hover:text-red-700 ml-2"
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Plan Title *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Monthly Plan"
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                    value={plan.title}
                                    onChange={e => updatePackage(idx, 'title', e.target.value)}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Validity / Duration *</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 30 Days, 90 Days, 365 Days, 15 Days"
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                    value={plan.duration || ''}
                                    onChange={e => updatePackage(idx, 'duration', e.target.value)}
                                    required
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Number of Visits / Credits *</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 4"
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none font-semibold"
                                    value={plan.visitsCredits ?? 4}
                                    onChange={e => updatePackage(idx, 'visitsCredits', parseInt(e.target.value) || 0)}
                                    required
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Visit Interval / Frequency</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Every 15 days, Every 2 months"
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                    value={plan.visitFrequency || ''}
                                    onChange={e => updatePackage(idx, 'visitFrequency', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Extra Booking Discount (%)</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 10"
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                    value={plan.bookingDiscount ?? 0}
                                    onChange={e => updatePackage(idx, 'bookingDiscount', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                  />
                                </div>
                              </div>

                              <div className="p-3 bg-white rounded-lg border border-violet-100/50 space-y-2">
                                <span className="block text-[10px] font-bold text-violet-700 uppercase tracking-wider">Included Benefits</span>
                                <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600 pt-1">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!plan.freeInspection}
                                      onChange={e => updatePackage(idx, 'freeInspection', e.target.checked)}
                                      className="accent-violet-600"
                                    />
                                    Free Inspection/Checkup
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!plan.prioritySupport}
                                      onChange={e => updatePackage(idx, 'prioritySupport', e.target.checked)}
                                      className="accent-violet-600"
                                    />
                                    Priority Support
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!plan.memberPricing}
                                      onChange={e => updatePackage(idx, 'memberPricing', e.target.checked)}
                                      className="accent-violet-600"
                                    />
                                    Special Member Pricing
                                  </label>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">Short Description (optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Complete home coverage with priority response"
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                  value={plan.description || ''}
                                  onChange={e => updatePackage(idx, 'description', e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
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
                            {(() => {
                              const selectedCatForVar = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                              const selectedTemplateForVar = selectedCatForVar ? templates.find(t => (t._id === selectedCatForVar.templateId || t.id === selectedCatForVar.templateId || t.code === selectedCatForVar.template)) : null;
                              const isNormalServiceVar = selectedTemplateForVar?.code === 'NORMAL_SERVICE';

                              return (
                                <>
                                  <div className={`grid gap-2 ${isNormalServiceVar ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    <div>
                                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Variant Title *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Front Glass Replacement"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400"
                                        value={variant.title}
                                        onChange={e => updateVariant(idx, 'title', e.target.value)}
                                      />
                                    </div>
                                    {!isNormalServiceVar && (
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-600 mb-1">Customer Price (₹) *</label>
                                        <input
                                          type="number"
                                          min={0}
                                          placeholder="0"
                                          className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-violet-400 font-bold text-gray-800"
                                          value={variant.extraPrice}
                                          onChange={e => updateVariant(idx, 'extraPrice', parseFloat(e.target.value) || 0)}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {!isNormalServiceVar && (
                                    <>
                                      <div className="grid grid-cols-4 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-500 mb-1">GST %</label>
                                          <input
                                            type="number"
                                            min={0}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                            value={variant.gstPercentage ?? 18}
                                            onChange={e => updateVariant(idx, 'gstPercentage', parseFloat(e.target.value) || 0)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-500 mb-1">GST Type</label>
                                          <select
                                            className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                            value={variant.gstIncluded !== false ? 'true' : 'false'}
                                            onChange={e => updateVariant(idx, 'gstIncluded', e.target.value === 'true')}
                                          >
                                            <option value="true">Included</option>
                                            <option value="false">Excluded</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Platform Comm %</label>
                                          <input
                                            type="number"
                                            min={0} max={100}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                            value={variant.platformCommission ?? 20}
                                            onChange={e => updateVariant(idx, 'platformCommission', parseFloat(e.target.value) || 0)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-emerald-600 mb-1">Vendor Payout (₹)</label>
                                          <input
                                            type="number"
                                            min={0}
                                            className="w-full p-2 border border-emerald-300 rounded-lg text-[10px] bg-white outline-none font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-400"
                                            value={variant.vendorPayout ?? 0}
                                            onChange={e => updateVariant(idx, 'vendorPayout', parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-500 mb-1">L1 Comm %</label>
                                          <input
                                            type="number"
                                            min={0} max={100}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                            value={variant.l1Commission ?? 10}
                                            onChange={e => updateVariant(idx, 'l1Commission', parseFloat(e.target.value) || 0)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-500 mb-1">L2 Comm %</label>
                                          <input
                                            type="number"
                                            min={0} max={100}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                            value={variant.l2Commission ?? 15}
                                            onChange={e => updateVariant(idx, 'l2Commission', parseFloat(e.target.value) || 0)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-gray-500 mb-1">L3 Comm %</label>
                                          <input
                                            type="number"
                                            min={0} max={100}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-[10px] bg-white outline-none"
                                            value={variant.l3Commission ?? 20}
                                            onChange={e => updateVariant(idx, 'l3Commission', parseFloat(e.target.value) || 0)}
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">Addon Icon / Image</label>
                                <div className="flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg bg-white">
                                  {variant.iconUrl ? (
                                    <div className="relative w-8 h-8 rounded border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                                      <img src={toAssetUrl(variant.iconUrl)} alt="Addon icon" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => updateVariant(idx, 'iconUrl', '')}
                                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                      >
                                        <FiX className="w-2 h-2" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400 shrink-0">
                                      <FiCamera className="w-4 h-4" />
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleVariantImageUpload(idx, e)}
                                    id={`variant-img-${idx}`}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`variant-img-${idx}`}
                                    className="px-2.5 py-1.5 bg-gray-150 hover:bg-gray-200 rounded-md text-[9px] font-bold text-gray-700 cursor-pointer shadow-sm flex items-center gap-1 transition-all"
                                  >
                                    <FiUpload className="w-2.5 h-2.5" />
                                    Choose
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

                {/* ── STEP 4: SCHEDULING WORKFLOW ── */}
                {currentStepKey === 'workflow' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Step 4: Scheduling Workflow</h4>
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
                              </select>
                            </div>
                            <button onClick={() => removeWorkflowStep(idx)} className="text-xs font-bold text-red-600 hover:text-red-800">Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 5: PRICING MATRIX ── */}
                {currentStepKey === 'pricing_matrix' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Step 5: Pricing Matrix</h4>

                    {/* Table showing configured prices */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Configured Price Mappings</span>
                        {!isPricingModalOpen && (
                          <button
                            type="button"
                            onClick={() => handleOpenPricingForm()}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1"
                          >
                            <FiPlus /> Add Pricing
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-150">
                              <th className="p-2.5 font-bold text-gray-600">City</th>
                              <th className="p-2.5 font-bold text-gray-600">Brand</th>
                              <th className="p-2.5 font-bold text-gray-600">Price Details</th>
                              <th className="p-2.5 font-bold text-gray-600">GST</th>
                              <th className="p-2.5 font-bold text-gray-600 bg-green-50">Admin Profit (L1/L2/L3)</th>
                              <th className="p-2.5 font-bold text-gray-600">Status</th>
                              <th className="p-2.5 font-bold text-gray-600 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pricingConfigs.map((config, idx) => {
                              const cityName = config.cityId 
                                ? (cities.find(c => (c._id || c.id) === (config.cityId?._id || config.cityId))?.name || 'Selected City')
                                : 'Global';
                              const brandName = (config.brandId && serviceType !== 'image_base')
                                ? (brands.find(b => (b._id || b.id) === (config.brandId?._id || config.brandId))?.title || 'Selected Brand')
                                : '—';
                              const isMinuteBased = serviceType === 'minute_base';
                              // Compute inline profit display
                              const cp = Number(config.customerPrice) || 0;
                              const gstPct = Number(config.gstPercentage) || 0;
                              const gstInc = config.gstIncluded ?? true;
                              const pCommPct = Number(config.platformCommission ?? globalSettings?.commissionPercentage ?? 20);
                              const l1Pct = Number(config.l1Commission ?? globalSettings?.commissionRates?.level1 ?? 10);
                              const l2Pct = Number(config.l2Commission ?? globalSettings?.commissionRates?.level2 ?? 15);
                              const l3Pct = Number(config.l3Commission ?? globalSettings?.commissionRates?.level3 ?? 20);
                              
                              let totalCustomerPay = cp;
                              if (!gstInc) {
                                const platformBase = cp * (pCommPct / 100);
                                const vendorBase = cp - platformBase;
                                const platformGST = platformBase * (gstPct / 100);
                                const vendorGST = vendorBase * 0.05;
                                const platformFeeInclusive = platformBase + platformGST;
                                const vendorShareInclusive = vendorBase + vendorGST;
                                totalCustomerPay = platformFeeInclusive + vendorShareInclusive;
                              }

                              const displayTaxable = gstInc ? cp - (cp * (gstPct / 100)) : cp;
                              const displayPlatComm = displayTaxable * (pCommPct / 100);
                              const profL1 = displayPlatComm + (displayTaxable * (l1Pct / 100));
                              const profL2 = displayPlatComm + (displayTaxable * (l2Pct / 100));
                              const profL3 = displayPlatComm + (displayTaxable * (l3Pct / 100));
                              return (
                                <tr key={config._tempId || config._id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded font-bold ${config.cityId ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'}`}>
                                      {cityName}
                                    </span>
                                  </td>
                                  <td className="p-2.5 font-semibold text-gray-700">
                                    {brandName}
                                    {config.variantId && (
                                      <span className="block text-[9px] font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded px-1.5 py-0.5 mt-1 w-fit">
                                        Addon: {variants.find(v => String(v._id || v.id) === String(config.variantId?._id || config.variantId) || v.title === config.variantId)?.title || 'Selected Addon'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 font-bold text-gray-800">
                                    {isMinuteBased ? (
                                      <span>
                                        Base: ₹{config.customerPrice} ({config.minimumMinutes || 30} mins)
                                        <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Total Pay: ₹{totalCustomerPay.toFixed(1)}</span>
                                        <span className="block text-[10px] text-blue-600 font-normal mt-0.25">Extra: ₹{config.pricePerMinute}/10 min</span>
                                        <span className="block text-[10px] text-indigo-600 font-bold mt-0.5">Payout Base: ₹{config.vendorPayoutBase}</span>
                                        <span className="block text-[10px] text-indigo-500 font-normal mt-0.25">Payout Extra: ₹{config.vendorPayoutExtra}/10 min</span>
                                      </span>
                                    ) : serviceType === 'subscription_base' ? (
                                      <span>
                                        ₹{config.customerPrice} (Subscription{config.packageTitle ? `: ${config.packageTitle}` : ''})
                                        <span className="block text-[10px] text-blue-600 font-bold mt-0.5">{config.visitsCredits || 4} Visits / {config.validityDays || 30} Days</span>
                                        <span className="block text-[10px] text-indigo-600 font-bold mt-0.5">Payout: ₹{config.vendorPayoutBase}</span>
                                      </span>
                                    ) : (
                                      <span>
                                        ₹{config.customerPrice}
                                        {!gstInc && <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">Total Pay: ₹{totalCustomerPay.toFixed(1)}</span>}
                                        <span className="block text-[10px] text-indigo-600 font-bold mt-0.5">Payout: ₹{config.vendorPayoutBase}</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-gray-500 font-semibold">{config.gstPercentage}% ({gstInc ? 'Incl.' : 'Excl.'})</td>
                                  <td className="p-2.5 bg-green-50 font-bold text-green-700">
                                    ₹{profL1.toFixed(1)} / ₹{profL2.toFixed(1)} / ₹{profL3.toFixed(1)}
                                  </td>
                                  <td className="p-2.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${config.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {config.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button type="button" onClick={() => handleOpenPricingForm(config, idx)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 className="w-3.5 h-3.5" /></button>
                                      <button type="button" onClick={() => handleDeletePricingConfig(idx)} className="p-1 text-red-600 hover:bg-red-50 rounded"><FiTrash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {pricingConfigs.length === 0 && (
                              <tr>
                                <td colSpan="7" className="p-4 text-center text-gray-400">No pricing configurations defined yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {isPricingModalOpen && (
                      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                          <div className="flex justify-between items-center border-b p-5 shrink-0">
                            <span className="text-sm font-extrabold text-gray-800">
                              {editingPricingConfigIdx !== null ? '📝 Edit Pricing configuration' : '➕ Add Pricing configuration'}
                            </span>
                            <button type="button" onClick={() => { setIsPricingModalOpen(false); setEditingPricingConfigIdx(null); }} className="text-xl font-bold text-gray-400 hover:text-gray-650">✕</button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">City Availability</label>
                            <select
                              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                              value={pricingForm.cityId}
                              onChange={e => setPricingForm({ ...pricingForm, cityId: e.target.value })}
                            >
                              <option value="">All Cities (Global Pricing)</option>
                              {cities.map(city => <option key={city._id || city.id} value={city._id || city.id}>{city.name}</option>)}
                            </select>
                          </div>

                          {isNormalService ? (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Variant (Addon)</label>
                              <select
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none font-semibold text-violet-700"
                                value={pricingForm.variantId}
                                onChange={e => setPricingForm({ ...pricingForm, variantId: e.target.value })}
                              >
                                <option value="">-- Apply to Base Service --</option>
                                {variants.map((v, vIdx) => (
                                  <option key={v._id || vIdx} value={v._id || v.title}>
                                    {v.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subcategory</label>
                              <select
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none font-semibold text-blue-700"
                                value={pricingForm.subCategoryId}
                                onChange={e => setPricingForm({ ...pricingForm, subCategoryId: e.target.value })}
                              >
                                <option value="">-- Select Subcategory --</option>
                                {subCategories.filter(sub => !formData.categoryId || sub.categoryId?._id === formData.categoryId || sub.categoryId === formData.categoryId).map(sub => (
                                  <option key={sub._id || sub.id} value={sub._id || sub.id}>
                                    {sub.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {(() => {
                            const selectedCat = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                            const showBrandField = selectedCat ? (selectedCat.enableBrands === true && serviceType !== 'image_base') : false;
                            if (!showBrandField) return null;
                            const filteredBrands = brands.filter(brnd => {
                              if (!formData.categoryId) return true;
                              return (brnd.categoryId && (brnd.categoryId?._id === formData.categoryId || brnd.categoryId === formData.categoryId)) ||
                                     (brnd.categoryIds && brnd.categoryIds.some(c => (c?._id || c) === formData.categoryId));
                            });

                            return (
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Brand</label>
                                <select
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                  value={pricingForm.brandId}
                                  onChange={e => setPricingForm({ ...pricingForm, brandId: e.target.value })}
                                  required={selectedCat?.brandRequired === true}
                                >
                                  <option value="">Select Brand {selectedCat?.brandRequired ? '(Required)' : '(Optional)'}</option>
                                  {filteredBrands.map(brnd => <option key={brnd._id || brnd.id} value={brnd._id || brnd.id}>{brnd.title}</option>)}
                                </select>
                              </div>
                            );
                          })()}
                        </div>

                        {serviceType === 'minute_base' ? (
                          <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <div>
                              <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Service Price (₹)</label>
                              <input
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                value={pricingForm.customerPrice}
                                onChange={e => setPricingForm({ ...pricingForm, customerPrice: e.target.value })}
                                required
                                min="0"
                                placeholder="e.g. 300"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Min Minutes</label>
                              <input
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                value={pricingForm.minimumMinutes}
                                onChange={e => setPricingForm({ ...pricingForm, minimumMinutes: parseInt(e.target.value) || 30 })}
                                required
                                min="1"
                                placeholder="e.g. 30"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Extra ₹/10 min</label>
                              <input
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                value={pricingForm.pricePerMinute}
                                onChange={e => setPricingForm({ ...pricingForm, pricePerMinute: e.target.value })}
                                required
                                min="0"
                                placeholder="e.g. 100"
                              />
                            </div>
                          </div>
                        ) : serviceType === 'subscription_base' ? (
                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-violet-700 uppercase mb-1">Select Subscription Plan *</label>
                              <select
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                value={pricingForm.packageTitle || ''}
                                onChange={e => {
                                  const selectedPkg = packages.find(p => p.title === e.target.value);
                                  setPricingForm({
                                    ...pricingForm,
                                    packageTitle: e.target.value,
                                    validityDays: selectedPkg ? (parseInt(selectedPkg.duration) || 30) : 30,
                                    visitsCredits: selectedPkg ? (selectedPkg.visitsCredits || 4) : 4,
                                    customerPrice: selectedPkg ? selectedPkg.price : ''
                                  });
                                }}
                                required
                              >
                                <option value="">-- Choose Plan --</option>
                                {packages.map((pkg, pIdx) => (
                                  <option key={pIdx} value={pkg.title}>{pkg.title}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-3 bg-violet-50/50 border border-violet-100 rounded-lg">
                              <div>
                                <label className="block text-[10px] font-bold text-violet-700 uppercase mb-1">Subscription Price (₹) *</label>
                                <input
                                  type="number"
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none font-bold"
                                  value={pricingForm.customerPrice}
                                  onChange={e => setPricingForm({ ...pricingForm, customerPrice: e.target.value })}
                                  required
                                  min="0"
                                  placeholder="e.g. 999"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-violet-700 uppercase mb-1">Original Price (₹)</label>
                                <input
                                  type="number"
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none text-gray-500 line-through"
                                  value={pricingForm.originalPrice || ''}
                                  onChange={e => setPricingForm({ ...pricingForm, originalPrice: e.target.value })}
                                  min="0"
                                  placeholder="e.g. 1499"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price (Customer Pays) *</label>
                            <input
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                value={pricingForm.customerPrice}
                                onChange={e => setPricingForm({ ...pricingForm, customerPrice: e.target.value })}
                                required
                                min="0"
                                placeholder="e.g. 500"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1">Vendor Payout Base (₹) *</label>
                            <input
                              type="number"
                              min="0"
                              className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white font-bold text-indigo-800 outline-none focus:ring-2 focus:ring-indigo-400"
                              value={pricingForm.vendorPayoutBase === 0 ? '' : pricingForm.vendorPayoutBase}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setPricingForm({ ...pricingForm, vendorPayoutBase: isNaN(val) ? 0 : Math.max(0, val) });
                              }}
                              placeholder="e.g. 500"
                              required
                            />
                          </div>
                          {serviceType === 'minute_base' && (
                            <div>
                              <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Vendor Payout Extra (₹/10 min) *</label>
                              <input
                                type="number"
                                min="0"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-400"
                                value={pricingForm.vendorPayoutExtra === 0 ? '' : pricingForm.vendorPayoutExtra}
                                onChange={e => {
                                  const val = parseFloat(e.target.value);
                                  setPricingForm({ ...pricingForm, vendorPayoutExtra: isNaN(val) ? 0 : Math.max(0, val) });
                                }}
                                placeholder="e.g. 15"
                                required
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-5">
                            <input
                              id="configIsActiveToggle"
                              type="checkbox"
                              checked={pricingForm.isActive !== false}
                              onChange={e => setPricingForm({ ...pricingForm, isActive: e.target.checked })}
                              className="h-4 w-4 accent-green-600"
                            />
                            <label htmlFor="configIsActiveToggle" className="text-xs font-bold text-gray-600">Active configuration</label>
                          </div>
                        </div>

                        {/* COD Configurations section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3 mt-2">
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              id="configCodEnabledToggle"
                              type="checkbox"
                              checked={pricingForm.codEnabled !== false}
                              onChange={e => setPricingForm({ ...pricingForm, codEnabled: e.target.checked })}
                              className="h-4 w-4 accent-indigo-600"
                            />
                            <label htmlFor="configCodEnabledToggle" className="text-xs font-bold text-gray-600">COD (Pay at Home) Enabled</label>
                          </div>
                          {pricingForm.codEnabled !== false && (
                            <div>
                              <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1">COD Advance Amount (₹)</label>
                              <input
                                type="number"
                                min="0"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                                value={pricingForm.codAdvanceAmount || ''}
                                onChange={e => setPricingForm({ ...pricingForm, codAdvanceAmount: e.target.value })}
                                placeholder="e.g. 0 for no advance"
                              />
                            </div>
                          )}
                        </div>

                        {/* Applied Global Configuration Overview */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Global Configurations Applied (Read-Only)</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Platform GST</span>
                              <span className="font-bold text-slate-700">{globalSettings?.serviceGstPercentage ?? 18}%</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Vendor SGST</span>
                              <span className="font-bold text-slate-700">{globalSettings?.vendorSgstPercentage ?? 2.5}%</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Vendor CGST</span>
                              <span className="font-bold text-slate-700">{globalSettings?.vendorCgstPercentage ?? 2.5}%</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Platform Commission</span>
                              <span className="font-bold text-slate-700">{globalSettings?.commissionPercentage ?? 25}%</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="block text-[9px] font-extrabold text-slate-400 uppercase">L1 Commission</span>
                              <span className="font-bold text-slate-700">{globalSettings?.commissionRates?.level1 ?? 0}%</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="block text-[9px] font-extrabold text-slate-400 uppercase">L2 Commission</span>
                              <span className="font-bold text-slate-700">{globalSettings?.commissionRates?.level2 ?? 0}%</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                              <span className="block text-[9px] font-extrabold text-slate-400 uppercase">L3 Commission</span>
                              <span className="font-bold text-slate-700">{globalSettings?.commissionRates?.level3 ?? 0}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Split Calculation Details */}
                        {(() => {
                          const calcs = getInlinePricingCalcs();
                          return (
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                              <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Live Split Calculation Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Tax calculations column */}
                                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                  <div className="text-[10px] font-bold uppercase text-slate-500">Tax Calculations</div>
                                  <div className="flex justify-between items-center text-xs border-b pb-1">
                                    <span className="text-slate-500">Customer Pay</span>
                                    <span className="font-bold text-slate-800">₹{calcs.totalCustomerPay.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Vendor Payout Base</span>
                                    <span className="font-semibold text-slate-700">₹{pricingForm.vendorPayoutBase}</span>
                                  </div>
                                  <div className="text-[10px] bg-slate-50 p-1.5 rounded space-y-1 ml-2">
                                    <div className="flex justify-between text-slate-500">
                                      <span>Vendor CGST ({globalSettings?.vendorCgstPercentage ?? 2.5}%)</span>
                                      <span>₹{((Number(pricingForm.vendorPayoutBase) || 0) * (Number(globalSettings?.vendorCgstPercentage ?? 2.5) / 100)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                      <span>Vendor SGST ({globalSettings?.vendorSgstPercentage ?? 2.5}%)</span>
                                      <span>₹{((Number(pricingForm.vendorPayoutBase) || 0) * (Number(globalSettings?.vendorSgstPercentage ?? 2.5) / 100)).toFixed(2)}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-xs font-semibold text-indigo-700">
                                    <span>Vendor Share (After SGST & CGST)</span>
                                    <span>₹{calcs.remainingBase.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs pt-1 border-t">
                                    <span className="text-slate-500">Admin Taxable Base</span>
                                    <span className="font-semibold text-slate-700">₹{calcs.adminTaxableBase.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">GST on Admin (18%)</span>
                                    <span className="font-semibold text-gray-600">₹{calcs.adminGstAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs font-bold border-t pt-1">
                                    <span className="text-slate-700">Total GST Calculated</span>
                                    <span className="text-slate-700">₹{calcs.gstAmount.toFixed(2)}</span>
                                  </div>
                                </div>

                                {/* Vendor & Platform column */}
                                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm col-span-2">
                                  <div className="text-[10px] font-bold uppercase text-slate-500">Vendor &amp; Platform Commission Splits</div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5 border-r border-gray-100 pr-3">
                                      <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>Platform Comm ({globalSettings?.commissionPercentage ?? 25}%)</span>
                                        <span className="font-semibold">₹{calcs.platformCommissionAmount.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs text-gray-500 pb-1.5 border-b">
                                        <span>Net Vendor Share</span>
                                        <span className="font-semibold">₹{calcs.vendorShare.toFixed(2)}</span>
                                      </div>
                                      <div className="pt-1 text-xs font-bold text-blue-600">Level Commissions &amp; Payouts</div>
                                      <div className="text-xs flex justify-between text-gray-600">
                                        <span>L1 Payout ({globalSettings?.commissionRates?.level1 ?? 0}%)</span>
                                        <span className="font-bold text-green-600">₹{calcs.payoutL1.toFixed(1)}</span>
                                      </div>
                                      <div className="text-xs flex justify-between text-gray-600">
                                        <span>L2 Payout ({globalSettings?.commissionRates?.level2 ?? 0}%)</span>
                                        <span className="font-bold text-green-600">₹{calcs.payoutL2.toFixed(1)}</span>
                                      </div>
                                      <div className="text-xs flex justify-between text-gray-600">
                                        <span>L3 Payout ({globalSettings?.commissionRates?.level3 ?? 0}%)</span>
                                        <span className="font-bold text-green-600">₹{calcs.payoutL3.toFixed(1)}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="text-xs font-bold text-blue-700">Admin Net Profit</div>
                                      <div className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1 my-1">
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Customer Share Net:</span>
                                          <span className="font-semibold text-slate-700">₹{calcs.marginTaxableBase.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Platform Comm:</span>
                                          <span className="font-semibold text-slate-700">+₹{calcs.platformCommissionAmount.toFixed(2)}</span>
                                        </div>
                                      </div>
                                      <div className="text-xs flex justify-between text-gray-700 font-semibold mt-1">
                                        <span>Admin Profit (L1)</span>
                                        <span className="text-blue-700 font-bold">₹{calcs.profitL1.toFixed(1)}</span>
                                      </div>
                                      <div className="text-xs flex justify-between text-gray-700 font-semibold">
                                        <span>Admin Profit (L2)</span>
                                        <span className="text-blue-700 font-bold">₹{calcs.profitL2.toFixed(1)}</span>
                                      </div>
                                      <div className="text-xs flex justify-between text-gray-700 font-semibold">
                                        <span>Admin Profit (L3)</span>
                                        <span className="text-blue-700 font-bold">₹{calcs.profitL3.toFixed(1)}</span>
                                      </div>
                                      <div className="pt-2 mt-2 border-t border-dashed border-gray-200 space-y-1">
                                        <div className="text-[11px] flex justify-between text-gray-550 font-bold">
                                          <span>Total GST</span>
                                          <span className="text-gray-700">₹{calcs.gstAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="text-[11px] flex justify-between text-gray-550 font-bold">
                                          <span>Total SGST &amp; CGST</span>
                                          <span className="text-gray-700">₹{(((Number(pricingForm.vendorPayoutBase) || 0) * (Number(globalSettings?.vendorCgstPercentage ?? 2.5) + Number(globalSettings?.vendorSgstPercentage ?? 2.5))) / 100).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        </div>

                        <div className="flex justify-end gap-2 p-5 border-t bg-gray-50 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setIsPricingModalOpen(false); setEditingPricingConfigIdx(null); }}
                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 font-bold text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSavePricingConfig}
                            className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md text-xs"
                          >
                            Save Configuration
                          </button>
                        </div>
                      </div>
                    </div>
                    )}


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
