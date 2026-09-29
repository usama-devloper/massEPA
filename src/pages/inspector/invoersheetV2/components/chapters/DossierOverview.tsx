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
  ChevronLeft
} from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { AppSelect } from '../../../../../components/common/AppSelect';


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
  onUpdateTechnicalDetails?: (field: keyof NonNullable<ProjectDossier['technicalDetails']>, value: string) => void;
  onUpdateCalcOverride?: (field: keyof NtaCalculationResult, value: any) => void;
}

const ALL_LABELS: EnergyLabel[] = ['A++++', 'A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

// Reusable inline input component for V2 dashboard fields
const InlineInput = ({ value, onChange, type = "text", className = "", placeholder = "-" }: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 rounded transition-all w-full px-1 py-0.5 -ml-1 ${className}`}
  />
);

const InlineSelect = ({ value, onChange, options, className = "" }: any) => (
  <AppSelect
    value={value || ''}
    onChange={onChange}
    options={options}
    className={className}
    variant="compact"
    searchable={false}
  />
);

const GboInput = ({ value, onChange, disabled }: any) => {
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
    if (l && w) return <span className="font-mono font-bold text-slate-900 text-xs">{`${l} m * ${w} m = ${a} m²`}</span>;
    return <span className="font-mono font-bold text-slate-900 text-xs">{a ? `${a} m²` : '-'}</span>;
  }

  return (
    <div className="flex items-center space-x-1.5 w-full mt-0.5">
      <input 
        type="number" step="0.01" placeholder="L" value={l} 
        onChange={e => handleLChange(e.target.value)}
        className="w-12 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded px-1 py-0.5 text-right font-mono text-[11px]"
      />
      <span className="text-slate-400 text-[10px]">x</span>
      <input 
        type="number" step="0.01" placeholder="W" value={w} 
        onChange={e => handleWChange(e.target.value)}
        className="w-12 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded px-1 py-0.5 text-right font-mono text-[11px]"
      />
      <span className="text-slate-400 text-[10px]">=</span>
      <input 
        type="number" step="0.01" placeholder="Area" value={a} 
        onChange={e => handleAChange(e.target.value)}
        className="w-16 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded px-1 py-0.5 text-right font-mono font-bold text-slate-900 text-[11px]"
      />
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
  onUpdateCalcOverride
}) => {
  const { t } = useLanguage();
  const currentLabelConfig = LABEL_COLORS[calcResult.label];

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
              {t('invoersheetV2.dossier.ntaResult') || 'NTA 8800 Berekeningsresultaat & Energielabel Trap'}
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <span className="font-mono text-[11px]">RVO EP-Online</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
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
                    onClick={() => onUpdateCalcOverride && onUpdateCalcOverride('label', lbl)}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.ep1') || 'EP1 Fossiel'}</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 flex items-center">
                {onUpdateCalcOverride ? (
                  <InlineInput type="number" value={calcResult.ep1} onChange={(v: string) => onUpdateCalcOverride('ep1', Number(v))} className="font-mono text-xl text-slate-900 !w-24" />
                ) : calcResult.ep1}
                <span className="text-xs font-normal text-slate-500 ml-1">kWh/m²·jr</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Karakteristiek fossiel energieverbruik
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.ep2') || 'EP2 Primair'}</span>
                <Zap className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 flex items-center">
                {onUpdateCalcOverride ? (
                  <InlineInput type="number" value={calcResult.ep2} onChange={(v: string) => onUpdateCalcOverride('ep2', Number(v))} className="font-mono text-xl text-slate-900 !w-24" />
                ) : calcResult.ep2}
                <span className="text-xs font-normal text-slate-500 ml-1">kWh/m²·jr</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Totaal primair fossiel verbruik
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.ep3') || 'EP3 Hernieuwbaar'}</span>
                <Sun className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700 flex items-center">
                {onUpdateCalcOverride ? (
                  <InlineInput type="number" value={calcResult.ep3} onChange={(v: string) => onUpdateCalcOverride('ep3', Number(v))} className="font-mono text-xl text-emerald-700 !w-20" />
                ) : calcResult.ep3}
                <span className="ml-1">%</span> <span className="text-xs font-normal text-slate-500 ml-1">(eis &gt;50%)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Aandeel hernieuwbare energie
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-mono font-medium">{t('invoersheetV2.dossier.toJuli') || 'TO_juli'}</span>
                <Wind className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 flex items-center">
                {onUpdateCalcOverride ? (
                  <InlineInput type="number" step="0.01" value={calcResult.toJuli} onChange={(v: string) => onUpdateCalcOverride('toJuli', Number(v))} className="font-mono text-xl text-slate-900 !w-20" />
                ) : calcResult.toJuli}
                <span className="text-xs font-normal text-slate-500 ml-1">(eis &lt;1.20)</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 inline" />
                <span>Voldoet ruimschoots</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="space-y-2.5">
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.name') || 'Name'}:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {onUpdateBewoner ? (
                      <InlineInput value={dossier.bewoner?.name} onChange={(v: string) => onUpdateBewoner('name', v)} className="font-semibold" />
                    ) : (dossier.bewoner?.name || t('invoersheetV2.dossier.unknown'))}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.contact') || 'Contact'}:</span>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">
                    {onUpdateBewoner ? (
                      <InlineInput value={dossier.bewoner?.contact} onChange={(v: string) => onUpdateBewoner('contact', v)} className="font-mono font-semibold" />
                    ) : (dossier.bewoner?.contact || '-')}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.postcode') || 'Postcode'}:</span>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">
                    {onUpdateBewoner ? (
                      <InlineInput value={dossier.bewoner?.postcode} onChange={(v: string) => onUpdateBewoner('postcode', v)} className="font-mono font-semibold" />
                    ) : (dossier.bewoner?.postcode || '-')}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.email') || 'Email'}:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {onUpdateBewoner ? (
                      <InlineInput type="email" value={dossier.bewoner?.email} onChange={(v: string) => onUpdateBewoner('email', v)} className="font-semibold" />
                    ) : (dossier.bewoner?.email || '-')}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.address') || 'Address'}:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {onUpdateBewoner ? (
                      <InlineInput value={dossier.bewoner?.address} onChange={(v: string) => onUpdateBewoner('address', v)} className="font-semibold" />
                    ) : (dossier.bewoner?.address || '-')}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.city') || 'Plaats'}:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {onUpdateBewoner ? (
                      <InlineInput value={dossier.bewoner?.plaats} onChange={(v: string) => onUpdateBewoner('plaats', v)} className="font-semibold" />
                    ) : (dossier.bewoner?.plaats || 'Almere Stad')}
                  </div>
                </div>
            </div>
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="space-y-2.5">
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.name') || 'Name'}:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {onUpdateInspector ? (
                      <InlineInput value={dossier.inspector?.name} onChange={(v: string) => onUpdateInspector('name', v)} className="font-semibold" />
                    ) : (dossier.inspector?.name || t('invoersheetV2.dossier.unknown') || 'Onbekend')}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.email') || 'Email'}:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {onUpdateInspector ? (
                      <InlineInput type="email" value={dossier.inspector?.email} onChange={(v: string) => onUpdateInspector('email', v)} className="font-semibold" />
                    ) : (dossier.inspector?.email || '-')}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.postcode') || 'Postcode'}:</span>
                  <div className="font-mono text-slate-900 mt-0.5">
                    {onUpdateInspector ? (
                      <InlineInput value={dossier.inspector?.postcode} onChange={(v: string) => onUpdateInspector('postcode', v)} className="font-mono" />
                    ) : '-'}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.certNumber') || 'Certificate number'}:</span>
                  <div className="font-mono font-semibold text-slate-900 mt-0.5">
                    {onUpdateDossierField ? (
                      <InlineInput value={dossier.inspectorCertNumber} onChange={(v: string) => onUpdateDossierField('inspectorCertNumber', v)} className="font-mono font-semibold" />
                    ) : (dossier.inspectorCertNumber || '5923.3337.5020')}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.contact') || 'Contact'}:</span>
                  <div className="font-mono text-slate-900 font-semibold mt-0.5">
                    {onUpdateInspector ? (
                      <InlineInput value={dossier.inspector?.contact} onChange={(v: string) => onUpdateInspector('contact', v)} className="font-mono font-semibold" />
                    ) : (dossier.inspector?.contact || '-')}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.address') || 'Address'}:</span>
                  <div className="text-slate-900 font-semibold mt-0.5">
                    {onUpdateInspector ? (
                      <InlineInput value={dossier.inspector?.address} onChange={(v: string) => onUpdateInspector('address', v)} className="font-semibold" />
                    ) : (dossier.inspector?.address || '-')}
                  </div>
                </div>
                <div className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.city') || 'Plaats'}:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {onUpdateInspector ? (
                      <InlineInput value={dossier.inspector?.plaats} onChange={(v: string) => onUpdateInspector('plaats', v)} className="font-semibold" />
                    ) : (dossier.inspector?.plaats || 'Almere')}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs mt-3 pt-3 border-t border-slate-100">
              <div className="flex flex-col py-1">
                <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.inspectionDate') || 'Opnamedatum'}:</span>
                <div className="font-mono font-semibold text-slate-900 mt-0.5">
                  {onUpdateDossierField ? (
                    <InlineInput type="date" value={dossier.inspectionDate} onChange={(v: string) => onUpdateDossierField('inspectionDate', v)} className="font-mono font-semibold text-[11px]" />
                  ) : (dossier.inspectionDate || '09-09-2026')}
                </div>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-[11px] font-medium text-slate-500">{t('invoersheetV2.dossier.inputDate') || 'Invoerdatum'}:</span>
                <div className="font-mono font-semibold text-slate-900 mt-0.5">
                  {onUpdateDossierField ? (
                    <InlineInput type="date" value={dossier.invoerdatum} onChange={(v: string) => onUpdateDossierField('invoerdatum', v)} className="font-mono font-semibold text-[11px]" />
                  ) : (dossier.invoerdatum || '09-09-2026')}
                </div>
              </div>
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.constructionPhase') || 'Bouwface'}:</span>
                <div className="font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateGeneralDetails ? (
                    <InlineSelect options={bouwfaseOptions} value={dossier.generalDetails?.bouwfase} onChange={(v: string) => onUpdateGeneralDetails('bouwfase', v)} className="font-semibold text-right text-right-select" />
                  ) : dossier.generalDetails?.bouwfase}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.buildingType') || 'Gebouwtype'}:</span>
                <div className="font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateGeneralDetails ? (
                    <InlineSelect options={gebouwtypeOptions} value={dossier.generalDetails?.gebouwtype} onChange={(v: string) => onUpdateGeneralDetails('gebouwtype', v)} className="font-semibold text-right text-right-select" />
                  ) : dossier.generalDetails?.gebouwtype}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.roofType') || 'Daktype/Ligging'}:</span>
                <div className="font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateGeneralDetails ? (
                    <InlineSelect options={daktypeLiggingOptions} value={dossier.generalDetails?.daktypeLigging} onChange={(v: string) => onUpdateGeneralDetails('daktypeLigging', v)} className="font-semibold text-right text-right-select" />
                  ) : dossier.generalDetails?.daktypeLigging}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.pandId') || 'PandID'}:</span>
                <div className="font-mono font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateBag ? (
                    <InlineInput value={dossier.bag.pandId} onChange={(v: string) => onUpdateBag({ pandId: v })} className="font-mono font-semibold text-right" />
                  ) : dossier.bag.pandId}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.recordingType') || 'Opnametype'}:</span>
                <div className="font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateGeneralDetails ? (
                    <InlineSelect options={opnameOptions} value={dossier.generalDetails?.opnametype} onChange={(v: string) => onUpdateGeneralDetails('opnametype', v)} className="font-semibold text-right text-right-select" />
                  ) : dossier.generalDetails?.opnametype}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.subtype') || 'Subtype'}:</span>
                <div className="font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateGeneralDetails ? (
                    <InlineSelect options={subtypeOptions} value={dossier.generalDetails?.subtype} onChange={(v: string) => onUpdateGeneralDetails('subtype', v)} className="font-semibold text-right text-right-select" />
                  ) : dossier.generalDetails?.subtype}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.buildingHeight') || 'Gebouwhoogte'}:</span>
                <div className="font-mono font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateGeneralDetails ? (
                    <InlineInput value={dossier.generalDetails?.gebouwhoogte} onChange={(v: string) => onUpdateGeneralDetails('gebouwhoogte', v)} className="font-mono font-semibold text-right" />
                  ) : dossier.generalDetails?.gebouwhoogte}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.vboId') || 'VBO ID'}:</span>
                <div className="font-mono font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateBag ? (
                    <InlineInput value={dossier.bag.vboId} onChange={(v: string) => onUpdateBag({ vboId: v })} className="font-mono font-semibold text-right" />
                  ) : dossier.bag.vboId}
                </div>
              </div>
            </div>
          </div>
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

            <div className="p-5 space-y-2.5 text-xs text-slate-900">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.floorConstruction') || 'Vloer constructie'}:</span>
                <div className="font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateTechnicalDetails ? (
                    <InlineSelect options={constructieOptions} value={dossier.technicalDetails?.vloerConstructie} onChange={(v: string) => onUpdateTechnicalDetails('vloerConstructie', v)} className="font-semibold text-right text-right-select" />
                  ) : dossier.technicalDetails?.vloerConstructie}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.wallConstruction') || 'Wand construtie'}:</span>
                <div className="font-semibold text-slate-900 w-1/2 text-right">
                  {onUpdateTechnicalDetails ? (
                    <InlineSelect options={constructieOptions} value={dossier.technicalDetails?.wandConstructie} onChange={(v: string) => onUpdateTechnicalDetails('wandConstructie', v)} className="font-semibold text-right text-right-select" />
                  ) : dossier.technicalDetails?.wandConstructie}
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.pipes') || 'Leidingdoorvoeren'}:</span>
                <div className="font-semibold text-emerald-700 w-1/2 text-right">
                  {onUpdateTechnicalDetails ? (
                    <InlineSelect options={leidingOptions} value={dossier.technicalDetails?.leidingdoorvoeren} onChange={(v: string) => onUpdateTechnicalDetails('leidingdoorvoeren', v)} className="font-semibold text-right text-emerald-700 text-right-select" />
                  ) : dossier.technicalDetails?.leidingdoorvoeren}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 py-1.5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.quantity') || 'Aantal'}:</span>
                  <div className="font-mono font-semibold text-slate-900 w-1/2 text-right">
                    {onUpdateTechnicalDetails ? (
                      <InlineInput value={dossier.technicalDetails?.aantal} onChange={(v: string) => onUpdateTechnicalDetails('aantal', v)} className="font-mono font-semibold text-right" />
                    ) : dossier.technicalDetails?.aantal}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{t('invoersheetV2.dossier.avr') || 'AVR'}:</span>
                  <div className="font-mono font-semibold text-slate-900 w-1/2 text-right">
                    {onUpdateTechnicalDetails ? (
                      <InlineInput value={dossier.technicalDetails?.avr} onChange={(v: string) => onUpdateTechnicalDetails('avr', v)} className="font-mono font-semibold text-right" />
                    ) : dossier.technicalDetails?.avr}
                  </div>
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <div className="flex flex-col py-1.5 px-2.5 bg-slate-50 rounded border border-slate-200/70">
                  <span className="text-[11px] font-medium text-slate-500">GBO_1:</span>
                  <GboInput 
                    value={dossier.technicalDetails?.gbo1} 
                    onChange={(v: string) => onUpdateTechnicalDetails?.('gbo1', v)} 
                    disabled={!onUpdateTechnicalDetails} 
                  />
                </div>
                <div className="flex flex-col py-1.5 px-2.5 bg-slate-50 rounded border border-slate-200/70">
                  <span className="text-[11px] font-medium text-slate-500">GBO_2:</span>
                  <GboInput 
                    value={dossier.technicalDetails?.gbo2} 
                    onChange={(v: string) => onUpdateTechnicalDetails?.('gbo2', v)} 
                    disabled={!onUpdateTechnicalDetails} 
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Floor Plans GBO_1 & GBO_2 CAD drawings */}
        <div className="lg:col-span-7 flex">
          <FloorPlansCadView />
        </div>
      </div>
    </div>
  );
};


