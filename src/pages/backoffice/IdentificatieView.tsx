import React from 'react';
import { CollapsibleSection, FieldGroup } from '../../components/ui/BackOfficeUI';
import { InspectionData } from './backofficeTypes';
import { useLanguage } from '../../context/LanguageContext';

interface IdentificatieViewProps {
  data: InspectionData;
  onChange: (path: string | Record<string, string>, value?: string) => void;
}

// 1. Bewoner (Resident) View
export const BewonerView: React.FC<IdentificatieViewProps> = ({ data, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Title Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-black text-on-background tracking-tight flex items-center gap-2">
          <span className="text-on-surface-variant/40 font-normal">{t('nav.identificatie') || 'Identificatie'}</span>
          <span className="text-on-surface-variant/40 font-normal text-xl">/</span>
          <span>{t('nav.bewoner') || 'Bewoner'}</span>
        </h1>
      </div>

      <CollapsibleSection title={t('bewoner.title') || 'Bewoner'}>
        <div className="grid grid-cols-1 gap-y-3.5">
          <FieldGroup label={t('bewoner.persoon') || 'Contactpersoon'}>
            <input
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bewoner.persoon || ''}
              onChange={(e) => onChange('algemeen.bewoner.persoon', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label={t('bewoner.telefoon') || 'Telefoonnummer'}>
            <input
              type="tel"
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bewoner.telefoon || ''}
              onChange={(e) => onChange('algemeen.bewoner.telefoon', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label={t('bewoner.email') || 'E-mailadres'}>
            <input
              type="email"
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bewoner.email || ''}
              onChange={(e) => onChange('algemeen.bewoner.email', e.target.value)}
            />
          </FieldGroup>

          <div className="h-px bg-outline-variant/10 my-3" />
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-xs font-black text-on-surface-variant/40 uppercase tracking-wider">{t('bewoner.addressInfo') || 'Adresgegevens'}</h3>
            <button
              type="button"
              onClick={() => {
                onChange({
                  'algemeen.bewoner.adres': data.algemeen.woning.adres || '',
                  'algemeen.bewoner.postcode': data.algemeen.woning.postcode || '',
                  'algemeen.bewoner.plaats': data.algemeen.woning.plaats || ''
                });
              }}
              className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('bewoner.copyAddress') || 'Kopieer adres van woning'}</span>
            </button>
          </div>

          <FieldGroup label={t('general.adres') || 'Adres'}>
            <input
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bewoner.adres || ''}
              onChange={(e) => onChange('algemeen.bewoner.adres', e.target.value)}
            />
          </FieldGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={t('general.postcode') || 'Postcode'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-mono font-bold"
                value={data.algemeen.bewoner.postcode || ''}
                onChange={(e) => onChange('algemeen.bewoner.postcode', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={t('general.plaats') || 'Plaats'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
                value={data.algemeen.bewoner.plaats || ''}
                onChange={(e) => onChange('algemeen.bewoner.plaats', e.target.value)}
              />
            </FieldGroup>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

// 2. Inspector View
export const InspectorView: React.FC<IdentificatieViewProps> = ({ data, onChange }) => {
  const { t } = useLanguage();
  const [flags, setFlags] = React.useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    try {
      const saved = localStorage.getItem(`inspector_flags_${data.clientId || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(`inspector_flags_${data.clientId || 'default'}`, JSON.stringify(flags));
    } catch (e) { console.error(e); }
  }, [flags, data.clientId]);

  const toggleFlag = (fieldKey: string, status: 'red' | 'yellow' | 'green' | null) => {
    setFlags(prev => {
      const current = prev[fieldKey];
      return { ...prev, [fieldKey]: current === status ? null : status };
    });
  };

  const getFieldBorder = (fieldKey: string) => {
    const status = flags[fieldKey];
    if (status === 'red') return '!border-red-500 ring-2 ring-red-100 bg-red-50/20';
    if (status === 'yellow') return '!border-amber-500 ring-2 ring-amber-100 bg-amber-50/20';
    if (status === 'green') return '!border-green-500 ring-2 ring-green-100 bg-green-50/20';
    return '';
  };

  const renderLabelWithFlags = (fieldKey: string, label: string) => {
    const status = flags[fieldKey];
    let labelNode;
    if (status === 'red') {
      labelNode = <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider block w-fit">{label}</span>;
    } else if (status === 'yellow') {
      labelNode = <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider block w-fit">{label}</span>;
    } else if (status === 'green') {
      labelNode = <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider block w-fit">{label}</span>;
    } else {
      labelNode = <span className="text-on-surface-variant/70 font-bold text-[10px] uppercase tracking-wider leading-tight">{label}</span>;
    }
    return (
      <div className="flex flex-col gap-1 w-full md:w-40 shrink-0 select-none">
        {labelNode}
        <div className="flex items-center gap-0.5 w-16 h-2 rounded overflow-hidden mt-0.5">
          <button type="button" onClick={() => toggleFlag(fieldKey, 'red')}
            className={`flex-1 h-full cursor-pointer transition-all duration-150 ${status === 'red' ? 'bg-red-600' : 'bg-red-200/30 hover:bg-red-200/60'}`}
            title="Action required / Missing" />
          <button type="button" onClick={() => toggleFlag(fieldKey, 'yellow')}
            className={`flex-1 h-full cursor-pointer transition-all duration-150 ${status === 'yellow' ? 'bg-amber-500' : 'bg-amber-200/30 hover:bg-amber-200/60'}`}
            title="Needs review" />
          <button type="button" onClick={() => toggleFlag(fieldKey, 'green')}
            className={`flex-1 h-full cursor-pointer transition-all duration-150 ${status === 'green' ? 'bg-green-600' : 'bg-green-200/30 hover:bg-green-200/60'}`}
            title="Verified / OK" />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Title Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-black text-on-background tracking-tight flex items-center gap-2">
          <span className="text-on-surface-variant/40 font-normal">{t('nav.identificatie') || 'Identificatie'}</span>
          <span className="text-on-surface-variant/40 font-normal text-xl">/</span>
          <span>{t('nav.inspector') || 'Inspector'}</span>
        </h1>
      </div>

      <CollapsibleSection title={t('inspector.title') || 'Inspecteur'}>
        <div className="grid grid-cols-1 gap-y-3.5">
          <FieldGroup label={t('inspector.inspecteur') || 'Naam inspecteur'}>
            <input
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.inspector.adviseur || ''}
              onChange={(e) => onChange('algemeen.inspector.adviseur', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label={t('general.adres') || 'Adres'}>
            <input
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.inspector.adres || ''}
              onChange={(e) => onChange('algemeen.inspector.adres', e.target.value)}
            />
          </FieldGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={t('general.postcode') || 'Postcode'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-mono font-bold"
                value={data.algemeen.inspector.postcode || ''}
                onChange={(e) => onChange('algemeen.inspector.postcode', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={t('general.plaats') || 'Plaats'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
                value={data.algemeen.inspector.plaats || ''}
                onChange={(e) => onChange('algemeen.inspector.plaats', e.target.value)}
              />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={t('bewoner.telefoon') || 'Telefoonnummer'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
                value={data.algemeen.inspector.telefoon || ''}
                onChange={(e) => onChange('algemeen.inspector.telefoon', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={t('bewoner.email') || 'E-mailadres'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
                value={data.algemeen.inspector.email || ''}
                onChange={(e) => onChange('algemeen.inspector.email', e.target.value)}
              />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={t('inspector.certificaathouder') || 'Certificaatnummer'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
                value={data.algemeen.inspector.certificaathouder || ''}
                onChange={(e) => onChange('algemeen.inspector.certificaathouder', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={t('inspector.gebruiker') || 'Certificaathouder'}>
              <input
                className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
                value={data.algemeen.inspector.gebruiker || ''}
                onChange={(e) => onChange('algemeen.inspector.gebruiker', e.target.value)}
              />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup label={renderLabelWithFlags('opnamedatum', t('inspector.opnamedatum') || 'Opnamedatum')}>
              <input
                type="date"
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('opnamedatum')}`}
                value={data.algemeen.inspector.opnamedatum || ''}
                onChange={(e) => onChange('algemeen.inspector.opnamedatum', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('invoerdatum', t('inspector.invoerdatum') || 'Invoerdatum')}>
              <input
                type="date"
                className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border border-transparent transition-all font-semibold ${getFieldBorder('invoerdatum')}`}
                value={data.algemeen.inspector.invoerdatum || ''}
                onChange={(e) => onChange('algemeen.inspector.invoerdatum', e.target.value)}
              />
            </FieldGroup>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};


// 3. BID Intern View
export const BIDInternView: React.FC<IdentificatieViewProps> = ({ data, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Title Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-black text-on-background tracking-tight flex items-center gap-2">
          <span className="text-on-surface-variant/40 font-normal">{t('nav.identificatie') || 'Identificatie'}</span>
          <span className="text-on-surface-variant/40 font-normal text-xl">/</span>
          <span>{t('nav.bidIntern') || 'BID intern'}</span>
        </h1>
      </div>

      <CollapsibleSection title={t('bidIntern.title') || 'BID Intern'}>
        <div className="grid grid-cols-1 gap-y-3.5">
          <FieldGroup label={t('bidIntern.fullName') || 'Volledige naam'}>
            <input
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bidIntern.fullName || ''}
              onChange={(e) => onChange('algemeen.bidIntern.fullName', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label={t('bidIntern.phoneNumber') || 'Telefoonnummer'}>
            <input
              type="tel"
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bidIntern.phoneNumber || ''}
              onChange={(e) => onChange('algemeen.bidIntern.phoneNumber', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label={t('bidIntern.email') || 'E-mailadres'}>
            <input
              type="email"
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bidIntern.email || ''}
              onChange={(e) => onChange('algemeen.bidIntern.email', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label={t('bidIntern.contactAddress') || 'Contactadres'}>
            <input
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold"
              value={data.algemeen.bidIntern.contactAddress || ''}
              onChange={(e) => onChange('algemeen.bidIntern.contactAddress', e.target.value)}
            />
          </FieldGroup>
        </div>
      </CollapsibleSection>
    </div>
  );
};
