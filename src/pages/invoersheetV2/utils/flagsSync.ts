/**
 * Unified Flags & Roles Synchronization between Invoersheet (V1) and Invoersheet-V2
 * 
 * Accurately mirrors Invoersheet V1 flag storage (inspector_flags, algemeen_flags, installatie_flags)
 * with zero pollution from validation errors or unrelated storage keys.
 */

export type FlagColor = 'red' | 'yellow' | 'green' | null;

export interface FlagNamespace {
  storageKey: string;
  subKey: string;
}

export const KEY_ALIASES: Record<string, string[]> = {
  // General & BAG Identification
  'generalDetails.complex': ['algemeen.woning.technischComplex', 'technischComplex', 'complex'],
  'generalDetails.financieelComplex': ['algemeen.woning.financieelComplex', 'financieelComplex'],
  'generalDetails.bouwfase': ['algemeen.woning.bouwfase', 'bouwfase'],
  'generalDetails.opnametype': ['algemeen.woning.opname', 'opname'],
  'generalDetails.gebouwtype': ['algemeen.woning.gebouwtype', 'gebouwtype', 'woningtype'],
  'generalDetails.subtype': ['algemeen.woning.subtype', 'subtype', 'woningtypeSub'],
  'generalDetails.daktype': ['algemeen.woning.daktype', 'daktype'],
  'generalDetails.ligging': ['algemeen.woning.ligging', 'ligging'],
  'generalDetails.daktypeLigging': ['algemeen.woning.daktype', 'daktype', 'algemeen.woning.ligging', 'ligging'],
  'generalDetails.gebouwhoogte': ['algemeen.woning.gebouwhoogte', 'gebouwhoogte'],
  'generalDetails.wijk': ['algemeen.woning.wijk', 'wijk'],
  'generalDetails.svbStatus': ['algemeen.woning.svbStatus', 'svbStatus'],
  'generalDetails.bron': ['algemeen.woning.bron', 'bron'],

  'bag.pandId': ['algemeen.woning.pandId', 'pandId'],
  'bag.vboId': ['algemeen.woning.vboId', 'vboId'],
  'bag.address': ['algemeen.woning.adres', 'adres', 'woning_adres'],
  'bag.postalCode': ['algemeen.woning.postcode', 'postcode', 'woning_postcode'],
  'bag.city': ['algemeen.woning.plaats', 'plaats', 'woonplaats', 'woning_plaats'],
  'bag.municipality': ['algemeen.woning.gemeent', 'gemeent', 'gemeente'],
  'bag.constructionYear': ['algemeen.woning.bouwjaar', 'bouwjaar'],

  // Technical Details
  'technicalDetails.vloerConstructie': ['algemeen.woning.floorConstructieType', 'floorConstructieType'],
  'technicalDetails.wandConstructie': ['algemeen.woning.wallConstructieType', 'wallConstructieType'],
  'technicalDetails.leidingdoorvoeren': ['algemeen.technical.leidingdoorvoeren', 'leidingdoorvoeren'],
  'technicalDetails.aantal': ['algemeen.technical.aantal', 'aantal'],
  'technicalDetails.avr': ['algemeen.technical.avr', 'avr', 'aantalAvr'],
  'technicalDetails.gbo1': ['algemeen.technical.gboTs.0', 'gbot-0'],
  'technicalDetails.gbo2': ['algemeen.technical.gboTs.1', 'gbot-1'],
  'technicalDetails.gbo3': ['algemeen.technical.gboTs.2', 'gbot-2'],

  // Bewoner Details
  'bewoner.name': ['algemeen.bewoner.persoon', 'bewoner_persoon', 'persoon'],
  'bewoner.contact': ['algemeen.bewoner.telefoon', 'bewoner_telefoon', 'telefoon'],
  'bewoner.email': ['algemeen.bewoner.email', 'bewoner_email', 'email'],
  'bewoner.address': ['algemeen.bewoner.adres', 'bewoner_adres'],
  'bewoner.postcode': ['algemeen.bewoner.postcode', 'bewoner_postcode'],
  'bewoner.plaats': ['algemeen.bewoner.plaats', 'bewoner_plaats'],

  // Inspector Details
  'inspector.name': ['algemeen.inspector.adviseur', 'adviseur'],
  'inspector.contact': ['algemeen.inspector.telefoon', 'inspector_telefoon'],
  'inspector.email': ['algemeen.inspector.email', 'inspector_email'],
  'inspector.address': ['algemeen.inspector.adres', 'inspector_adres'],
  'inspector.postcode': ['algemeen.inspector.postcode', 'inspector_postcode'],
  'inspector.plaats': ['algemeen.inspector.plaats', 'inspector_plaats'],
  'inspectorCertNumber': ['algemeen.inspector.certificaathouder', 'certificaathouder'],
  'certificationInstitute': ['algemeen.inspector.gebruiker', 'gebruiker'],
  'inspectionDate': ['algemeen.inspector.opnamedatum', 'opnamedatum'],
  'invoerdatum': ['algemeen.inspector.invoerdatum', 'invoerdatum'],

  // BID Intern Details
  'algemeen.bidIntern.fullName': ['bid_fullName'],
  'algemeen.bidIntern.phoneNumber': ['bid_phoneNumber'],
  'algemeen.bidIntern.email': ['bid_email'],
  'algemeen.bidIntern.contactAddress': ['bid_contactAddress']
};

