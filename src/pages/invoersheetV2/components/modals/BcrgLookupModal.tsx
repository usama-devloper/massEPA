import React, { useState } from 'react';
import { BCRG_DATABASE } from '../../data/mockDossier';
import { Database, Search, ShieldCheck, Check, X } from 'lucide-react';

interface BcrgLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId?: string;
  onApplyBcrgProduct: (product: typeof BCRG_DATABASE[0], targetElementId?: string) => void;
}

export const BcrgLookupModal: React.FC<BcrgLookupModalProps> = ({
  isOpen,
  onClose,
  targetElementId,
  onApplyBcrgProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const categories = ['all', 'Spouwmuurisolatie', 'Hellend dak & houtskeletbouw', 'Vloerisolatie', 'Beglazing', 'Warmtepompen', 'Ventilatie met warmteterugwinning'];

  const filteredProducts = BCRG_DATABASE.filter((prod) => {
    if (selectedCategory !== 'all' && prod.category !== selectedCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        prod.productName.toLowerCase().includes(term) ||
        prod.manufacturer.toLowerCase().includes(term) ||
        prod.code.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-primary text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-display font-semibold text-sm">
                BCRG Kwaliteitsverklaringen Databank
              </h3>
              <p className="text-[11px] text-slate-300">
                Bureau Controle en Registratie Gelijkwaardigheidsverklaringen (NTA 8800 geaccrediteerd)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Zoek op merk, productnaam of BCRG code (bijv. Kingspan, Supafil, Daikin)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded focus:border-primary outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded outline-none"
          >
            <option value="all">Alle Categorieën</option>
            {categories.filter((c) => c !== 'all').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredProducts.map((prod) => (
            <div
              key={prod.code}
              className="p-3.5 hover:bg-slate-50 rounded-lg transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {prod.code}
                  </span>
                  <span className="font-semibold text-slate-900">{prod.productName}</span>
                </div>
                <div className="text-slate-600">
                  Fabrikant: <span className="font-medium text-slate-800">{prod.manufacturer}</span>
                  <span className="mx-2 text-slate-400">•</span>
                  Categorie: <span className="text-slate-700">{prod.category}</span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-600 pt-1">
                  {'certifiedRc' in prod && (
                    <span className="text-emerald-700 font-bold">Gecertificeerde Rc: {prod.certifiedRc} m²K/W</span>
                  )}
                  {'certifiedU' in prod && (
                    <span className="text-sky-700 font-bold">Gecertificeerde U: {prod.certifiedU} W/m²K</span>
                  )}
                  {'certifiedCOP' in prod && (
                    <span className="text-emerald-700 font-bold">Gecertificeerde COP: {prod.certifiedCOP}</span>
                  )}
                  {'efficiencyPct' in prod && (
                    <span className="text-teal-700 font-bold">WTW Rendement: {prod.efficiencyPct}%</span>
                  )}
                  <span className="text-slate-400">Geldig tot: {prod.validUntil}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyBcrgProduct(prod, targetElementId);
                  onClose();
                }}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded font-medium flex items-center space-x-1 shrink-0 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Toepassen</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium transition"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

