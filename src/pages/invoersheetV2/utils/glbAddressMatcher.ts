import housingData from '../../../data/glbHousingIndex.json';

export interface GlbUnitInfo {
  vhe: string;
  complexId: string;
  complexName: string;
  bouwblok: string;
  street: string;
  houseNumber: number;
  houseNumberFull: string;
  address: string;
  postalCode: string;
  city: string;
  pandId: string;
  vboId: string;
  glbName: string;
  glbUrl: string;
  glbFileName: string;
  glbExists: boolean;
  lat: number;
  lng: number;
  scale: number;
  displX: number;
  displY: number;
  displZ: number;
}

export interface GlbComplexInfo {
  id: string;
  name: string;
  org?: string;
  municipality?: string;
  province?: string;
  lat: number;
  lng: number;
}

const allUnits: GlbUnitInfo[] = housingData.units as GlbUnitInfo[];
const allComplexes: GlbComplexInfo[] = housingData.complexes as GlbComplexInfo[];

/**
 * Clean and normalize address search query
 */
function normalizeStr(s?: string | null): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Finds matching GlbUnitInfo for a given query (address, pandId, vboId, or complex).
 */
export function findGlbForAddress(
  addressQuery?: string | null,
  pandId?: string | null,
  vboId?: string | null,
  complexRef?: string | null
): GlbUnitInfo | null {
  if (!addressQuery && !pandId && !vboId && !complexRef) return null;

  // 1. Direct match by PAND_ID
  if (pandId) {
    const pClean = pandId.trim();
    const pMatch = allUnits.find(u => u.pandId && u.pandId === pClean);
    if (pMatch) return pMatch;
  }

  // 2. Direct match by VBO_ID
  if (vboId) {
    const vClean = vboId.trim();
    const vMatch = allUnits.find(u => u.vboId && u.vboId === vClean);
    if (vMatch) return vMatch;
  }

  const rawQuery = (addressQuery || '').trim();

  // 3. Extract components (house number, postal code, street name)
  const numMatch = rawQuery.match(/\b(\d+)\s*([a-zA-Z])?(?:[-/](\d+))?\b/);
  const targetNum = numMatch ? parseInt(numMatch[1], 10) : null;

  const pcMatch = rawQuery.replace(/\s+/g, '').toUpperCase().match(/(\d{4}[A-Z]{2})/);
  const targetPc = pcMatch ? pcMatch[1] : null;

  const streetQuery = rawQuery
    .replace(/\b\d{4}\s*[A-Z]{2}\b/gi, '')
    .replace(/\b\d+.*$/, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .toLowerCase();

  // 4. Exact Postal Code + House Number match
  if (targetPc && targetNum !== null) {
    const m = allUnits.find(u => u.postalCode === targetPc && u.houseNumber === targetNum);
    if (m) return m;
  }

  // 5. Complex Ref filter if available
  let candidatePool = allUnits;
  if (complexRef) {
    const cClean = complexRef.trim().toLowerCase();
    const filtered = allUnits.filter(u => 
      u.complexId.toLowerCase().includes(cClean) ||
      u.complexName.toLowerCase().includes(cClean) ||
      cClean.includes(u.complexId.toLowerCase())
    );
    if (filtered.length > 0) {
      candidatePool = filtered;
    }
  }

  // 6. Street name + House Number match
  if (targetNum !== null && streetQuery) {
    const m = candidatePool.find(u => {
      const s = (u.street || '').toLowerCase();
      const streetMatches = s.includes(streetQuery) || streetQuery.includes(s);
      return streetMatches && u.houseNumber === targetNum;
    });
    if (m) return m;
  }

  // 7. House number matches and address includes street
  if (targetNum !== null) {
    const m = candidatePool.find(u => 
      u.houseNumber === targetNum && 
      rawQuery.toLowerCase().includes(u.street.toLowerCase())
    );
    if (m) return m;
  }

  // 8. Fallback: match by normalized address
  const normQuery = normalizeStr(rawQuery);
  if (normQuery.length > 3) {
    const m = candidatePool.find(u => {
      const nAddr = normalizeStr(u.address);
      return nAddr.length > 3 && (normQuery.includes(nAddr) || nAddr.includes(normQuery));
    });
    if (m) return m;
  }

  // If complexRef was given and has units, return the first unit of that complex as fallback
  if (candidatePool !== allUnits && candidatePool.length > 0) {
    return candidatePool[0];
  }

  return null;
}

/**
 * Returns all units belonging to a specific complex
 */
export function getUnitsForComplex(complexId: string): GlbUnitInfo[] {
  const cClean = complexId.trim().toLowerCase();
  return allUnits.filter(u => 
    u.complexId.toLowerCase() === cClean ||
    u.complexName.toLowerCase().includes(cClean)
  );
}

/**
 * Returns all available complexes
 */
export function getAllComplexes(): GlbComplexInfo[] {
  return allComplexes;
}

/**
 * Returns all units in the database
 */
export function getAllGlbUnits(): GlbUnitInfo[] {
  return allUnits;
}

/**
 * Asynchronously fetch GeoJSON polygon for a specific building pandId
 */
export async function fetchPandPolygon(complexId: string, pandId: string): Promise<any | null> {
  try {
    const cleanDir = encodeURIComponent(complexId);
    let fileName = `GS_${complexId}_pand.json`;
    if (complexId.includes('+')) {
      fileName = `GS_${complexId.replace(/\s+/g, '')}_pand.json`;
    }
    const res = await fetch(`/data/${cleanDir}/${fileName}`);
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data.features?.find((f: any) => f.properties?.PAND_ID === pandId);
    if (feat && feat.properties?.FeaturesWithStyle) {
      return feat.properties.FeaturesWithStyle;
    }
    return null;
  } catch (e) {
    console.warn(`Could not fetch pand polygon for ${pandId}:`, e);
    return null;
  }
}