/**
 * Maps any field key (V1 or V2 style) to its exact V1 storageKey and subKey
 */
export function resolveV1StorageKey(fieldKey: string, clientId: string = 'default'): FlagNamespace {
  const cid = clientId || 'default';

  // 1. Bewoner fields
  if (fieldKey === 'bewoner.address' || fieldKey === 'algemeen.bewoner.adres' || fieldKey === 'bewoner_adres') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'bewoner_adres' };
  }
  if (fieldKey === 'bewoner.postcode' || fieldKey === 'algemeen.bewoner.postcode' || fieldKey === 'bewoner_postcode') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'bewoner_postcode' };
  }
  if (fieldKey === 'bewoner.plaats' || fieldKey === 'algemeen.bewoner.plaats' || fieldKey === 'bewoner_plaats') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'bewoner_plaats' };
  }
  if (fieldKey === 'bewoner.name' || fieldKey === 'algemeen.bewoner.persoon' || fieldKey === 'bewoner_persoon') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'bewoner_persoon' };
  }
  if (fieldKey === 'bewoner.contact' || fieldKey === 'algemeen.bewoner.telefoon' || fieldKey === 'bewoner_telefoon') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'bewoner_telefoon' };
  }
  if (fieldKey === 'bewoner.email' || fieldKey === 'algemeen.bewoner.email' || fieldKey === 'bewoner_email') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'bewoner_email' };
  }

  // 2. Inspector fields
  if (fieldKey === 'inspector.name' || fieldKey === 'algemeen.inspector.adviseur' || fieldKey === 'adviseur') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'adviseur' };
  }
  if (fieldKey === 'inspectorCertNumber' || fieldKey === 'algemeen.inspector.certificaathouder' || fieldKey === 'certificaathouder') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'certificaathouder' };
  }
  if (fieldKey === 'certificationInstitute' || fieldKey === 'algemeen.inspector.gebruiker' || fieldKey === 'gebruiker') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'gebruiker' };
  }
  if (fieldKey === 'inspector.address' || fieldKey === 'algemeen.inspector.adres' || fieldKey === 'inspector_adres') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'adres' };
  }
  if (fieldKey === 'inspector.postcode' || fieldKey === 'algemeen.inspector.postcode' || fieldKey === 'inspector_postcode') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'postcode' };
  }
  if (fieldKey === 'inspector.plaats' || fieldKey === 'algemeen.inspector.plaats' || fieldKey === 'inspector_plaats') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'plaats' };
  }
  if (fieldKey === 'inspector.contact' || fieldKey === 'algemeen.inspector.telefoon' || fieldKey === 'inspector_telefoon') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'telefoon' };
  }
  if (fieldKey === 'inspector.email' || fieldKey === 'algemeen.inspector.email' || fieldKey === 'inspector_email') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'email' };
  }
  if (fieldKey === 'inspectionDate' || fieldKey === 'algemeen.inspector.opnamedatum' || fieldKey === 'opnamedatum') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'opnamedatum' };
  }
  if (fieldKey === 'invoerdatum' || fieldKey === 'algemeen.inspector.invoerdatum') {
    return { storageKey: `inspector_flags_${cid}`, subKey: 'invoerdatum' };
  }

  // 3. BID Intern
  if (fieldKey.startsWith('algemeen.bidIntern.') || fieldKey.startsWith('bidIntern.')) {
    const sub = fieldKey.split('.').pop() || '';
    return { storageKey: `inspector_flags_${cid}`, subKey: `bid_${sub}` };
  }

  // 4. General Details
  if (fieldKey === 'generalDetails.complex' || fieldKey === 'algemeen.woning.technischComplex' || fieldKey === 'technischComplex' || fieldKey === 'complex') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'technischComplex' };
  }
  if (fieldKey === 'generalDetails.financieelComplex' || fieldKey === 'algemeen.woning.financieelComplex' || fieldKey === 'financieelComplex') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'financieelComplex' };
  }
  if (fieldKey === 'bag.municipality' || fieldKey === 'algemeen.woning.gemeent' || fieldKey === 'gemeent' || fieldKey === 'gemeente') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'gemeent' };
  }
  if (fieldKey === 'bag.address' || fieldKey === 'algemeen.woning.adres' || fieldKey === 'woning_adres') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'adres' };
  }
  if (fieldKey === 'generalDetails.bouwfase' || fieldKey === 'algemeen.woning.bouwfase' || fieldKey === 'bouwfase') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'bouwfase' };
  }
  if (fieldKey === 'generalDetails.opnametype' || fieldKey === 'algemeen.woning.opname' || fieldKey === 'opname') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'opname' };
  }
  if (fieldKey === 'bag.postalCode' || fieldKey === 'algemeen.woning.postcode' || fieldKey === 'woning_postcode') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'postcode' };
  }
  if (fieldKey === 'bag.city' || fieldKey === 'algemeen.woning.plaats' || fieldKey === 'woning_plaats') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'plaats' };
  }
  if (fieldKey === 'bag.pandId' || fieldKey === 'algemeen.woning.pandId' || fieldKey === 'pandId') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'pandId' };
  }
  if (fieldKey === 'bag.vboId' || fieldKey === 'algemeen.woning.vboId' || fieldKey === 'vboId') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'vboId' };
  }
  if (fieldKey === 'generalDetails.wijk' || fieldKey === 'algemeen.woning.wijk' || fieldKey === 'wijk') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'wijk' };
  }
  if (fieldKey === 'generalDetails.svbStatus' || fieldKey === 'algemeen.woning.svbStatus' || fieldKey === 'svbStatus') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'svbStatus' };
  }
  if (fieldKey === 'generalDetails.bron' || fieldKey === 'algemeen.woning.bron' || fieldKey === 'bron') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'bron' };
  }

  // 5. Technical Details
  if (fieldKey === 'generalDetails.gebouwtype' || fieldKey === 'algemeen.woning.gebouwtype' || fieldKey === 'gebouwtype') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'gebouwtype' };
  }
  if (fieldKey === 'generalDetails.subtype' || fieldKey === 'algemeen.woning.subtype' || fieldKey === 'subtype') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'subtype' };
  }
  if (fieldKey === 'generalDetails.daktype' || fieldKey === 'generalDetails.daktypeLigging' || fieldKey === 'algemeen.woning.daktype' || fieldKey === 'daktype') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'daktype' };
  }
  if (fieldKey === 'generalDetails.ligging' || fieldKey === 'algemeen.woning.ligging' || fieldKey === 'ligging') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'ligging' };
  }
  if (fieldKey === 'generalDetails.gebouwhoogte' || fieldKey === 'algemeen.woning.gebouwhoogte' || fieldKey === 'gebouwhoogte') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'gebouwhoogte' };
  }
  if (fieldKey === 'technicalDetails.vloerConstructie' || fieldKey === 'algemeen.woning.floorConstructieType' || fieldKey === 'floorConstructieType') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'floorConstructieType' };
  }
  if (fieldKey === 'technicalDetails.wandConstructie' || fieldKey === 'algemeen.woning.wallConstructieType' || fieldKey === 'wallConstructieType') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'wallConstructieType' };
  }
  if (fieldKey === 'technicalDetails.leidingdoorvoeren' || fieldKey === 'algemeen.technical.leidingdoorvoeren' || fieldKey === 'leidingdoorvoeren') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'leidingdoorvoeren' };
  }
  if (fieldKey === 'technicalDetails.aantal' || fieldKey === 'algemeen.technical.aantal' || fieldKey === 'aantal') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'aantal' };
  }
  if (fieldKey === 'technicalDetails.avr' || fieldKey === 'algemeen.technical.avr' || fieldKey === 'avr') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'avr' };
  }
  if (fieldKey === 'technicalDetails.gbo1' || fieldKey === 'algemeen.technical.gboTs.0' || fieldKey === 'gbot-0') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'gbot-0' };
  }
  if (fieldKey === 'technicalDetails.gbo2' || fieldKey === 'algemeen.technical.gboTs.1' || fieldKey === 'gbot-1') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'gbot-1' };
  }
  if (fieldKey === 'technicalDetails.gbo3' || fieldKey === 'algemeen.technical.gboTs.2' || fieldKey === 'gbot-2') {
    return { storageKey: `algemeen_flags_${cid}`, subKey: 'gbot-2' };
  }

  // 6. Generic installations / constructies / geometry
  if (fieldKey.startsWith('installations.') || fieldKey.startsWith('installations_') || fieldKey.startsWith('inst_')) {
    return { storageKey: `installatie_flags_${cid}`, subKey: fieldKey };
  }
  if (fieldKey.startsWith('constructie_')) {
    return { storageKey: `constructie_flags_${cid}`, subKey: fieldKey };
  }
  if (fieldKey.startsWith('bouwkundig_') || fieldKey.startsWith('overstek_')) {
    return { storageKey: `geometry_flags_${cid}`, subKey: fieldKey };
  }
  if (fieldKey.startsWith('library_')) {
    return { storageKey: `kozijn_flags_${cid}`, subKey: fieldKey };
  }

  return { storageKey: `algemeen_flags_${cid}`, subKey: fieldKey };
}

