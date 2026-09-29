import React, { useState } from 'react';
import { InstallationSystem } from '../../types';
import { InteriorSpacesSection } from './InteriorSpacesSection';
import { AppSelect } from '../../../../../components/common/AppSelect';
import { 
  Flame, 
  Sun, 
  Wind, 
  Droplets, 
  Zap, 
  Cpu, 
  CheckCircle2, 
  Gauge, 
  ShieldCheck,
  HelpCircle,
  Home,
  Sliders,
  Camera,
  ChevronLeft,
  Check
} from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

interface InstallationsProps {
  installations: InstallationSystem;
  facadesData?: any[];
  onUpdateInstallations: (updated: Partial<InstallationSystem>) => void;
  usableAreaAg: number;
  onNavigateToChapter?: (chapter: any) => void;
  onUpdateSpacesCount?: (count: number) => void;
  interiorSpacesData?: any[];
  onUpdateInteriorSpacesData?: (data: any[]) => void;
}

export const Installations: React.FC<InstallationsProps> = ({
  installations,
  facadesData,
  onUpdateInstallations,
  usableAreaAg,
  onNavigateToChapter,
  onUpdateSpacesCount,
  interiorSpacesData,
  onUpdateInteriorSpacesData
}) => {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<'interior_spaces' | 'calculator'>('interior_spaces');
  const totalWp = installations.solarPvPanelsCount * installations.solarPvWpPerPanel;
  const estAnnualYieldKwh = Math.round(totalWp * 0.9);

  if (activeView === 'interior_spaces') {
    return (
      <InteriorSpacesSection
        installations={installations}
        facadesData={facadesData}
        onUpdateInstallations={onUpdateInstallations}
        usableAreaAg={usableAreaAg}
        onSwitchToCalculationTab={() => setActiveView('calculator')}
        onUpdateSpacesCount={onUpdateSpacesCount}
        interiorSpacesData={interiorSpacesData}
        onUpdateInteriorSpacesData={onUpdateInteriorSpacesData}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Chapter header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Flame className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.installations.title') || 'Installaties, Ventilatie & PV Parameters'}</span>
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('interior_spaces')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-[#1a2f4d] text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('invoersheetV2.installations.toInteriorSpaces') || 'Naar Interior Spaces (Audit Formaat)'}</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-slate-600">{t('invoersheetV2.installations.pvArray') || 'PV Array:'}</span>
            <span className="font-mono font-bold text-slate-900">{totalWp} Wp</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Ruimteverwarming */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>{t('invoersheetV2.installations.spaceHeatingTitle') || 'Ruimteverwarming (Opwekker & SCOP)'}</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {t('invoersheetV2.installations.bcrgVerified') || 'BCRG Geverifieerd'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('invoersheetV2.installations.mainGeneratorType') || 'Type Hoofdopwekker'}</label>
              <AppSelect
                value={installations.heatingType}
                onChange={(val) =>
                  onUpdateInstallations({
                    heatingType: val as InstallationSystem['heatingType']
                  })
                }
                options={[
                  { value: "Warmtepomp (Lucht/Water)", label: t('invoersheetV2.installations.generatorHeatPumpAirWater') || "Warmtepomp (Lucht/Water split)" },
                  { value: "Warmtepomp (Bodem/Water)", label: t('invoersheetV2.installations.generatorHeatPumpGroundWater') || "Warmtepomp (Bodem/Water gesloten bron)" },
                  { value: "Hybride Warmtepomp + HR-ketel", label: t('invoersheetV2.installations.generatorHybrid') || "Hybride Warmtepomp + HR-107 CV" },
                  { value: "HR-107 CV-ketel", label: t('invoersheetV2.installations.generatorHR107') || "HR-107 Aardgas Combiketel" },
                  { value: "Stadsverwarming", label: t('invoersheetV2.installations.generatorDistrictHeating') || "Stadsverwarming / Warmtenet" }
                ]}
                variant="white"
                searchable={false}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-medium">
                  {t('invoersheetV2.installations.scop') || 'Seizoensprestatiefactor (SCOP)'}
                </label>
                <span className="font-mono font-bold text-emerald-700">
                  {installations.heatingEfficiencyCOP}
                </span>
              </div>
              <input
                type="range"
                min="0.9"
                max="5.5"
                step="0.1"
                value={installations.heatingEfficiencyCOP}
                onChange={(e) =>
                  onUpdateInstallations({ heatingEfficiencyCOP: parseFloat(e.target.value) })
                }
                className="w-full accent-[#006a63]"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                <span>0.9 ({t('invoersheetV2.installations.boiler') || 'CV-ketel'})</span>
                <span>3.0 ({t('invoersheetV2.installations.hybrid') || 'Hybride'})</span>
                <span>4.4 ({t('invoersheetV2.installations.awHp') || 'L/W WP'})</span>
                <span>5.5 ({t('invoersheetV2.installations.ground') || 'Bodem'})</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-800 mb-1 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('invoersheetV2.installations.nta8800Nameplate') || 'NTA 8800 Typeplaatje & Productregistratie'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t('invoersheetV2.installations.recordedAppliance') || 'Opgenomen toestel: '}<strong>Daikin Altherma 3 R W 6kW</strong> (Buitenunit ERGA06EAV3H, Binnenunit EHVX08S18E6V).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Warm Tapwater */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>{t('invoersheetV2.installations.dhwTitle') || 'Warm Tapwater (DHW Bereiding)'}</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('invoersheetV2.installations.dhwGenerator') || 'Tapwater Bereiding Toestel'}</label>
              <AppSelect
                value={installations.tapwaterType}
                onChange={(val) =>
                  onUpdateInstallations({
                    tapwaterType: val as InstallationSystem['tapwaterType']
                  })
                }
                options={[
                  { value: "Geïntegreerde boiler warmtepomp", label: t('invoersheetV2.installations.dhwIntegratedBoilerHp') || "Geïntegreerde RVS boiler warmtepomp (180-230L)" },
                  { value: "Combiketel HR", label: t('invoersheetV2.installations.dhwCombiBoilerHr') || "Aardgas Combiketel HR-klasse" },
                  { value: "Zonneboiler + naverwarmer", label: t('invoersheetV2.installations.dhwSolarBoiler') || "Zonneboiler met collector op dak" },
                  { value: "Elektrische boiler", label: t('invoersheetV2.installations.dhwElectricBoiler') || "Elektrische boiler direct gestookt" }
                ]}
                variant="white"
                searchable={false}
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="solarBoilerCheck"
                checked={installations.hasSolarBoiler}
                onChange={(e) => onUpdateInstallations({ hasSolarBoiler: e.target.checked })}
                className="w-4 h-4 accent-[#006a63] rounded"
              />
              <label htmlFor="solarBoilerCheck" className="text-slate-700 font-medium cursor-pointer">
                {t('invoersheetV2.installations.solarBoilerPresent') || 'Zonneboilerinstallatie aanwezig op het perceel'}
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <input
                type="checkbox"
                id="coolingCheck"
                checked={installations.coolingPresent}
                onChange={(e) => onUpdateInstallations({ coolingPresent: e.target.checked })}
                className="w-4 h-4 accent-[#006a63] rounded"
              />
              <label htmlFor="coolingCheck" className="text-slate-700 font-medium cursor-pointer">
                {t('invoersheetV2.installations.coolingPresent') || 'Actieve koeling aanwezig (Vloerkoeling / Airconditioning)'}
              </label>
            </div>

            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-sky-900 text-[11px]">
              {t('invoersheetV2.installations.dhwHpInfo') || 'Tapwater warmtepompboiler reduceert het primair fossiele verbruik (EP2) aanzienlijk ten opzichte van traditionele gasgestookte doorstroomtoestellen.'}
            </div>
          </div>
        </div>

        {/* Section 3: Ventilatiesysteem */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-2">
              <Wind className="w-4 h-4 text-teal-600" />
              <span>{t('invoersheetV2.installations.ventilationTitle') || 'Ventilatiesysteem & Warmteterugwinning'}</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('invoersheetV2.installations.ventilationPrinciple') || 'Ventilatieprincipe (NEN 1087)'}</label>
              <AppSelect
                value={installations.ventilationType}
                onChange={(val) =>
                  onUpdateInstallations({
                    ventilationType: val as InstallationSystem['ventilationType']
                  })
                }
                options={[
                  { value: "Balansventilatie met WTW (Systeem D)", label: t('invoersheetV2.installations.ventSystemD') || "Systeem D: Balansventilatie met warmteterugwinning (WTW)" },
                  { value: "Mechanische afvoer (Systeem C)", label: t('invoersheetV2.installations.ventSystemC') || "Systeem C: Natuurlijke toevoer, mechanische afvoer" },
                  { value: "Vraaggestuurde ventilatie CO2", label: t('invoersheetV2.installations.ventSystemCPlus') || "Systeem C+: Vraaggestuurd op CO2 en vochtsensoren" },
                  { value: "Natuurlijke toevoer + afvoer (Systeem A)", label: t('invoersheetV2.installations.ventSystemA') || "Systeem A: Volledig natuurlijke ventilatie" }
                ]}
                variant="white"
                searchable={false}
              />
            </div>

            {installations.ventilationType.includes('WTW') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-medium">
                    {t('invoersheetV2.installations.wtwEfficiency') || 'WTW Thermisch Rendement (η_wtw)'}
                  </label>
                  <span className="font-mono font-bold text-teal-700">
                    {installations.wtwEfficiencyPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="98"
                  value={installations.wtwEfficiencyPct}
                  onChange={(e) =>
                    onUpdateInstallations({ wtwEfficiencyPct: parseInt(e.target.value) })
                  }
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-0.5">
                  <span>75% ({t('invoersheetV2.installations.basic') || 'Basis'})</span>
                  <span>90% ({t('invoersheetV2.installations.standard') || 'Standaard'})</span>
                  <span>95%+ ({t('invoersheetV2.installations.highEfficiency') || 'Hoogrendement'})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Zonne-energie (PV) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{t('invoersheetV2.installations.solarPvTitle') || 'Zonnepanelen (Fotovoltaïsch - PV)'}</span>
            </h3>
            <span className="text-xs font-mono font-bold text-amber-700">
              ~{estAnnualYieldKwh} kWh/jr
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('invoersheetV2.installations.panelsCount') || 'Aantal Panelen'}</label>
              <input
                type="number"
                min="0"
                max="60"
                value={installations.solarPvPanelsCount}
                onChange={(e) =>
                  onUpdateInstallations({ solarPvPanelsCount: parseInt(e.target.value) || 0 })
                }
                className="w-full font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('invoersheetV2.installations.powerPerPanel') || 'Vermogen per paneel (Wp)'}</label>
              <input
                type="number"
                step="5"
                value={installations.solarPvWpPerPanel}
                onChange={(e) =>
                  onUpdateInstallations({ solarPvWpPerPanel: parseInt(e.target.value) || 400 })
                }
                className="w-full font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('invoersheetV2.installations.pvOrientation') || 'Oriëntatie PV'}</label>
              <AppSelect
                value={installations.solarPvOrientation}
                onChange={(val) =>
                  onUpdateInstallations({
                    solarPvOrientation: val as InstallationSystem['solarPvOrientation']
                  })
                }
                options={[
                  { value: "Z", label: t('invoersheetV2.installations.southOptimal') || "Zuid (Optimaal)" },
                  { value: "ZO", label: t('invoersheetV2.installations.southEast') || "Zuid-Oost" },
                  { value: "ZW", label: t('invoersheetV2.installations.southWest') || "Zuid-West" },
                  { value: "O", label: t('invoersheetV2.installations.east') || "Oost" },
                  { value: "W", label: t('invoersheetV2.installations.west') || "West" }
                ]}
                variant="white"
                searchable={false}
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">{t('invoersheetV2.installations.inclinationAngle') || 'Hellingshoek (°)'}</label>
              <input
                type="number"
                min="0"
                max="90"
                value={installations.solarPvInclinationDeg}
                onChange={(e) =>
                  onUpdateInstallations({ solarPvInclinationDeg: parseInt(e.target.value) || 35 })
                }
                className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-amber-950 text-[11px]">
            {t('invoersheetV2.installations.totalCalculatedPeak') || 'Totale berekende piekcapaciteit:'} <strong>{(totalWp / 1000).toFixed(2)} kWp</strong>. 
            {t('invoersheetV2.installations.solarYieldInfo') || 'Deze zonneopbrengst compenseert direct voor de primaire fossiele energie (EP1) van de woning.'}
          </div>
        </div>
      </div>
    </div>
  );
};

