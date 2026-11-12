import React from 'react';
import { 
  ProjectDossier, 
  EnergyLabel,
  BagIdentification 
} from '../../types';
import { 
  NtaCalculationResult, 
  LABEL_COLORS 
} from '../../utils/nta8800Calculator';
import { FloorPlansCadView } from './FloorPlansCadView';
import { 
  CheckCircle2, 
  Flame, 
  Zap, 
  Sun, 
  Wind,
  FileText,
  User,
  ShieldCheck,
  Building2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import { AppSelect } from '../../../../components/common/AppSelect';
import { renderV1Field } from '../common/LegacyField';
import { KEY_ALIASES } from '../../utils/flagsSync';

interface DossierOverviewProps {
  dossier: ProjectDossier;
  calcResult: NtaCalculationResult;
  onNavigateToChapter?: (chapter: any) => void;
  onApplyOptimization?: (type: string) => void;
  onUpdateBag?: (updated: Partial<BagIdentification>) => void;
  onUpdateBewoner?: (field: keyof NonNullable<ProjectDossier['bewoner']>, value: string) => void;
  onUpdateInspector?: (field: keyof NonNullable<ProjectDossier['inspector']>, value: string) => void;
  onUpdateDossierField?: (field: keyof ProjectDossier, value: string) => void;
  onUpdateGeneralDetails?: (field: keyof NonNullable<ProjectDossier['generalDetails']>, value: string) => void;
  onUpdateTechnicalDetails?: (field: keyof NonNullable<ProjectDossier['technicalDetails']>, value: any) => void;
  onUpdateCalcOverride?: (field: keyof NtaCalculationResult, value: any) => void;
  flags?: Record<string, 'red' | 'yellow' | 'green' | null>;
  onUpdateFlag?: (fieldKey: string, flag: 'red' | 'yellow' | 'green' | null) => void;
  fieldRoles?: Record<string, string>;
  onUpdateFieldRole?: (fieldKey: string, role: string) => void;
  onAutoInspectField?: (fieldKey: string) => void;
}

const ALL_LABELS: EnergyLabel[] = ['A++++', 'A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Reusable inline input component for V2 dashboard fields
const InlineInput = ({ value, onChange, type = "text", className = "", placeholder = "Vul in..." }: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`v2-inline-input ${className}`}
  />
);

const InlineSelect = ({ value, onChange, options, className = "" }: any) => (
  <div className="v2-inline-select-wrap">
    <AppSelect
      value={value || ''}
      onChange={onChange}
      options={options}
      className={className}
      variant="compact"
      searchable={false}
    />
  </div>
);

const GboInput = ({ 
  value, 
  onChange, 
  disabled, 
  onAdd, 
  onRemove, 
  canAdd, 
  canRemove 
}: any) => {
  const [l, setL] = React.useState(value?.l ?? '');
  const [w, setW] = React.useState(value?.w ?? '');
  const [a, setA] = React.useState(value?.a ?? '');

  React.useEffect(() => {
    setL(value?.l ?? '');
    setW(value?.w ?? '');
    setA(value?.a ?? '');
  }, [value]);

  const handleLChange = (v: string) => {
    setL(v);
    const numV = parseFloat(v);
    const numW = parseFloat(w);
    if (!isNaN(numV) && !isNaN(numW)) {
      onChange({ l: v, w, a: (numV * numW).toFixed(2) });
    } else if (v === '' && w === '') {
      onChange({ l: '', w: '', a: '' });
    }
  };

  const handleWChange = (v: string) => {
    setW(v);
    const numL = parseFloat(l);
    const numV = parseFloat(v);
    if (!isNaN(numL) && !isNaN(numV)) {
      onChange({ l, w: v, a: (numL * numV).toFixed(2) });
    } else if (l === '' && v === '') {
      onChange({ l: '', w: '', a: '' });
    }
  };

  const handleAChange = (v: string) => {
    setA(v);
    setL('');
    setW('');
    onChange({ l: '', w: '', a: v });
  };

  if (disabled) {
    if (l && w) return <span className="font-sans font-semibold text-slate-700 text-xs">{`${l} m * ${w} m = ${a} m²`}</span>;
    return <span className="font-sans font-semibold text-slate-700 text-xs">{a ? `${a} m²` : '-'}</span>;
  }

  return (
    <div className="flex items-center justify-between w-full mt-0.5 pr-1">
      <div className="flex items-center space-x-1.5">
        <input 
          type="number" step="0.01" placeholder="L" value={l} 
          onChange={e => handleLChange(e.target.value)}
          className="v2-inline-input w-12 font-sans font-semibold text-[11px] text-slate-700"
        />
        <span className="text-slate-400 text-[10px]">x</span>
        <input 
          type="number" step="0.01" placeholder="W" value={w} 
          onChange={e => handleWChange(e.target.value)}
          className="v2-inline-input w-12 font-sans font-semibold text-[11px] text-slate-700"
        />
        <span className="text-slate-400 text-[10px]">=</span>
        <input 
          type="number" step="0.01" placeholder="Area" value={a} 
          onChange={e => handleAChange(e.target.value)}
          className="v2-inline-input w-16 font-sans font-semibold text-[11px] text-slate-700"
        />
      </div>

      <div className="flex items-center space-x-1 shrink-0 ml-1">
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove GBO"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {canAdd && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="p-1 rounded text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-2xs flex items-center justify-center cursor-pointer"
            title="Add another GBO (max 3)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const DossierOverview: React.FC<DossierOverviewProps> = ({
  dossier,
  calcResult,
  onNavigateToChapter,
  onUpdateBag,
  onUpdateBewoner,
  onUpdateInspector,
  onUpdateDossierField,
  onUpdateGeneralDetails,
  onUpdateTechnicalDetails,
  onUpdateCalcOverride,
  flags,
  onUpdateFlag,
  fieldRoles,
  onUpdateFieldRole,
  onAutoInspectField
}) => {
  const { t } = useLanguage();
  const currentLabelConfig = LABEL_COLORS[calcResult.label];

  const [gboCount, setGboCount] = React.useState<number>(() => {
    if (dossier.technicalDetails?.gbo3?.a || dossier.technicalDetails?.gbo3?.l || dossier.technicalDetails?.gbo3?.w) return 3;
    if (dossier.technicalDetails?.gbo2?.a || dossier.technicalDetails?.gbo2?.l || dossier.technicalDetails?.gbo2?.w) return 2;
    return 1;
  });

  React.useEffect(() => {
    if (dossier.technicalDetails?.gbo3?.a || dossier.technicalDetails?.gbo3?.l || dossier.technicalDetails?.gbo3?.w) {
      setGboCount(prev => Math.max(prev, 3));
    } else if (dossier.technicalDetails?.gbo2?.a || dossier.technicalDetails?.gbo2?.l || dossier.technicalDetails?.gbo2?.w) {
      setGboCount(prev => Math.max(prev, 2));
    }
  }, [dossier.technicalDetails]);

  const renderOverviewField = (
    fieldKey: string,
    label: string,
    inputNode: React.ReactNode,
    defaultRoleBadge: string = 'SYS'
  ) => {
    const flagVal = flags?.[fieldKey] || 
      (KEY_ALIASES[fieldKey] ? KEY_ALIASES[fieldKey].map(k => flags?.[k]).find(Boolean) : null) || null;
    const onFlag = onUpdateFlag ? (v: 'red' | 'yellow' | 'green' | null) => onUpdateFlag(fieldKey, v) : undefined;
    const activeRole = fieldRoles?.[fieldKey] || 
      (KEY_ALIASES[fieldKey] ? KEY_ALIASES[fieldKey].map(k => fieldRoles?.[k]).find(Boolean) : null) || 
      (flagVal === 'green' ? 'INS' : defaultRoleBadge);

    return renderV1Field(
      label,
      undefined,
      defaultRoleBadge,
      flagVal || 'none',
      undefined,
      'text',
      undefined,
      inputNode,
      flagVal,
      onFlag,
      activeRole,
      () => onAutoInspectField?.(fieldKey)
    );
  };

  // Callback wrappers that trigger auto-inspect on inspector edit
  const handleUpdateBag = onUpdateBag ? (updated: Partial<BagIdentification>, keys?: string[]) => {
    onUpdateBag(updated);
    if (keys) {
      keys.forEach(k => onAutoInspectField?.(k));
    } else {
      Object.keys(updated).forEach(k => onAutoInspectField?.(`bag.${k}`));
    }
  } : undefined;

  const handleUpdateBewoner = onUpdateBewoner ? (field: keyof NonNullable<ProjectDossier['bewoner']>, value: string) => {
    onUpdateBewoner(field, value);
    onAutoInspectField?.(`bewoner.${field}`);
  } : undefined;

  const handleUpdateInspector = onUpdateInspector ? (field: keyof NonNullable<ProjectDossier['inspector']>, value: string) => {
    onUpdateInspector(field, value);
    onAutoInspectField?.(`inspector.${field}`);
  } : undefined;

  const handleUpdateDossierField = onUpdateDossierField ? (field: keyof ProjectDossier, value: string) => {
    onUpdateDossierField(field, value);
    onAutoInspectField?.(field);
  } : undefined;

  const handleUpdateGeneralDetails = onUpdateGeneralDetails ? (field: keyof NonNullable<ProjectDossier['generalDetails']>, value: string) => {
    onUpdateGeneralDetails(field, value);
    onAutoInspectField?.(`generalDetails.${field}`);
  } : undefined;

  const handleUpdateTechnicalDetails = onUpdateTechnicalDetails ? (field: keyof NonNullable<ProjectDossier['technicalDetails']>, value: any) => {
    onUpdateTechnicalDetails(field, value);
    onAutoInspectField?.(`technicalDetails.${field}`);
  } : undefined;

  const handleUpdateCalcOverride = onUpdateCalcOverride;

    const bouwfaseOptions = [
    { value: 'Existing building', label: 'Existing building' },
    { value: 'New construction', label: 'New construction' },
    { value: 'Renovation', label: 'Renovation' },
    { value: 'Bestaande bouw', label: 'Bestaande bouw' },
    { value: 'Nieuwbouw', label: 'Nieuwbouw' },
    { value: 'Renovatie', label: 'Renovatie' },
  ];

  const opnameOptions = [
    { value: 'Basic recording', label: 'Basic recording' },
    { value: 'Detail recording', label: 'Detail recording' },
    { value: 'Basisopname', label: 'Basisopname' },
    { value: 'Detailopname', label: 'Detailopname' },
  ];

  const gebouwtypeOptions = [
    { value: 'Detached house', label: 'Detached house' },
    { value: 'Apartment building unit', label: 'Apartment building unit' },
    { value: 'Detached house (non-self-contained units)', label: 'Detached house (non-self-contained units)' },
    { value: 'Apartment (non-self-contained units)', label: 'Apartment (non-self-contained units)' },
    { value: 'Eengezinswoning', label: 'Eengezinswoning' },
    { value: 'Appartementsrecht', label: 'Appartementsrecht' },
  ];

  const subtypeOptions = [
    { value: 'detached', label: 'detached' },
    { value: 'endTerrace', label: 'endTerrace' },
    { value: 'midTerrace', label: 'midTerrace' },
    { value: 'semiDetached', label: 'semiDetached' },
    { value: 'Vrijstaand', label: 'Vrijstaand' },
    { value: 'Eindwoning / hoek', label: 'Eindwoning / hoek' },
    { value: 'Tussenwoning', label: 'Tussenwoning' },
  ];

  const daktypeOptions = [
    { value: 'pitchedRoof', label: 'pitchedRoof' },
    { value: 'partlyFlat', label: 'partlyFlat' },
    { value: 'flatRoof', label: 'flatRoof' },
    { value: 'Hellend dak', label: 'Hellend dak' },
    { value: 'Plat dak', label: 'Plat dak' },
  ];

  const liggingOptions = [
    { value: 'groundFloorUnit', label: 'groundFloorUnit' },
    { value: 'middleFloor', label: 'middleFloor' },
    { value: 'topFloor', label: 'topFloor' },
    { value: 'groundWithRoof', label: 'groundWithRoof' },
  ];

  const daktypeLiggingOptions = [
    { value: 'Plat dak', label: 'Plat dak' },
    { value: 'Hellend dak', label: 'Hellend dak' },
    { value: 'Deels plat dak', label: 'Deels plat dak' },
    { value: 'Plat dak / geen kap', label: 'Plat dak / geen kap' },
    { value: 'Benedenwoning', label: 'Benedenwoning' },
    { value: 'Tussenverdieping', label: 'Tussenverdieping' },
    { value: 'Bovenste verdieping', label: 'Bovenste verdieping' },
    { value: 'Benedenwoning met kap', label: 'Benedenwoning met kap' },
  ];

  const constructieOptions = [
    { value: 'Light', label: 'Light' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Heavy', label: 'Heavy' },
    { value: 'Licht', label: 'Licht' },
    { value: 'Middel', label: 'Middel' },
    { value: 'Zwaar', label: 'Zwaar' },
  ];

  const leidingOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
    { value: 'Onbekend', label: 'Onbekend' },
    { value: 'Ja', label: 'Ja' },
    { value: 'Nee', label: 'Nee' },
    { value: 'Aanwezig', label: 'Aanwezig' },
  ];

  const svbOptions = [
    { value: 'Continue exploitation', label: 'Continue exploitation' },
    { value: 'Sale', label: 'Sale' },
    { value: 'Demolition', label: 'Demolition' },
    { value: 'Minor maintenance', label: 'Minor maintenance' },
    { value: 'Major maintenance', label: 'Major maintenance' },
    { value: 'Otherwise', label: 'Otherwise' },
  ];

  const bronOptions = [
    { value: 'BAG', label: 'BAG' },
    { value: 'Bouwtekening', label: 'Bouwtekening' },
    { value: 'Eigen opname', label: 'Eigen opname' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Chapter Top Header Bar (Format matching Visuals) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.dossier.title') || '2. Overview (Gebouw & Inspectie)'}</span>
          </h1>
        </div>


      </div>

      {/* Primary BENG Calculation Result & Official Label Badge */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display font-semibold text-sm tracking-wide">
              {t('invoersheetV2.dossier.ntaResult') || 'Berekeningsresultaat & Energielabel Trap'}
            </h3>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                {dossier.bag.address} {dossier.bag.houseNumber}, {dossier.bag.city}
              </h2>
            </div>

            {/* Large Label Display Badge */}
            <div className="flex items-center space-x-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-500 block uppercase">{t('invoersheetV2.dossier.preLabel') || 'Pre-label'}</span>
                <span className="text-xs font-medium text-slate-700">{currentLabelConfig.desc}</span>
                <span className="text-[11px] font-mono text-slate-600 block mt-0.5">
                  {t('invoersheetV2.dossier.energyIndex') || 'Energie-index'}: <strong className="text-slate-900 font-bold">{Math.round((calcResult.ep2 / 160) * 100) / 100}</strong>
                </span>
              </div>
              <div className={`px-4 py-2 rounded-lg font-display font-black text-3xl tracking-tight shadow-md ${currentLabelConfig.bg} ${currentLabelConfig.text}`}>
                {calcResult.label}
              </div>
            </div>
          </div>

          {/* NTA 8800 Label Scale Bar Indicator */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                {t('invoersheetV2.dossier.labelScale') || 'Energielabel Trap (RVO EP-Online Schaal)'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Grenswaarde EP1 ≤ 0 kWh/m² voor A++++
              </span>
            </div>

            {/* Spectrum Bar */}
            <div className="grid grid-cols-11 gap-1 h-9 rounded-lg overflow-hidden p-0.5 bg-slate-100 border border-slate-200">
              {ALL_LABELS.map((lbl) => {
                const isSelected = calcResult.label === lbl;
                const cfg = LABEL_COLORS[lbl];
                return (
                  <div
                    key={lbl}
                    onClick={() => handleUpdateCalcOverride && handleUpdateCalcOverride('label', lbl)}
                    className={`flex flex-col items-center justify-center text-xs font-bold font-display rounded transition-all duration-200 relative cursor-pointer ${cfg.bg} ${cfg.text} ${
                      isSelected ? 'ring-3 ring-slate-900 z-10 scale-105 shadow-md' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[11px] md:text-xs leading-none">{lbl}</span>
                    {isSelected && (
                      <div className="absolute -bottom-2 transform translate-y-full">
                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-slate-900 mx-auto transform rotate-180"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Regulatory Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.ep1') || 'EP1 Fossiel'}</span>
                <Flame className="w-4 h-4 text-amber-600 shrink-0" />
              </div>
              <div className="w-full">
                {handleUpdateCalcOverride ? (
                  <InlineInput type="number" step="0.1" value={calcResult.ep1} onChange={(v: string) => handleUpdateCalcOverride('ep1', Number(v))} className="w-full font-mono text-base sm:text-lg font-bold text-slate-900 !min-h-[36px] !px-2.5 !py-1" />
                ) : (
                  <span className="font-mono text-base sm:text-xl font-bold text-slate-900">{calcResult.ep1}</span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 leading-tight">
                <span className="font-semibold text-slate-700">kWh/m²·jr</span> • Karakteristiek fossiel verbruik
              </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.ep2') || 'EP2 Primair'}</span>
                <Zap className="w-4 h-4 text-sky-600 shrink-0" />
              </div>
              <div className="w-full">
                {handleUpdateCalcOverride ? (
                  <InlineInput type="number" step="0.1" value={calcResult.ep2} onChange={(v: string) => handleUpdateCalcOverride('ep2', Number(v))} className="w-full font-mono text-base sm:text-lg font-bold text-slate-900 !min-h-[36px] !px-2.5 !py-1" />
                ) : (
                  <span className="font-mono text-base sm:text-xl font-bold text-slate-900">{calcResult.ep2}</span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 leading-tight">
                <span className="font-semibold text-slate-700">kWh/m²·jr</span> • Totaal primair verbruik
              </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.ep3') || 'EP3 Hernieuwbaar'}</span>
                <Sun className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="w-full">
                {handleUpdateCalcOverride ? (
                  <InlineInput type="number" value={calcResult.ep3} onChange={(v: string) => handleUpdateCalcOverride('ep3', Number(v))} className="w-full font-mono text-base sm:text-lg font-bold text-emerald-700 !min-h-[36px] !px-2.5 !py-1" />
                ) : (
                  <span className="font-mono text-base sm:text-xl font-bold text-emerald-700">{calcResult.ep3} %</span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 leading-tight">
                <span className="font-semibold text-emerald-700">% (eis &gt;50%)</span> • Hernieuwbare energie
              </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.toJuli') || 'TO_juli'}</span>
                <Wind className="w-4 h-4 text-teal-600 shrink-0" />
              </div>
              <div className="w-full">
                {handleUpdateCalcOverride ? (
                  <InlineInput type="number" step="0.01" value={calcResult.toJuli} onChange={(v: string) => handleUpdateCalcOverride('toJuli', Number(v))} className="w-full font-mono text-base sm:text-lg font-bold text-slate-900 !min-h-[36px] !px-2.5 !py-1" />
                ) : (
                  <span className="font-mono text-base sm:text-xl font-bold text-slate-900">{calcResult.toJuli}</span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 leading-tight flex items-center justify-between flex-wrap gap-0.5">
                <span className="font-semibold text-slate-700">(eis &lt;1.20)</span>
                <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 inline shrink-0" />
                  <span>Voldoet</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* IDENTIFICATIE SECTION HEADER */}
      <div className="border-b border-neutral-250 pb-2 mb-2 flex justify-between items-center">
        <h2 className="text-sm font-black text-primary uppercase tracking-wider font-sans">
          Identificatie
        </h2>
      </div>

      {/* Bewoner, Inspecteur & BID Intern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {/* Bewoner Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide uppercase">
                {t('invoersheetV2.dossier.resident') || 'Bewoner'}
              </span>
            </div>
            <User className="w-3.5 h-3.5 text-slate-300" />
          </div>

          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs items-start">
              <div className="w-full">
                {renderOverviewField(
                  'bewoner.name',
                  t('invoersheetV2.dossier.name') || 'Name',
                  handleUpdateBewoner ? (
                    <InlineInput value={dossier.bewoner?.name} onChange={(v: string) => handleUpdateBewoner('name', v)} placeholder="Bijv. Jan Jansen1" className="font-semibold" />
                  ) : (dossier.bewoner?.name || 'Jan Jansen1'),
                  'EWO'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'bewoner.contact',
                  t('invoersheetV2.dossier.contact') || 'Contact',
                  handleUpdateBewoner ? (
                    <InlineInput value={dossier.bewoner?.contact} onChange={(v: string) => handleUpdateBewoner('contact', v)} placeholder="+316123456011" className="font-semibold" />
                  ) : (dossier.bewoner?.contact || '+316123456011'),
                  'EWO'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'bewoner.email',
                  t('invoersheetV2.dossier.email') || 'Email',
                  handleUpdateBewoner ? (
                    <InlineInput type="email" value={dossier.bewoner?.email} onChange={(v: string) => handleUpdateBewoner('email', v)} placeholder="j.jansen@example.com" className="font-semibold" />
                  ) : (dossier.bewoner?.email || 'j.jansen@example.com'),
                  'EWO'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'bewoner.address',
                  t('invoersheetV2.dossier.address') || 'Adress',
                  handleUpdateBewoner ? (
                    <InlineInput value={dossier.bewoner?.address} onChange={(v: string) => handleUpdateBewoner('address', v)} placeholder="Jaagmeent 1 1356 AA Almere" className="font-semibold" />
                  ) : (dossier.bewoner?.address || 'Jaagmeent 1 1356 AA Almere'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'bewoner.postcode',
                  t('invoersheetV2.dossier.postcode') || 'Postcode',
                  handleUpdateBewoner ? (
                    <InlineInput value={dossier.bewoner?.postcode} onChange={(v: string) => handleUpdateBewoner('postcode', v)} placeholder="1356 AA" className="font-semibold" />
                  ) : (dossier.bewoner?.postcode || '1356 AA'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'bewoner.plaats',
                  t('invoersheetV2.dossier.city') || 'Plaats',
                  handleUpdateBewoner ? (
                    <InlineInput value={dossier.bewoner?.plaats} onChange={(v: string) => handleUpdateBewoner('plaats', v)} placeholder="Almere" className="font-semibold" />
                  ) : (dossier.bewoner?.plaats || dossier.bag.city || 'Almere'),
                  'INS'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inspecteur Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide uppercase">
                {t('invoersheetV2.dossier.inspector') || 'Inspecteur'}
              </span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
          </div>

          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs items-start">
              <div className="w-full">
                {renderOverviewField(
                  'inspector.name',
                  'Inspecteur Name',
                  handleUpdateInspector ? (
                    <InlineInput value={dossier.inspector?.name} onChange={(v: string) => handleUpdateInspector('name', v)} placeholder="F. Inspector" className="font-semibold" />
                  ) : (dossier.inspector?.name || 'F. Inspector'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'inspectorCertNumber',
                  'Certificaatnummer',
                  handleUpdateDossierField ? (
                    <InlineInput value={dossier.inspectorCertNumber} onChange={(v: string) => handleUpdateDossierField('inspectorCertNumber', v)} placeholder="MassEPA B.V." className="font-semibold" />
                  ) : (dossier.inspectorCertNumber || 'MassEPA B.V.'),
                  'SYS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'certificationInstitute',
                  'Certificaathouder',
                  handleUpdateDossierField ? (
                    <InlineInput value={dossier.certificationInstitute} onChange={(v: string) => handleUpdateDossierField('certificationInstitute', v)} placeholder="inspector" className="font-semibold" />
                  ) : (dossier.certificationInstitute || 'inspector'),
                  'SYS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'inspector.address',
                  'Adress',
                  handleUpdateInspector ? (
                    <InlineInput value={dossier.inspector?.address} onChange={(v: string) => handleUpdateInspector('address', v)} placeholder="Test Adress" className="font-semibold" />
                  ) : (dossier.inspector?.address || 'Test Adress'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'inspector.postcode',
                  'Postcode',
                  handleUpdateInspector ? (
                    <InlineInput value={dossier.inspector?.postcode} onChange={(v: string) => handleUpdateInspector('postcode', v)} placeholder="4541AP 11" className="font-semibold" />
                  ) : (dossier.inspector?.postcode || '4541AP 11'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'inspector.plaats',
                  'Plaats',
                  handleUpdateInspector ? (
                    <InlineInput value={dossier.inspector?.plaats} onChange={(v: string) => handleUpdateInspector('plaats', v)} placeholder="Almere" className="font-semibold" />
                  ) : (dossier.inspector?.plaats || 'Almere'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'inspector.contact',
                  'Telephone',
                  handleUpdateInspector ? (
                    <InlineInput value={dossier.inspector?.contact} onChange={(v: string) => handleUpdateInspector('contact', v)} placeholder="+316111122221" className="font-semibold" />
                  ) : (dossier.inspector?.contact || '+316111122221'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'inspector.email',
                  'Email',
                  handleUpdateInspector ? (
                    <InlineInput type="email" value={dossier.inspector?.email} onChange={(v: string) => handleUpdateInspector('email', v)} placeholder="inspector@test.com" className="font-semibold" />
                  ) : (dossier.inspector?.email || 'inspector@test.com'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'inspectionDate',
                  'Opnamedatum',
                  handleUpdateDossierField ? (
                    <InlineInput type="date" value={dossier.inspectionDate} onChange={(v: string) => handleUpdateDossierField('inspectionDate', v)} className="font-semibold text-[11px]" />
                  ) : (dossier.inspectionDate || '2026-09-01'),
                  'INS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'invoerdatum',
                  'Invoerdatum',
                  handleUpdateDossierField ? (
                    <InlineInput type="date" value={dossier.invoerdatum} onChange={(v: string) => handleUpdateDossierField('invoerdatum', v)} className="font-semibold text-[11px]" />
                  ) : (dossier.invoerdatum || '2026-07-17'),
                  'INS'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BID Intern Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide uppercase">
                BID Intern
              </span>
            </div>
            <Building2 className="w-3.5 h-3.5 text-slate-300" />
          </div>

          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs items-start">
              <div className="w-full">
                {renderOverviewField(
                  'algemeen.bidIntern.fullName',
                  'Volledige naam',
                  <InlineInput value={(dossier.bidIntern as any)?.fullName || '-'} disabled className="font-semibold" />,
                  'SYS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'algemeen.bidIntern.phoneNumber',
                  'Telefoonnummer',
                  <InlineInput value={(dossier.bidIntern as any)?.phoneNumber || '-'} disabled className="font-semibold" />,
                  'SYS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'algemeen.bidIntern.email',
                  'E-mailadres',
                  <InlineInput value={(dossier.bidIntern as any)?.email || '-'} disabled className="font-semibold" />,
                  'SYS'
                )}
              </div>
              <div className="w-full">
                {renderOverviewField(
                  'algemeen.bidIntern.contactAddress',
                  'Contactadres',
                  <InlineInput value={(dossier.bidIntern as any)?.contactAddress || '-'} disabled className="font-semibold" />,
                  'SYS'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALGEMEEN SECTION HEADER */}
      <div className="border-b border-neutral-250 pb-2 mb-2 pt-2 flex justify-between items-center">
        <h2 className="text-sm font-black text-primary uppercase tracking-wider font-sans">
          Algemeen
        </h2>
      </div>

      {/* General details Card (4 columns layout matching V1) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display font-semibold text-sm tracking-wide uppercase">
              General details
            </h3>
          </div>
          <Building2 className="w-4 h-4 text-slate-300" />
        </div>

        <div className="p-5 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs items-start">
            {/* Row 1: Complex | Financieel complex | Gemeente | Adress */}
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.complex',
                'Complex',
                handleUpdateGeneralDetails ? (
                  <InlineInput value={(dossier.generalDetails as any)?.complex || '1690'} onChange={(v: string) => handleUpdateGeneralDetails('complex' as any, v)} className="font-semibold" />
                ) : ((dossier.generalDetails as any)?.complex || '1690'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.financieelComplex',
                'Financieel complex',
                handleUpdateGeneralDetails ? (
                  <InlineInput value={(dossier.generalDetails as any)?.financieelComplex || '-'} onChange={(v: string) => handleUpdateGeneralDetails('financieelComplex' as any, v)} className="font-semibold" />
                ) : ((dossier.generalDetails as any)?.financieelComplex || '-'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'bag.municipality',
                'Gemeente',
                handleUpdateBag ? (
                  <InlineInput value={dossier.bag.municipality || dossier.bag.city || 'Almere'} onChange={(v: string) => handleUpdateBag({ municipality: v })} className="font-semibold" />
                ) : (dossier.bag.municipality || dossier.bag.city || 'Almere'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'bag.address',
                'Adress',
                handleUpdateBag ? (
                  <InlineInput value={dossier.bag.address || 'Jaagmeent 1 1356 AA Almere'} onChange={(v: string) => handleUpdateBag({ address: v })} className="font-semibold" />
                ) : (dossier.bag.address || 'Jaagmeent 1 1356 AA Almere'),
                'SYS'
              )}
            </div>

            {/* Row 2: Bouwfase | Opnametype | Postcode | Plaats */}
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.bouwfase',
                'Bouwfase',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={bouwfaseOptions} value={dossier.generalDetails?.bouwfase || 'Existing building'} onChange={(v: string) => handleUpdateGeneralDetails('bouwfase', v)} className="font-semibold" />
                ) : (dossier.generalDetails?.bouwfase || 'Existing building'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.opnametype',
                'Opnametype',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={opnameOptions} value={dossier.generalDetails?.opnametype || 'Basic recording'} onChange={(v: string) => handleUpdateGeneralDetails('opnametype', v)} className="font-semibold" />
                ) : (dossier.generalDetails?.opnametype || 'Basic recording'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'bag.postalCode',
                'Postcode',
                handleUpdateBag ? (
                  <InlineInput value={dossier.bag.postalCode || '1356 AA'} onChange={(v: string) => handleUpdateBag({ postalCode: v })} className="font-semibold" />
                ) : (dossier.bag.postalCode || '1356 AA'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'bag.city',
                'Plaats',
                handleUpdateBag ? (
                  <InlineInput value={dossier.bag.city || 'Almere'} onChange={(v: string) => handleUpdateBag({ city: v })} className="font-semibold" />
                ) : (dossier.bag.city || 'Almere'),
                'SYS'
              )}
            </div>

            {/* Row 3: Pand ID | VBO ID | Wijk | SVB-Status */}
            <div className="w-full">
              {renderOverviewField(
                'bag.pandId',
                'Pand ID',
                handleUpdateBag ? (
                  <InlineInput value={dossier.bag.pandId || '003410000029155'} onChange={(v: string) => handleUpdateBag({ pandId: v })} className="font-semibold" />
                ) : (dossier.bag.pandId || '003410000029155'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'bag.vboId',
                'VBO ID',
                handleUpdateBag ? (
                  <InlineInput value={dossier.bag.vboId || '003401000010168'} onChange={(v: string) => handleUpdateBag({ vboId: v })} className="font-sans font-semibold text-slate-700" />
                ) : (dossier.bag.vboId || '003401000010168'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.wijk',
                'Wijk',
                handleUpdateGeneralDetails ? (
                  <InlineInput value={(dossier.generalDetails as any)?.wijk || 'Waterwijk'} onChange={(v: string) => handleUpdateGeneralDetails('wijk' as any, v)} className="font-semibold" />
                ) : ((dossier.generalDetails as any)?.wijk || 'Waterwijk'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.svbStatus',
                'SVB-Status',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={svbOptions} value={(dossier.generalDetails as any)?.svbStatus || 'Continue exploitation'} onChange={(v: string) => handleUpdateGeneralDetails('svbStatus' as any, v)} className="font-semibold" />
                ) : ((dossier.generalDetails as any)?.svbStatus || 'Continue exploitation'),
                'SYS'
              )}
            </div>

            {/* Row 4: Bron */}
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.bron',
                'Bron',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={bronOptions} value={(dossier.generalDetails as any)?.bron || 'BAG'} onChange={(v: string) => handleUpdateGeneralDetails('bron' as any, v)} className="font-semibold" />
                ) : ((dossier.generalDetails as any)?.bron || 'BAG'),
                'SYS'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Technical details Card (4 columns layout matching V1) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display font-semibold text-sm tracking-wide uppercase">
              Technical details
            </h3>
          </div>
          <Building2 className="w-4 h-4 text-slate-300" />
        </div>

        <div className="p-5 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs items-start">
            {/* Row 1: Gebouwtype | Subtype | Daktype | Ligging */}
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.gebouwtype',
                'Gebouwtype',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={gebouwtypeOptions} value={dossier.generalDetails?.gebouwtype || 'Detached house'} onChange={(v: string) => handleUpdateGeneralDetails('gebouwtype', v)} className="font-semibold" />
                ) : (dossier.generalDetails?.gebouwtype || 'Detached house'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.subtype',
                'Subtype',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={subtypeOptions} value={dossier.generalDetails?.subtype || 'endTerrace'} onChange={(v: string) => handleUpdateGeneralDetails('subtype', v)} className="font-semibold" />
                ) : (dossier.generalDetails?.subtype || 'endTerrace'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.daktype',
                'Daktype',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={daktypeOptions} value={(dossier.generalDetails as any)?.daktype || dossier.generalDetails?.daktypeLigging || 'pitchedRoof'} onChange={(v: string) => handleUpdateGeneralDetails('daktype' as any, v)} className="font-semibold" />
                ) : ((dossier.generalDetails as any)?.daktype || dossier.generalDetails?.daktypeLigging || 'pitchedRoof'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.ligging',
                'Ligging',
                handleUpdateGeneralDetails ? (
                  <InlineSelect options={liggingOptions} value={(dossier.generalDetails as any)?.ligging || 'groundFloorUnit'} onChange={(v: string) => handleUpdateGeneralDetails('ligging' as any, v)} className="font-semibold" />
                ) : ((dossier.generalDetails as any)?.ligging || 'groundFloorUnit'),
                'INS'
              )}
            </div>

            {/* Row 2: Gebouwhoogte | Vloer constructietype | Wand constructietype | Leidingdoorvoeren */}
            <div className="w-full">
              {renderOverviewField(
                'generalDetails.gebouwhoogte',
                'Gebouwhoogte',
                handleUpdateGeneralDetails ? (
                  <InlineInput value={dossier.generalDetails?.gebouwhoogte || '8.5'} onChange={(v: string) => handleUpdateGeneralDetails('gebouwhoogte', v)} className="font-semibold" />
                ) : (dossier.generalDetails?.gebouwhoogte || '8.5'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.vloerConstructie',
                'Vloer constructietype',
                handleUpdateTechnicalDetails ? (
                  <InlineSelect options={constructieOptions} value={dossier.technicalDetails?.vloerConstructie || 'Medium'} onChange={(v: string) => handleUpdateTechnicalDetails('vloerConstructie', v)} className="font-semibold" />
                ) : (dossier.technicalDetails?.vloerConstructie || 'Medium'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.wandConstructie',
                'Wand constructietype',
                handleUpdateTechnicalDetails ? (
                  <InlineSelect options={constructieOptions} value={dossier.technicalDetails?.wandConstructie || 'Heavy'} onChange={(v: string) => handleUpdateTechnicalDetails('wandConstructie', v)} className="font-semibold" />
                ) : (dossier.technicalDetails?.wandConstructie || 'Heavy'),
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.leidingdoorvoeren',
                'Leidingdoorvoeren',
                handleUpdateTechnicalDetails ? (
                  <InlineSelect options={leidingOptions} value={dossier.technicalDetails?.leidingdoorvoeren || 'Yes'} onChange={(v: string) => handleUpdateTechnicalDetails('leidingdoorvoeren', v)} className="font-semibold" />
                ) : (dossier.technicalDetails?.leidingdoorvoeren || 'Yes'),
                'SYS'
              )}
            </div>

            {/* Row 3: Aantal | Aantal AVR | GBO-T_1 | GBO-T_2 */}
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.aantal',
                'Aantal',
                handleUpdateTechnicalDetails ? (
                  <InlineInput value={dossier.technicalDetails?.aantal || '12'} onChange={(v: string) => handleUpdateTechnicalDetails('aantal', v)} className="font-semibold" />
                ) : (dossier.technicalDetails?.aantal || '12'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.avr',
                'Aantal AVR',
                handleUpdateTechnicalDetails ? (
                  <InlineInput value={dossier.technicalDetails?.avr || '22'} onChange={(v: string) => handleUpdateTechnicalDetails('avr', v)} className="font-semibold" />
                ) : (dossier.technicalDetails?.avr || '22'),
                'SYS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.gbo1',
                'GBO-T_1',
                <GboInput 
                  value={dossier.technicalDetails?.gbo1 || { a: '115', l: '', w: '' }} 
                  onChange={(v: any) => handleUpdateTechnicalDetails?.('gbo1', v)} 
                  disabled={!handleUpdateTechnicalDetails} 
                  canAdd={false}
                />,
                'INS'
              )}
            </div>
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.gbo2',
                'GBO-T_2',
                <GboInput 
                  value={dossier.technicalDetails?.gbo2 || { a: '-', l: '', w: '' }} 
                  onChange={(v: any) => handleUpdateTechnicalDetails?.('gbo2', v)} 
                  disabled={!handleUpdateTechnicalDetails} 
                  canAdd={false}
                />,
                'INS'
              )}
            </div>

            {/* Row 4: GBO-T_3 */}
            <div className="w-full">
              {renderOverviewField(
                'technicalDetails.gbo3',
                'GBO-T_3',
                <GboInput 
                  value={dossier.technicalDetails?.gbo3 || { a: '-', l: '', w: '' }} 
                  onChange={(v: any) => handleUpdateTechnicalDetails?.('gbo3', v)} 
                  disabled={!handleUpdateTechnicalDetails} 
                  canAdd={false}
                />,
                'INS'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floor Plans Section */}
      <div className="w-full">
        <FloorPlansCadView />
      </div>
    </div>
  );
};


