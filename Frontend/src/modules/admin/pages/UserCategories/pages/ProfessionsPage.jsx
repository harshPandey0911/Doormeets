import React, { useEffect, useState } from "react";
import { FiGrid, FiPlus, FiEdit2, FiTrash2, FiSave, FiCheckSquare, FiSquare } from "react-icons/fi";
import { toast } from "react-hot-toast";
import CardShell from "../components/CardShell";
import Modal from "../components/Modal";
import { professionService, categoryService } from "../../../../../services/catalogService";

const ProfessionsPage = ({ selectedCity }) => {
  const [professions, setProfessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    categories: [] // Array of category IDs
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [profRes, catRes] = await Promise.all([
        professionService.getAll(),
        categoryService.getAll({ status: 'active' })
      ]);

      if (profRes.success) setProfessions(profRes.data);
      if (catRes.success) setCategories(catRes.categories || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load professions data.');
    } finally {
      setFetching(false);
    }
  };

  const reset = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      status: "active",
      categories: []
    });
    setIsModalOpen(false);
  };

  const openEdit = (prof) => {
    setEditingId(prof._id || prof.id);
    setForm({
      name: prof.name || "",
      description: prof.description || "",
      status: prof.status || "active",
      categories: prof.categories ? prof.categories.map(c => c._id || c) : []
    });
    setIsModalOpen(true);
  };

  const upsert = async () => {
    if (!form.name.trim()) {
      toast.error("Profession name is required");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...form };

      if (editingId) {
        const res = await professionService.update(editingId, payload);
        if (res.success) {
          toast.success("Profession updated successfully");
          fetchData();
          reset();
        } else {
          throw new Error(res.message);
        }
      } else {
        const res = await professionService.create(payload);
        if (res.success) {
          toast.success("Profession created successfully");
          fetchData();
          reset();
        } else {
          throw new Error(res.message);
        }
      }
    } catch (error) {
      console.error('Upsert profession error:', error);
      toast.error(error.message || 'Failed to save profession');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this profession?")) return;

    try {
      setLoading(true);
      const res = await professionService.delete(id);
      if (res.success) {
        toast.success("Profession deleted successfully");
        fetchData();
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete profession');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setForm(prev => {
      const isSelected = prev.categories.includes(categoryId);
      if (isSelected) {
        return { ...prev, categories: prev.categories.filter(id => id !== categoryId) };
      } else {
        return { ...prev, categories: [...prev.categories, categoryId] };
      }
    });
  };

  const filteredProfessions = selectedCity
    ? professions.filter(p => {
        if (!p.categories || p.categories.length === 0) return false;
        
        return p.categories.some(cat => {
          const category = categories.find(c => String(c.id || c._id) === String(cat._id || cat));
          if (!category) return false;
          
          const catCityIds = category.cityIds || [];
          if (catCityIds.length === 0) return false;
          
          return catCityIds.some(id => String(id) === String(selectedCity) || (id._id && String(id._id) === String(selectedCity)));
        });
      })
    : professions;

  return (
    <div className="space-y-6">
      <CardShell icon={FiGrid}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{filteredProfessions.length} Professions</div>
          <button
            onClick={() => { reset(); setIsModalOpen(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Profession</span>
          </button>
        </div>

        {fetching ? (
          <div className="text-center py-8 text-gray-500">Loading professions...</div>
        ) : filteredProfessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No professions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Categories Linked</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfessions.map((p) => (
                  <tr key={p._id || p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {p.categories?.length || 0} categories
                      {p.categories?.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {p.categories.map(c => c.title || c.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                          <FiEdit2 />
                        </button>
                        <button onClick={() => remove(p._id || p.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardShell>

      <Modal isOpen={isModalOpen} onClose={reset} title={editingId ? "Edit Profession" : "Add Profession"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Name</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Electrician, Plumber"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">Link Categories to this Profession</label>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {categories.length === 0 ? (
                <div className="col-span-full text-sm text-gray-500 p-2 text-center">
                  No active categories available. You can create categories first from the "Manage Categories" page.
                </div>
              ) : (
                categories.map(cat => {
                  const isSelected = form.categories.includes(cat.id);
                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}
                    >
                      {isSelected ? <FiCheckSquare className="text-blue-600" /> : <FiSquare className="text-gray-400" />}
                      <span className={`text-sm ${isSelected ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>{cat.title}</span>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">When a vendor selects this profession, they will automatically be assigned the checked categories.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={upsert} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
              {loading ? "Saving..." : "Save Profession"}
            </button>
            <button onClick={reset} className="px-6 py-3 border rounded-lg font-bold text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfessionsPage;
