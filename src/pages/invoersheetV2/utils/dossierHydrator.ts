import { ProjectDossier, BagIdentification, EnvelopeElement, InstallationSystem } from '../types';
import { initialProjectDossier } from '../data/mockDossier';
import { FacadeGeometry, KozijnDetail, FACADE_GEOMETRY_DATA } from '../data/facadeGeometryData';
import { InteriorSpaceCard, SpacePhoto, INTERIOR_SPACES_DATA } from '../data/interiorSpacesData';
import { InspectionData, User } from '../../backoffice/backofficeTypes';
import { loadAppSnapshot } from '../../../storage/appSnapshot';
import { loadAlgemeenFromStorage } from '../../../storage/algemeenData';
import { loadPhotoCaptureFromStorage, PhotoCaptureStoredData } from '../../../storage/photoCaptureData';
import { loadInstallatieFromStorage } from '../../../storage/installatieData';
import { idbGet } from '../../../storage/idbKv';
import { getPhotoDisplayUrl } from '../../../services/api';
import { resolvePropertyMapPresentation } from '../../../utils/propertyMap';

function getStoredInspectionData(): InspectionData | null {
  try {
    const raw = localStorage.getItem('mepa_inspection_data');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse mepa_inspection_data from localStorage:', e);
  }
  return null;
}

