/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CollapsibleSection, FieldGroup } from '../components/UI';
import { InspectionData, ConstructionRow } from '../types';
import { Plus, Check, Circle, AlertTriangle, Trash2, Copy, Image, Camera, X } from 'lucide-react';

interface ConstructionType {
  id: string;
  label: string;
  status: 'todo' | 'warning' | 'completed';
}

interface ConstructieViewProps {
  data: InspectionData;
  onChange: (rows: ConstructionRow[]) => void;
}

const ConstructieView: React.FC<ConstructieViewProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'Deur' | 'Raam' | 'Paneel' | 'Gevel' | 'Vloer' | 'Dak'>('Deur');
  const tabs: ('Deur' | 'Raam' | 'Paneel' | 'Gevel' | 'Vloer' | 'Dak')[] = ['Deur', 'Raam', 'Paneel', 'Gevel', 'Vloer', 'Dak'];
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [editingRow, setEditingRow] = useState<ConstructionRow | null>(null);

  const handleDirectUpload = (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const dataUrl = re.target?.result as string;
        onChange(constructies.map(r => {
          if (r.id === rowId) {
            return {
              ...r,
              photoUrl: dataUrl,
              photoTag: `[${r.type}] ${r.naam}`
            };
          }
          return r;
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const constructies = data.constructies || [];

  const handleAddRow = () => {
    const newId = `c-${Date.now()}`;
    const newRow: ConstructionRow = { 
      id: newId,
      type: activeTab,
      naam: `Nieuwe ${activeTab.toLowerCase()}`, 
      locatie: 'voorgevel',
      invoer: 'Beslisschema', 
      isolatie: 'Yes', 
      area: '0.00',
      rc: '0.0',
      dakType: activeTab === 'Dak' ? 'Hellend dak' : undefined,
    };
    setEditingRow(newRow);
  };

  const handleSave = (updatedRow: ConstructionRow) => {
    const exists = constructies.some(r => r.id === updatedRow.id);
    if (exists) {
      onChange(constructies.map(r => r.id === updatedRow.id ? updatedRow : r));
    } else {
      onChange([...constructies, updatedRow]);
    }
    setEditingRow(null);
  };

  const handleCopyRow = (idx: number) => {
    const currentRows = constructies.filter(r => r.type === activeTab);
    const rowToCopy = currentRows[idx];
    const newId = `c-${Date.now()}`;
    onChange([...constructies, { ...rowToCopy, id: newId, naam: `${rowToCopy.naam} (kopie)` }]);
  };

  const handleDeleteRow = (idx: number) => {
    const currentRows = constructies.filter(r => r.type === activeTab);
    const rowToDelete = currentRows[idx];
    onChange(constructies.filter(r => r.id !== rowToDelete.id));
  };

  const handleUpdateCell = (indexInTab: number, field: keyof ConstructionRow, value: string) => {
    const currentTabRows = constructies.filter(r => r.type === activeTab);
    const rowToUpdate = currentTabRows[indexInTab];
    
    onChange(constructies.map(r => r.id === rowToUpdate.id ? { ...r, [field]: value } : r));
  };

  const handleUpdateFlag = (row: ConstructionRow, val: 'red' | 'yellow' | 'green' | undefined) => {
    onChange(constructies.map(r => r.id === row.id ? { ...r, flag: val } : r));
  };

  const currentRows = constructies.filter(r => r.type === activeTab);

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden h-full">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Constructie - {activeTab}</h1>
        <button 
          onClick={handleAddRow}
          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus size={12} /> Add {activeTab.toLowerCase()}
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-sm w-fit border border-gray-200" id="constructie-tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col" id="constructie-table-container">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse border-spacing-0" id="constructie-matrix-table">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-[10px] font-bold text-gray-700 sticky left-0 bg-gray-50 z-40 min-w-[250px]" id="header-naam">Naam</th>
                {activeTab === 'Dak' && (
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-700 sticky left-[250px] bg-gray-50 z-35 min-w-[120px]" id="header-dak-type">Type</th>
                )}

                <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[100px]" id="header-invoer">Invoer</th>
                
                {activeTab === 'Deur' && (
                  <>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[100px]">Isolatie aanwezig</th>
                  </>
                )}

                {activeTab === 'Raam' && (
                  <>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700">Kozijn</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700">Glas</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Merk & Type</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">U (niet grenzend)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">U (grenzend)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">g (-)</th>
                  </>
                )}

                {activeTab === 'Paneel' && (
                  <>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[100px]">Isolatie aanwezig</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Dikte</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700">Kozijn</th>
                  </>
                )}

                {activeTab === 'Gevel' && (
                  <>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[100px]">Isolatie aanwezig</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Merk & Type</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Dikte</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Bouwjaar</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Oriëntatie</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Rc</th>
                  </>
                )}

                {activeTab === 'Vloer' && (
                  <>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[100px]">Isolatie aanwezig</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Merk & Type</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Dikte</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Bouwjaar</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Rc</th>
                  </>
                )}

                {activeTab === 'Dak' && (
                  <>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[100px]">Isolatie aanwezig</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Merk & Type</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Dikte</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Bouwjaar</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Oriëntatie</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Rc</th>
                  </>
                )}

                {activeTab !== 'Deur' && activeTab !== 'Raam' && activeTab !== 'Paneel' && activeTab !== 'Gevel' && activeTab !== 'Vloer' && activeTab !== 'Dak' && (
                  <>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[100px]">Isolatie aanwezig</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700">Kozijn</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700">Glas</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700">g-Invoer</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Merk & Type</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700">Type</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">U (niet g.)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">U (grenz.)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">g</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Dikte</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 min-w-[120px]">Bouwjaar</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center">Rc</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center min-w-[80px]">Rc (Woonwagens)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center min-w-[80px]">Rc (Woonboten)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-700 text-center min-w-[100px]">Rc (Woonboten grenst aan water)</th>
                  </>
                )}
                {(activeTab === 'Deur' || activeTab === 'Raam' || activeTab === 'Paneel') && (
                  <th className="px-3 py-2 text-[10px] font-bold text-gray-700 w-20 text-center sticky right-[240px] bg-gray-50 z-30">U-waarde</th>
                )}
                <th className="px-3 py-2 text-[10px] font-bold text-gray-700 w-20 text-center sticky right-[160px] bg-gray-50 z-30">Foto</th>
                <th className="px-3 py-2 text-[10px] font-bold text-gray-700 w-16 text-center sticky right-24 bg-gray-50 z-30">Action</th>
                <th className="px-3 py-2 text-[10px] font-bold text-gray-700 w-24 text-center sticky right-0 bg-gray-50 z-30">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentRows.map((row, idx) => (
                <tr 
                  key={row.id || idx} 
                  className="hover:bg-primary/5 cursor-pointer group transition-colors select-none"
                  onClick={() => setEditingRow(row)}
                >
                  <td className="px-3 py-2.5 sticky left-0 bg-white z-20 group-hover:bg-primary/5 min-w-[250px] text-[10px] font-bold text-gray-900">
                    {row.naam || '-'}
                  </td>
                  {activeTab === 'Dak' && (
                    <td className="px-3 py-2.5 sticky left-[250px] bg-white z-10 group-hover:bg-primary/5 min-w-[120px] text-[10px] font-bold text-primary">
                      {row.dakType || 'Hellend dak'}
                    </td>
                  )}

                  <td className="px-3 py-2.5 text-[10px] font-medium text-gray-700">
                    <div>{row.invoer || '-'}</div>
                    {row.invoer === 'Kwaliteitsverklaring' && row.merk && (
                      <div className="text-[9px] text-[#00838f] font-semibold mt-0.5">
                        Merk: {row.merk}
                      </div>
                    )}
                  </td>
                  
                  {activeTab === 'Deur' && (
                    <td className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-700">
                      {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? 'Yes' : 'No'}
                    </td>
                  )}

                  {activeTab === 'Raam' && (
                    <>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700">
                        {row.kozijn || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700">
                        {row.glas || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.merk || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.uNiet || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.uGren || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.g || '-'}
                      </td>
                    </>
                  )}

                  {activeTab === 'Paneel' && (
                    <>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-700">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.dikte || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700">
                        {row.kozijn || '-'}
                      </td>
                    </>
                  )}

                  {activeTab === 'Gevel' && (
                    <>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-700">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.merk || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.dikte || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.bouwjaar || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700">
                        {row.orientation || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-primary font-mono">
                        {row.rc || '-'}
                      </td>
                    </>
                  )}

                  {activeTab === 'Vloer' && (
                    <>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-700">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.merk || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.dikte || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.bouwjaar || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-primary font-mono">
                        {row.rc || '-'}
                      </td>
                    </>
                  )}

                  {activeTab === 'Dak' && (
                    <>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-700">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.merk || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.dikte || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.bouwjaar || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700">
                        {row.orientation || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-primary font-mono">
                        {row.rc || '-'}
                      </td>
                    </>
                  )}

                  {activeTab !== 'Deur' && activeTab !== 'Raam' && activeTab !== 'Paneel' && activeTab !== 'Gevel' && activeTab !== 'Vloer' && activeTab !== 'Dak' && (
                    <>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-gray-700">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? 'Yes' : 'No'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700">
                        {row.kozijn || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700">
                        {row.glas || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.gInvoer || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.merk || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.type || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.uNiet || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.uGren || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.g || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.dikte || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-gray-500 italic">
                        {row.bouwjaar || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-bold text-primary font-mono">
                        {row.rc || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.rcWw || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.rcWb || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-medium text-gray-700 font-mono">
                        {row.rcWbWater || '-'}
                      </td>
                    </>
                  )}
                   {/* U-waarde column cell */}
                  {(activeTab === 'Deur' || activeTab === 'Raam' || activeTab === 'Paneel') && (
                    <td className="px-3 py-2.5 text-center sticky right-[240px] bg-white z-10 group-hover:bg-primary/5 min-w-[80px] w-20 text-[10px] font-mono font-bold text-primary">
                      {row.uWaarde || '-'}
                    </td>
                  )}
                  {/* Foto column cell */}
                  <td className="px-3 py-2.5 text-center sticky right-[160px] bg-white z-10 group-hover:bg-primary/5 min-w-[80px] w-20">
                    <div className="flex items-center justify-center">
                      {row.photoUrl ? (
                        <div 
                          className="relative group/pic cursor-pointer" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedPhoto(row.photoUrl || null); 
                            setLightboxTitle(row.naam); 
                          }}
                        >
                          <img 
                            src={row.photoUrl} 
                            alt={row.naam} 
                            className="w-10 h-8 object-cover rounded shadow-sm hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">Geen foto</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center sticky right-24 bg-white z-10 group-hover:bg-primary/5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleCopyRow(idx)}
                        className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors inline-flex items-center justify-center cursor-pointer font-bold"
                        title="Copy row"
                      >
                        <Copy size={12} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-55 rounded transition-colors inline-flex items-center justify-center cursor-pointer font-bold"
                        title="Delete row"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center sticky right-0 bg-white z-10 group-hover:bg-primary/5 min-w-[96px] w-24">
                    <div className="flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center w-16 h-[12px] bg-slate-100 border border-slate-200 rounded-[4px] overflow-hidden p-[1px] gap-[1px] shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateFlag(row, row.flag === 'red' ? undefined : 'red')}
                          className={`h-full flex-1 rounded-[2.5px] transition-all duration-150 cursor-pointer ${
                            row.flag === 'red'
                              ? 'bg-red-600 shadow-xs scale-y-110'
                              : 'bg-red-100 hover:bg-red-200'
                          }`}
                          title="Rood - Informatie kan onjuist zijn / Hoge prioriteit"
                        />
                        <div className="w-[1px] h-full bg-slate-200" />
                        <button
                          type="button"
                          onClick={() => handleUpdateFlag(row, row.flag === 'yellow' ? undefined : 'yellow')}
                          className={`h-full flex-1 rounded-[1px] transition-all duration-150 cursor-pointer ${
                            row.flag === 'yellow'
                              ? 'bg-amber-400 shadow-xs scale-y-110'
                              : 'bg-amber-100 hover:bg-amber-250'
                          }`}
                          title="Geel - Backoffice twijfelt over deze vraag"
                        />
                        <div className="w-[1px] h-full bg-slate-200" />
                        <button
                          type="button"
                          onClick={() => handleUpdateFlag(row, row.flag === 'green' ? undefined : 'green')}
                          className={`h-full flex-1 rounded-[2.5px] transition-all duration-150 cursor-pointer ${
                            row.flag === 'green'
                              ? 'bg-green-600 shadow-xs scale-y-110'
                              : 'bg-green-100 hover:bg-green-250'
                          }`}
                          title="Groen - Backoffice heeft bevestiging"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Detail Popup Modal (New edit/add screen) */}
      {editingRow && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingRow(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <span className="text-[10px] font-bold uppercase">{editingRow.type[0]}</span>
                </div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  {constructies.some(r => r.id === editingRow.id) ? 'Bewerken' : 'Toevoegen'} ({editingRow.type})
                </h3>
              </div>
              <button 
                onClick={() => setEditingRow(null)}
                className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Naam */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">Naam</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-semibold"
                  value={editingRow.naam || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, naam: e.target.value })}
                  placeholder="Bijv. Voordeur, Achterdeur..."
                />
              </div>

              {/* Custom type-specific Dak details directly under Naam */}
              {editingRow.type === 'Dak' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">Dak Type</label>
                  <select
                    className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-semibold bg-white cursor-pointer"
                    value={editingRow.dakType || 'Hellend dak'}
                    onChange={(e) => setEditingRow({ ...editingRow, dakType: e.target.value })}
                  >
                    <option value="Hellend dak">Hellend dak</option>
                    <option value="Plat dak">Plat dak</option>
                  </select>
                </div>
              )}

              {/* Invoer option dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">Invoer</label>
                <select
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-semibold bg-white cursor-pointer"
                  value={editingRow.invoer || 'Beslisschema'}
                  onChange={(e) => setEditingRow({ ...editingRow, invoer: e.target.value })}
                >
                  <option value="Beslisschema">Beslisschema</option>
                  <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                </select>
              </div>

              {editingRow.invoer === 'Kwaliteitsverklaring' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">Merk & type</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-semibold"
                    value={editingRow.merk || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, merk: e.target.value })}
                    placeholder="Voer merk & type in..."
                    id="input-merk-type"
                  />
                </div>
              )}

              {/* Isolatie aanwezig option dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">Isolatie aanwezig</label>
                <select
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-semibold bg-white cursor-pointer"
                  value={editingRow.isolatie === 'Ja' || editingRow.isolatie === 'Yes' ? 'Yes' : 'No'}
                  onChange={(e) => setEditingRow({ ...editingRow, isolatie: e.target.value })}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Vlag / Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1.5">Vlag / Status</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRow({ ...editingRow, flag: editingRow.flag === 'red' ? undefined : 'red' })}
                    className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      editingRow.flag === 'red'
                        ? 'bg-red-650! bg-red-600 text-white border-red-700 hover:bg-red-700'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                    }`}
                  >
                    Rood (Fout)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRow({ ...editingRow, flag: editingRow.flag === 'yellow' ? undefined : 'yellow' })}
                    className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      editingRow.flag === 'yellow'
                        ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                    }`}
                  >
                    Geel (Twijfel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRow({ ...editingRow, flag: editingRow.flag === 'green' ? undefined : 'green' })}
                    className={`flex-1 py-1.5 px-3 rounded text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      editingRow.flag === 'green'
                        ? 'bg-green-650! bg-green-600 text-white border-green-700 hover:bg-green-700'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                    }`}
                  >
                    Groen (Akkoord)
                  </button>
                </div>
              </div>

              {/* U-waarde */}
              {(editingRow.type === 'Deur' || editingRow.type === 'Raam' || editingRow.type === 'Paneel') && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">U-waarde</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all font-mono font-bold"
                    value={editingRow.uWaarde || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, uWaarde: e.target.value })}
                    placeholder="e.g. 1.6"
                  />
                </div>
              )}

              {/* Extra specifications for tabs outside Deur */}
              {editingRow.type !== 'Deur' && (
                <div className="border-t border-gray-100 pt-3 mt-3 grid grid-cols-2 gap-2.5">
                  {editingRow.rc !== undefined && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400">Rc-waarde</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                        value={editingRow.rc || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, rc: e.target.value })}
                      />
                    </div>
                  )}
                  {editingRow.dikte !== undefined && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400">Dikte [mm]</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                        value={editingRow.dikte || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, dikte: e.target.value })}
                      />
                    </div>
                  )}
                  {editingRow.bouwjaar !== undefined && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400">Bouwjaar</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                        value={editingRow.bouwjaar || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, bouwjaar: e.target.value })}
                      />
                    </div>
                  )}
                  {editingRow.orientation !== undefined && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400">Oriëntatie</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        value={editingRow.orientation || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, orientation: e.target.value })}
                      />
                    </div>
                  )}
                  {editingRow.kozijn !== undefined && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400">Kozijn</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        value={editingRow.kozijn || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, kozijn: e.target.value })}
                      />
                    </div>
                  )}
                  {editingRow.glas !== undefined && (
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400">Glas</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        value={editingRow.glas || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, glas: e.target.value })}
                      />
                    </div>
                  )}
                  {editingRow.merk !== undefined && (
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold uppercase text-gray-400">Merk & Type</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        value={editingRow.merk || ''}
                        onChange={(e) => setEditingRow({ ...editingRow, merk: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Foto uploaden & preview */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-1">Foto</label>
                {editingRow.photoUrl ? (
                  <div className="relative group/editpic rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={editingRow.photoUrl} 
                      alt={editingRow.naam} 
                      className="w-full h-36 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                        type="button"
                        onClick={() => setEditingRow({ ...editingRow, photoUrl: undefined, photoTag: undefined })}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Verwijder afbeelding
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded p-4 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100/50 transition-colors">
                    <Camera size={20} className="text-gray-450 mb-1" />
                    <p className="text-[10px] text-gray-500 mb-2 font-medium">Selecteer een afbeelding om te koppelen</p>
                    <input 
                      type="file" 
                      id="modal-photo-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            const dataUrl = re.target?.result as string;
                            setEditingRow({
                              ...editingRow,
                              photoUrl: dataUrl,
                              photoTag: `[${editingRow.type}] ${editingRow.naam}`
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-[9px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
                      onClick={() => document.getElementById('modal-photo-upload')?.click()}
                    >
                      Koppel foto
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2 text-right">
              <button 
                onClick={() => setEditingRow(null)}
                className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded transition-colors cursor-pointer animate-none"
              >
                Annuleren
              </button>
              <button 
                onClick={() => handleSave(editingRow)}
                className="px-3.5 py-1.5 bg-primary hover:bg-[#00838f] text-white text-xs font-bold rounded transition-colors cursor-pointer animate-none"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-w-2xl w-full border border-gray-100 flex flex-col relative animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Image size={16} className="text-primary animate-pulse" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{lightboxTitle || 'Foto Preview'}</h3>
              </div>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full transition-colors cursor-pointer"
                title="Sluiten"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-gray-900 max-h-[75vh]">
              <img 
                src={selectedPhoto} 
                alt="Preview" 
                className="max-w-full max-h-[60vh] object-contain rounded-xs border border-gray-800 shadow" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstructieView;
