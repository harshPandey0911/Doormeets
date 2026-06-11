import React, { useState, useEffect } from 'react';
import { FiBox, FiPlus, FiImage, FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { uploadToCloudinary } from '../../../../utils/cloudinaryUpload';

const ServicesPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    basePrice: '',
    discountPrice: '',
    description: '',
    type: 'service', // 'service' or 'product'
    isPriceDisclosed: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/vendors/products'),
        api.get('/vendors/categories')
      ]);
      if (productsRes.data.success) {
        setProducts(productsRes.data.products);
      }
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (error) {
      console.error('Fetch data error', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const res = await api.delete(`/vendors/products/${id}`);
        if (res.data.success) {
          toast.success('Item deleted successfully');
          fetchData();
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete item');
      }
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.categoryId) {
      toast.error('Please fill required fields');
      return;
    }

    if (form.basePrice < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      let iconUrl = '';
      if (imageFile) {
        toast.loading('Uploading image...', { id: 'upload' });
        iconUrl = await uploadToCloudinary(imageFile, 'products');
        toast.dismiss('upload');
      }

      const res = await api.post('/vendors/products', {
        ...form,
        iconUrl
      });

      if (res.data.success) {
        toast.success(`${form.type === 'service' ? 'Service' : 'Product'} created successfully!`);
        setIsModalOpen(false);
        setForm({ title: '', categoryId: '', basePrice: '', discountPrice: '', description: '', type: 'service', isPriceDisclosed: true });
        setImageFile(null);
        setImagePreview('');
        fetchData();
      }
    } catch (error) {
      console.error('Create item error:', error);
      toast.error(error.response?.data?.message || 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Manage Services/Items" showBack={true} />

      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Your Service Catalog</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-teal-700 transition active:scale-95"
          >
            <FiPlus /> Add Item
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : products.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-12 text-center border border-white/40 shadow-sm">
            <FiBox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-800 font-black mb-2 tracking-tight">No Items Created Yet</h3>
            <p className="text-xs text-gray-500 font-medium">Add your services (like AC Repair) or materials (like Reti/Cement) to start receiving bookings.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="relative">
                   <img src={p.iconUrl || 'https://via.placeholder.com/100'} alt={p.title} className="w-16 h-16 rounded-2xl object-cover bg-gray-50 shadow-inner border border-gray-100" />
                   <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-sm bg-teal-500 text-white`}>
                     Service
                   </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 truncate leading-tight">{p.title}</h4>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">{p.category}</p>
                  <div className="mt-1 flex gap-2 items-center">
                    {p.isPriceDisclosed !== false ? (
                      <>
                        <span className="text-teal-600 font-black">₹{p.basePrice}</span>
                        {p.discountPrice > 0 && <span className="text-xs text-red-500 line-through">₹{p.basePrice + p.discountPrice}</span>}
                      </>
                    ) : (
                      <span className="text-gray-400 font-black text-[10px] uppercase tracking-tighter bg-gray-100 px-2 py-0.5 rounded-md">Not Disclosed</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Add New Item</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Populate your catalog</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition"><FiX className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">


                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Service Name / Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-inner" placeholder="e.g. AC Deep Cleaning" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Main Category *</label>
                  <select 
                    required 
                    value={form.categoryId} 
                    onChange={e => setForm({...form, categoryId: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-inner appearance-none"
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter(c => c.categoryType === 'service' || !c.categoryType)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))
                    }
                  </select>
                </div>



                {form.isPriceDisclosed && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Selling Price (₹)</label>
                      <input type="number" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-teal-500/20 outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Original Price (₹)</label>
                      <input type="number" value={form.discountPrice} onChange={e => setForm({...form, discountPrice: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-teal-500/20 outline-none" placeholder="For discount" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Display Image</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-6 flex flex-col items-center justify-center relative bg-gray-50 overflow-hidden group hover:border-teal-500/50 transition-all">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover rounded-2xl shadow-lg" />
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3">
                          <FiImage className="h-6 w-6 text-teal-500" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Tap to upload photo</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-teal-700 transition active:scale-95 mt-6 disabled:opacity-50 disabled:scale-100">
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Publishing...</span>
                    </div>
                  ) : `Publish Service`}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ServicesPage;