/**
 * Loads all flags strictly and exactly as Invoersheet V1 does from localStorage & inspection data
 */
export function loadAllUnifiedFlags(
  clientId: string = 'default',
  inspectionData?: any
): Record<string, FlagColor> {
  const flags: Record<string, FlagColor> = {};
  if (typeof localStorage === 'undefined') return flags;

  const cid = clientId || 'default';
  const inspClientId = inspectionData?.clientId;
  const inspId = inspectionData?.id;

  const candidateIds = Array.from(new Set([
    cid,
    inspClientId,
    inspId,
    'default'
  ].filter(Boolean)));

  const setUnifiedFlag = (key: string, val: any) => {
    if (val !== 'green' && val !== 'yellow' && val !== 'red') return;
    flags[key] = val;

    if (key === 'gbot-0' || key === 'algemeen.technical.gboTs.0') {
      flags['technicalDetails.gbo1'] = val;
      flags['algemeen.technical.gboTs.0'] = val;
      flags['gbot-0'] = val;
    } else if (key === 'gbot-1' || key === 'algemeen.technical.gboTs.1') {
      flags['technicalDetails.gbo2'] = val;
      flags['algemeen.technical.gboTs.1'] = val;
      flags['gbot-1'] = val;
    } else if (key === 'gbot-2' || key === 'algemeen.technical.gboTs.2') {
      flags['technicalDetails.gbo3'] = val;
      flags['algemeen.technical.gboTs.2'] = val;
      flags['gbot-2'] = val;
    } else if (key === 'technischComplex' || key === 'complex' || key === 'algemeen.woning.technischComplex') {
      flags['generalDetails.complex'] = val;
      flags['algemeen.woning.technischComplex'] = val;
      flags['technischComplex'] = val;
      flags['complex'] = val;
    } else if (key === 'financieelComplex' || key === 'algemeen.woning.financieelComplex') {
      flags['generalDetails.financieelComplex'] = val;
      flags['algemeen.woning.financieelComplex'] = val;
      flags['financieelComplex'] = val;
    }

    for (const [v2Key, aliases] of Object.entries(KEY_ALIASES)) {
      if (key === v2Key || aliases.includes(key)) {
        flags[v2Key] = val;
        aliases.forEach(a => { flags[a] = val; });
      }
    }
  };

  // 1. First priority: load field_flags directly from active inspection data / building_details
  const rawFieldFlags = inspectionData?.building_details?.field_flags || inspectionData?.algemeen?.field_flags;
  if (rawFieldFlags) {
    try {
      const parsed = typeof rawFieldFlags === 'string' ? JSON.parse(rawFieldFlags) : rawFieldFlags;
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, val]) => {
          setUnifiedFlag(k, val);
        });
      }
    } catch {}
  }

  // 2. Read storage from candidate IDs
  const readStorage = (prefix: string): Record<string, any> => {
    const result: Record<string, any> = {};
    const reversed = [...candidateIds].reverse();
    for (const id of reversed) {
      try {
        const raw = localStorage.getItem(`${prefix}_${id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.assign(result, parsed);
          }
        }
      } catch {}
    }
    return result;
  };

  const inspParsed = readStorage('inspector_flags');
  if (inspParsed) {
    Object.keys(inspParsed).forEach(k => {
      setUnifiedFlag(k, inspParsed[k]);
      if (k.startsWith('bewoner_')) {
        setUnifiedFlag(`algemeen.bewoner.${k.substring(8)}`, inspParsed[k]);
      } else if (k.startsWith('bid_')) {
        setUnifiedFlag(`algemeen.bidIntern.${k.substring(4)}`, inspParsed[k]);
      } else {
        setUnifiedFlag(`algemeen.inspector.${k}`, inspParsed[k]);
      }
    });
  }

  const algParsed = readStorage('algemeen_flags');
  if (algParsed) {
    Object.keys(algParsed).forEach(k => {
      setUnifiedFlag(k, algParsed[k]);
    });
  }

  const instParsed = readStorage('installatie_flags');
  if (instParsed) {
    Object.keys(instParsed).forEach(k => {
      setUnifiedFlag(k, instParsed[k]);
      flags[`installations.${k}`] = instParsed[k];
      flags[`inst_${k}`] = instParsed[k];
    });
  }

  const constrParsed = readStorage('constructie_flags');
  if (constrParsed) {
    Object.keys(constrParsed).forEach(k => {
      setUnifiedFlag(k, constrParsed[k]);
      flags[`constructie_row_${k}`] = constrParsed[k];
      flags[`constructie_${k}`] = constrParsed[k];
    });
  }

  const geomParsed = readStorage('geometry_flags');
  if (geomParsed) {
    Object.keys(geomParsed).forEach(k => {
      setUnifiedFlag(k, geomParsed[k]);
    });
  }

  const kozijnParsed = readStorage('kozijn_flags');
  if (kozijnParsed) {
    Object.keys(kozijnParsed).forEach(k => {
      setUnifiedFlag(k, kozijnParsed[k]);
      flags[`library_${k}`] = kozijnParsed[k];
    });
  }

  // 3. Fallback scan across all localStorage keys in case candidate IDs didn't catch active flags
  if (!flags['generalDetails.complex'] && !flags['technicalDetails.gbo1']) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('algemeen_flags_') || key.startsWith('inspector_flags_'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              Object.entries(parsed).forEach(([k, val]) => {
                setUnifiedFlag(k, val);
              });
            }
          }
        }
      }
    } catch {}
  }

  // 4. Baseline default flags matching Invoersheet V1 (Complex, Financieel Complex, GBO-T 1, 2, 3)
  if (!flags['generalDetails.complex'] && !flags['technicalDetails.gbo1']) {
    setUnifiedFlag('generalDetails.complex', 'green');
    setUnifiedFlag('generalDetails.financieelComplex', 'green');
    setUnifiedFlag('technicalDetails.gbo1', 'green');
    setUnifiedFlag('technicalDetails.gbo2', 'green');
    setUnifiedFlag('technicalDetails.gbo3', 'green');
  }

  return flags;
}

/**
 * Loads all field roles strictly from field_roles_{clientId}
 */
export function loadAllUnifiedRoles(
  clientId: string = 'default',
  inspectionData?: any
): Record<string, string> {
  const roles: Record<string, string> = {};
  if (typeof localStorage === 'undefined') return roles;

  const cid = clientId || 'default';
  const inspClientId = inspectionData?.clientId;
  const inspId = inspectionData?.id;

  const candidateIds = Array.from(new Set([
    cid,
    inspClientId,
    inspId,
    'default'
  ].filter(Boolean)));

  const reversed = [...candidateIds].reverse();
  for (const id of reversed) {
    try {
      const raw = localStorage.getItem(`field_roles_${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          Object.assign(roles, parsed);
        }
      }
    } catch {}
  }

  // Ensure fields with green flags have 'INS' role
  const flags = loadAllUnifiedFlags(clientId, inspectionData);
  Object.keys(flags).forEach(k => {
    if (flags[k] === 'green' && !roles[k]) {
      roles[k] = 'INS';
    }
  });

  // Always ensure the 5 baseline fields are INS
  if (!roles['generalDetails.complex']) roles['generalDetails.complex'] = 'INS';
  if (!roles['generalDetails.financieelComplex']) roles['generalDetails.financieelComplex'] = 'INS';
  if (!roles['technicalDetails.gbo1']) roles['technicalDetails.gbo1'] = 'INS';
  if (!roles['technicalDetails.gbo2']) roles['technicalDetails.gbo2'] = 'INS';
  if (!roles['technicalDetails.gbo3']) roles['technicalDetails.gbo3'] = 'INS';

  return roles;
}

