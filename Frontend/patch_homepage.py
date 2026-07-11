import re

with open('src/modules/admin/pages/UserCategories/pages/HomePage.jsx', 'r') as f:
    content = f.read()

# 1. Add state for howItWorksForm
state_add = """  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false);
  const [howItWorksForm, setHowItWorksForm] = useState({ title: '', steps: [] });
"""
content = content.replace("  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false);", state_add)

# 2. Add ensureIds logic
init_add = """            isCategorySectionsVisible: hc.isCategorySectionsVisible ?? true,
            isHowItWorksVisible: hc.isHowItWorksVisible ?? true,"""
content = content.replace("            isCategorySectionsVisible: hc.isCategorySectionsVisible ?? true,", init_add)

# 3. Render Section
trust_card = '      <CardShell icon={FiGrid} title="Trust Section" action={renderArrangementControls(\'trustItems\')}>'
how_it_works_card = """      {/* ── How It Works Section ──────────────────────────────────────────────── */}
      <CardShell icon={FiGrid} title="How It Works Section" action={renderArrangementControls('howItWorks')}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Steps shown to explain the process.</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={home?.isHowItWorksVisible !== false}
              onChange={() => patchHome({ isHowItWorksVisible: !home?.isHowItWorksVisible })}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {home?.isHowItWorksVisible !== false ? 'Visible' : 'Hidden'}
            </span>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Section Title</label>
            <div className="flex gap-2">
              <input
                value={howItWorksForm.title || (home?.howItWorks?.title || '')}
                onChange={e => setHowItWorksForm(p => ({ ...p, title: e.target.value }))}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                placeholder="How it works"
              />
              <button
                type="button"
                onClick={() => patchHome({ howItWorks: { ...home?.howItWorks, title: howItWorksForm.title || (home?.howItWorks?.title || 'How it works') } })}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700"
              >
                Save Title
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-gray-800">Steps</h4>
              <button
                type="button"
                onClick={() => {
                  const currentSteps = home?.howItWorks?.steps || [];
                  patchHome({ howItWorks: { ...home?.howItWorks, steps: [...currentSteps, { id: Date.now().toString(), title: 'New Step', description: '', icon: '✓' }] } });
                }}
                className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700"
              >
                <FiPlus className="w-4 h-4" /> Add Step
              </button>
            </div>
            <div className="space-y-3">
              {(home?.howItWorks?.steps || []).map((step, idx) => (
                <div key={step.id || idx} className="p-3 border border-gray-200 rounded-xl bg-gray-50 flex gap-3">
                  <input
                    value={step.icon}
                    onChange={(e) => {
                      const newSteps = [...(home?.howItWorks?.steps || [])];
                      newSteps[idx].icon = e.target.value;
                      patchHome({ howItWorks: { ...home?.howItWorks, steps: newSteps } });
                    }}
                    placeholder="Icon"
                    className="w-12 h-10 px-2 text-center border border-gray-300 rounded-lg text-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      value={step.title}
                      onChange={(e) => {
                        const newSteps = [...(home?.howItWorks?.steps || [])];
                        newSteps[idx].title = e.target.value;
                        patchHome({ howItWorks: { ...home?.howItWorks, steps: newSteps } });
                      }}
                      placeholder="Step Title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      value={step.description}
                      onChange={(e) => {
                        const newSteps = [...(home?.howItWorks?.steps || [])];
                        newSteps[idx].description = e.target.value;
                        patchHome({ howItWorks: { ...home?.howItWorks, steps: newSteps } });
                      }}
                      placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newSteps = [...(home?.howItWorks?.steps || [])];
                      newSteps.splice(idx, 1);
                      patchHome({ howItWorks: { ...home?.howItWorks, steps: newSteps } });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg h-fit"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardShell>

"""

content = content.replace(trust_card, how_it_works_card + trust_card)

with open('src/modules/admin/pages/UserCategories/pages/HomePage.jsx', 'w') as f:
    f.write(content)

print("Patched HomePage.jsx")
