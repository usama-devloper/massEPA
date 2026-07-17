import React, { useState, useEffect } from 'react';
import { CollapsibleSection, FieldGroup } from '../../components/ui/BackOfficeUI';
import { InspectionData } from './backofficeTypes';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AppSelect } from '../../components/common/AppSelect';
import { AppFlaggedLabel } from '../../components/common/AppFlaggedLabel';

interface AlgemeenViewProps {
  data: InspectionData;
  onChange: (path: string, value: string) => void;
  onAddGboT: () => void;
  onDeleteGboT: (index: number) => void;
}

const AlgemeenView: React.FC<AlgemeenViewProps> = ({ data, onChange, onAddGboT, onDeleteGboT }) => {
  const { t, locale } = useLanguage();
  const gboTCount = data.algemeen.technical.gboTs.length;

  const [flags, setFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    try {
      const saved = localStorage.getItem(`algemeen_flags_${data.clientId || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`algemeen_flags_${data.clientId || 'default'}`, JSON.stringify(flags));
    } catch (e) {
      console.error(e);
    }
  }, [flags, data.clientId]);

  const toggleFlag = (fieldKey: string, status: 'red' | 'yellow' | 'green' | null) => {
    setFlags(prev => {
      const current = prev[fieldKey];
      return {
        ...prev,
        [fieldKey]: current === status ? null : status
      };
    });
  };

  const getFieldBorder = (fieldKey: string) => {
    const status = flags[fieldKey];
    if (status === 'red') return '!border-red-500 ring-2 ring-red-100 bg-red-50/20';
    if (status === 'yellow') return '!border-amber-500 ring-2 ring-amber-100 bg-amber-50/20';
    if (status === 'green') return '!border-green-500 ring-2 ring-green-100 bg-green-50/20';
    return '';
  };

  const getSelectValidationStatus = (fieldKey: string) => {
    return flags[fieldKey] || null;
  };

  const renderLabelWithFlags = (fieldKey: string, label: string) => {
    return (
      <AppFlaggedLabel
        label={label}
        value={flags[fieldKey]}
        onChange={(val) => toggleFlag(fieldKey, val)}
      />
    );
  };

  // Bulletproof localized translation resolver helper
  const getTranslation = (key: string, nlFallback: string, enFallback: string): string => {
    const res = t(key);
    if (res === key) {
      return locale === 'en' ? enFallback : nlFallback;
    }
    return res;
  };

  const bouwfaseOptions = [
    { value: 'Bestaande bouw', label: getTranslation('general.options.bestaandeBouw', 'Bestaande bouw', 'Existing Construction') },
    { value: 'Nieuwbouw', label: getTranslation('general.options.nieuwbouw', 'Nieuwbouw', 'New Construction') },
    { value: 'Renovatie', label: getTranslation('general.options.renovatie', 'Renovatie', 'Renovation') },
  ];

  const opnameOptions = [
    { value: 'Basisopname', label: getTranslation('general.options.basisopname', 'Basisopname', 'Basic Inspection') },
    { value: 'Detailopname', label: getTranslation('general.options.detailopname', 'Detailopname', 'Detailed Inspection') },
  ];

  const svbStatusOptions = [
    { value: 'Definitief', label: getTranslation('general.options.definitief', 'Definitief', 'Definitive') },
    { value: 'Concept', label: getTranslation('general.options.concept', 'Concept', 'Draft') },
  ];

  const bronOptions = [
    { value: 'BAG', label: getTranslation('general.options.bag', 'BAG', 'BAG') },
    { value: 'Bouwtekening', label: getTranslation('general.options.bouwtekening', 'Bouwtekening', 'Construction Drawing') },
    { value: 'Eigen opname', label: getTranslation('general.options.eigenOpname', 'Eigen opname', 'Own Inspection') },
  ];

  const gebouwtypeOptions = [
    { value: 'Woonhuis', label: getTranslation('general.options.woonhuis', 'Woonhuis', 'House') },
    { value: 'Woongebouw', label: getTranslation('general.options.woongebouw', 'Woongebouw', 'Apartment Building') },
    { value: 'Woonwagen', label: getTranslation('general.options.woonwagen', 'Woonwagen', 'Mobile Home') },
  ];

  const subtypeOptions = [
    { value: 'Tussenwoning', label: getTranslation('general.options.tussenwoning', 'Tussenwoning', 'Terraced House') },
    { value: 'Hoekwoning', label: getTranslation('general.options.hoekwoning', 'Hoekwoning', 'Corner House') },
    { value: 'Eindwoning', label: getTranslation('general.options.eindwoning', 'Eindwoning', 'End-of-Terrace House') },
    { value: 'Twee-onder-één-kap', label: getTranslation('general.options.tweeOnderEenKap', 'Twee-onder-één-kap', 'Semi-Detached') },
    { value: 'Vrijstaande woning', label: getTranslation('general.options.vrijstaand', 'Vrijstaande woning', 'Detached') },
  ];

  const liggingOptions = [
    { value: 'Beschut', label: getTranslation('general.options.beschut', 'Beschut', 'Sheltered') },
    { value: 'Niet beschut', label: getTranslation('general.options.nietBeschut', 'Niet beschut', 'Not Sheltered') },
  ];

  const daktypeOptions = [
    { value: 'Zadeldak', label: getTranslation('general.options.zadeldak', 'Zadeldak', 'Gable Roof') },
    { value: 'Plat dak', label: getTranslation('general.options.platDak', 'Plat dak', 'Flat Roof') },
    { value: 'Lessenaarsdak', label: getTranslation('general.options.lessenaarsdak', 'Lessenaarsdak', 'Shed Roof') },
    { value: 'Schilddak', label: getTranslation('general.options.schilddak', 'Schilddak', 'Hip Roof') },
    { value: 'Mansardedak', label: getTranslation('general.options.mansardedak', 'Mansardedak', 'Mansard Roof') },
  ];

  const constructieTypeOptions = [
    { value: 'Licht', label: locale === 'en' ? 'Light' : 'Licht' },
    { value: 'Middel', label: locale === 'en' ? 'Medium' : 'Middel' },
    { value: 'Zwaar', label: locale === 'en' ? 'Heavy' : 'Zwaar' },
  ];

  const leidingOptions = [
    { value: 'Onbekend', label: getTranslation('general.options.onbekend', 'Onbekend', 'Unknown') },
    { value: 'Ja', label: getTranslation('general.options.ja', 'Ja', 'Yes') },
    { value: 'Nee', label: getTranslation('general.options.nee', 'Nee', 'No') },
  ];

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

      {/* Title Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-black text-on-background tracking-tight">
          {getTranslation('nav.algemeen', 'Algemeen', 'General')}
        </h1>
      </div>

      {/* 1. Address details section */}
      <CollapsibleSection title={getTranslation('general.addressDetails', 'Adresgegevens', 'Address Details')}>
        <div className="grid grid-cols-1 gap-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('bouwfase', getTranslation('general.bouwfase', 'Bouwfase', 'Construction Phase'))}>
              <AppSelect
                value={data.algemeen.woning.bouwfase || ''}
                onChange={(val) => onChange('algemeen.woning.bouwfase', val)}
                options={bouwfaseOptions}
                placeholder={getTranslation('general.selectBouwfase', 'Kies bouwfase...', 'Choose construction phase...')}
                validationStatus={getSelectValidationStatus('bouwfase')}
                label={getTranslation('general.bouwfase', 'Bouwfase', 'Construction Phase')}
                hideLabelHtml={true}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('opname', getTranslation('general.opname', 'Opnametype', 'Inspection Type'))}>
              <AppSelect
                value={data.algemeen.woning.opname || ''}
                onChange={(val) => onChange('algemeen.woning.opname', val)}
                options={opnameOptions}
                placeholder={getTranslation('general.selectOpname', 'Kies opnametype...', 'Choose inspection type...')}
                validationStatus={getSelectValidationStatus('opname')}
                label={getTranslation('general.opname', 'Opnametype', 'Inspection Type')}
                hideLabelHtml={true}
              />
            </FieldGroup>
          </div>

          <FieldGroup label={renderLabelWithFlags('adres', getTranslation('general.adres', 'Adres', 'Address'))}>
            <input
              className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('adres')}`}
              value={data.algemeen.woning.adres || ''}
              onChange={(e) => onChange('algemeen.woning.adres', e.target.value)}
            />
          </FieldGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('postcode', getTranslation('general.postcode', 'Postcode', 'Postal Code'))}>
              <input
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-mono font-bold ${getFieldBorder('postcode')}`}
                placeholder="1234 AB"
                value={data.algemeen.woning.postcode || ''}
                onChange={(e) => onChange('algemeen.woning.postcode', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('plaats', getTranslation('general.plaats', 'Plaats', 'City'))}>
              <input
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('plaats')}`}
                value={data.algemeen.woning.plaats || ''}
                onChange={(e) => onChange('algemeen.woning.plaats', e.target.value)}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('pandId', getTranslation('general.pandId', 'Pand ID', 'Building ID'))}>
              <input
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-mono font-bold ${getFieldBorder('pandId')}`}
                value={data.algemeen.woning.pandId || ''}
                onChange={(e) => onChange('algemeen.woning.pandId', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('vboId', getTranslation('general.vboId', 'Verblijfsobject ID', 'Verblijfsobject ID'))}>
              <input
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-mono font-bold ${getFieldBorder('vboId')}`}
                value={data.algemeen.woning.vboId || ''}
                onChange={(e) => onChange('algemeen.woning.vboId', e.target.value)}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('wijk', getTranslation('general.wijk', 'Wijk', 'Neighborhood'))}>
              <input
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('wijk')}`}
                value={data.algemeen.woning.wijk || ''}
                onChange={(e) => onChange('algemeen.woning.wijk', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('gemeent', getTranslation('general.gemeent', 'Gemeente', 'Municipality'))}>
              <input
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('gemeent')}`}
                value={data.algemeen.woning.gemeent || ''}
                onChange={(e) => onChange('algemeen.woning.gemeent', e.target.value)}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('svbStatus', getTranslation('general.svbStatus', 'Status', 'Status'))}>
              <AppSelect
                value={data.algemeen.woning.svbStatus || ''}
                onChange={(val) => onChange('algemeen.woning.svbStatus', val)}
                options={svbStatusOptions}
                placeholder={getTranslation('general.selectStatus', 'Kies status...', 'Choose status...')}
                validationStatus={getSelectValidationStatus('svbStatus')}
                label={getTranslation('general.svbStatus', 'Status', 'Status')}
                hideLabelHtml={true}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('bron', getTranslation('general.bron', 'Bron', 'Source'))}>
              <AppSelect
                value={data.algemeen.woning.bron || ''}
                onChange={(val) => onChange('algemeen.woning.bron', val)}
                options={bronOptions}
                placeholder={getTranslation('general.selectBron', 'Kies bron...', 'Choose source...')}
                validationStatus={getSelectValidationStatus('bron')}
                label={getTranslation('general.bron', 'Bron', 'Source')}
                hideLabelHtml={true}
              />
            </FieldGroup>
          </div>
        </div>
      </CollapsibleSection>

      {/* 2. Classification section */}
      <CollapsibleSection title={getTranslation('general.classification', 'Classificatie', 'Classification')}>
        <div className="grid grid-cols-1 gap-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('gebouwtype', getTranslation('general.gebouwtype', 'Gebouwtype', 'Building Type'))}>
              <AppSelect
                value={data.algemeen.woning.gebouwtype || ''}
                onChange={(val) => onChange('algemeen.woning.gebouwtype', val)}
                options={gebouwtypeOptions}
                placeholder={getTranslation('general.selectGebouwtype', 'Kies gebouwtype...', 'Choose building type...')}
                validationStatus={getSelectValidationStatus('gebouwtype')}
                label={getTranslation('general.gebouwtype', 'Gebouwtype', 'Building Type')}
                hideLabelHtml={true}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('subtype', getTranslation('general.subtype', 'Subtype woning', 'Property Subtype'))}>
              <AppSelect
                value={data.algemeen.woning.subtype || ''}
                onChange={(val) => onChange('algemeen.woning.subtype', val)}
                options={subtypeOptions}
                placeholder={getTranslation('general.selectSubtype', 'Kies subtype...', 'Choose property subtype...')}
                validationStatus={getSelectValidationStatus('subtype')}
                label={getTranslation('general.subtype', 'Subtype woning', 'Property Subtype')}
                hideLabelHtml={true}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('ligging', getTranslation('general.ligging', 'Ligging', 'Exposure'))}>
              <AppSelect
                value={data.algemeen.woning.ligging || ''}
                onChange={(val) => onChange('algemeen.woning.ligging', val)}
                options={liggingOptions}
                placeholder={getTranslation('general.selectLigging', 'Kies ligging...', 'Choose exposure...')}
                validationStatus={getSelectValidationStatus('ligging')}
                label={getTranslation('general.ligging', 'Ligging', 'Exposure')}
                hideLabelHtml={true}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('daktype', getTranslation('general.daktype', 'Daktype', 'Roof Type'))}>
              <AppSelect
                value={data.algemeen.woning.daktype || ''}
                onChange={(val) => onChange('algemeen.woning.daktype', val)}
                options={daktypeOptions}
                placeholder={getTranslation('general.selectDaktype', 'Kies daktype...', 'Choose roof type...')}
                validationStatus={getSelectValidationStatus('daktype')}
                label={getTranslation('general.daktype', 'Daktype', 'Roof Type')}
                hideLabelHtml={true}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('gebouwhoogte', getTranslation('general.gebouwhoogte', 'Gebouwhoogte', 'Building Height'))}>
              <div className="flex items-center gap-2 flex-1 w-full">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                  className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('gebouwhoogte')}`}
                  value={data.algemeen.woning.gebouwhoogte || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      onChange('algemeen.woning.gebouwhoogte', val);
                    }
                  }}
                />
                <span className="text-on-surface-variant/60 font-bold">m</span>
              </div>
            </FieldGroup>

            {/* First GBO-T field */}
            <FieldGroup label={renderLabelWithFlags('gbot-0', gboTCount > 1 ? "GBO-T (1)" : "GBO-T")}>
              <div className="flex items-center gap-2 flex-1 w-full">
                <input
                  type="number"
                  min="0"
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                  className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('gbot-0')}`}
                  value={data.algemeen.technical.gboTs[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      onChange('algemeen.technical.gboTs.0', val);
                    }
                  }}
                />
                <span className="text-on-surface-variant/60 font-bold">m²</span>
                {gboTCount === 1 && (
                  <button
                    type="button"
                    onClick={onAddGboT}
                    className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </FieldGroup>
          </div>

          {/* Remaining GBO-T fields */}
          {data.algemeen.technical.gboTs.slice(1).map((val, idx) => (
            <div key={idx + 1} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label={renderLabelWithFlags(`gbot-${idx + 1}`, `GBO-T (${idx + 2})`)}>
                <div className="flex items-center gap-2 flex-1 w-full">
                  <input
                    type="number"
                    min="0"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                    className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder(`gbot-${idx + 1}`)}`}
                    value={val || ''}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      if (valStr === '' || parseFloat(valStr) >= 0) {
                        onChange(`algemeen.technical.gboTs.${idx + 1}`, valStr);
                      }
                    }}
                  />
                  <span className="text-on-surface-variant/60 font-bold">m²</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {idx + 1 === gboTCount - 1 && (
                      <button
                        type="button"
                        onClick={onAddGboT}
                        className="p-2 hover:bg-primary/10 rounded-xl text-primary transition-colors cursor-pointer"
                        title={t('common.add') || 'Toevoegen'}
                      >
                        <Plus size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteGboT(idx + 1)}
                      className="p-2 hover:bg-red-50 rounded-xl text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                      title={t('common.delete') || 'Verwijderen'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </FieldGroup>
              <div />
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('floorConstructieType', getTranslation('general.floorConstructieType', 'Vloer constructietype', 'Floor Construction Type'))}>
              <AppSelect
                value={data.algemeen.woning.floorConstructieType || ''}
                onChange={(val) => onChange('algemeen.woning.floorConstructieType', val)}
                options={constructieTypeOptions}
                placeholder={getTranslation('general.selectFloorType', 'Kies vloer constructietype...', 'Choose floor construction type...')}
                validationStatus={getSelectValidationStatus('floorConstructieType')}
                label={getTranslation('general.floorConstructieType', 'Vloer constructietype', 'Floor Construction Type')}
                hideLabelHtml={true}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('wallConstructieType', getTranslation('general.wallConstructieType', 'Wand constructietype', 'Wall Construction Type'))}>
              <AppSelect
                value={data.algemeen.woning.wallConstructieType || ''}
                onChange={(val) => onChange('algemeen.woning.wallConstructieType', val)}
                options={constructieTypeOptions}
                placeholder={getTranslation('general.selectWallType', 'Kies wand constructietype...', 'Choose wall construction type...')}
                validationStatus={getSelectValidationStatus('wallConstructieType')}
                label={getTranslation('general.wallConstructieType', 'Wand constructietype', 'Wall Construction Type')}
                hideLabelHtml={true}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('leidingdoorvoeren', getTranslation('general.leidingdoorvoeren', 'Leidingdoorvoeren', 'Pipe Penetrations'))}>
              <AppSelect
                value={data.algemeen.technical.leidingdoorvoeren || ''}
                onChange={(val) => onChange('algemeen.technical.leidingdoorvoeren', val)}
                options={leidingOptions}
                placeholder={getTranslation('general.selectLeiding', 'Selecteer...', 'Select...')}
                validationStatus={getSelectValidationStatus('leidingdoorvoeren')}
                label={getTranslation('general.leidingdoorvoeren', 'Leidingdoorvoeren', 'Pipe Penetrations')}
                hideLabelHtml={true}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('avr', getTranslation('general.aantalAvr', 'Aantal AVR', 'Number of AVRs'))}>
              <input
                type="number"
                min="0"
                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('avr')}`}
                value={data.algemeen.technical.avr || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    onChange('algemeen.technical.avr', val);
                  }
                }}
              />
            </FieldGroup>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default AlgemeenView;
export { AlgemeenView };