function getStoredLegacyFormData(): any | null {
  try {
    const raw = localStorage.getItem('buildingID_formData');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function normalizeRoomDisplayName(roomKey: string): { displayName: string; roomType: string; badge: string; icon: string } {
  const upper = roomKey.trim().toUpperCase();
  if (upper.includes('WOONKAMER') || upper.includes('LIVING')) {
    return { displayName: 'Woonkamer', roomType: 'Woonkamer', badge: '(WOON)', icon: 'Home' };
  }
  if (upper.includes('KEUKEN') || upper.includes('KITCHEN')) {
    return { displayName: 'Keuken', roomType: 'Keuken', badge: '(KEUK)', icon: 'Layers' };
  }
  if (upper.includes('SLAAPKAMER') || upper.includes('BEDROOM')) {
    const match = upper.match(/\d+/);
    const num = match ? ` ${match[0]}` : '';
    return { displayName: `Slaapkamer${num}`, roomType: 'Slaapkamer', badge: '(SLAAP)', icon: 'Layers' };
  }
  if (upper.includes('BADKAMER') || upper.includes('BATHROOM')) {
    return { displayName: 'Badkamer', roomType: 'Badkamer', badge: '(BAD)', icon: 'Droplets' };
  }
  if (upper.includes('HAL') || upper.includes('HALL') || upper.includes('ENTREE') || upper.includes('GANG')) {
    return { displayName: 'Hal', roomType: 'Hal', badge: '(HAL)', icon: 'DoorClosed' };
  }
  if (upper.includes('MK') || upper.includes('METER')) {
    return { displayName: 'Meterkast', roomType: 'Meterkast', badge: '(MK)', icon: 'Zap' };
  }
  if (upper.includes('WC') || upper.includes('TOILET')) {
    return { displayName: 'Toilet', roomType: 'Toilet', badge: '(WC)', icon: 'Droplets' };
  }
  if (upper.includes('ZOLDER') || upper.includes('ATTIC')) {
    return { displayName: 'Zolder', roomType: 'Zolder', badge: '(ZOL)', icon: 'Home' };
  }
  if (upper.includes('BERGING') || upper.includes('STORAGE')) {
    return { displayName: 'Berging', roomType: 'Berging', badge: '(BERG)', icon: 'Layers' };
  }
  if (upper.includes('WASRUIMTE') || upper.includes('LAUNDRY')) {
    return { displayName: 'Wasruimte', roomType: 'Wasruimte', badge: '(WAS)', icon: 'Droplets' };
  }
  if (upper.includes('EETKAMER') || upper.includes('DINING')) {
    return { displayName: 'Eetkamer', roomType: 'Eetkamer', badge: '(EET)', icon: 'Layers' };
  }
  if (upper.includes('AANBOUW')) {
    return { displayName: 'Aanbouw', roomType: 'Aanbouw', badge: '(AAN)', icon: 'Building2' };
  }
  if (upper.includes('DAKKAPEL')) {
    return { displayName: 'Dakkapel', roomType: 'Dakkapel', badge: '(DAK)', icon: 'Home' };
  }
  if (upper.includes('SERRE')) {
    return { displayName: 'Serre', roomType: 'Serre', badge: '(SER)', icon: 'Sun' };
  }
  if (upper.includes('TECHNICAL') || upper.includes('TECHNISCH')) {
    return { displayName: 'Technische Ruimte', roomType: 'Technische Ruimte', badge: '(TECH)', icon: 'Cpu' };
  }
  return { 
    displayName: roomKey.charAt(0).toUpperCase() + roomKey.slice(1), 
    roomType: roomKey, 
    badge: `(${roomKey.substring(0, 4).toUpperCase()})`, 
    icon: 'Layers' 
  };
}

export function parseDutchAddress(raw?: string | null): { street: string; houseNumber: string; postalCode: string; city: string } {
  if (!raw) return { street: '', houseNumber: '', postalCode: '', city: '' };
  let str = raw.trim();

  // Extract postal code if present (e.g. 1356 AA or 1356AA)
  let postalCode = '';
  const pcMatch = str.match(/\b(\d{4}\s?[A-Za-z]{2})\b/);
  if (pcMatch) {
    postalCode = pcMatch[1].replace(/(\d{4})([A-Za-z]{2})/, '$1 $2').toUpperCase();
    str = str.replace(pcMatch[0], ' ');
  }

  // Remove commas and normalize spaces
  str = str.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  // Match street name and house number: e.g. "Jaagmeent 1 Almere" or "Jaagmeent 1"
  const m = str.match(/^([A-Za-zÀ-ÿ\s.\-]+?)\s+(\d+[A-Za-z0-9\-\/]*)(?:\s+(.*))?$/);
  if (m) {
    const street = m[1].trim();
    const houseNumber = m[2].trim();
    const city = (m[3] || '').trim();
    return { street, houseNumber, postalCode, city };
  }

  return { street: str, houseNumber: '', postalCode, city: '' };
}

/**
 * Synchronous initial state constructor to avoid mock flicker while IndexedDB loads.
 */
export function createInitialDossier(
  inspectionData?: InspectionData,
  userProfile?: User | null
): ProjectDossier {
  const d: ProjectDossier = JSON.parse(JSON.stringify(initialProjectDossier));
  const insp = inspectionData || getStoredInspectionData();
  const legacyForm = getStoredLegacyFormData();
  const algemeen = loadAlgemeenFromStorage();

  const isRealAudit = Boolean(insp && (insp.id || insp.clientId || insp.algemeen?.woning?.adres));
  const clientId = insp?.clientId || (insp as any)?.id || (insp?.algemeen?.woning?.adres ? encodeURIComponent(insp.algemeen.woning.adres) : 'default');
  const targetAddress = insp?.algemeen?.woning?.adres || (isRealAudit ? '' : (legacyForm?.address || legacyForm?.straatnaam || ''));

  // Clean stale global streetview_url key
  try {
    localStorage.removeItem('streetview_url');
  } catch (e) {}

  try {
    const savedCustomDossier = localStorage.getItem(`invoersheet_v2_dossier_${clientId}`);
    if (savedCustomDossier) {
      const parsed = JSON.parse(savedCustomDossier);
      if (parsed && parsed.bag && parsed.bag.address) {
        // Only use saved dossier if it belongs to this address or if scoped to specific audit
        const isMatchingAddress = (clientId !== 'default') || !targetAddress || Boolean(
          parsed.bag?.address &&
          (parsed.bag.address.toLowerCase().includes(targetAddress.toLowerCase()) || 
           targetAddress.toLowerCase().includes(parsed.bag.address.toLowerCase()))
        );

        if (isMatchingAddress) {
          // Sanitize any previously duplicated/mangled address fields in cached dossier
          const clean = parseDutchAddress(`${parsed.bag.address} ${parsed.bag.houseNumber || ''}`);
          if (clean.street) {
            parsed.bag.address = clean.street;
            if (clean.houseNumber) parsed.bag.houseNumber = clean.houseNumber;
            if (clean.postalCode) parsed.bag.postalCode = clean.postalCode;
            if (clean.city) parsed.bag.city = clean.city;
          }
          if (parsed.streetviewUrl && parsed.streetviewUrl.includes('output=svembed') && !parsed.streetviewUrl.includes('cbll=')) {
            parsed.streetviewUrl = undefined;
            if (parsed.bag) parsed.bag.streetviewUrl = undefined;
          }
          return parsed;
        }
      }
    }
  } catch (e) {}

  // 1. BAG / Address resolution
  const rawAdres = insp?.algemeen?.woning?.adres || (isRealAudit ? '' : (legacyForm?.address || legacyForm?.straatnaam || d.bag.address));
  const parsed = parseDutchAddress(rawAdres);

  const street = parsed.street || rawAdres || (isRealAudit ? '' : d.bag.address);
  const houseNum = parsed.houseNumber || (isRealAudit ? '' : (legacyForm?.houseNumber || d.bag.houseNumber));
  const city = parsed.city || insp?.algemeen?.woning?.plaats || (isRealAudit ? '' : (legacyForm?.woonplaats || algemeen.city || d.bag.city));
  const postcode = parsed.postalCode || insp?.algemeen?.woning?.postcode || (isRealAudit ? '' : (legacyForm?.postcode || d.bag.postalCode));
  const pandId = insp?.algemeen?.woning?.pandId || (isRealAudit ? '' : d.bag.pandId);
  const vboId = insp?.algemeen?.woning?.vboId || (isRealAudit ? '' : d.bag.vboId);
  const bouwjaar = Number(insp?.algemeen?.woning?.bouwjaar || (isRealAudit ? 0 : (algemeen.bouwjaar || d.bag.constructionYear))) || d.bag.constructionYear;
  const floorAreaVal = insp?.algemeen?.technical?.gboTs?.[0] || (isRealAudit ? '' : algemeen.floorArea) || `${d.bag.usableAreaAg}`;
  const floorArea = parseFloat(floorAreaVal) || d.bag.usableAreaAg;
  const buildingType = insp?.algemeen?.woning?.gebouwtype || (isRealAudit ? '' : algemeen.buildingType) || d.bag.buildingType;

  const fullAddr = `${street} ${houseNum}, ${postcode} ${city}`.replace(/\s+/g, ' ').trim();
  const auditKey = insp?.id || insp?.clientId || '';
  const houseKey = (pandId && pandId !== '0034100000029155' ? pandId : fullAddr).toLowerCase().trim();
  const auditSpecificSv = fullAddr ? localStorage.getItem(`streetview_url_${fullAddr.toLowerCase().trim()}`) : null;

  let streetview = (insp as any)?.streetviewUrl || (insp as any)?.streetview_url || (insp as any)?.building_details?.streetview_url || auditSpecificSv || '';
  if (streetview && (!streetview.includes('cbll=') && (streetview.includes('output=svembed') || !streetview.includes('maps.google')))) {
    streetview = '';
  }

  d.bag = {
    ...d.bag,
    address: street,
    houseNumber: houseNum || (isRealAudit ? '' : d.bag.houseNumber),
    postalCode: postcode,
    city: city,
    pandId: pandId,
    vboId: vboId,
    constructionYear: bouwjaar,
    usableAreaAg: floorArea,
    buildingType: buildingType,
    floorsCount: (isRealAudit ? 2 : (algemeen.numberOfFloors || d.bag.floorsCount)),
    streetviewUrl: streetview || undefined,
  };

  d.streetviewUrl = streetview || undefined;

  // 2. Bewoner
  d.bewoner = {
    name: insp?.algemeen?.bewoner?.persoon || (isRealAudit ? '' : (legacyForm?.fullName || d.bewoner?.name || '')),
    contact: insp?.algemeen?.bewoner?.telefoon || (isRealAudit ? '' : (legacyForm?.phoneNumber || d.bewoner?.contact || '')),
    email: insp?.algemeen?.bewoner?.email || (isRealAudit ? '' : (legacyForm?.email || d.bewoner?.email || '')),
    address: insp?.algemeen?.bewoner?.adres || street || (isRealAudit ? '' : (d.bewoner?.address || '')),
    postcode: insp?.algemeen?.bewoner?.postcode || postcode || (isRealAudit ? '' : (d.bewoner?.postcode || '')),
    plaats: insp?.algemeen?.bewoner?.plaats || city || (isRealAudit ? '' : (d.bewoner?.plaats || '')),
  };

  // 2b. BID Intern
  d.bidIntern = {
    fullName: insp?.algemeen?.bidIntern?.fullName || '-',
    phoneNumber: insp?.algemeen?.bidIntern?.phoneNumber || '-',
    email: insp?.algemeen?.bidIntern?.email || '-',
    contactAddress: insp?.algemeen?.bidIntern?.contactAddress || '-',
  };

  // 3. Inspector
  d.inspector = {
    name: userProfile?.full_name || insp?.algemeen?.inspector?.adviseur || localStorage.getItem('user_name') || d.inspector?.name || '',
    contact: insp?.algemeen?.inspector?.telefoon || d.inspector?.contact || '',
    email: userProfile?.email || insp?.algemeen?.inspector?.email || localStorage.getItem('user_email') || d.inspector?.email || '',
    address: insp?.algemeen?.inspector?.adres || d.inspector?.address || '',
    postcode: insp?.algemeen?.inspector?.postcode || d.inspector?.postcode || '',
    plaats: insp?.algemeen?.inspector?.plaats || d.inspector?.plaats || '',
  };

  d.inspectionDate = insp?.algemeen?.inspector?.opnamedatum || d.inspectionDate;
  d.invoerdatum = insp?.algemeen?.inspector?.invoerdatum || d.invoerdatum;

  // 4. General Details
  d.generalDetails = {
    bouwfase: insp?.algemeen?.woning?.bouwfase || 'Bestaande bouw',
    opnametype: insp?.algemeen?.woning?.opname || 'Basisopname',
    gebouwtype: insp?.algemeen?.woning?.gebouwtype || buildingType || 'Woonhuis',
    subtype: insp?.algemeen?.woning?.subtype || 'Eengezinswoning',
    daktypeLigging: insp?.algemeen?.woning?.daktype || 'Zadeldek',
    daktype: insp?.algemeen?.woning?.daktype || 'pitchedRoof',
    ligging: insp?.algemeen?.woning?.ligging || 'groundFloorUnit',
    gebouwhoogte: insp?.algemeen?.woning?.gebouwhoogte || (isRealAudit ? '8.5' : (algemeen.gebouwhoogte || '8.5')),
    complex: insp?.algemeen?.woning?.technischComplex || (insp?.algemeen?.woning as any)?.complex || '1690',
    financieelComplex: insp?.algemeen?.woning?.financieelComplex || '-',
    gemeente: insp?.algemeen?.woning?.gemeent || city || 'Almere',
    wijk: insp?.algemeen?.woning?.wijk || 'Waterwijk',
    svbStatus: insp?.algemeen?.woning?.svbStatus || 'Continue exploitation',
    bron: insp?.algemeen?.woning?.bron || 'BAG',
  };

  // 5. Technical Details
  d.technicalDetails = {
    vloerConstructie: insp?.algemeen?.woning?.floorConstructieType || 'Heavy',
    wandConstructie: insp?.algemeen?.woning?.wallConstructieType || 'Heavy',
    leidingdoorvoeren: insp?.algemeen?.technical?.leidingdoorvoeren || 'Aanwezig',
    aantal: insp?.algemeen?.technical?.aantal || '1',
    avr: insp?.algemeen?.technical?.avr || '1',
    gbo1: {
      l: insp?.algemeen?.technical?.gboTsLength?.[0] ?? '',
      w: insp?.algemeen?.technical?.gboTsWidth?.[0] ?? '',
      a: insp?.algemeen?.technical?.gboTs?.[0] ?? `${floorArea}`,
    },
    gbo2: {
      l: insp?.algemeen?.technical?.gboTsLength?.[1] ?? '',
      w: insp?.algemeen?.technical?.gboTsWidth?.[1] ?? '',
      a: insp?.algemeen?.technical?.gboTs?.[1] ?? '',
    },
    gbo3: {
      l: insp?.algemeen?.technical?.gboTsLength?.[2] ?? '',
      w: insp?.algemeen?.technical?.gboTsWidth?.[2] ?? '',
      a: insp?.algemeen?.technical?.gboTs?.[2] ?? '',
    }
  };

  // Rehydrate locally saved edits from localStorage if available
  const cid = insp?.clientId || insp?.id || 'default';
  if (typeof localStorage !== 'undefined') {
    try {
      const rawStored = localStorage.getItem(`invoersheet_v2_dossier_${cid}`) || localStorage.getItem('invoersheet_v2_dossier_default');
      if (rawStored) {
        const stored = JSON.parse(rawStored);
        if (stored && typeof stored === 'object') {
          if (stored.bewoner) d.bewoner = { ...d.bewoner, ...stored.bewoner };
          if (stored.bag) d.bag = { ...d.bag, ...stored.bag };
          if (stored.generalDetails) d.generalDetails = { ...d.generalDetails, ...stored.generalDetails };
          if (stored.technicalDetails) d.technicalDetails = { ...d.technicalDetails, ...stored.technicalDetails };
          if (stored.inspector) d.inspector = { ...d.inspector, ...stored.inspector };
          if (stored.bidIntern) d.bidIntern = { ...d.bidIntern, ...stored.bidIntern };
        }
      }
    } catch (e) {}
  }

  // Map constructions to envelope
  if (insp?.constructies && Array.isArray(insp.constructies) && insp.constructies.length > 0) {
    d.envelope = insp.constructies.map((c: any, idx: number) => {
      const typeLower = (c.type || 'gevel').toLowerCase();
      const validTypes = ['gevel', 'dak', 'vloer', 'paneel', 'raam', 'deur'];
      const mappedType = validTypes.includes(typeLower) ? typeLower : 'gevel';
      const displayPhoto = c.photoUrl ? getPhotoDisplayUrl(c.photoUrl) : undefined;
      return {
        id: c.id || `env-${idx + 1}`,
        code: c.code || c.naam || `EL-${idx + 1}`,
        name: c.naam || `Element ${idx + 1}`,
        type: mappedType as any,
        orientation: c.orientation || 'Z',
        area: parseFloat(c.oppervlakte || c.area) || 0,
        rc: parseFloat(c.rc) || undefined,
        uValue: parseFloat(c.uWaarde || c.uNiet) || undefined,
        insulationType: c.isolatie || undefined,
        insulationThicknessMm: parseFloat(c.dikte) || undefined,
        inspectionPhotoUrl: displayPhoto,
        verified: true,
        notes: c.locatie || ''
      };
    });
  } else if (isRealAudit) {
    // Clear mock photos from initial envelope for a real audit
    d.envelope = d.envelope.map(el => ({ ...el, inspectionPhotoUrl: undefined }));
  }

  if (insp?.facadesData && insp.facadesData.length > 0) {
    d.facadesData = insp.facadesData;
  }
  if (insp?.interiorSpacesData && insp.interiorSpacesData.length > 0) {
    d.interiorSpacesData = insp.interiorSpacesData;
  }

  return d;
}

/**
 * Full asynchronous hydrator that reads IndexedDB, active inspection photos,
 * exterior & interior photo state, uploaded floor plans, and resolves Street View.
 */
export async function hydrateDossier(
  inspectionData?: InspectionData,
  userProfile?: User | null,
  currentDossier?: ProjectDossier
): Promise<ProjectDossier> {
  const insp = inspectionData || getStoredInspectionData();
  const initial = createInitialDossier(inspectionData, userProfile);
  const isRealAudit = Boolean(insp && (insp.id || insp.clientId || insp.algemeen?.woning?.adres));

  // If currentDossier matches initial address, preserve in-memory user edits; otherwise use fresh initial
  const base = currentDossier && initial.bag?.address && currentDossier.bag?.address &&
    (currentDossier.bag.address.toLowerCase().includes(initial.bag.address.toLowerCase()) ||
     initial.bag.address.toLowerCase().includes(currentDossier.bag.address.toLowerCase()))
      ? JSON.parse(JSON.stringify(currentDossier))
      : initial;

  const clientId = insp?.clientId || (insp as any)?.id || 'default';

  // Always remove stale global streetview_url key
  try {
    localStorage.removeItem('streetview_url');
  } catch (e) {}

  // Load from IndexedDB
  let appSnapshot: any = null;
  let photoCapture: PhotoCaptureStoredData | null = null;
  try {
    appSnapshot = await loadAppSnapshot();
  } catch (e) {}

  try {
    photoCapture = await loadPhotoCaptureFromStorage();
  } catch (e) {}

  const algemeen = loadAlgemeenFromStorage();
  const installatie = loadInstallatieFromStorage();

  // 1. Refine BAG / Address & Bewoner from AppSnapshot ONLY if appSnapshot matches this house
  const targetAddr = base.bag.address || insp?.algemeen?.woning?.adres || '';
  const appSnapshotAddr = appSnapshot?.profile?.address || appSnapshot?.profile?.straatnaam || '';
  const appSnapshotMatches = Boolean(
    !isRealAudit || (
      appSnapshotAddr && targetAddr &&
      (targetAddr.toLowerCase().includes(appSnapshotAddr.toLowerCase()) ||
       appSnapshotAddr.toLowerCase().includes(targetAddr.toLowerCase()))
    )
  );

  if (!isRealAudit && appSnapshot?.profile) {
    const prof = appSnapshot.profile;
    const bld = appSnapshot.building || {};

    const rawAddr = prof.address || prof.straatnaam || base.bag.address;
    const parsed = parseDutchAddress(rawAddr);

    base.bag.address = parsed.street || base.bag.address;
    base.bag.houseNumber = parsed.houseNumber || prof.houseNumber || base.bag.houseNumber;
    base.bag.postalCode = parsed.postalCode || prof.postcode || base.bag.postalCode;
    base.bag.city = parsed.city || prof.woonplaats || algemeen.city || base.bag.city;
    if (bld.bouwjaar) base.bag.constructionYear = parseInt(bld.bouwjaar, 10) || base.bag.constructionYear;
    if (bld.floorArea) base.bag.usableAreaAg = parseFloat(bld.floorArea) || base.bag.usableAreaAg;
    if (algemeen.buildingType) base.bag.buildingType = algemeen.buildingType;
    if (algemeen.numberOfFloors) base.bag.floorsCount = algemeen.numberOfFloors;

    if (base.bewoner) {
      base.bewoner.name = prof.fullName || base.bewoner.name;
      base.bewoner.contact = prof.phoneNumber || base.bewoner.contact;
      base.bewoner.email = prof.email || base.bewoner.email;
      base.bewoner.address = base.bag.address || base.bewoner.address;
      base.bewoner.postcode = base.bag.postalCode || base.bewoner.postcode;
      base.bewoner.plaats = base.bag.city || base.bewoner.plaats;
    }
  }

  // 2. Resolve Street View URL (Google Street View 360° Panorama)
  
function isJaagmeent1Address(addr?: string | null): boolean {
  if (!addr) return false;
  const l = addr.toLowerCase();
  return /\bjaagmeent\s+1\b/i.test(l) && !/\bjaagmeent\s+1\d+/i.test(l);
}

const isGoogleStreetViewUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    if (
      lower.startsWith('data:') ||
      lower.startsWith('blob:') ||
      lower.includes('/uploads/') ||
      lower.includes('/images/') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp')
    ) {
      return false;
    }
    return lower.includes('maps.google.') || lower.includes('google.com/maps') || lower.includes('output=svembed') || lower.includes('layer=c');
  };

  const fullAddr = `${base.bag.address || ''} ${base.bag.houseNumber || ''}, ${base.bag.postalCode || ''} ${base.bag.city || ''}`.replace(/\s+/g, ' ').trim();
  const auditKey = insp?.id || insp?.clientId || '';
  const houseKey = (base.bag?.pandId && base.bag.pandId !== '0034100000029155' 
    ? base.bag.pandId 
    : fullAddr).toLowerCase().trim();

  let candidateSv = (insp as any)?.streetviewUrl || (insp as any)?.streetview_url || (insp as any)?.building_details?.streetview_url || '';
  if (!candidateSv) {
    candidateSv = (fullAddr ? localStorage.getItem(`streetview_url_${fullAddr.toLowerCase().trim()}`) : null) || '';
  }

  const isJaagmeent1 = isJaagmeent1Address(fullAddr) || isJaagmeent1Address(base.bag?.address);
  if (isJaagmeent1) {
    // If candidateSv points to Jaagmeent 175 (HEMINK van coords), purge it
    if (candidateSv && (candidateSv.includes('52.3359') || candidateSv.includes('5.2361'))) {
      candidateSv = '';
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`streetview_url_${fullAddr.toLowerCase().trim()}`);
        localStorage.removeItem('streetview_url_jaagmeent 1 1356 aa almere');
        localStorage.removeItem('streetview_url_jaagmeent 1, 1356 aa almere');
      }
    }
    if (!candidateSv) {
      candidateSv = 'https://maps.google.com/maps?layer=c&cbll=52.33702599569312,5.232569310471482&cbp=0,102,0,1,0';
    }
  }
  if (candidateSv && !isGoogleStreetViewUrl(candidateSv)) {
    candidateSv = '';
  }
  if (candidateSv && candidateSv.includes('output=svembed') && !candidateSv.includes('cbll=')) {
    candidateSv = '';
  }

  let resolvedStreetview = candidateSv;

  if (!resolvedStreetview && fullAddr) {
    try {
      const presentation = await resolvePropertyMapPresentation(fullAddr);
      if (presentation?.embedUrl) {
        resolvedStreetview = presentation.embedUrl;
      }
    } catch (e) {
      console.warn('Could not resolve Street View embed URL via presentation:', e);
    }
  }

  base.streetviewUrl = resolvedStreetview;
  base.bag.streetviewUrl = resolvedStreetview;

  // 3. Hydrate Chapter 3: Exterior (Facades, Gevels, Photos & Kozijnen)
  const inspectionPhotos: any[] = Array.isArray(insp?.photos) ? insp.photos : [];

  const getSidePhotos = (sideKey: 'voor' | 'achter' | 'links' | 'rechts', dutchName: string): string[] => {
    const urls: string[] = [];
    if (appSnapshotMatches && photoCapture?.exterior?.[sideKey] && Array.isArray(photoCapture.exterior[sideKey])) {
      photoCapture.exterior[sideKey].forEach(u => {
        if (u) urls.push(getPhotoDisplayUrl(u));
      });
    }

    // Also match photos from inspectionData.photos
    inspectionPhotos.forEach(p => {
      const cat = String(p.category || '').toLowerCase();
      const scope = String(p.scope || '').toLowerCase();
      const gevel = String(p.gevel || '').toLowerCase();
      if (
        scope === 'exterior' || 
        scope === 'exterieur' || 
        cat.includes(sideKey) || 
        cat.includes(dutchName.toLowerCase()) ||
        gevel.includes(sideKey) ||
        gevel.includes(dutchName.toLowerCase())
      ) {
        const u = getPhotoDisplayUrl(p.photo_url || p.file_url || p.url);
        if (u && !urls.includes(u)) {
          urls.push(u);
        }
      }
    });

    return Array.from(new Set(urls));
  };

  const voorPhotos = getSidePhotos('voor', 'Voorgevel');
  const achterPhotos = getSidePhotos('achter', 'Achtergevel');
  const linksPhotos = getSidePhotos('links', 'Linkergevel');
  const rechtsPhotos = getSidePhotos('rechts', 'Rechtergevel');

  // Extract kozijnen from inspectionData
  const rawKozijnen: any[] = Array.isArray(insp?.kozijnen) ? insp.kozijnen : [];
  const mapKozijn = (k: any, idx: number): KozijnDetail => {
    const displayUrl = k.photoUrl || (Array.isArray(k.photos) && k.photos[0]) || '';
    const allPhotos = Array.isArray(k.photos) && k.photos.length > 0 
      ? k.photos.map(getPhotoDisplayUrl) 
      : (displayUrl ? [getPhotoDisplayUrl(displayUrl)] : []);

    const w = parseFloat(k.width) || 1.2;
    const h = parseFloat(k.height) || 1.5;
    const area = parseFloat(k.area) || Math.round(w * h * 100) / 100;

    return {
      id: k.id || `kz-${idx + 1}`,
      code: k.naam || `K-${idx + 1}`,
      name: k.naam || `Kozijn ${idx + 1}`,
      category: k.naam?.startsWith('D') ? 'Buitendeur' : 'Raam (draai-kiep)',
      width: w,
      height: h,
      area: area,
      brandAndType: k.constructie || k.constructieId || 'HR++ Hout',
      overstekBelemmering: 'Automatic',
      zonwering: 'Geen zonwering',
      photoUrl: allPhotos[0] || '',
      photoUrls: allPhotos,
      photoDescription: k.naam || `Kozijn ${idx + 1}`
    };
  };

  const voorKozijnen = rawKozijnen.filter(k => String(k.gevel || '').toLowerCase().includes('voor')).map(mapKozijn);
  const achterKozijnen = rawKozijnen.filter(k => String(k.gevel || '').toLowerCase().includes('achter')).map(mapKozijn);
  const linksKozijnen = rawKozijnen.filter(k => String(k.gevel || '').toLowerCase().includes('links')).map(mapKozijn);
  const rechtsKozijnen = rawKozijnen.filter(k => String(k.gevel || '').toLowerCase().includes('rechts')).map(mapKozijn);

  // Build or update facadesData
  const existingFacades: FacadeGeometry[] = base.facadesData && base.facadesData.length > 0 ? base.facadesData : FACADE_GEOMETRY_DATA;

  const updatedFacades: FacadeGeometry[] = existingFacades.map(facade => {
    const fId = facade.id;
    let photos: string[] = [];
    let koz: KozijnDetail[] = facade.kozijnen || [];

    if (fId === 'facade-voor' || facade.title.toLowerCase().includes('voor')) {
      photos = isRealAudit ? voorPhotos : (voorPhotos.length > 0 ? voorPhotos : (facade.photoUrls || (facade.photoUrl ? [facade.photoUrl] : [])));
      koz = isRealAudit ? voorKozijnen : (voorKozijnen.length > 0 ? voorKozijnen : (facade.kozijnen || []));
    } else if (fId === 'facade-achter' || facade.title.toLowerCase().includes('achter')) {
      photos = isRealAudit ? achterPhotos : (achterPhotos.length > 0 ? achterPhotos : (facade.photoUrls || (facade.photoUrl ? [facade.photoUrl] : [])));
      koz = isRealAudit ? achterKozijnen : (achterKozijnen.length > 0 ? achterKozijnen : (facade.kozijnen || []));
    } else if (fId === 'facade-links' || facade.title.toLowerCase().includes('links')) {
      photos = isRealAudit ? linksPhotos : (linksPhotos.length > 0 ? linksPhotos : (facade.photoUrls || (facade.photoUrl ? [facade.photoUrl] : [])));
      koz = isRealAudit ? linksKozijnen : (linksKozijnen.length > 0 ? linksKozijnen : (facade.kozijnen || []));
    } else if (fId === 'facade-rechts' || facade.title.toLowerCase().includes('rechts')) {
      photos = isRealAudit ? rechtsPhotos : (rechtsPhotos.length > 0 ? rechtsPhotos : (facade.photoUrls || (facade.photoUrl ? [facade.photoUrl] : [])));
      koz = isRealAudit ? rechtsKozijnen : (rechtsKozijnen.length > 0 ? rechtsKozijnen : (facade.kozijnen || []));
    }

    const subTitle = isRealAudit && base.bag?.address
      ? `${facade.title} straatbeeld (${base.bag.address})`
      : facade.subTitle;

    return {
      ...facade,
      subTitle,
      photoUrl: photos[0] || '',
      photoUrls: photos,
      kozijnen: koz,
      kozijnListString: koz.map(k => k.code).join(', ') || 'Geen kozijnen geregistreerd'
    };
  });

  base.facadesData = updatedFacades;

  // 4. Hydrate Chapter 4: Interior (Spaces, Rooms & Captured Photos)
  const interiorCards: InteriorSpaceCard[] = [];
  const recordedRooms = (appSnapshotMatches && photoCapture?.interior) ? photoCapture.interior : {};
  const roomKeys = Object.keys(recordedRooms);

  // Group interior photos from inspectionPhotos by room
  const interiorInspPhotos = inspectionPhotos.filter(p => {
    const scope = String(p.scope || '').toLowerCase();
    return scope === 'interior' || scope === 'interieur';
  });

  // Extract distinct rooms from inspection photos
  const inspRoomNames = Array.from(new Set(
    interiorInspPhotos.map(p => p.room_id || p.room_name || p.space || '').filter(Boolean)
  ));

  const allRoomNames = Array.from(new Set([...roomKeys, ...inspRoomNames]));

  if (allRoomNames.length > 0) {
    allRoomNames.forEach((roomKey) => {
      const { displayName, roomType, badge, icon } = normalizeRoomDisplayName(roomKey);
      const categories = recordedRooms[roomKey] || {};
      const photos: SpacePhoto[] = [];

      Object.entries(categories).forEach(([categoryName, photoUrls]) => {
        (photoUrls || []).forEach((pUrl, pIdx) => {
          if (pUrl) {
            photos.push({
              id: `${roomKey}-${categoryName}-${pIdx}`,
              url: getPhotoDisplayUrl(pUrl),
              caption: `${displayName} - ${categoryName}`,
              tag: categoryName
            });
          }
        });
      });

      // Match photos from inspectionData.photos
      interiorInspPhotos.forEach((p, idx) => {
        const pRoom = String(p.room_id || p.room_name || p.space || '').toLowerCase();
        if (pRoom === roomKey.toLowerCase() || pRoom === displayName.toLowerCase()) {
          const u = getPhotoDisplayUrl(p.photo_url || p.file_url || p.url);
          if (u && !photos.some(existing => existing.url === u)) {
            photos.push({
              id: `insp-room-${roomKey}-${idx}`,
              url: u,
              caption: `${displayName} - ${p.category || 'Inspectie'}`,
              tag: p.category || 'Inspectie'
            });
          }
        }
      });

      const details = (appSnapshotMatches && photoCapture?.interiorDetails?.[roomKey]) ? photoCapture.interiorDetails[roomKey] : {};
      const specs: InteriorSpaceCard['specs'] = [];

      Object.entries(details).forEach(([catName, det]) => {
        if (det.doorIsolated !== undefined && det.doorIsolated !== null) {
          specs.push({
            label: `Deur (${catName})`,
            value: det.doorIsolated ? 'Geïsoleerd' : 'Ongeïsoleerd',
            highlight: true
          });
        }
        if (det.glassType) {
          specs.push({
            label: `Glas (${catName})`,
            value: det.glassType,
            highlight: true
          });
        }
        if (det.frameType) {
          specs.push({
            label: `Kozijn (${catName})`,
            value: det.frameType
          });
        }
      });

      if (specs.length === 0) {
        specs.push(
          { label: 'Oppervlakte', value: '18.50 m2' },
          { label: 'Grenst aan', value: 'Buitenlucht' },
          { label: 'Natuurlijke ventilatie', value: 'Ja' }
        );
      }

      interiorCards.push({
        id: `space-${roomKey.toLowerCase()}`,
        spaceName: displayName,
        spaceType: roomType,
        floorLevel: (roomKey.toLowerCase().includes('slaap') || roomKey.toLowerCase().includes('bad') || roomKey.toLowerCase().includes('zolder')) ? '1st Floor' : 'Ground Floor',
        sectionTitle: 'Ruimte & Installaties',
        category: 'window',
        icon: icon,
        badgeCode: badge,
        specs: specs,
        photos: photos
      });
    });
  } else if (isRealAudit) {
    // Generate clean standard room cards for the house with empty photos
    const standardRooms = ['Hal', 'Livingroom', 'Keuken', 'Slaapkamer', 'Badkamer', 'MK', 'WC', 'Zolder'];
    standardRooms.forEach(roomKey => {
      const { displayName, roomType, badge, icon } = normalizeRoomDisplayName(roomKey);
      interiorCards.push({
        id: `space-${roomKey.toLowerCase()}`,
        spaceName: displayName,
        spaceType: roomType,
        floorLevel: (roomKey.toLowerCase().includes('slaap') || roomKey.toLowerCase().includes('bad') || roomKey.toLowerCase().includes('zolder')) ? '1st Floor' : 'Ground Floor',
        sectionTitle: 'Ruimte & Installaties',
        category: 'window',
        icon: icon,
        badgeCode: badge,
        specs: [
          { label: 'Oppervlakte', value: '18.50 m2' },
          { label: 'Grenst aan', value: 'Buitenlucht' },
          { label: 'Natuurlijke ventilatie', value: 'Ja' }
        ],
        photos: []
      });
    });
  }

  // Add Core Installation Cards (Heating, Ventilation, Tapwater, Solar PV)
  const heatingPhotos: SpacePhoto[] = [];
  const ventPhotos: SpacePhoto[] = [];
  const tapPhotos: SpacePhoto[] = [];
  const solarPhotos: SpacePhoto[] = [];

  inspectionPhotos.forEach((p, idx) => {
    const cat = String(p.category || '').toLowerCase();
    const u = getPhotoDisplayUrl(p.photo_url || p.file_url || p.url);
    if (!u) return;

    if (cat.includes('verwarm') || cat.includes('heating')) {
      heatingPhotos.push({ id: `heat-${idx}`, url: u, caption: 'Verwarming inspectie', tag: 'Verwarming' });
    } else if (cat.includes('ventilat') || cat.includes('ventilation')) {
      ventPhotos.push({ id: `vent-${idx}`, url: u, caption: 'Ventilatie inspectie', tag: 'Ventilatie' });
    } else if (cat.includes('tapwater') || cat.includes('water')) {
      tapPhotos.push({ id: `tap-${idx}`, url: u, caption: 'Tapwater inspectie', tag: 'Tapwater' });
    } else if (cat.includes('pv') || cat.includes('zon') || cat.includes('solar')) {
      solarPhotos.push({ id: `solar-${idx}`, url: u, caption: 'Zonnepanelen inspectie', tag: 'Zonne-energie' });
    }
  });

  // Verwarming Card
  interiorCards.push({
    id: 'space-verwarming-sys',
    spaceName: 'Verwarming',
    spaceType: 'Installatie',
    floorLevel: 'Begane grond / Zolder',
    sectionTitle: 'Verwarming',
    category: 'heating',
    icon: 'Flame',
    badgeCode: '(VERW)',
    specs: [
      { label: 'Systeem', value: insp?.installations?.verwarmSysteem || (isRealAudit ? 'Individueel' : installatie.heatingSystemType) || 'Individueel', highlight: true },
      { label: 'Type opwekker', value: insp?.installations?.verwarmTypeopwekker || 'Gasgestookte ketel' },
      { label: 'Merk & Type', value: insp?.installations?.verwarmMerkType || (isRealAudit ? '' : 'Nefit Trendline HRC30'), highlight: true },
      { label: 'Distributiemedium', value: insp?.installations?.verwarmDistributiemedium || 'Water' },
      { label: 'Watertemperatuur', value: insp?.installations?.verwarmWatertemprater || '55/47 °C' },
      { label: 'Afgiftesysteem', value: insp?.installations?.verwarmAfgiftesysteem || 'Radiatoren / convectoren' },
      { label: 'Regeling', value: insp?.installations?.verwarmRegeling || 'Regeling in hoofdvertrek (kamerthermostaat)' }
    ],
    photos: isRealAudit ? heatingPhotos : (heatingPhotos.length > 0 ? heatingPhotos : [
      { id: 'mock-heat-1', url: '/assets/v2/images/heating_boiler_nefit_1789462276510.jpg', caption: 'Verwarmingstoestel installatie', tag: 'CV-Ketel' }
    ])
  });

  // Ventilatie Card
  interiorCards.push({
    id: 'space-ventilatie-sys',
    spaceName: 'Ventilatie',
    spaceType: 'Installatie',
    floorLevel: 'Begane grond',
    sectionTitle: 'Ventilatie',
    category: 'ventilation',
    icon: 'Wind',
    badgeCode: '(VENT)',
    specs: [
      { label: 'Systeem', value: insp?.installations?.ventSysteem || 'Mechanische afvoer', highlight: true },
      { label: 'Ventilatiesysteem', value: insp?.installations?.ventVentilatiesysteem || 'Type C.4a', highlight: true },
      { label: 'Merk & Type', value: insp?.installations?.ventMerkType || (isRealAudit ? '' : (installatie.ventilationOpwekker || 'Itho Daalderop CVE-S')) },
      { label: 'Subsysteem', value: insp?.installations?.ventSubsysteem || 'Woonhuisventilator' },
      { label: 'Luchtdichtheidsklasse', value: insp?.installations?.ventLuchtdichtheid || 'LUKA A B of C' },
      { label: 'Type ventilator', value: insp?.installations?.ventTypeVentilator || 'Centrifugaal' }
    ],
    photos: isRealAudit ? ventPhotos : (ventPhotos.length > 0 ? ventPhotos : [
      { id: 'mock-vent-1', url: '/assets/v2/images/ventilation_unit_itho_1789462291580.jpg', caption: 'Ventilatie unit type C', tag: 'Ventilatie' }
    ])
  });

  // Tapwater Card
  interiorCards.push({
    id: 'space-tapwater-sys',
    spaceName: 'Tapwater',
    spaceType: 'Installatie',
    floorLevel: 'Zolder / Keuken',
    sectionTitle: 'Tapwater',
    category: 'tapwater',
    icon: 'Droplets',
    badgeCode: '(TAP)',
    specs: [
      { label: 'Systeem', value: insp?.installations?.tapSysteem || 'Gecombineerd met CV', highlight: true },
      { label: 'Type opwekker', value: insp?.installations?.tapTypeOpwekker || 'Compleet toestel' },
      { label: 'Merk & Type', value: insp?.installations?.tapMerkType || (isRealAudit ? '' : (installatie.tapWaterDevice || 'Nefit Trendline (Interne)')), highlight: true },
      { label: 'Afgifte keuken', value: insp?.installations?.tapAfgifteKeuken || '2 m <= l < 4 m' },
      { label: 'Afgifte badkamer', value: insp?.installations?.tapAfgifteBadkamer || '< 2 m' }
    ],
    photos: isRealAudit ? tapPhotos : (tapPhotos.length > 0 ? tapPhotos : [
      { id: 'mock-tap-1', url: '/assets/v2/images/heating_boiler_nefit_1789462276510.jpg', caption: 'Combiketel tapwatervoorziening', tag: 'Tapwater' }
    ])
  });

  // Solar Card
  const hasSolar = isRealAudit ? Boolean(insp?.installations?.zonSysteem || insp?.installations?.zonAantal) : installatie.solarPanels !== false;
  if (hasSolar) {
    interiorCards.push({
      id: 'space-solar-sys',
      spaceName: 'Zonne-energie',
      spaceType: 'Installatie',
      floorLevel: 'Dak',
      sectionTitle: 'Zonne-energie',
      category: 'solar',
      icon: 'Sun',
      badgeCode: '(PV)',
      specs: [
        { label: 'Systeem', value: insp?.installations?.zonSysteem || 'PV-panelen', highlight: true },
        { label: 'Aantal', value: insp?.installations?.zonAantal || (isRealAudit ? '' : `${installatie.solarPanelCount || 12} stuks`), highlight: true },
        { label: 'Merk & Type', value: insp?.installations?.zonMerkType || (isRealAudit ? '' : (installatie.solarBrandAndType || 'JA Solar Mono')) },
        { label: 'Wattpiekvermogen', value: insp?.installations?.zonWattpiekvermogen || (isRealAudit ? '' : '410 Wp / paneel') },
        { label: 'Bouwintegratie', value: insp?.installations?.zonBouwintegratie || 'Matig geventileerd: met luchtspouw' },
        { label: 'Hellingshoek', value: insp?.installations?.zonHellingshook || (isRealAudit ? '' : `${installatie.solarTiltAngle || 35}°`) },
        { label: 'Oriëntatie', value: insp?.installations?.zonOrientatie || 'Zuid-West' }
      ],
      photos: isRealAudit ? solarPhotos : (solarPhotos.length > 0 ? solarPhotos : [
        { id: 'mock-pv-1', url: '/assets/v2/images/pv_inverter_solaredge_1789462284120.jpg', caption: 'PV installatie omvormer', tag: 'Solar PV' }
      ])
    });
  }

  base.interiorSpacesData = interiorCards;

  // Reapply user edits from localStorage so rehydration never wipes out saved user edits
  const hydrateAuditId = insp?.clientId || insp?.id || 'default';
  if (typeof localStorage !== 'undefined') {
    try {
      const rawStored = localStorage.getItem(`invoersheet_v2_dossier_${hydrateAuditId}`) || localStorage.getItem('invoersheet_v2_dossier_default');
      if (rawStored) {
        const stored = JSON.parse(rawStored);
        if (stored && typeof stored === 'object') {
          if (stored.bewoner) base.bewoner = { ...base.bewoner, ...stored.bewoner };
          if (stored.bag) base.bag = { ...base.bag, ...stored.bag };
          if (stored.generalDetails) base.generalDetails = { ...base.generalDetails, ...stored.generalDetails };
          if (stored.technicalDetails) base.technicalDetails = { ...base.technicalDetails, ...stored.technicalDetails };
          if (stored.inspector) base.inspector = { ...base.inspector, ...stored.inspector };
          if (stored.bidIntern) base.bidIntern = { ...base.bidIntern, ...stored.bidIntern };
        }
      }
    } catch (e) {}
  }

  return base;
}
