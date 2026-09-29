import React, { useState } from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { EnvelopeElement } from '../../types';
import { ExteriorGeometrySection } from './ExteriorGeometrySection';
import { AppSelect } from '../../../../../components/common/AppSelect';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Filter, 
  ExternalLink, 
  Info,
  Maximize2,
  FileCheck,
  Table,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';

interface ThermalEnvelopeProps {
  envelope: EnvelopeElement[];
  facadesData?: any[];
  onUpdateEnvelope: (elements: EnvelopeElement[]) => void;
  onUpdateFacadesData?: (data: any[]) => void;
  onOpenBcrgForElement: (elementId: string) => void;
  selectedElementId?: string;
  onSelectElement: (id: string) => void;
  onNavigateToChapter?: (chapter: any) => void;
  projectAddress?: string;
  projectNumber?: string;
}

export const ThermalEnvelope: React.FC<ThermalEnvelopeProps> = ({
  envelope,
  facadesData,
  onUpdateEnvelope,
  onUpdateFacadesData,
  onOpenBcrgForElement,
  selectedElementId,
  onSelectElement,
  onNavigateToChapter,
  projectAddress,
  projectNumber
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'audit_report' | 'nta_table'>('audit_report');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddingElement, setIsAddingElement] = useState<boolean>(false);

  // New element form state
  const [newCode, setNewCode] = useState<string>('GEV-03');
  const [newName, setNewName] = useState<string>('Zijgevel spouwmuur');
  const [newType, setNewType] = useState<EnvelopeElement['type']>('gevel');
  const [newOrientation, setNewOrientation] = useState<EnvelopeElement['orientation']>('W');
  const [newArea, setNewArea] = useState<number>(24.5);
  const [newLength, setNewLength] = useState<number | ''>('');
  const [newWidth, setNewWidth] = useState<number | ''>('');
  const [newRc, setNewRc] = useState<number>(3.8);
  const [newUValue, setNewUValue] = useState<number>(1.2);
  const [newInsulationType, setNewInsulationType] = useState<string>('Minerale wol / EPS parels');
  const [newThickness, setNewThickness] = useState<number>(80);

  const typeOptions = [
    { value: 'gevel', label: t('nav.gevel') },
    { value: 'dak', label: t('nav.dak') },
    { value: 'vloer', label: t('nav.vloer') },
    { value: 'raam', label: t('thermalEnvelope.framesAndGlass') },
    { value: 'deur', label: t('thermalEnvelope.door') }
  ];

  const insulationOptions = [
    'Minerale wol',
    'EPS / XPS',
    'PIR / PUR',
    'Glaswol',
    'Steenwol',
    'Cellenglas',
    'Vlas / Hennep',
    'Ongeïsoleerd',
    'Minerale wol / EPS parels'
  ];

  const glazingOptions = [
    'Enkel glas',
    'Dubbel glas',
    'HR',
    'HR+',
    'HR++',
    'HR+++ Triple',
    'Voorzetraam'
  ];

  const handleUpdateItem = (id: string, updates: Partial<EnvelopeElement>) => {
    const updated = envelope.map((el) => (el.id === id ? { ...el, ...updates } : el));
    onUpdateEnvelope(updated);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateEnvelope(envelope.filter((el) => el.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newElement: EnvelopeElement = {
      id: `env-${Date.now()}`,
      code: newCode,
      name: newName,
      type: newType,
      orientation: newOrientation,
      area: newArea,
      length: newLength === '' ? undefined : newLength,
      width: newWidth === '' ? undefined : newWidth,
      rc: newType === 'raam' || newType === 'deur' ? undefined : newRc,
      uValue: newType === 'raam' || newType === 'deur' ? newUValue : undefined,
      insulationType: newInsulationType,
      insulationThicknessMm: newThickness,
      qualityStatement: false,
      verified: true
    };
    onUpdateEnvelope([...envelope, newElement]);
    setIsAddingElement(false);
  };

  const filteredElements = envelope.filter((el) => {
    if (filterType !== 'all' && el.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        el.code.toLowerCase().includes(term) ||
        el.name.toLowerCase().includes(term) ||
        el.insulationType.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Calculate metrics
  const totalArea = envelope.reduce((acc, el) => acc + el.area, 0);
  const opaqueElements = envelope.filter((el) => el.type !== 'raam' && el.type !== 'deur');
  const windowElements = envelope.filter((el) => el.type === 'raam' || el.type === 'deur');

  const avgRc = opaqueElements.length
    ? Math.round((opaqueElements.reduce((acc, el) => acc + (el.rc || 0) * el.area, 0) / (opaqueElements.reduce((acc, el) => acc + el.area, 0) || 1)) * 10) / 10
    : 0;

  const avgU = windowElements.length
    ? Math.round((windowElements.reduce((acc, el) => acc + (el.uValue || 1.4) * el.area, 0) / (windowElements.reduce((acc, el) => acc + el.area, 0) || 1)) * 100) / 100
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {activeTab === 'audit_report' ? (
        <ExteriorGeometrySection 
          envelope={envelope}
          facadesData={facadesData}
          onUpdateFacadesData={onUpdateFacadesData}
          onOpenBcrgForElement={onOpenBcrgForElement}
          onNavigateToChapter={onNavigateToChapter}
          onSwitchToNtaTable={() => setActiveTab('nta_table')}
          onAddEnvelopeElement={(newElement) => onUpdateEnvelope([...envelope.filter(e => e.id !== newElement.id), newElement])}
          onDeleteEnvelopeElement={(id) => onUpdateEnvelope(envelope.filter(e => e.id !== id))}
          projectAddress={projectAddress}
          projectNumber={projectNumber}
        />
      ) : (
        <>
          {/* Chapter header (NTA Table mode) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
                <Table className="w-5 h-5 text-primary" />
                <span>{t('thermalEnvelope.tableAndDeclarations')}</span>
              </h2>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setActiveTab('audit_report')}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-[#1a2f4d] text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('thermalEnvelope.toFacadesAndFrames')}</span>
              </button>

              <button
                onClick={() => setIsAddingElement(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-lg transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t('thermalEnvelope.addEnvelopeElement')}</span>
              </button>
            </div>
          </div>


      {/* Quick stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">{t('thermalEnvelope.totalArea')}</span>
          <span className="font-mono text-lg font-bold text-slate-900">{Math.round(totalArea * 10) / 10} m²</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{envelope.length} {t('thermalEnvelope.constructions')}</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">{t('thermalEnvelope.averageRc')}</span>
          <span className="font-mono text-lg font-bold text-emerald-700">{avgRc} m²K/W</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{t('thermalEnvelope.opaquePartsInfo')}</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">{t('thermalEnvelope.averageUValue')}</span>
          <span className="font-mono text-lg font-bold text-sky-700">{avgU} W/m²K</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{t('thermalEnvelope.transparentPartsInfo')}</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">{t('thermalEnvelope.qualityDeclarations')}</span>
          <span className="font-mono text-lg font-bold text-slate-900">
            {envelope.filter((e) => e.qualityStatement).length} / {envelope.length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{t('thermalEnvelope.bcrgCertified')}</span>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1 overflow-x-auto">
          <span className="text-slate-500 font-mono text-[11px] mr-1">{t('thermalEnvelope.type')}</span>
          {[
            { id: 'all', label: t('thermalEnvelope.all') },
            { id: 'gevel', label: t('thermalEnvelope.facades') },
            { id: 'dak', label: t('thermalEnvelope.roofs') },
            { id: 'vloer', label: t('thermalEnvelope.floors') },
            { id: 'raam', label: t('thermalEnvelope.framesAndGlass') }
          ].map((t_filter) => (
            <button
              key={t_filter.id}
              onClick={() => setFilterType(t_filter.id)}
              className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                filterType === t_filter.id
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t_filter.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder={t('thermalEnvelope.searchElementOrCode')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* High-density Data Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-primary text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">{t('thermalEnvelope.tableHeaders.code')}</th>
                <th className="py-3 px-3">{t('thermalEnvelope.tableHeaders.nameAndType')}</th>
                <th className="py-3 px-2">{t('thermalEnvelope.tableHeaders.orientation')}</th>
                <th className="py-3 px-3 text-right">{t('thermalEnvelope.tableHeaders.area')}</th>
                <th className="py-3 px-3 text-right">{t('thermalEnvelope.tableHeaders.rcUValue')}</th>
                <th className="py-3 px-3">{t('thermalEnvelope.tableHeaders.insulationGlazing')}</th>
                <th className="py-3 px-2 text-center">{t('thermalEnvelope.tableHeaders.bcrg')}</th>
                <th className="py-3 px-2 text-center">{t('thermalEnvelope.tableHeaders.photo')}</th>
                <th className="py-3 px-2 text-right">{t('thermalEnvelope.tableHeaders.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredElements.map((el) => {
                const isSelected = selectedElementId === el.id;
                return (
                  <tr
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Code */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                        {el.code}
                      </span>
                    </td>

                    {/* Name & Type */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{el.name}</div>
                      <select
                        value={el.type}
                        onChange={(e) => handleUpdateItem(el.id, { type: e.target.value as any })}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-slate-500 bg-transparent border border-transparent hover:border-slate-300 rounded px-1 py-0.5 outline-none block mt-0.5 w-full -ml-1 truncate max-w-[150px]"
                      >
                        {typeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Orientation */}
                    <td className="py-2.5 px-2 font-mono text-slate-700">
                      <select
                        value={el.orientation}
                        onChange={(e) =>
                          handleUpdateItem(el.id, {
                            orientation: e.target.value as EnvelopeElement['orientation']
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border border-transparent hover:border-slate-300 rounded px-1 py-0.5 text-xs outline-none truncate max-w-[100px]"
                      >
                        <option value="N">N</option>
                        <option value="NO">NO</option>
                        <option value="O">O</option>
                        <option value="ZO">ZO</option>
                        <option value="Z">Z</option>
                        <option value="ZW">ZW</option>
                        <option value="W">W</option>
                        <option value="NW">NW</option>
                        <option value="Horizontaal">{t('thermalEnvelope.options.horizontal')}</option>
                      </select>
                    </td>

                    {/* Area inline editable */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          type="number"
                          placeholder="L"
                          value={el.length || ''}
                          onChange={(e) => {
                            const l = parseFloat(e.target.value) || 0;
                            const w = el.width || 0;
                            const a = parseFloat((l * w).toFixed(2));
                            handleUpdateItem(el.id, { length: parseFloat(e.target.value) || undefined, area: a > 0 ? a : el.area });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 font-mono text-center px-1 py-0.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-primary outline-none text-[10px]"
                        />
                        <span className="text-slate-400 font-mono text-[10px]">×</span>
                        <input
                          type="number"
                          placeholder="B"
                          value={el.width || ''}
                          onChange={(e) => {
                            const w = parseFloat(e.target.value) || 0;
                            const l = el.length || 0;
                            const a = parseFloat((l * w).toFixed(2));
                            handleUpdateItem(el.id, { width: parseFloat(e.target.value) || undefined, area: a > 0 ? a : el.area });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 font-mono text-center px-1 py-0.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-primary outline-none text-[10px]"
                        />
                        <span className="text-slate-400 font-mono text-[10px]">=</span>
                        <input
                          type="number"
                          step="0.1"
                          value={el.area}
                          onChange={(e) =>
                            handleUpdateItem(el.id, { area: parseFloat(e.target.value) || 0, length: undefined, width: undefined })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 font-mono text-right px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-primary outline-none"
                        />
                      </div>
                    </td>

                    {/* Rc or U Value inline editable */}
                    <td className="py-2.5 px-3 text-right">
                      {el.type === 'raam' || el.type === 'deur' ? (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-[10px] text-slate-400 font-mono">U=</span>
                          <input
                            type="number"
                            step="0.05"
                            value={el.uValue || 1.4}
                            onChange={(e) =>
                              handleUpdateItem(el.id, { uValue: parseFloat(e.target.value) || 1.4 })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-14 font-mono font-bold text-sky-700 text-right px-1 py-0.5 bg-sky-50 border border-sky-200 rounded focus:bg-white focus:border-primary outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-[10px] text-slate-400 font-mono">Rc=</span>
                          <input
                            type="number"
                            step="0.1"
                            value={el.rc || 2.5}
                            onChange={(e) =>
                              handleUpdateItem(el.id, { rc: parseFloat(e.target.value) || 2.5 })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-14 font-mono font-bold text-emerald-800 text-right px-1 py-0.5 bg-emerald-50 border border-emerald-200 rounded focus:bg-white focus:border-primary outline-none"
                          />
                        </div>
                      )}
                    </td>

                    {/* Insulation description */}
                    <td className="py-2.5 px-3">
                      <select
                        value={el.insulationType || el.glazingType || ''}
                        onChange={(e) => {
                          if (el.type === 'raam' || el.type === 'deur') {
                            handleUpdateItem(el.id, { glazingType: e.target.value });
                          } else {
                            handleUpdateItem(el.id, { insulationType: e.target.value });
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[11px] px-1.5 py-1 bg-transparent border border-transparent hover:border-slate-300 rounded focus:bg-white focus:border-primary outline-none truncate max-w-[150px]"
                      >
                        <option value="" disabled className="text-left text-slate-700">{t('thermalEnvelope.chooseType')}</option>
                        {(el.type === 'raam' || el.type === 'deur' ? glazingOptions : insulationOptions).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {el.type !== 'raam' && el.type !== 'deur' && (
                        <div className="flex items-center space-x-1 mt-1 px-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">{t('thermalEnvelope.thickness')}</span>
                          <input
                            type="number"
                            value={el.insulationThicknessMm || ''}
                            onChange={(e) => handleUpdateItem(el.id, { insulationThicknessMm: parseInt(e.target.value, 10) || 0 })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-12 text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-1 outline-none focus:border-primary"
                            placeholder="mm"
                          />
                        </div>
                      )}
                    </td>

                    {/* BCRG Quality badge */}
                    <td className="py-2.5 px-2 text-center">
                      {el.qualityStatement ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBcrgForElement(el.id);
                          }}
                           className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono hover:bg-emerald-200 transition"
                           title={`${t('thermalEnvelope.activeQualityDeclaration')} ${el.bcrgCode || 'BCRG'}`}
                         >
                           <ShieldCheck className="w-3 h-3 mr-0.5" />
                           <span>{t('thermalEnvelope.yes')}</span>
                         </button>
                       ) : (
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             onOpenBcrgForElement(el.id);
                           }}
                           className="text-[10px] text-slate-400 hover:text-[#2563eb] underline"
                         >
                           {t('thermalEnvelope.link')}
                         </button>
                       )}
                    </td>

                    {/* Photo reference */}
                    <td className="py-2.5 px-2 text-center">
                      {el.inspectionPhotoUrl ? (
                        <a
                          href={el.inspectionPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-block p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200 transition"
                          title={t('thermalEnvelope.viewInspectionPhoto')}
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(el.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                        title={t('thermalEnvelope.deleteConstruction')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Element Drawer Modal */}
      {isAddingElement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden">
            <div className="bg-primary text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">{t('thermalEnvelope.addNewEnvelopeElementTitle')}</h3>
              <button
                onClick={() => setIsAddingElement(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('thermalEnvelope.tableHeaders.code')}</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full font-mono px-3 py-1.5 border border-slate-300 rounded outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('thermalEnvelope.constructionType')}</label>
                  <AppSelect
                    value={newType}
                    onChange={(val) => setNewType(val as EnvelopeElement['type'])}
                    options={[
                      { value: "gevel", label: t('thermalEnvelope.facadeMasonry') },
                      { value: "dak", label: t('thermalEnvelope.roofPitchedFlat') },
                      { value: "vloer", label: t('thermalEnvelope.floorGround') },
                      { value: "raam", label: t('thermalEnvelope.windowFrame') },
                      { value: "deur", label: t('thermalEnvelope.door') }
                    ]}
                    variant="white"
                    searchable={false}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('thermalEnvelope.nameDescription')}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('thermalEnvelope.tableHeaders.orientation')}</label>
                  <AppSelect
                    value={newOrientation}
                    onChange={(val) => setNewOrientation(val as EnvelopeElement['orientation'])}
                    options={[
                      { value: "N", label: "N" },
                      { value: "NO", label: "NO" },
                      { value: "O", label: "O" },
                      { value: "ZO", label: "ZO" },
                      { value: "Z", label: "Z" },
                      { value: "ZW", label: "ZW" },
                      { value: "W", label: "W" },
                      { value: "NW", label: "NW" },
                      { value: "Horizontaal", label: t('thermalEnvelope.options.horizontal') }
                    ]}
                    variant="white"
                    searchable={false}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('thermalEnvelope.areaM2')}</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      placeholder={t('thermalEnvelope.length')}
                      value={newLength}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setNewLength(val);
                        if (val !== '' && newWidth !== '') {
                          setNewArea(Math.round(val * Number(newWidth) * 100) / 100);
                        }
                      }}
                      className="w-full font-mono px-2 py-1.5 border border-slate-300 rounded outline-none text-xs"
                    />
                    <span className="text-slate-400 font-mono text-xs">×</span>
                    <input
                      type="number"
                      placeholder={t('thermalEnvelope.width')}
                      value={newWidth}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setNewWidth(val);
                        if (val !== '' && newLength !== '') {
                          setNewArea(Math.round(Number(newLength) * val * 100) / 100);
                        }
                      }}
                      className="w-full font-mono px-2 py-1.5 border border-slate-300 rounded outline-none text-xs"
                    />
                    <span className="text-slate-400 font-mono text-xs">=</span>
                    <input
                      type="number"
                      step="0.1"
                      value={newArea}
                      onChange={(e) => {
                        setNewArea(parseFloat(e.target.value) || 0);
                        setNewLength('');
                        setNewWidth('');
                      }}
                      className="w-full font-mono px-2 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-800 rounded outline-none font-bold text-xs"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    {newType === 'raam' || newType === 'deur' ? t('thermalEnvelope.uValue') : t('thermalEnvelope.rcValue')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newType === 'raam' || newType === 'deur' ? newUValue : newRc}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (newType === 'raam' || newType === 'deur') setNewUValue(val);
                      else setNewRc(val);
                    }}
                    className="w-full font-mono px-3 py-1.5 border border-slate-300 rounded outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    {newType === 'raam' || newType === 'deur' ? t('thermalEnvelope.glazing') : t('thermalEnvelope.insulationMaterial')}
                  </label>
                  <select
                    value={newInsulationType}
                    onChange={(e) => setNewInsulationType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded outline-none truncate"
                  >
                    {(newType === 'raam' || newType === 'deur' ? glazingOptions : insulationOptions).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('thermalEnvelope.thicknessMm')}</label>
                  <input
                    type="number"
                    value={newThickness}
                    onChange={(e) => setNewThickness(parseInt(e.target.value) || 0)}
                    className="w-full font-mono px-3 py-1.5 border border-slate-300 rounded outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingElement(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  {t('thermalEnvelope.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded font-medium"
                >
                  {t('thermalEnvelope.addToEnvelope')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