export function saveUnifiedFlag(
  clientId: string,
  fieldKey: string,
  flag: FlagColor,
  currentFlags: Record<string, FlagColor>,
  onGlobalDataChange?: (pathOrUpdates: string | Record<string, string>, value?: string) => void
): Record<string, FlagColor> {
  const cid = clientId || 'default';
  const { storageKey, subKey } = resolveV1StorageKey(fieldKey, cid);

  // 1. Update localStorage in the exact V1 structure
  try {
    const raw = localStorage.getItem(storageKey);
    const obj = raw ? JSON.parse(raw) : {};
    if (flag === null) {
      delete obj[subKey];
    } else {
      obj[subKey] = flag;
    }
    localStorage.setItem(storageKey, JSON.stringify(obj));

    // Also mirror to 'default' if cid !== 'default'
    if (cid !== 'default') {
      const defaultKey = storageKey.replace(`_${cid}`, '_default');
      const defRaw = localStorage.getItem(defaultKey);
      const defObj = defRaw ? JSON.parse(defRaw) : {};
      if (flag === null) {
        delete defObj[subKey];
      } else {
        defObj[subKey] = flag;
      }
      localStorage.setItem(defaultKey, JSON.stringify(defObj));
    }
  } catch (e) {
    console.error('Failed to save flag to V1 storage:', e);
  }

  // 2. Update role to INS if green
  if (flag === 'green') {
    try {
      const roleKey = `field_roles_${cid}`;
      const rRaw = localStorage.getItem(roleKey);
      const rObj = rRaw ? JSON.parse(rRaw) : {};
      rObj[fieldKey] = 'INS';
      localStorage.setItem(roleKey, JSON.stringify(rObj));
      if (cid !== 'default') {
        const defRoleKey = 'field_roles_default';
        const defRaw = localStorage.getItem(defRoleKey);
        const defObj = defRaw ? JSON.parse(defRaw) : {};
        defObj[fieldKey] = 'INS';
        localStorage.setItem(defRoleKey, JSON.stringify(defObj));
      }
    } catch {}
  }

  // 3. Return updated local state with all aliases synced
  const updated = { ...currentFlags };
  if (flag === null) {
    delete updated[fieldKey];
    if (KEY_ALIASES[fieldKey]) {
      KEY_ALIASES[fieldKey].forEach(alias => delete updated[alias]);
    }
  } else {
    updated[fieldKey] = flag;
    if (KEY_ALIASES[fieldKey]) {
      KEY_ALIASES[fieldKey].forEach(alias => { updated[alias] = flag; });
    }
  }

  // 4. Notify global handler if present
  if (onGlobalDataChange) {
    try {
      const v1Key = `algemeen.woning.${subKey}`;
      onGlobalDataChange(v1Key, flag || '');
    } catch {}
  }

  return updated;
}
