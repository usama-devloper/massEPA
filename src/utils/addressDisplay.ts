/** Strip legacy trailing digit artifact from stored addresses (whole-string suffix only). */
export function cleanAddress(address: string): string {
  if (!address) return '';
  const trimmed = address.trim();
  if (/,\s*1$/.test(trimmed)) return trimmed.replace(/1$/, '').trim();
  return trimmed;
}

/** Parse address into bar segments: postal code | street | city. */
export function parseAddressBarParts(address: string): {
  postalCode: string;
  street: string;
  city: string;
} {
  const cleaned = cleanAddress(address);
  if (!cleaned) return { postalCode: '', street: '', city: '' };

  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  const street = parts[0] ?? '';
  let postalCode = '';
  let city = '';
  let neighborhood = '';

  for (let i = 1; i < parts.length; i++) {
    const segment = parts[i];
    const pcMatch = segment.match(/^(\d{4}\s?[A-Za-z]{2})\s*(.*)$/);
    if (pcMatch) {
      postalCode = pcMatch[1].replace(/\s/g, '').toUpperCase();
      const afterPc = pcMatch[2]?.trim();
      if (afterPc) city = afterPc;
      continue;
    }
    if (!city) {
      city = segment;
      continue;
    }
    if (!neighborhood) {
      if (segment.toLowerCase().startsWith(city.toLowerCase())) {
        const suffix = segment.slice(city.length).trim();
        if (suffix) neighborhood = suffix;
      } else {
        neighborhood = segment;
      }
    }
  }

  if (!postalCode) {
    const inlinePc = cleaned.match(/\b(\d{4}\s?[A-Za-z]{2})\b/);
    if (inlinePc) postalCode = inlinePc[1].replace(/\s/g, '').toUpperCase();
  }

  const cityDisplay = neighborhood ? `${city} ${neighborhood}`.trim() : city;

  return { postalCode, street, city: cityDisplay };
}

export type GeoCoords = { lat: number; lng: number };

export function normalizeDutchPostcode(address: string): string {
  return address.replace(/\b(\d{4})\s*([A-Za-z]{2})\b/g, '$1 $2');
}

function formatPostalCode(code: string): string {
  const compact = code.replace(/\s/g, '').toUpperCase();
  if (compact.length === 6) return `${compact.slice(0, 4)} ${compact.slice(4)}`;
  return compact;
}

export function buildGeocodeQueries(address: string): string[] {
  const cleaned = normalizeDutchPostcode(cleanAddress(address));
  const { postalCode, street, city } = parseAddressBarParts(address);
  const pc = postalCode ? formatPostalCode(postalCode) : '';
  const queries = new Set<string>();

  if (cleaned) queries.add(cleaned);
  if (street && pc && city) queries.add(`${street}, ${pc} ${city}, Netherlands`);
  if (street && city) queries.add(`${street}, ${city}, Netherlands`);
  if (pc && city) queries.add(`${pc} ${city}, Netherlands`);

  return [...queries].filter(Boolean);
}

async function geocodeWithNominatim(query: string): Promise<GeoCoords | null> {
  try {
    const q = encodeURIComponent(normalizeDutchPostcode(query));
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=nl&q=${q}`,
      {
        headers: {
          'Accept-Language': 'nl,en',
          'User-Agent': 'massEPA/1.0 (energy-label audit app)',
        },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function geocodeWithPhoton(query: string): Promise<GeoCoords | null> {
  try {
    const q = encodeURIComponent(normalizeDutchPostcode(query));
    const res = await fetch(`https://photon.komoot.io/api/?q=${q}&limit=1&lang=nl`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    return { lat: coords[1], lng: coords[0] };
  } catch {
    return null;
  }
}

/** Free geocoding — no API key (Nominatim + Photon). */
export async function geocodeAddress(address: string): Promise<GeoCoords | null> {
  for (const query of buildGeocodeQueries(address)) {
    const fromNominatim = await geocodeWithNominatim(query);
    if (fromNominatim) return fromNominatim;
    const fromPhoton = await geocodeWithPhoton(query);
    if (fromPhoton) return fromPhoton;
  }
  return null;
}
