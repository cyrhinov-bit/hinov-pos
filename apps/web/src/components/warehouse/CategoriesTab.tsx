import React, { useState, useMemo } from 'react';
import { WarehouseCategory, EnrichedProduct } from './types';

interface CategoriesTabProps {
  categories: WarehouseCategory[];
  setCategories: React.Dispatch<React.SetStateAction<WarehouseCategory[]>>;
  products: EnrichedProduct[];
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  setCategories,
  products,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<WarehouseCategory | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate dynamic product counts
  const productCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCat: WarehouseCategory = {
      name: name.trim(),
      description: description.trim() || 'Classification générique pour les articles SmartStock ERP.',
      image: image.trim() || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      active: true,
    };

    setCategories((prev) => [...prev, newCat]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !name.trim()) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.name === selectedCat.name
          ? {
              ...c,
              name: name.trim(),
              description: description.trim(),
              image: image.trim() || c.image,
            }
          : c
      )
    );
    setShowEditModal(false);
    resetForm();
  };

  const toggleActive = (cat: WarehouseCategory) => {
    if (productCounts[cat.name] > 0 && cat.active) {
      alert(`Impossible de désactiver la catégorie '${cat.name}' car elle contient actuellement ${productCounts[cat.name]} produits actifs.`);
      return;
    }

    setCategories((prev) =>
      prev.map((c) => (c.name === cat.name ? { ...c, active: !c.active } : c))
    );
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setImage('');
    setSelectedCat(null);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 font-sans">Catégories d'Articles</h3>
          <p className="text-xs text-gray-500">Organisez vos classifications pour faciliter les filtres logistiques et commerciaux</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-[#3525cd] text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4f46e5] flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Créer une Catégorie
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-2xl border border-[#c7c4d8]/40 shadow-sm">
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd]"
          />
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((cat) => {
          const count = productCounts[cat.name] || 0;
          return (
            <div
              key={cat.name}
              className={`bg-white rounded-3xl overflow-hidden border border-[#c7c4d8]/40 shadow-sm flex flex-col justify-between group hover:border-[#3525cd] transition-all duration-300 ${
                !cat.active ? 'opacity-60 bg-gray-50/40' : ''
              }`}
            >
              {/* Image banner */}
              <div className="h-40 w-full relative overflow-hidden bg-gray-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-300 bg-indigo-950/70 px-2.5 py-1 rounded-full">
                    {count} {count > 1 ? 'articles' : 'article'}
                  </span>
                </div>
              </div>

              {/* Text Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-gray-900 group-hover:text-[#3525cd] transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">
                    {cat.description}
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                      cat.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {cat.active ? 'Actif' : 'Désactivé'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCat(cat);
                        setName(cat.name);
                        setDescription(cat.description);
                        setImage(cat.image);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        cat.active ? 'text-emerald-500 hover:text-[#ba1a1a] hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={cat.active ? 'Désactiver' : 'Réactiver'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {cat.active ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Créer une Catégorie</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">Définissez une nouvelle catégorie d'articles pour votre catalogue d'entrepôt</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom de la Catégorie *</label>
                <input
                  type="text"
                  required
                  placeholder="ex. Électroménager"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Description</label>
                <textarea
                  placeholder="Éléments de définition logistique ou commerciale..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Image de Présentation (URL)</label>
                <input
                  type="url"
                  placeholder="ex. https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCat && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Modifier la Catégorie</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">Mise à jour de la classification : {selectedCat.name}</p>

            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom de la Catégorie *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Image (URL)</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3525cd] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5]"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
