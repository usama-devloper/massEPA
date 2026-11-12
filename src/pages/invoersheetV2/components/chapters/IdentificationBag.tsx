import React, { useState } from 'react';
import { BagIdentification, ProjectDossier } from '../../types';
import { 
  Building2, 
  MapPin, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Home, 
  Layers, 
  Compass,
  FileCheck2,
  AlertCircle,
  Eye,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';
import { renderV1Field } from '../common/LegacyField';

interface IdentificationBagProps {
  bag: BagIdentification;
  onUpdateBag: (updated: Partial<BagIdentification>) => void;
  dossier?: ProjectDossier;
  onNavigateToChapter?: (chapter: any) => void;
  flags?: Record<string, 'red' | 'yellow' | 'green' | null>;
  onUpdateFlag?: (fieldKey: string, flag: 'red' | 'yellow' | 'green' | null) => void;
  fieldRoles?: Record<string, string>;
  onAutoInspectField?: (fieldKey: string) => void;
}

export const IdentificationBag: React.FC<IdentificationBagProps> = ({
  bag,
  onUpdateBag,
  dossier,
  onNavigateToChapter,
  flags,
  onUpdateFlag,
  fieldRoles,
  onAutoInspectField
}) => {
  const [isBagVerified, setIsBagVerified] = useState<boolean>(true);
  const [isSearchingBag, setIsSearchingBag] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const { t } = useLanguage();

  // Transient state for area calculation
  const [agLength, setAgLength] = useState<number | ''>('');
  const [agWidth, setAgWidth] = useState<number | ''>('');
  const [alsLength, setAlsLength] = useState<number | ''>('');
  const [alsWidth, setAlsWidth] = useState<number | ''>('');

  const handleSimulateBagLookup = () => {
    setIsSearchingBag(true);
    setSearchFeedback(null);
    setTimeout(() => {
      setIsSearchingBag(false);
      setIsBagVerified(true);
      setSearchFeedback(t('invoersheetV2.identificationBag.syncSuccess') || 'Succesvol gesynchroniseerd met Landelijke Voorziening BAG (LV-BAG API). Geometrie en PandID geverifieerd.');
    }, 600);
  };

  const handleAreaChange = (field: 'usableAreaAg' | 'lossAreaAls', value: number) => {
    const updated = { [field]: value };
    const newAg = field === 'usableAreaAg' ? value : bag.usableAreaAg;
    const newAls = field === 'lossAreaAls' ? value : bag.lossAreaAls;
    if (newAg > 0) {
      updated.compactnessAlsAg = Math.round((newAls / newAg) * 100) / 100;
    }
    onUpdateBag(updated);
  };

  const buildingTypes: BagIdentification['buildingType'][] = [
    t('invoersheetV2.identificationBag.terracedHouse') || 'Tussenwoning',
    t('invoersheetV2.identificationBag.cornerHouse') || 'Hoekwoning',
    t('invoersheetV2.identificationBag.semiDetached') || 'Twee-onder-één-kap',
    t('invoersheetV2.identificationBag.detached') || 'Vrijstaand',
    t('invoersheetV2.identificationBag.apartmentIntermediate') || 'Appartement (tussen)',
    t('invoersheetV2.identificationBag.apartmentTop') || 'Appartement (dak)'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Copied from 1st screen: 1. Visuals (House information) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Eye className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.identificationBag.visualsTitle') || '1. Visuals (House information)'}</span>
          </h1>
        </div>


      </div>

      {/* Chapter header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Building2 className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.identificationBag.bagTitle') || 'Kadastrale & BAG Identificatie (NTA 8800)'}</span>
          </h2>
        </div>

        <button
          onClick={handleSimulateBagLookup}
          disabled={isSearchingBag}
          className="flex items-center space-x-2 px-3 py-2 bg-primary hover:bg-primary text-white text-xs font-medium rounded-lg transition shadow-xs"
        >
          <Search className={`w-3.5 h-3.5 text-emerald-500 ${isSearchingBag ? 'animate-spin' : ''}`} />
          <span>{isSearchingBag ? (t('invoersheetV2.identificationBag.requestingBag') || 'BAG Opvragen...') : (t('invoersheetV2.identificationBag.syncWithBag') || 'Synchroniseer met BAG')}</span>
        </button>
      </div>

      {searchFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center space-x-2 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{searchFeedback}</span>
        </div>
      )}

      {/* Main BAG Data Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Official BAG Identifiers & Address */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#2563eb]" />
              <span>{t('invoersheetV2.identificationBag.addressAndKeys') || 'Adresgegevens & Landelijke Sleutels'}</span>
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t('invoersheetV2.identificationBag.lvBagValidated') || 'LV-BAG Gevalideerd'}</span>
            </span>
          </div>

          {(() => {
            const bagSpans: Record<string, number> = {
              pandId: 1,
              vboId: 1,
              address: 1,
              houseNumber: 1,
              postalCode: 1,
              city: 1,
              municipality: 2
            };

            return (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs items-start">
                <div className={`w-full ${bagSpans['pandId'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderV1Field(
                    t('invoersheetV2.identificationBag.bagPandId') || 'BAG PandID (16 cijfers)',
                    bag.pandId,
                    'BAG',
                    flags?.['bag.pandId'] || 'none',
                    (v) => onUpdateBag({ pandId: v }),
                    'text',
                    undefined,
                    undefined,
                    flags?.['bag.pandId'],
                    onUpdateFlag ? (val) => onUpdateFlag('bag.pandId', val) : undefined,
                    fieldRoles?.['bag.pandId'],
                    () => onAutoInspectField?.('bag.pandId'),
                    '16-cijferig PandID'
                  )}
                </div>

                <div className={`w-full ${bagSpans['vboId'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderV1Field(
                    t('invoersheetV2.identificationBag.bagVboId') || 'BAG Verblijfsobject (VBO-ID)',
                    bag.vboId,
                    'BAG',
                    flags?.['bag.vboId'] || 'none',
                    (v) => onUpdateBag({ vboId: v }),
                    'text',
                    undefined,
                    undefined,
                    flags?.['bag.vboId'],
                    onUpdateFlag ? (val) => onUpdateFlag('bag.vboId', val) : undefined,
                    fieldRoles?.['bag.vboId'],
                    () => onAutoInspectField?.('bag.vboId'),
                    '16-cijferig VBO-ID'
                  )}
                </div>

                <div className={`w-full ${bagSpans['address'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderV1Field(
                    t('invoersheetV2.identificationBag.streetName') || 'Straatnaam',
                    bag.address,
                    'BAG',
                    flags?.['bag.address'] || 'none',
                    (v) => onUpdateBag({ address: v }),
                    'text',
                    undefined,
                    undefined,
                    flags?.['bag.address'],
                    onUpdateFlag ? (val) => onUpdateFlag('bag.address', val) : undefined,
                    fieldRoles?.['bag.address'],
                    () => onAutoInspectField?.('bag.address'),
                    'Straatnaam'
                  )}
                </div>

                <div className={`w-full ${bagSpans['houseNumber'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderV1Field(
                    t('invoersheetV2.identificationBag.houseNumber') || 'Huisnummer',
                    bag.houseNumber,
                    'BAG',
                    flags?.['bag.houseNumber'] || 'none',
                    (v) => onUpdateBag({ houseNumber: v }),
                    'text',
                    undefined,
                    undefined,
                    flags?.['bag.houseNumber'],
                    onUpdateFlag ? (val) => onUpdateFlag('bag.houseNumber', val) : undefined,
                    fieldRoles?.['bag.houseNumber'],
                    () => onAutoInspectField?.('bag.houseNumber'),
                    'Huisnummer + toev.'
                  )}
                </div>

                <div className={`w-full ${bagSpans['postalCode'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderV1Field(
                    t('invoersheetV2.identificationBag.postalCode') || 'Postcode',
                    bag.postalCode,
                    'BAG',
                    flags?.['bag.postalCode'] || 'none',
                    (v) => onUpdateBag({ postalCode: v }),
                    'text',
                    undefined,
                    undefined,
                    flags?.['bag.postalCode'],
                    onUpdateFlag ? (val) => onUpdateFlag('bag.postalCode', val) : undefined,
                    fieldRoles?.['bag.postalCode'],
                    () => onAutoInspectField?.('bag.postalCode'),
                    '1234 AB'
                  )}
                </div>

                <div className={`w-full ${bagSpans['city'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderV1Field(
                    t('invoersheetV2.identificationBag.city') || 'Woonplaats',
                    bag.city,
                    'BAG',
                    flags?.['bag.city'] || 'none',
                    (v) => onUpdateBag({ city: v }),
                    'text',
                    undefined,
                    undefined,
                    flags?.['bag.city'],
                    onUpdateFlag ? (val) => onUpdateFlag('bag.city', val) : undefined,
                    fieldRoles?.['bag.city'],
                    () => onAutoInspectField?.('bag.city'),
                    'Woonplaats'
                  )}
                </div>

                <div className={`w-full ${bagSpans['municipality'] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  {renderV1Field(
                    t('invoersheetV2.identificationBag.municipality') || 'Gemeente',
                    bag.municipality,
                    'BAG',
                    flags?.['bag.municipality'] || 'none',
                    (v) => onUpdateBag({ municipality: v }),
                    'text',
                    undefined,
                    undefined,
                    flags?.['bag.municipality'],
                    onUpdateFlag ? (val) => onUpdateFlag('bag.municipality', val) : undefined,
                    fieldRoles?.['bag.municipality'],
                    () => onAutoInspectField?.('bag.municipality'),
                    'Gemeentenaam'
                  )}
                </div>
              </div>
            );
          })()}

          {/* Building Typology selector */}
          <div className="pt-3 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              {t('invoersheetV2.identificationBag.buildingTypology') || 'Gebouwtypologie Woningbouw (NTA 8800)'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {buildingTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdateBag({ buildingType: type })}
                  className={`px-3 py-2 text-xs rounded border text-left transition ${
                    bag.buildingType === type
                      ? 'bg-primary text-white border-[#0f2038] font-medium'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Home className={`w-3.5 h-3.5 inline mr-1.5 ${bag.buildingType === type ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Geometry, Areas & NEN 2580 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>{t('invoersheetV2.identificationBag.measurementArea') || 'Meetstaat & Maatvoering (NEN 2580)'}</span>
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700">
                  {t('invoersheetV2.identificationBag.usableAreaAg') || 'Gebruiksoppervlakte (Ag)'}
                </label>
                <span className="text-[11px] font-mono text-slate-500">m²</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  placeholder={t('invoersheetV2.identificationBag.length') || "Lengte"}
                  value={agLength}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setAgLength(val);
                    if (val !== '' && agWidth !== '') {
                      handleAreaChange('usableAreaAg', Math.round(val * Number(agWidth) * 100) / 100);
                    }
                  }}
                  className="w-full text-xs px-2 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
                />
                <span className="text-slate-400 font-medium text-[10px]">×</span>
                <input
                  type="number"
                  placeholder={t('invoersheetV2.identificationBag.width') || "Breedte"}
                  value={agWidth}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setAgWidth(val);
                    if (val !== '' && agLength !== '') {
                      handleAreaChange('usableAreaAg', Math.round(Number(agLength) * val * 100) / 100);
                    }
                  }}
                  className="w-full text-xs px-2 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
                />
                <span className="text-slate-400 font-medium text-[10px]">=</span>
                <input
                  type="number"
                  step="0.1"
                  value={bag.usableAreaAg}
                  onChange={(e) => {
                    handleAreaChange('usableAreaAg', parseFloat(e.target.value) || 0);
                    setAgLength('');
                    setAgWidth('');
                  }}
                  className="w-full text-xs font-mono font-bold px-2 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded focus:bg-white focus:border-primary outline-none text-center"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t('invoersheetV2.identificationBag.usableAreaHelp') || 'Binnenwerks gemeten conform NTA 8800. Vul L × B in of direct het totaal.'}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700">
                  {t('invoersheetV2.identificationBag.lossAreaAls') || 'Verliesoppervlakte (Als)'}
                </label>
                <span className="text-[11px] font-mono text-slate-500">m²</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  placeholder={t('invoersheetV2.identificationBag.length') || "Lengte"}
                  value={alsLength}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setAlsLength(val);
                    if (val !== '' && alsWidth !== '') {
                      handleAreaChange('lossAreaAls', Math.round(val * Number(alsWidth) * 100) / 100);
                    }
                  }}
                  className="w-full text-xs px-2 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
                />
                <span className="text-slate-400 font-medium text-[10px]">×</span>
                <input
                  type="number"
                  placeholder={t('invoersheetV2.identificationBag.width') || "Breedte"}
                  value={alsWidth}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setAlsWidth(val);
                    if (val !== '' && alsLength !== '') {
                      handleAreaChange('lossAreaAls', Math.round(Number(alsLength) * val * 100) / 100);
                    }
                  }}
                  className="w-full text-xs px-2 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
                />
                <span className="text-slate-400 font-medium text-[10px]">=</span>
                <input
                  type="number"
                  step="0.1"
                  value={bag.lossAreaAls}
                  onChange={(e) => {
                    handleAreaChange('lossAreaAls', parseFloat(e.target.value) || 0);
                    setAlsLength('');
                    setAlsWidth('');
                  }}
                  className="w-full text-xs font-mono font-bold px-2 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded focus:bg-white focus:border-primary outline-none text-center"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {t('invoersheetV2.identificationBag.lossAreaHelp') || 'Totale buitenschil. Vul L × B in of direct het totaal.'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-600 mb-1 flex items-center justify-between">
                <span>{t('invoersheetV2.identificationBag.compactnessAlsAg') || 'Compactheid (Als / Ag)'}</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {bag.compactnessAlsAg}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {t('invoersheetV2.identificationBag.compactnessHelp') || 'Lagere ratio betekent efficiëntere vormfactor en minder energieverlies per m² woonoppervlakte.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('invoersheetV2.identificationBag.constructionYear') || 'Bouwjaar'}
                </label>
                <input
                  type="number"
                  value={bag.constructionYear || ''}
                  placeholder="Bijv. 1995"
                  onChange={(e) => onUpdateBag({ constructionYear: parseInt(e.target.value) || 1990 })}
                  className="w-full text-xs font-mono px-2 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('invoersheetV2.identificationBag.grossVolumeM3') || 'Bruto Inhoud (m³)'}
                </label>
                <input
                  type="number"
                  value={bag.volumeM3 || ''}
                  placeholder="Bijv. 350"
                  onChange={(e) => onUpdateBag({ volumeM3: parseFloat(e.target.value) || 300 })}
                  className="w-full text-xs font-mono px-2 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Aantal bouwlagen
                </label>
                <input
                  type="number"
                  value={bag.floorsCount || ''}
                  placeholder="Bijv. 3"
                  onChange={(e) => onUpdateBag({ floorsCount: parseInt(e.target.value) || 1 })}
                  className="w-full text-xs font-mono px-2 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('invoersheetV2.identificationBag.usageFunction') || 'Gebruiksfunctie'}
              </label>
              <input
                type="text"
                value={bag.usageFunction || ''}
                placeholder="Bijv. Woonfunctie (Woning)"
                onChange={(e) => onUpdateBag({ usageFunction: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

