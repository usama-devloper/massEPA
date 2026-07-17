import {
  cleanAddress,
  normalizeDutchPostcode,
  geocodeAddress as fetchGeocodeAddress,
  type GeoCoords,
} from './addressDisplay';

export type PropertyMapPresentation = {
  embedUrl: string;
  externalUrl: string;
};

type OverpassResponse = {
  elements?: Array<{
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
};

// Cache for geocoding
const geocodeCache = new Map<string, GeoCoords>();
let lastOverpassRequest = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

/** Geocode address using the robust geocoder from addressDisplay (with caching) */
async function geocodeAddress(address: string): Promise<GeoCoords | null> {
  const trimmed = cleanAddress(address);
  if (!trimmed) return null;

  // Check cache
  if (geocodeCache.has(trimmed)) {
    return geocodeCache.get(trimmed) || null;
  }

  const coords = await fetchGeocodeAddress(trimmed);
  if (coords) {
    geocodeCache.set(trimmed, coords);
  }
  return coords;
}

function computeHeading(from: GeoCoords, to: GeoCoords): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function haversineMeters(a: GeoCoords, b: GeoCoords): number {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

/** Find street-side camera point facing the building (OpenStreetMap roads, no API key). */
async function estimateStreetCameraPoint(
  building: GeoCoords,
): Promise<{ camera: GeoCoords; heading: number } | null> {
  // Rate limiting
  const now = Date.now();
  const waitTime = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastOverpassRequest));
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastOverpassRequest = Date.now();

  const query = `
    [out:json][timeout:25];
    way(around:50,${building.lat},${building.lng})["highway"~"^(primary|secondary|tertiary|residential|living_street|unclassified|service|pedestrian)$"];
    out geom;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as OverpassResponse;

    let bestPoint: GeoCoords | null = null;
    let bestDistance = Infinity;

    for (const element of data.elements ?? []) {
      const nodes = element.geometry ?? [];
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = { lat: nodes[i].lat, lng: nodes[i].lon };
        const b = { lat: nodes[i + 1].lat, lng: nodes[i + 1].lon };
        for (const candidate of [a, b]) {
          const d = haversineMeters(building, candidate);
          if (d < bestDistance && d > 3) {
            bestDistance = d;
            bestPoint = candidate;
          }
        }
      }
    }

    if (!bestPoint) return null;
    return {
      camera: bestPoint,
      heading: computeHeading(bestPoint, building),
    };
  } catch {
    return null;
  }
}

/** Google Street View embed — no API key (svembed). */
function buildStreetViewEmbedUrl(options: {
  address?: string;
  camera?: GeoCoords;
  heading?: number;
}): string {
  const heading = Math.round(options.heading ?? 0);
  if (options.camera) {
    return `https://maps.google.com/maps?q=&layer=c&cbll=${options.camera.lat},${options.camera.lng}&cbp=0,${heading},0,0,0&output=svembed`;
  }
  const q = encodeURIComponent(normalizeDutchPostcode(cleanAddress(options.address ?? '')));
  return `https://maps.google.com/maps?q=${q}&layer=c&cbp=0,${heading},0,0,0&output=svembed`;
}

function buildExternalStreetViewUrl(address: string, coords?: GeoCoords): string {
  const trimmed = normalizeDutchPostcode(cleanAddress(address));
  if (coords) {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}&layer=c`;
}

function buildAddressOnlyPresentation(address: string): PropertyMapPresentation {
  const trimmed = normalizeDutchPostcode(cleanAddress(address));
  return {
    embedUrl: buildStreetViewEmbedUrl({ address: trimmed, heading: 0 }),
    externalUrl: buildExternalStreetViewUrl(trimmed),
  };
}

/**
 * Google Street View at the house — free embed, no API key.
 * Geocodes address, orients camera toward the building when possible.
 */
export async function resolvePropertyMapPresentation(
  address: string,
): Promise<PropertyMapPresentation | null> {
  const trimmed = cleanAddress(address);
  if (!trimmed) return null;

  const building = await geocodeAddress(trimmed);

  if (!building) {
    return buildAddressOnlyPresentation(trimmed);
  }

  const estimate = await estimateStreetCameraPoint(building);
  if (estimate) {
    return {
      embedUrl: buildStreetViewEmbedUrl({
        camera: estimate.camera,
        heading: estimate.heading,
      }),
      externalUrl: buildExternalStreetViewUrl(trimmed, estimate.camera),
    };
  }

  return {
    embedUrl: buildStreetViewEmbedUrl({ camera: building, heading: 0 }),
    externalUrl: buildExternalStreetViewUrl(trimmed, building),
  };
}

export function getAddressOnlyPropertyMap(address: string): PropertyMapPresentation | null {
  const trimmed = cleanAddress(address);
  if (!trimmed) return null;
  return buildAddressOnlyPresentation(trimmed);
}