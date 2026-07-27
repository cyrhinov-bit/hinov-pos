import React, { useState, useMemo } from 'react';
import { WarehouseSupplier, EnrichedProduct } from './types';

interface SuppliersTabProps {
  suppliers: WarehouseSupplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<WarehouseSupplier[]>>;
  products: EnrichedProduct[];
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({
  suppliers,
  setSuppliers,
  products,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSup, setSelectedSup] = useState<WarehouseSupplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  // Calculate product counts per supplier dynamically
  const supplierProductCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    products.forEach((p) => {
      const sup = p.supplierName || 'Global Tech Dist.';
      counts[sup] = (counts[sup] || 0) + 1;
    });
    return counts;
  }, [products]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSup: WarehouseSupplier = {
      id: `SUP-${Date.now().toString().slice(-3)}`,
      name: name.trim(),
      contact: contact.trim() || 'Non spécifié',
      phone: phone.trim() || 'Non spécifié',
      email: email.trim() || 'Non spécifié',
      address: address.trim() || 'Non spécifié',
      notes: notes.trim() || 'Aucun mémo.',
      active: true,
      productsProvided: 0,
    };

    setSuppliers((prev) => [...prev, newSup]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSup || !name.trim()) return;

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === selectedSup.id
          ? {
              ...s,
              name: name.trim(),
              contact: contact.trim(),
              phone: phone.trim(),
              email: email.trim(),
              address: address.trim(),
              notes: notes.trim(),
            }
          : s
      )
    );
    setShowEditModal(false);
    resetForm();
  };

  const toggleActive = (sup: WarehouseSupplier) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === sup.id ? { ...s, active: !s.active } : s))
    );
  };

  const resetForm = () => {
    setName('');
    setContact('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setSelectedSup(null);
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contact.toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900">Fournisseurs & Partenaires</h3>
          <p className="text-xs text-gray-500">Supervisez les fiches d'identité de vos fournisseurs et l'historique logistique des flux entrants</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-2.5 bg-[#3525cd] text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4f46e5] flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Créer un Fournisseur
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#c7c4d8]/40 shadow-sm">
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom ou contact principal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#3525cd]"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSuppliers.map((sup) => {
          const productCount = supplierProductCounts[sup.name] || 0;
          return (
            <div
              key={sup.id}
              className={`bg-white rounded-3xl border border-[#c7c4d8]/40 shadow-sm p-6 space-y-4 hover:border-[#3525cd] transition-all duration-300 ${
                !sup.active ? 'opacity-60 bg-gray-50/40' : ''
              }`}
            >
              {/* Top supplier identity block */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base text-gray-900">{sup.name}</h4>
                  <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md inline-block mt-1">
                    {sup.id}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase ${
                    sup.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {sup.active ? 'Actif' : 'Désactivé'}
                </span>
              </div>

              {/* Information body grids */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Contact</span>
                  <p className="font-bold text-gray-800">{sup.contact}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Téléphone</span>
                  <p className="font-mono text-gray-800">{sup.phone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Email</span>
                  <p className="font-medium text-gray-800 truncate">{sup.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Produits Fournis</span>
                  <p className="font-bold text-gray-800">{productCount} références</p>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-gray-400 font-bold uppercase text-[9px]">Adresse d'expédition</span>
                <p className="text-gray-600 leading-snug">{sup.address}</p>
              </div>

              {sup.notes && (
                <div className="p-3 bg-gray-50/50 rounded-xl text-[11px] text-gray-500 italic border border-gray-100 leading-snug">
                  "{sup.notes}"
                </div>
              )}

              {/* Actions & Delivery status */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">local_shipping</span>
                  Livraisons : 100% à l'heure
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSup(sup);
                      setName(sup.name);
                      setContact(sup.contact);
                      setPhone(sup.phone);
                      setEmail(sup.email);
                      setAddress(sup.address);
                      setNotes(sup.notes);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Modifier"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => toggleActive(sup)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      sup.active ? 'text-emerald-500 hover:text-[#ba1a1a] hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={sup.active ? 'Désactiver' : 'Réactiver'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {sup.active ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Créer un Fournisseur</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">Créez une fiche de fournisseur principal ou secondaire</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom de l'Entreprise *</label>
                <input
                  type="text"
                  required
                  placeholder="ex. Global Tech Dist."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Contact Principal</label>
                  <input
                    type="text"
                    placeholder="ex. Jean Dupont"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Téléphone</label>
                  <input
                    type="text"
                    placeholder="ex. +33 1 23 45 67 89"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Email</label>
                <input
                  type="email"
                  placeholder="ex. contact@fournisseur.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Adresse</label>
                <input
                  type="text"
                  placeholder="ex. 15 Rue de l'Usine, Lyon"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Notes & Mémos</label>
                <textarea
                  placeholder="Spécifiez des notes, délais de livraison standard..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3525cd]"
                ></textarea>
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
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && selectedSup && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Modifier le Fournisseur</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium">Éditez les informations de : {selectedSup.name}</p>

            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Nom de l'Entreprise *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Contact Principal</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-600 uppercase">Notes & Mémos</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none"
                ></textarea>
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
