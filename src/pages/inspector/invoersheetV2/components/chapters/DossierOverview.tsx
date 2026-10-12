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
import { useLanguage } from '../../../../../context/LanguageContext';
import { AppSelect } from '../../../../../components/common/AppSelect';
import { renderV1Field } from '../common/LegacyField';

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
    const flagVal = flags?.[fieldKey];
    const onFlag = onUpdateFlag ? (v: 'red' | 'yellow' | 'green' | null) => onUpdateFlag(fieldKey, v) : undefined;
    const activeRole = fieldRoles?.[fieldKey] || defaultRoleBadge;
    
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
    { value: 'Bestaande bouw', label: 'Bestaande bouw' },
    { value: 'Nieuwbouw', label: 'Nieuwbouw' },
    { value: 'Renovatie', label: 'Renovatie' },
  ];

  const opnameOptions = [
    { value: 'Basisopname', label: 'Basisopname' },
    { value: 'Detailopname', label: 'Detailopname' },
  ];

  const gebouwtypeOptions = [
    { value: 'Eengezinswoning', label: 'Eengezinswoning' },
    { value: 'Appartementsrecht', label: 'Appartementsrecht' },
    { value: 'Eengezinswoning (onstandig)', label: 'Eengezinswoning (onstandig)' },
    { value: 'Appartement (onstandig)', label: 'Appartement (onstandig)' },
  ];

  const subtypeOptions = [
    { value: 'Vrijstaand', label: 'Vrijstaand' },
    { value: 'Eindwoning / hoek', label: 'Eindwoning / hoek' },
    { value: 'Kop-eind-of hoekligging', label: 'Kop-eind-of hoekligging' },
    { value: 'Tussenwoning', label: 'Tussenwoning' },
    { value: 'Twee-onder-één-kap', label: 'Twee-onder-één-kap' },
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
    { value: 'Licht', label: t('invoersheetV2.dossier.constructionOptions.light') || 'Licht' },
    { value: 'Zwaar', label: t('invoersheetV2.dossier.constructionOptions.heavy') || 'Zwaar' },
    { value: 'Zeer zwaar', label: t('invoersheetV2.dossier.constructionOptions.veryHeavy') || 'Zeer zwaar' },
  ];

  const leidingOptions = [
    { value: 'Onbekend', label: t('invoersheetV2.dossier.unknown') || 'Onbekend' },
    { value: 'Ja', label: t('common.yes') || 'Ja' },
    { value: 'Nee', label: t('common.no') || 'Nee' },
    { value: 'Aanwezig', label: 'Aanwezig' },
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

      {/* Bewoner & Inspecteur Details (Matching Visuals Card Format) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bewoner Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">

              <span className="font-display font-semibold text-xs tracking-wide">
                {t('invoersheetV2.dossier.resident') || 'Bewoner'}
              </span>
            </div>
            <User className="w-3.5 h-3.5 text-slate-300" />
          </div>

          <div className="p-5 flex-1 bg-white">
            {(() => {
              const bwoSpans: Record<string, number> = {
                name: 1, contact: 1, email: 1, address: 1, postcode: 1, plaats: 1
              };

              return (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs items-start">
                  <div className={`w-full ${bwoSpans['name'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'bewoner.name',
                      t('invoersheetV2.dossier.name') || 'Name',
                      handleUpdateBewoner ? (
                        <InlineInput value={dossier.bewoner?.name} onChange={(v: string) => handleUpdateBewoner('name', v)} placeholder="Bijv. Jan de Vries" className="font-semibold" />
                      ) : (dossier.bewoner?.name || t('invoersheetV2.dossier.unknown')),
                      'BWO'
                    )}
                  </div>
                  <div className={`w-full ${bwoSpans['contact'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'bewoner.contact',
                      t('invoersheetV2.dossier.contact') || 'Contact',
                      handleUpdateBewoner ? (
                        <InlineInput value={dossier.bewoner?.contact} onChange={(v: string) => handleUpdateBewoner('contact', v)} placeholder="Bijv. 0612345678" className="font-semibold" />
                      ) : (dossier.bewoner?.contact || '-'),
                      'BWO'
                    )}
                  </div>
                  <div className={`w-full ${bwoSpans['email'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'bewoner.email',
                      t('invoersheetV2.dossier.email') || 'Email',
                      handleUpdateBewoner ? (
                        <InlineInput type="email" value={dossier.bewoner?.email} onChange={(v: string) => handleUpdateBewoner('email', v)} placeholder="jan@voorbeeld.nl" className="font-semibold" />
                      ) : (dossier.bewoner?.email || '-'),
                      'BWO'
                    )}
                  </div>
                  <div className={`w-full ${bwoSpans['address'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'bewoner.address',
                      t('invoersheetV2.dossier.address') || 'Address',
                      handleUpdateBewoner ? (
                        <InlineInput value={dossier.bewoner?.address} onChange={(v: string) => handleUpdateBewoner('address', v)} placeholder="Bijv. Straatnaam 12" className="font-semibold" />
                      ) : (dossier.bewoner?.address || '-'),
                      'BWO'
                    )}
                  </div>
                  <div className={`w-full ${bwoSpans['postcode'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'bewoner.postcode',
                      t('invoersheetV2.dossier.postcode') || 'Postcode',
                      handleUpdateBewoner ? (
                        <InlineInput value={dossier.bewoner?.postcode} onChange={(v: string) => handleUpdateBewoner('postcode', v)} placeholder="Bijv. 1234 AB" className="font-semibold" />
                      ) : (dossier.bewoner?.postcode || '-'),
                      'BWO'
                    )}
                  </div>
                  <div className={`w-full ${bwoSpans['plaats'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'bewoner.plaats',
                      t('invoersheetV2.dossier.city') || 'Plaats',
                      handleUpdateBewoner ? (
                        <InlineInput value={dossier.bewoner?.plaats} onChange={(v: string) => handleUpdateBewoner('plaats', v)} placeholder="Bijv. Almere Stad" className="font-semibold" />
                      ) : (dossier.bewoner?.plaats || 'Almere Stad'),
                      'BWO'
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      {/* Inspecteur Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">

              <span className="font-display font-semibold text-xs tracking-wide">
                {t('invoersheetV2.dossier.inspector') || 'Inspecteur'}
              </span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
          </div>

          <div className="p-5 flex-1 bg-white">
            {(() => {
              const insSpans: Record<string, number> = {
                name: 1, contact: 1, email: 1, address: 1, postcode: 1, plaats: 1, certNumber: 1, certificationInstitute: 1, protocolVersion: 1, inspectionDate: 1, invoerdatum: 2
              };

              return (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs items-start">
                  <div className={`w-full ${insSpans['name'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspector.name',
                      t('invoersheetV2.dossier.name') || 'Name',
                      handleUpdateInspector ? (
                        <InlineInput value={dossier.inspector?.name} onChange={(v: string) => handleUpdateInspector('name', v)} placeholder="Bijv. Peter Inspecteur" className="font-semibold" />
                      ) : (dossier.inspector?.name || t('invoersheetV2.dossier.unknown') || 'Onbekend'),
                      'INS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['contact'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspector.contact',
                      t('invoersheetV2.dossier.contact') || 'Contact',
                      handleUpdateInspector ? (
                        <InlineInput value={dossier.inspector?.contact} onChange={(v: string) => handleUpdateInspector('contact', v)} placeholder="Bijv. 0687654321" className="font-semibold" />
                      ) : (dossier.inspector?.contact || '-'),
                      'INS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['email'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspector.email',
                      t('invoersheetV2.dossier.email') || 'Email',
                      handleUpdateInspector ? (
                        <InlineInput type="email" value={dossier.inspector?.email} onChange={(v: string) => handleUpdateInspector('email', v)} placeholder="inspecteur@mepa.nl" className="font-semibold" />
                      ) : (dossier.inspector?.email || '-'),
                      'INS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['address'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspector.address',
                      t('invoersheetV2.dossier.address') || 'Address',
                      handleUpdateInspector ? (
                        <InlineInput value={dossier.inspector?.address} onChange={(v: string) => handleUpdateInspector('address', v)} placeholder="Bijv. Inspectiestraat 1" className="font-semibold" />
                      ) : (dossier.inspector?.address || '-'),
                      'INS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['postcode'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspector.postcode',
                      t('invoersheetV2.dossier.postcode') || 'Postcode',
                      handleUpdateInspector ? (
                        <InlineInput value={dossier.inspector?.postcode} onChange={(v: string) => handleUpdateInspector('postcode', v)} placeholder="Bijv. 1000 AA" className="font-semibold" />
                      ) : (dossier.inspector?.postcode || '-'),
                      'INS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['plaats'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspector.plaats',
                      t('invoersheetV2.dossier.city') || 'Plaats',
                      handleUpdateInspector ? (
                        <InlineInput value={dossier.inspector?.plaats} onChange={(v: string) => handleUpdateInspector('plaats', v)} placeholder="Bijv. Amsterdam" className="font-semibold" />
                      ) : (dossier.inspector?.plaats || 'Almere'),
                      'INS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['certNumber'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspectorCertNumber',
                      t('invoersheetV2.dossier.certNumber') || 'Certificate number',
                      handleUpdateDossierField ? (
                        <InlineInput value={dossier.inspectorCertNumber} onChange={(v: string) => handleUpdateDossierField('inspectorCertNumber', v)} placeholder="5923.3337.5020" className="font-semibold" />
                      ) : (dossier.inspectorCertNumber || '5923.3337.5020'),
                      'SYS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['certificationInstitute'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'certificationInstitute',
                      'Certificatie-instelling',
                      handleUpdateDossierField ? (
                        <InlineInput value={dossier.certificationInstitute} onChange={(v: string) => handleUpdateDossierField('certificationInstitute', v)} placeholder="SKG-IKOB / DEKRA" className="font-semibold" />
                      ) : (dossier.certificationInstitute || 'SKG-IKOB B.V.'),
                      'SYS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['protocolVersion'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'protocolVersion',
                      'Opnameprotocol',
                      handleUpdateDossierField ? (
                        <InlineInput value={dossier.protocolVersion} onChange={(v: string) => handleUpdateDossierField('protocolVersion', v)} placeholder="NTA 8800:2024" className="font-semibold" />
                      ) : (dossier.protocolVersion || 'NTA 8800:2024'),
                      'SYS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['inspectionDate'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'inspectionDate',
                      t('invoersheetV2.dossier.inspectionDate') || 'Opnamedatum',
                      handleUpdateDossierField ? (
                        <InlineInput type="date" value={dossier.inspectionDate} onChange={(v: string) => handleUpdateDossierField('inspectionDate', v)} className="font-semibold text-[11px]" />
                      ) : (dossier.inspectionDate || '09-09-2026'),
                      'INS'
                    )}
                  </div>
                  <div className={`w-full ${insSpans['invoerdatum'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {renderOverviewField(
                      'invoerdatum',
                      t('invoersheetV2.dossier.inputDate') || 'Invoerdatum',
                      handleUpdateDossierField ? (
                        <InlineInput type="date" value={dossier.invoerdatum} onChange={(v: string) => handleUpdateDossierField('invoerdatum', v)} className="font-semibold text-[11px]" />
                      ) : (dossier.invoerdatum || '09-09-2026'),
                      'SYS'
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* General details Card (Matching Visuals Card Format) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">

            <h3 className="font-display font-semibold text-sm tracking-wide">
              {t('invoersheetV2.dossier.generalDetails') || 'General details'}
            </h3>
          </div>
          <Building2 className="w-4 h-4 text-slate-300" />
        </div>

        <div className="p-6 bg-white">
          {(() => {
            const genSpans: Record<string, number> = {
              bouwfase: 1, opnametype: 1, gebouwtype: 1, subtype: 1, daktypeLigging: 1, gebouwhoogte: 1, pandId: 1, vboId: 1
            };

            return (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs items-start">
                <div className={`w-full ${genSpans['bouwfase'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'generalDetails.bouwfase',
                    t('invoersheetV2.dossier.constructionPhase') || 'Bouwface',
                    handleUpdateGeneralDetails ? (
                      <InlineSelect options={bouwfaseOptions} value={dossier.generalDetails?.bouwfase} onChange={(v: string) => handleUpdateGeneralDetails('bouwfase', v)} className="font-semibold" />
                    ) : dossier.generalDetails?.bouwfase
                  )}
                </div>
                <div className={`w-full ${genSpans['opnametype'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'generalDetails.opnametype',
                    t('invoersheetV2.dossier.recordingType') || 'Opnametype',
                    handleUpdateGeneralDetails ? (
                      <InlineSelect options={opnameOptions} value={dossier.generalDetails?.opnametype} onChange={(v: string) => handleUpdateGeneralDetails('opnametype', v)} className="font-semibold" />
                    ) : dossier.generalDetails?.opnametype
                  )}
                </div>
                <div className={`w-full ${genSpans['gebouwtype'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'generalDetails.gebouwtype',
                    t('invoersheetV2.dossier.buildingType') || 'Gebouwtype',
                    handleUpdateGeneralDetails ? (
                      <InlineSelect options={gebouwtypeOptions} value={dossier.generalDetails?.gebouwtype} onChange={(v: string) => handleUpdateGeneralDetails('gebouwtype', v)} className="font-semibold" />
                    ) : dossier.generalDetails?.gebouwtype
                  )}
                </div>
                <div className={`w-full ${genSpans['subtype'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'generalDetails.subtype',
                    t('invoersheetV2.dossier.subtype') || 'Subtype',
                    handleUpdateGeneralDetails ? (
                      <InlineSelect options={subtypeOptions} value={dossier.generalDetails?.subtype} onChange={(v: string) => handleUpdateGeneralDetails('subtype', v)} className="font-semibold" />
                    ) : dossier.generalDetails?.subtype
                  )}
                </div>
                <div className={`w-full ${genSpans['daktypeLigging'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'generalDetails.daktypeLigging',
                    t('invoersheetV2.dossier.roofType') || 'Daktype/Ligging',
                    handleUpdateGeneralDetails ? (
                      <InlineSelect options={daktypeLiggingOptions} value={dossier.generalDetails?.daktypeLigging} onChange={(v: string) => handleUpdateGeneralDetails('daktypeLigging', v)} className="font-semibold" />
                    ) : dossier.generalDetails?.daktypeLigging
                  )}
                </div>
                <div className={`w-full ${genSpans['gebouwhoogte'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'generalDetails.gebouwhoogte',
                    t('invoersheetV2.dossier.buildingHeight') || 'Gebouwhoogte',
                    handleUpdateGeneralDetails ? (
                      <InlineInput value={dossier.generalDetails?.gebouwhoogte} onChange={(v: string) => handleUpdateGeneralDetails('gebouwhoogte', v)} className="font-semibold" />
                    ) : dossier.generalDetails?.gebouwhoogte
                  )}
                </div>
                <div className={`w-full ${genSpans['pandId'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'bag.pandId',
                    t('invoersheetV2.dossier.pandId') || 'PandID',
                    handleUpdateBag ? (
                      <InlineInput value={dossier.bag.pandId} onChange={(v: string) => handleUpdateBag({ pandId: v })} className="font-semibold" />
                    ) : dossier.bag.pandId
                  )}
                </div>
                <div className={`w-full ${genSpans['vboId'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderOverviewField(
                    'bag.vboId',
                    t('invoersheetV2.dossier.vboId') || 'VBO ID',
                    handleUpdateBag ? (
                      <InlineInput value={dossier.bag.vboId} onChange={(v: string) => handleUpdateBag({ vboId: v })} className="font-sans font-semibold text-slate-700" />
                    ) : dossier.bag.vboId
                  )}
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {/* Technical details & Floor Plans Section (Matching Visuals Card Format) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Technical details */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">

                <span className="font-display font-semibold text-xs tracking-wide">
                  {t('invoersheetV2.dossier.technicalDetails') || 'Technical details'}
                </span>
              </div>
            </div>

            <div className="p-5 flex-1 bg-white">
              {(() => {
                const techFields: { id: string; isLong: boolean }[] = [
                  { id: 'vloerConstructie', isLong: (dossier.technicalDetails?.vloerConstructie || '').length > 20 },
                  { id: 'wandConstructie', isLong: (dossier.technicalDetails?.wandConstructie || '').length > 20 },
                  { id: 'leidingdoorvoeren', isLong: (dossier.technicalDetails?.leidingdoorvoeren || '').length > 20 },
                  { id: 'aantal', isLong: false },
                  { id: 'avr', isLong: false },
                  { id: 'gbo1', isLong: true },
                  ...(gboCount >= 2 ? [{ id: 'gbo2', isLong: true }] : []),
                  ...(gboCount >= 3 ? [{ id: 'gbo3', isLong: true }] : [])
                ];

                const techSpans: Record<string, number> = {};
                let currentTechRowItems: string[] = [];

                techFields.forEach((field) => {
                  if (field.isLong) {
                    if (currentTechRowItems.length === 1) {
                      techSpans[currentTechRowItems[0]] = 2;
                      currentTechRowItems = [];
                    }
                    techSpans[field.id] = 2;
                  } else {
                    currentTechRowItems.push(field.id);
                    techSpans[field.id] = 1;
                    if (currentTechRowItems.length === 2) {
                      currentTechRowItems = [];
                    }
                  }
                });

                if (currentTechRowItems.length === 1) {
                  techSpans[currentTechRowItems[0]] = 2;
                }

                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs items-start">
                    <div className={`w-full ${techSpans['vloerConstructie'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                      {renderOverviewField(
                        'technicalDetails.vloerConstructie',
                        t('invoersheetV2.dossier.floorConstruction') || 'Vloer constructie',
                        handleUpdateTechnicalDetails ? (
                          <InlineSelect options={constructieOptions} value={dossier.technicalDetails?.vloerConstructie} onChange={(v: string) => handleUpdateTechnicalDetails('vloerConstructie', v)} className="font-semibold" />
                        ) : dossier.technicalDetails?.vloerConstructie
                      )}
                    </div>
                    <div className={`w-full ${techSpans['wandConstructie'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                      {renderOverviewField(
                        'technicalDetails.wandConstructie',
                        t('invoersheetV2.dossier.wallConstruction') || 'Wand construtie',
                        handleUpdateTechnicalDetails ? (
                          <InlineSelect options={constructieOptions} value={dossier.technicalDetails?.wandConstructie} onChange={(v: string) => handleUpdateTechnicalDetails('wandConstructie', v)} className="font-semibold" />
                        ) : dossier.technicalDetails?.wandConstructie
                      )}
                    </div>
                    <div className={`w-full ${techSpans['leidingdoorvoeren'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                      {renderOverviewField(
                        'technicalDetails.leidingdoorvoeren',
                        t('invoersheetV2.dossier.pipes') || 'Leidingdoorvoeren',
                        handleUpdateTechnicalDetails ? (
                          <InlineSelect options={leidingOptions} value={dossier.technicalDetails?.leidingdoorvoeren} onChange={(v: string) => handleUpdateTechnicalDetails('leidingdoorvoeren', v)} className="font-semibold" />
                        ) : dossier.technicalDetails?.leidingdoorvoeren
                      )}
                    </div>
                    <div className={`w-full ${techSpans['aantal'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                      {renderOverviewField(
                        'technicalDetails.aantal',
                        t('invoersheetV2.dossier.quantity') || 'Aantal',
                        handleUpdateTechnicalDetails ? (
                          <InlineInput value={dossier.technicalDetails?.aantal} onChange={(v: string) => handleUpdateTechnicalDetails('aantal', v)} className="font-semibold" />
                        ) : dossier.technicalDetails?.aantal
                      )}
                    </div>
                    <div className={`w-full ${techSpans['avr'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                      {renderOverviewField(
                        'technicalDetails.avr',
                        t('invoersheetV2.dossier.avr') || 'AVR',
                        handleUpdateTechnicalDetails ? (
                          <InlineInput value={dossier.technicalDetails?.avr} onChange={(v: string) => handleUpdateTechnicalDetails('avr', v)} className="font-semibold" />
                        ) : dossier.technicalDetails?.avr
                      )}
                    </div>
                    <div className="w-full col-span-2 pt-1 border-t border-slate-100">
                      {renderOverviewField(
                        'technicalDetails.gbo1',
                        'GBO',
                        <GboInput 
                          value={dossier.technicalDetails?.gbo1} 
                          onChange={(v: any) => handleUpdateTechnicalDetails?.('gbo1', v)} 
                          disabled={!handleUpdateTechnicalDetails} 
                          canAdd={gboCount === 1}
                          onAdd={() => setGboCount(2)}
                        />
                      )}
                    </div>
                    {gboCount >= 2 && (
                      <div className="w-full col-span-2">
                        {renderOverviewField(
                          'technicalDetails.gbo2',
                          'GBO_2',
                          <GboInput 
                            value={dossier.technicalDetails?.gbo2} 
                            onChange={(v: any) => handleUpdateTechnicalDetails?.('gbo2', v)} 
                            disabled={!handleUpdateTechnicalDetails} 
                            canAdd={gboCount === 2}
                            onAdd={() => setGboCount(3)}
                            canRemove={true}
                            onRemove={() => {
                              if (gboCount === 3) {
                                handleUpdateTechnicalDetails?.('gbo2', dossier.technicalDetails?.gbo3 || { l: '', w: '', a: '' });
                                handleUpdateTechnicalDetails?.('gbo3', { l: '', w: '', a: '' });
                                setGboCount(2);
                              } else {
                                handleUpdateTechnicalDetails?.('gbo2', { l: '', w: '', a: '' });
                                setGboCount(1);
                              }
                            }}
                          />
                        )}
                      </div>
                    )}
                    {gboCount >= 3 && (
                      <div className="w-full col-span-2">
                        {renderOverviewField(
                          'technicalDetails.gbo3',
                          'GBO_3',
                          <GboInput 
                            value={dossier.technicalDetails?.gbo3} 
                            onChange={(v: any) => handleUpdateTechnicalDetails?.('gbo3', v)} 
                            disabled={!handleUpdateTechnicalDetails} 
                            canAdd={false}
                            canRemove={true}
                            onRemove={() => {
                              handleUpdateTechnicalDetails?.('gbo3', { l: '', w: '', a: '' });
                              setGboCount(2);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Right: Floor Plans CAD drawings */}
        <div className="lg:col-span-7 flex">
          <FloorPlansCadView />
        </div>
      </div>
    </div>
  );
};


