import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiImage, FiExternalLink, FiMove } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import adminBannerService from '../../../../services/adminBannerService';
import CardShell from '../UserCategories/components/CardShell';
import Modal from '../UserCategories/components/Modal';

const OfferBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const setIsModalOpen = (isOpen) => {
    setIsModalOpenState(isOpen);
  };
  const [isModalOpenState, setIsModalOpenState] = useState(false);
  const isModalOpen = isModalOpenState;
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    priority: 0,
    mediaType: 'image',
    image: null,
    mobileImage: null
  });
  const [preview, setPreview] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await adminBannerService.getBanners();
      if (response.success) {
        setBanners(response.data);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'mobile') {
          setMobilePreview(reader.result);
          setFormData(prev => ({ ...prev, mobileImage: reader.result }));
        } else {
          setPreview(reader.result);
          setFormData(prev => ({ ...prev, image: reader.result, mediaType: fileType }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingBanner) {
        response = await adminBannerService.updateBanner(editingBanner._id, formData);
      } else {
        response = await adminBannerService.addBanner(formData);
      }

      if (response.success) {
        toast.success(editingBanner ? 'Banner updated' : 'Banner added');
        loadBanners();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error(error.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      const response = await adminBannerService.deleteBanner(id);
      if (response.success) {
        toast.success('Banner deleted');
        loadBanners();
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const openModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        link: banner.link,
        priority: banner.priority,
        isActive: banner.isActive,
        mediaType: banner.mediaType || 'image',
        image: null,
        mobileImage: null
      });
      setPreview(banner.imageUrl);
      setMobilePreview(banner.mobileImageUrl || banner.imageUrl);
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        link: '',
        priority: banners.length,
        mediaType: 'image',
        image: null,
        mobileImage: null
      });
      setPreview(null);
      setMobilePreview(null);
    }
    setIsModalOpenState(true);
  };

  const closeModal = () => {
    setIsModalOpenState(false);
    setEditingBanner(null);
    setFormData({ title: '', link: '', priority: 0, mediaType: 'image', image: null, mobileImage: null });
    setPreview(null);
    setMobilePreview(null);
  };

  const toggleActive = async (banner) => {
    try {
      const response = await adminBannerService.updateBanner(banner._id, {
        isActive: !banner.isActive
      });
      if (response.success) {
        setBanners(prev => prev.map(b => b._id === banner._id ? { ...b, isActive: !b.isActive } : b));
        toast.success('Status updated');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <CardShell
        title="Homepage Offer Banners"
        subtitle="Manage sliding banners shown below search bar"
        icon={FiImage}
        action={
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            <FiPlus /> Add Banner
          </button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner._id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                <div className="aspect-[21/9] bg-gray-100 relative">
                  {banner.mediaType === 'video' ? (
                    <video src={banner.imageUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  )}
                  {banner.mobileImageUrl && banner.mobileImageUrl !== banner.imageUrl && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-semibold">
                      Mobile Version Added
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => toggleActive(banner)}
                      className={`p-1.5 rounded-lg shadow-sm ${banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {banner.isActive ? <FiCheck size={14} /> : <FiX size={14} />}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{banner.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <FiMove size={10} /> Priority: {banner.priority}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(banner._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {banner.link && (
                    <div className="text-xs text-primary-600 font-medium truncate flex items-center gap-1">
                      <FiExternalLink size={12} /> {banner.link}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed">
                No banners added yet. Click "Add Banner" to start.
              </div>
            )}
          </div>
        )}
      </CardShell>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Banner Title</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary-500"
              placeholder="e.g. 50% Off on AC Service"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Target Link (Optional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary-500"
              placeholder="/services/ac-repair"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Display Priority</label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary-500"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Website Banner (Desktop)</label>
              <div className="mt-1 flex flex-col items-center">
                {preview ? (
                  <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border mb-2">
                    {formData.mediaType === 'video' ? (
                      <video src={preview} controls autoPlay muted loop className="w-full h-full object-cover" />
                    ) : (
                      <img src={preview} alt="Web Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setPreview(null); setFormData(p => ({ ...p, image: null })); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full aspect-[21/9] flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <FiImage className="text-3xl text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 font-medium text-center px-2">Click to upload Website Banner</span>
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleImageChange(e, 'web')} />
                  </label>
                )}
                <p className="text-[10px] text-gray-400 mt-2">Recommended aspect ratio 21:9.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Mobile UI Banner</label>
              <div className="mt-1 flex flex-col items-center">
                {mobilePreview ? (
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border mb-2">
                    {formData.mediaType === 'video' ? (
                      <video src={mobilePreview} controls autoPlay muted loop className="w-full h-full object-cover" />
                    ) : (
                      <img src={mobilePreview} alt="Mobile Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setMobilePreview(null); setFormData(p => ({ ...p, mobileImage: null })); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full aspect-[16/9] flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <FiImage className="text-3xl text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 font-medium text-center px-2">Click to upload Mobile Banner</span>
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleImageChange(e, 'mobile')} />
                  </label>
                )}
                <p className="text-[10px] text-gray-400 mt-2">Recommended aspect ratio 16:9.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
            >
              {editingBanner ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OfferBanners;
