import { EnvelopeElement, InstallationSystem, EnergyLabel, BagIdentification } from '../types';

export interface NtaCalculationResult {
  ep1: number; // kWh/m².yr (Fossiel energieverbruik)
  ep2: number; // kWh/m².yr (Primair fossiel)
  ep3: number; // % (Hernieuwbare energie)
  toJuli: number; // Oververhittingsindicator
  label: EnergyLabel;
  htLoss: number; // W/K (Transmissieverlies)
  hvLoss: number; // W/K (Ventilatieverlies)
  solarYieldKwhYr: number; // kWh/yr
  co2EmissionKgM2Yr: number; // kg/m².yr
  netHeatingDemandKwhM2: number;
}

export function calculateNta8800(
  bag: BagIdentification,
  envelope: EnvelopeElement[],
  installations: InstallationSystem
): NtaCalculationResult {
  const ag = Math.max(20, bag.usableAreaAg || 120);

  // 1. Calculate Envelope Transmission Loss (H_T in W/K)
  let htLoss = 0;
  envelope.forEach((el) => {
    if (el.type === 'raam' || el.type === 'deur') {
      const u = el.uValue || 1.4;
      htLoss += el.area * u;
    } else {
      // Opaque envelope: U = 1 / (Rc + 0.17)
      const rc = el.rc || 2.5;
      const uEquiv = 1 / (rc + 0.17);
      htLoss += el.area * uEquiv;
    }
  });

  // Ensure minimum realistic boundary
  if (htLoss === 0) htLoss = 180;

  // 2. Calculate Ventilation Heat Loss (H_V in W/K)
  // Base air flow for Ag: ~0.9 dm³/s per m² -> air volume exchange
  const airVolumeExchange = ag * 2.6 * 0.7; // m³/h effective
  let ventilationHeatLossFactor = 0.34 * airVolumeExchange; // W/K

  if (installations.ventilationType.includes('WTW (Systeem D)')) {
    const wtwEff = (installations.wtwEfficiencyPct || 90) / 100;
    ventilationHeatLossFactor *= (1 - wtwEff * 0.85); // recovery
  } else if (installations.ventilationType.includes('Systeem C')) {
    ventilationHeatLossFactor *= 0.85; // demand controlled
  }

  const hvLoss = ventilationHeatLossFactor;

  // 3. Space heating demand
  // Degree days roughly 2800 in NL: Q_heat ~ (H_T + H_V) * 24 * 2800 * 0.8 / (1000 * Ag) in kWh/m²
  const baseHeatLoss = htLoss + hvLoss;
  const rawHeatingDemandKwh = (baseHeatLoss * 24 * 2650 * 0.75) / 1000;
  const netHeatingDemandKwhM2 = Math.max(15, rawHeatingDemandKwh / ag);

  // 4. Heating system primary energy conversion
  let heatingCOP = installations.heatingEfficiencyCOP || 4.2;
  let primaryEnergyFactorHeating = 1.45; // electricity PEF in NL NTA8800 is ~1.45

  if (installations.heatingType.includes('CV-ketel')) {
    heatingCOP = 0.92;
    primaryEnergyFactorHeating = 1.0; // Gas PEF
  } else if (installations.heatingType.includes('Hybride')) {
    heatingCOP = 2.8; // combined annual performance
    primaryEnergyFactorHeating = 1.25;
  }

  const primaryHeatingEnergyM2 = (netHeatingDemandKwhM2 / heatingCOP) * primaryEnergyFactorHeating;

  // 5. Domestic hot water (DHW) demand (~25 kWh/m² primary)
  let dhwPrimaryM2 = 28;
  if (installations.tapwaterType.includes('Zonneboiler')) {
    dhwPrimaryM2 *= 0.55;
  } else if (installations.tapwaterType.includes('warmtepomp')) {
    dhwPrimaryM2 /= 2.6;
  }

  // 6. Auxiliary & ventilation fans energy
  const auxEnergyM2 = installations.ventilationType.includes('WTW') ? 6.5 : 3.8;

  // 7. Solar PV generation: ~370 Wp * panels * 0.9 kWh/Wp
  const totalWp = installations.solarPvPanelsCount * (installations.solarPvWpPerPanel || 410);
  let orientationFactor = 0.95;
  if (installations.solarPvOrientation === 'O' || installations.solarPvOrientation === 'W') orientationFactor = 0.82;
  const solarYieldKwhYr = Math.round(totalWp * orientationFactor * 0.92);
  const solarCreditKwhM2Yr = (solarYieldKwhYr / ag) * 1.45; // PEF credit

  // 8. Calculate EP1, EP2, EP3
  const totalPrimaryConsumptionM2 = primaryHeatingEnergyM2 + dhwPrimaryM2 + auxEnergyM2;
  const rawEp1 = totalPrimaryConsumptionM2 - solarCreditKwhM2Yr;
  const ep1 = Math.round(Math.max(-45, rawEp1) * 10) / 10;
  const ep2 = Math.round(totalPrimaryConsumptionM2 * 10) / 10;

  // Renewable share EP3
  const renewableGain = Math.max(0, solarYieldKwhYr) + (heatingCOP > 1 ? netHeatingDemandKwhM2 * (1 - 1 / heatingCOP) * ag : 0);
  const totalGrossDemand = (netHeatingDemandKwhM2 + dhwPrimaryM2 + auxEnergyM2) * ag;
  const ep3 = Math.min(100, Math.max(0, Math.round((renewableGain / (totalGrossDemand + 1)) * 100)));

  // TO_juli indicator (Risk of overheating in July, limit is 1.20)
  // Higher windows on Z/W without screens increase TO_juli
  let toJuliScore = 0.35;
  envelope.forEach((el) => {
    if ((el.type === 'raam') && (el.orientation === 'Z' || el.orientation === 'W')) {
      toJuliScore += (el.area / ag) * 1.8;
    }
  });
  if (installations.coolingPresent) toJuliScore *= 0.4;
  const toJuli = Math.round(toJuliScore * 100) / 100;

  // CO2 emission approx
  const co2EmissionKgM2Yr = Math.round(Math.max(0, ep1 * 0.21) * 10) / 10;

  // 9. Assign Official NTA 8800 Label Scale (Woningbouw)
  // Thresholds for EP1 in kWh/m².yr:
  // A++++ : <= 0
  // A+++  : <= 50
  // A++   : <= 75
  // A+    : <= 100
  // A     : <= 160
  // B     : <= 190
  // C     : <= 250
  // D     : <= 290
  // E     : <= 335
  // F     : <= 380
  // G     : > 380
  let label: EnergyLabel = 'G';
  if (ep1 <= 0) label = 'A++++';
  else if (ep1 <= 50) label = 'A+++';
  else if (ep1 <= 75) label = 'A++';
  else if (ep1 <= 100) label = 'A+';
  else if (ep1 <= 160) label = 'A';
  else if (ep1 <= 190) label = 'B';
  else if (ep1 <= 250) label = 'C';
  else if (ep1 <= 290) label = 'D';
  else if (ep1 <= 335) label = 'E';
  else if (ep1 <= 380) label = 'F';
  else label = 'G';

  return {
    ep1,
    ep2,
    ep3,
    toJuli,
    label,
    htLoss: Math.round(htLoss * 10) / 10,
    hvLoss: Math.round(hvLoss * 10) / 10,
    solarYieldKwhYr,
    co2EmissionKgM2Yr,
    netHeatingDemandKwhM2: Math.round(netHeatingDemandKwhM2 * 10) / 10
  };
}

