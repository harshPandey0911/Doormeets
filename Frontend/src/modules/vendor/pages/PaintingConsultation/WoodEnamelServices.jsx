import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const SHADES_WOOD = ['Teak Wood', 'Walnut', 'Mahogany', 'Dark Oak', 'Light Cedar', 'Natural Pine'];
const ENAMEL_PRODUCTS = ['Apcolyte Gloss-RP-Double', 'Apcolyte Satin Finish', 'Dulux Gloss Enamel', 'Berger Luxol Hi-Gloss'];
const SHADES_ENAMEL = ['Brilliant White', 'Signal Red', 'Oxford Blue', 'Black', 'Grey', 'Cream'];

const WoodEnamelServices = ({ consultation, onSave }) => {
  const [woodPolish, setWoodPolish] = useState({
    finish: 'GLOSSY',
    length: '',
    width: '',
    shade: 'Teak Wood',
  });

  const [enamelItems, setEnamelItems] = useState([
    { product: 'Apcolyte Gloss-RP-Double', length: '', width: '', shade: 'Brilliant White' },
  ]);

  const woodArea = (parseFloat(woodPolish.length) || 0) * (parseFloat(woodPolish.width) || 0);

  const addEnamelItem = () => {
    setEnamelItems([...enamelItems, { product: 'Apcolyte Gloss-RP-Double', length: '', width: '', shade: 'Brilliant White' }]);
  };

  const updateEnamelItem = (idx, field, val) => {
    const updated = [...enamelItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setEnamelItems(updated);
  };

  const removeEnamelItem = (idx) => {
    if (enamelItems.length > 1) {
      setEnamelItems(enamelItems.filter((_, i) => i !== idx));
    }
  };

  const handleSave = () => {
    const data = {
      woodPolish: [{
        finish: woodPolish.finish,
        length: parseFloat(woodPolish.length) || 0,
        width: parseFloat(woodPolish.width) || 0,
        area: woodArea,
        shade: woodPolish.shade,
        cost: woodArea * 25,
      }],
      enamelItems: enamelItems.map(item => {
        const area = (parseFloat(item.length) || 0) * (parseFloat(item.width) || 0);
        return {
          product: item.product,
          length: parseFloat(item.length) || 0,
          width: parseFloat(item.width) || 0,
          area,
          shade: item.shade,
          cost: area * 18,
        };
      }),
    };
    if (onSave) onSave(data);
    toast.success('Services saved!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4">
        <h2 className="text-white font-bold text-lg">Additional Services</h2>
      </div>

      <div className="p-5 space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">Wood & Enamel Services</h3>
          <p className="text-sm text-gray-500 mt-1">Customize your wood finishing and enamel painting requirements.</p>
        </div>

        {/* Wood Polish Section */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🪵</span>
            <h4 className="font-bold text-gray-800">Wood Polish</h4>
          </div>

          {/* Finish Type */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { id: 'GLOSSY', label: 'Glossy', desc: 'High Shine' },
              { id: 'MATTE', label: 'Matte', desc: 'Subtle Elegance' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setWoodPolish({ ...woodPolish, finish: f.id })}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  woodPolish.finish === f.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                <div className={`w-12 h-12 mx-auto mb-2 rounded-lg ${
                  f.id === 'GLOSSY'
                    ? 'bg-gradient-to-br from-amber-100 to-amber-300'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`} />
                <p className="font-bold text-sm text-gray-800">{f.label}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </button>
            ))}
          </div>

          {/* Dimensions */}
          <p className="text-xs text-gray-500 mb-2">Dimensions (L × W = Area)</p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              value={woodPolish.length}
              onChange={e => setWoodPolish({ ...woodPolish, length: e.target.value })}
              placeholder="10"
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-center focus:outline-none focus:border-orange-400"
            />
            <span className="text-gray-400 font-bold">×</span>
            <input
              type="number"
              value={woodPolish.width}
              onChange={e => setWoodPolish({ ...woodPolish, width: e.target.value })}
              placeholder="10"
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-center focus:outline-none focus:border-orange-400"
            />
            <span className="text-gray-400">=</span>
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-sm font-bold text-orange-600 text-center min-w-[70px]">
              {woodArea} sq ft
            </div>
          </div>

          {/* Shade */}
          <p className="text-xs text-gray-500 mb-1">Select Shade</p>
          <select
            value={woodPolish.shade}
            onChange={e => setWoodPolish({ ...woodPolish, shade: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold bg-white focus:outline-none focus:border-orange-400"
          >
            {SHADES_WOOD.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Enamel Painting Section */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎨</span>
            <h4 className="font-bold text-gray-800">Enamel Painting</h4>
          </div>

          {enamelItems.map((item, idx) => {
            const enamelArea = (parseFloat(item.length) || 0) * (parseFloat(item.width) || 0);
            return (
              <div key={idx} className="mb-4 bg-white rounded-xl p-3 border border-gray-200">
                {enamelItems.length > 1 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500 font-semibold">Item {idx + 1}</span>
                    <button onClick={() => removeEnamelItem(idx)} className="text-red-400 hover:text-red-600 text-xs">✕ Remove</button>
                  </div>
                )}
                {/* Product */}
                <p className="text-xs text-gray-500 mb-1">Select Item/Product</p>
                <select
                  value={item.product}
                  onChange={e => updateEnamelItem(idx, 'product', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold bg-white focus:outline-none focus:border-orange-400 mb-3"
                >
                  {ENAMEL_PRODUCTS.map(p => <option key={p}>{p}</option>)}
                </select>

                {/* Dimensions */}
                <p className="text-xs text-gray-500 mb-1">Dimensions (L × W = Area)</p>
                <div className="flex items-center gap-2 mb-3">
                  <input type="number" value={item.length} onChange={e => updateEnamelItem(idx, 'length', e.target.value)}
                    placeholder="15" className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-center focus:outline-none focus:border-orange-400" />
                  <span className="text-gray-400 font-bold">×</span>
                  <input type="number" value={item.width} onChange={e => updateEnamelItem(idx, 'width', e.target.value)}
                    placeholder="8" className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-center focus:outline-none focus:border-orange-400" />
                  <span className="text-gray-400">=</span>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 text-sm font-bold text-orange-600 text-center min-w-[70px]">
                    {enamelArea} sq ft
                  </div>
                </div>

                {/* Shade */}
                <p className="text-xs text-gray-500 mb-1">Select Shade</p>
                <select
                  value={item.shade}
                  onChange={e => updateEnamelItem(idx, 'shade', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold bg-white focus:outline-none focus:border-orange-400"
                >
                  {SHADES_ENAMEL.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            );
          })}

          {/* Add Another */}
          <button
            onClick={addEnamelItem}
            className="w-full py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-500 font-bold text-sm hover:bg-orange-50 transition-all"
          >
            + Add Another Enamel Item
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
        >
          Save Services
        </button>
      </div>
    </div>
  );
};

export default WoodEnamelServices;
