export type ProfileAddressParts = {
  straatnaam: string;
  houseNumber: string;
  toev: string;
  postcode: string;
  woonplaats: string;
};

export const DEFAULT_BEOWNER_PROFILE = {
  fullName: 'Jan de Vries',
  phoneNumber: '06 12345678',
  addressParts: {
    straatnaam: 'Jaagmeent',
    houseNumber: '175',
    toev: '',
    postcode: '1356 AR',
    woonplaats: 'Almere',
  } satisfies ProfileAddressParts,
};

export function formatProfileAddress(parts: ProfileAddressParts): string {
  const streetLine = [parts.straatnaam, parts.houseNumber, parts.toev].filter(Boolean).join(' ').trim();
  const pc = parts.postcode.trim();
  if (pc && parts.woonplaats) return `${streetLine} ${pc} ${parts.woonplaats}`.trim();
  if (pc) return `${streetLine} ${pc}`.trim();
  return streetLine;
}

export function parseProfileAddress(address: string): ProfileAddressParts {
  const fallback = DEFAULT_BEOWNER_PROFILE.addressParts;
  const cleaned = address.trim();
  if (!cleaned) return { ...fallback };

  const pcMatch = cleaned.match(/\b(\d{4})\s*([A-Za-z]{2})\b/);
  if (!pcMatch) {
    const streetMatch = cleaned.match(/^(.+?)\s+(\d+)([a-zA-Z])?$/);
    if (streetMatch) {
      return {
        straatnaam: streetMatch[1].trim(),
        houseNumber: streetMatch[2],
        toev: streetMatch[3] || '',
        postcode: fallback.postcode,
        woonplaats: fallback.woonplaats,
      };
    }
    return { ...fallback, straatnaam: cleaned };
  }

  const postcode = `${pcMatch[1]} ${pcMatch[2].toUpperCase()}`;
  const beforePc = cleaned.slice(0, pcMatch.index).trim();
  const afterPc = cleaned.slice(pcMatch.index! + pcMatch[0].length).trim();

  const streetMatch = beforePc.match(/^(.+?)\s+(\d+)(?:\s+([^\d]+))?$/);
  if (streetMatch) {
    return {
      straatnaam: streetMatch[1].trim(),
      houseNumber: streetMatch[2],
      toev: streetMatch[3]?.trim() || '',
      postcode,
      woonplaats: afterPc || fallback.woonplaats,
    };
  }

  return {
    ...fallback,
    straatnaam: beforePc || fallback.straatnaam,
    postcode,
    woonplaats: afterPc || fallback.woonplaats,
  };
}