export const LABEL_COLORS: Record<EnergyLabel, { bg: string; text: string; hex: string; desc: string }> = {
  'A++++': { bg: 'bg-[#004d40]', text: 'text-white', hex: '#004d40', desc: 'Energiepositief / Nul-op-de-meter' },
  'A+++': { bg: 'bg-[#00695c]', text: 'text-white', hex: '#00695c', desc: 'Zeer energiezuinig BENG conform' },
  'A++': { bg: 'bg-[#00796b]', text: 'text-white', hex: '#00796b', desc: 'Hoogwaardige isolatie & WP' },
  'A+': { bg: 'bg-[#2e7d32]', text: 'text-white', hex: '#2e7d32', desc: 'Zeer zuinig & hybride / zonne' },
  'A': { bg: 'bg-[#388e3c]', text: 'text-white', hex: '#388e3c', desc: 'Standaard nieuwbouwniveau' },
  'B': { bg: 'bg-[#689f38]', text: 'text-white', hex: '#689f38', desc: 'Goede na-isolatie' },
  'C': { bg: 'bg-[#fbc02d]', text: 'text-slate-900', hex: '#fbc02d', desc: 'Basis geïsoleerd, HR-ketel' },
  'D': { bg: 'bg-[#f57c00]', text: 'text-white', hex: '#f57c00', desc: 'Matige schilisolatie' },
  'E': { bg: 'bg-[#e64a19]', text: 'text-white', hex: '#e64a19', desc: 'Slechte isolatie, hoog verbruik' },
  'F': { bg: 'bg-[#d32f2f]', text: 'text-white', hex: '#d32f2f', desc: 'Achterstallig energetisch' },
  'G': { bg: 'bg-[#b71c1c]', text: 'text-white', hex: '#b71c1c', desc: 'Ongeïsoleerd (grootste verlies)' }
};
