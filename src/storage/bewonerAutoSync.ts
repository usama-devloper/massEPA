// src/storage/bewonerAutoSync.ts
import { apiRequest } from '../services/api';
import { loadAlgemeenFromStorage, AlgemeenStoredData } from './algemeenData';
import { loadInstallatieFromStorage, InstallatieData } from './installatieData';
import { loadHouseDesignPageRaw } from './houseDesignPageData';

let algemeenTimer: any = null;
let installatieTimer: any = null;
let houseDesignTimer: any = null;

async function getTargetAuditId(): Promise<string | null> {
  const preferred = localStorage.getItem('active_audit_id') || localStorage.getItem('mepa_active_audit_id');
  if (preferred) return preferred;

  try {
    const audits = await apiRequest('/api/audits', { method: 'GET' });
    if (Array.isArray(audits) && audits.length > 0) {
      const aid = audits[0].id;
      localStorage.setItem('active_audit_id', aid);
      localStorage.setItem('mepa_active_audit_id', aid);
      return aid;
    }
  } catch (err) {
    console.warn('[bewonerAutoSync] Failed to fetch audits:', err);
  }
  return null;
}

/**
 * Synchronizes general building details from storage to the backend API immediately.
 */
export async function syncAlgemeenToAPI(overrideData?: Partial<AlgemeenStoredData>): Promise<void> {
  if (algemeenTimer) {
    clearTimeout(algemeenTimer);
    algemeenTimer = null;
  }

  try {
    const auditId = await getTargetAuditId();
    if (!auditId) return;

    const data: Partial<AlgemeenStoredData> = overrideData 
      ? { ...loadAlgemeenFromStorage(), ...overrideData } 
      : loadAlgemeenFromStorage();

    let startFloorVal: number | null = null;
    if (data.whichFloor) {
      if (data.whichFloor.toLowerCase().includes('kelder')) startFloorVal = -1;
      else if (data.whichFloor.includes('Begane')) startFloorVal = 0;
      else {
        const matched = data.whichFloor.match(/\d+/);
        if (matched) startFloorVal = parseInt(matched[0], 10);
      }
    }

    const payload: any = {
      building_details: {
        gebouwtype: data.buildingType || undefined,
        ligging: data.position || undefined,
        daktype: data.location || undefined,
        number_of_floors: data.numberOfFloors !== null && data.numberOfFloors !== undefined 
          ? parseInt(String(data.numberOfFloors), 10) 
          : undefined,
        plaats: data.city || undefined,
        basement: data.hasKelder !== null && data.hasKelder !== undefined 
          ? (data.hasKelder ? 'Ja' : 'Nee') 
          : undefined,
        crawling_space: data.hasKruipruimte !== null && data.hasKruipruimte !== undefined 
          ? (data.hasKruipruimte ? 'Ja' : 'Nee') 
          : undefined,
        has_floor_plans: data.hasFloorPlans !== null && data.hasFloorPlans !== undefined 
          ? (data.hasFloorPlans ? 'Ja' : 'Nee') 
          : undefined,
        start_floor: startFloorVal,
        renovation_status: data.renovationStatus || undefined,
        renovation_year: data.renovationYear || undefined,
        bouwjaar: data.bouwjaar || undefined,
        gebouwhoogte: data.gebouwhoogte || undefined,
        wijk: data.wijk || undefined,
        gemeent: data.gemeente || undefined,
      }
    };

    await apiRequest(`/api/audits/${auditId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[syncAlgemeenToAPI] Error saving to API:', err);
  }
}

/**
 * Debounced sync for general building details (500ms delay).
 */
export function debouncedSyncAlgemeen(data?: Partial<AlgemeenStoredData>): void {
  if (algemeenTimer) clearTimeout(algemeenTimer);
  algemeenTimer = setTimeout(() => {
    void syncAlgemeenToAPI(data);
  }, 500);
}

/**
 * Synchronizes installations data from storage to the backend API immediately.
 */
export async function syncInstallatieToAPI(overrideData?: Partial<InstallatieData>): Promise<void> {
  if (installatieTimer) {
    clearTimeout(installatieTimer);
    installatieTimer = null;
  }

  try {
    const auditId = await getTargetAuditId();
    if (!auditId) return;

    const data: InstallatieData = overrideData 
      ? { ...loadInstallatieFromStorage(), ...overrideData } 
      : loadInstallatieFromStorage();

    const payload: any = {
      verwarming: [{
        heating_system_type: data.heatingSystemType || '',
        merk_type: data.heatingSystemType || '',
        heating_location: data.heatingLocation || '',
        other_heating_location: data.otherHeatingLocation || '',
        afgiftesysteem: data.emissionSystemType || 'Vloerverwarming',
        regeling: data.controlType || 'Regeling in hoofdvertrek',
      }],
      ventilatie: [{
        ventilation_type: data.ventilationType || '',
        systeem: data.ventilationType === 'mechanical' 
          ? 'Mechanische afzuiging' 
          : (data.ventilationType === 'natural' ? 'Natuurlijke ventilatie' : ''),
        ventilation_co2: data.ventilationCo2 !== null ? (data.ventilationCo2 ? 'Ja' : 'Nee') : '',
        merk_type: data.ventilationOpwekker || '',
        other_ventilatie_text: data.otherVentilatieText || '',
        ventilatie_sensor_locations: JSON.stringify(data.ventilatieSensorsByFloor || {}),
      }],
      tapwater: [{
        heating_same_as_water: data.heatingSameAsWater !== null ? (data.heatingSameAsWater ? 'Ja' : 'Nee') : '',
        tap_water_generator: data.tapWaterGenerator || '',
        tap_water_device: data.tapWaterDevice || '',
        tap_water_location: data.tapWaterLocation || '',
        tap_water_custom_location: data.tapWaterCustomLocation || '',
      }],
      koeling: [{
        active_cooling: data.activeCooling !== null ? (data.activeCooling ? 'Ja' : 'Nee') : '',
        cooling_locations: JSON.stringify(data.coolingRoomsByFloor || {}),
        other_cooling_room: data.otherCoolingRoom || '',
        cooling_generator_type: data.coolingGeneratorType || '',
        cooling_emission_system: data.coolingEmissionSystem || '',
        merk_type: data.coolingBrandAndType || '',
        cooling_year_built: data.coolingYearBuilt || '',
      }],
      zonnepanelen: [{
        solar_panels: data.solarPanels !== null ? (data.solarPanels ? 'Ja' : 'Nee') : '',
        solar_panel_count: data.solarPanelCount || '',
        aantal: data.solarPanelCount ? parseInt(data.solarPanelCount, 10) : undefined,
        solar_tilt_angle: data.solarTiltAngle || '',
        hellingshook: data.solarTiltAngle ? parseInt(data.solarTiltAngle, 10) : undefined,
        solar_integration: data.solarIntegration || 'Hoog geventileerd',
        bouwintegratie: data.solarIntegration || 'Hoog geventileerd',
        merk_en_type: data.solarBrandAndType || '',
        merk_type: data.solarBrandAndType || '',
      }]
    };

    await apiRequest(`/api/audits/${auditId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[syncInstallatieToAPI] Error saving to API:', err);
  }
}

/**
 * Debounced sync for installations data (500ms delay).
 */
export function debouncedSyncInstallatie(data?: Partial<InstallatieData>): void {
  if (installatieTimer) clearTimeout(installatieTimer);
  installatieTimer = setTimeout(() => {
    void syncInstallatieToAPI(data);
  }, 500);
}

/**
 * Synchronizes room selections to the backend API immediately.
 */
export async function syncHouseDesignToAPI(): Promise<void> {
  if (houseDesignTimer) {
    clearTimeout(houseDesignTimer);
    houseDesignTimer = null;
  }

  try {
    const auditId = await getTargetAuditId();
    if (!auditId) return;

    const rawMeta = loadHouseDesignPageRaw();
    if (!rawMeta || !rawMeta.selectedRooms) return;

    const payload: any = {
      house_design: {
        selectedRooms: rawMeta.selectedRooms || {},
        customRooms: rawMeta.customRooms || {},
        selectedCustomRooms: rawMeta.selectedCustomRooms || {},
        suppressedStandardRooms: rawMeta.suppressedStandardRooms || {},
        startFloorKey: rawMeta.startFloorKey || 'BG'
      }
    };

    await apiRequest(`/api/audits/${auditId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[syncHouseDesignToAPI] Error saving rooms to API:', err);
  }
}

/**
 * Debounced sync for room selections (500ms delay).
 */
export function debouncedSyncHouseDesign(): void {
  if (houseDesignTimer) clearTimeout(houseDesignTimer);
  houseDesignTimer = setTimeout(() => {
    void syncHouseDesignToAPI();
  }, 500);
}

/**
 * Flushes all pending syncs immediately (useful on navigation and before logout).
 */
export async function flushAllBewonerSync(): Promise<void> {
  try {
    await Promise.allSettled([
      syncAlgemeenToAPI(),
      syncInstallatieToAPI(),
      syncHouseDesignToAPI(),
    ]);
  } catch (err) {
    console.warn('[flushAllBewonerSync] Error during flush:', err);
  }
}
