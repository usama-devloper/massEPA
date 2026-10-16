const fs = require('fs');

// 1. BackOfficePortal.tsx
const bopPath = 'M:\\mEPA\\massEPA_live\\src\\pages\\backoffice\\BackOfficePortal.tsx';
let bop = fs.readFileSync(bopPath, 'utf8');

// A: Map streetviewUrl in onStartAudit (API audits)
bop = bop.replace(
  /initialDossier = \{\s*\.\.\.initialDossier,\s*id: apiData\.id,\s*status: apiData\.status,\s*clientId: cl\.id,/,
  `initialDossier = {
                    ...initialDossier,
                    id: apiData.id,
                    status: apiData.status,
                    clientId: cl.id || apiData.client_id || apiData.id || clientRecord.id,
                    streetviewUrl: bd.streetview_url || bd.streetviewUrl || undefined,
                    streetview_url: bd.streetview_url || bd.streetviewUrl || undefined,`
);

// B: Map streetviewUrl in onStartAudit (Demo / fallback audits)
bop = bop.replace(
  /initialDossier = \{\s*\.\.\.initialDossier,\s*clientId: clientRecord\.id,\s*algemeen: \{/,
  `initialDossier = {
                  ...initialDossier,
                  id: clientRecord.id,
                  clientId: clientRecord.id,
                  streetviewUrl: (clientRecord as any).streetview_url || (clientRecord as any).streetviewUrl || undefined,
                  streetview_url: (clientRecord as any).streetview_url || (clientRecord as any).streetviewUrl || undefined,
                  algemeen: {`
);

// C: Add key to InvoersheetV2View so switching houses completely remounts and re-initializes
bop = bop.replace(
  /<InvoersheetV2View\s*inspectionData=\{data\}\s*userProfile=\{userProfile\}\s*onGlobalDataChange=\{handleDataChange\}\s*\/>/,
  `<InvoersheetV2View
            key={data?.id || data?.clientId || data?.algemeen?.woning?.adres || 'invoersheet-v2-active'}
            inspectionData={data}
            userProfile={userProfile}
            onGlobalDataChange={handleDataChange}
          />`
);

fs.writeFileSync(bopPath, bop, 'utf8');
console.log('Updated BackOfficePortal.tsx');

// 2. dossierHydrator.ts
const dhPath = 'M:\\mEPA\\massEPA_live\\src\\pages\\invoersheetV2\\utils\\dossierHydrator.ts';
let dh = fs.readFileSync(dhPath, 'utf8');

// Make sure cached custom dossier only matches the current inspection address
const oldDossierCacheLookup = `  const clientId = insp?.clientId || 'default';
  try {
    const savedCustomDossier = localStorage.getItem(\`invoersheet_v2_dossier_\${clientId}\`);
    if (savedCustomDossier) {
      const parsed = JSON.parse(savedCustomDossier);
      if (parsed && parsed.bag && parsed.bag.address) {
        // Sanitize any previously duplicated/mangled address fields in cached dossier
        const clean = parseDutchAddress(\`\${parsed.bag.address} \${parsed.bag.houseNumber || ''}\`);
        if (clean.street) {
          parsed.bag.address = clean.street;
          if (clean.houseNumber) parsed.bag.houseNumber = clean.houseNumber;
          if (clean.postalCode) parsed.bag.postalCode = clean.postalCode;
          if (clean.city) parsed.bag.city = clean.city;
        }
        // If saved streetviewUrl has the old broken q= search query that led to indoor photospheres, clear it
        if (parsed.streetviewUrl && parsed.streetviewUrl.includes('output=svembed') && !parsed.streetviewUrl.includes('cbll=')) {
          parsed.streetviewUrl = undefined;
          if (parsed.bag) parsed.bag.streetviewUrl = undefined;
        }
        return parsed;
      }
    }
  } catch (e) {}`;

const newDossierCacheLookup = `  const clientId = insp?.clientId || (insp as any)?.id || 'default';
  const targetAddress = insp?.algemeen?.woning?.adres || legacyForm?.address || legacyForm?.straatnaam || '';
  try {
    const savedCustomDossier = localStorage.getItem(\`invoersheet_v2_dossier_\${clientId}\`);
    if (savedCustomDossier) {
      const parsed = JSON.parse(savedCustomDossier);
      if (parsed && parsed.bag && parsed.bag.address) {
        // Only use saved dossier if it belongs to this address
        const isMatchingAddress = !targetAddress || 
          parsed.bag.address.toLowerCase().includes(targetAddress.toLowerCase()) || 
          targetAddress.toLowerCase().includes(parsed.bag.address.toLowerCase());

        if (isMatchingAddress) {
          // Sanitize any previously duplicated/mangled address fields in cached dossier
          const clean = parseDutchAddress(\`\${parsed.bag.address} \${parsed.bag.houseNumber || ''}\`);
          if (clean.street) {
            parsed.bag.address = clean.street;
            if (clean.houseNumber) parsed.bag.houseNumber = clean.houseNumber;
            if (clean.postalCode) parsed.bag.postalCode = clean.postalCode;
            if (clean.city) parsed.bag.city = clean.city;
          }
          // If saved streetviewUrl has the old broken q= search query that led to indoor photospheres, clear it
          if (parsed.streetviewUrl && parsed.streetviewUrl.includes('output=svembed') && !parsed.streetviewUrl.includes('cbll=')) {
            parsed.streetviewUrl = undefined;
            if (parsed.bag) parsed.bag.streetviewUrl = undefined;
          }
          return parsed;
        }
      }
    }
  } catch (e) {}`;

dh = dh.replace(oldDossierCacheLookup, newDossierCacheLookup);

// Scoped streetview lookup in createInitialDossier - DO NOT use global unkeyed localStorage.getItem('streetview_url')
const oldStreetviewFallback = `  let streetview = (insp as any)?.streetviewUrl || (insp as any)?.streetview_url || localStorage.getItem('streetview_url') || '';`;
const newStreetviewFallback = `  const auditKey = insp?.id || insp?.clientId || '';
  const auditSpecificSv = auditKey ? localStorage.getItem(\`streetview_url_\${auditKey}\`) : null;
  let streetview = (insp as any)?.streetviewUrl || (insp as any)?.streetview_url || (insp as any)?.building_details?.streetview_url || auditSpecificSv || '';`;

dh = dh.replace(oldStreetviewFallback, newStreetviewFallback);

fs.writeFileSync(dhPath, dh, 'utf8');
console.log('Updated dossierHydrator.ts');

// 3. InvoersheetV2View.tsx
const v2Path = 'M:\\mEPA\\massEPA_live\\src\\pages\\invoersheetV2\\InvoersheetV2View.tsx';
let v2 = fs.readFileSync(v2Path, 'utf8');

// Add sync effect when inspectionData changes
const oldStateDef = `  const [dossier, setDossier] = useState<ProjectDossier>(() => {
    return createInitialDossier(inspectionData, userProfile);
  });`;

const newStateDef = `  const [dossier, setDossier] = useState<ProjectDossier>(() => {
    return createInitialDossier(inspectionData, userProfile);
  });

  useEffect(() => {
    if (inspectionData) {
      setDossier(createInitialDossier(inspectionData, userProfile));
      const newClientId = inspectionData.clientId || inspectionData.id || 'default';
      try {
        const savedFlags = localStorage.getItem(\`invoersheet_v2_flags_\${newClientId}\`);
        setFlags(savedFlags ? JSON.parse(savedFlags) : {});
      } catch (e) {}
      try {
        const savedRoles = localStorage.getItem(\`invoersheet_v2_field_roles_\${newClientId}\`);
        setFieldRoles(savedRoles ? JSON.parse(savedRoles) : {});
      } catch (e) {}
    }
  }, [inspectionData, userProfile]);`;

v2 = v2.replace(oldStateDef, newStateDef);

// Update handleSaveStreetview to save scoped key
v2 = v2.replace(
  /localStorage\.setItem\('streetview_url', url\);/,
  `const auditKey = inspectionData?.id || inspectionData?.clientId || dossier.bag?.address || 'default';
    try {
      localStorage.setItem(\`streetview_url_\${auditKey}\`, url);
    } catch (e) {}`
);

fs.writeFileSync(v2Path, v2, 'utf8');
console.log('Updated InvoersheetV2View.tsx');

// 4. VisualsHouseInfo.tsx
const vhPath = 'M:\\mEPA\\massEPA_live\\src\\pages\\invoersheetV2\\components\\chapters\\VisualsHouseInfo.tsx';
let vh = fs.readFileSync(vhPath, 'utf8');

const oldVhSvBlock = `  // Dedicated effect to resolve OUTDOOR street camera coordinates
  useEffect(() => {
    let isMounted = true;
    const raw = dossier.streetviewUrl || dossier.bag?.streetviewUrl;
    // If raw is already an outdoor coordinate embed with cbll, use it immediately
    if (raw && raw.includes('cbll=')) {
      setResolvedOutdoorSv(raw);
      return;
    }

    if (cleanFullAddress) {
      resolvePropertyMapPresentation(cleanFullAddress).then((res) => {
        if (isMounted && res?.embedUrl) {
          setResolvedOutdoorSv(res.embedUrl);
        }
      });
    }
    return () => { isMounted = false; };
  }, [dossier.streetviewUrl, dossier.bag?.streetviewUrl, cleanFullAddress]);

  const [activeSvUrl, setActiveSvUrl] = useState<string>(() => {
    return localStorage.getItem('streetview_url') || dossier.streetviewUrl || dossier.bag?.streetviewUrl || '';
  });

  useEffect(() => {
    const next = dossier.streetviewUrl || dossier.bag?.streetviewUrl || localStorage.getItem('streetview_url') || '';
    if (next && next !== activeSvUrl) {
      setActiveSvUrl(next);
    }
  }, [dossier.streetviewUrl, dossier.bag?.streetviewUrl]);

  const rawSv = activeSvUrl || dossier.streetviewUrl || dossier.bag?.streetviewUrl;
  const streetviewEmbedUrl = resolvedOutdoorSv || (rawSv && isGoogleStreetViewUrl(rawSv) && rawSv.includes('cbll=') ? rawSv : '');

  const savedSvUrl = activeSvUrl || dossier.streetviewUrl || dossier.bag?.streetviewUrl || localStorage.getItem('streetview_url') || '';
  const parsedSv = parseStreetViewUrl(savedSvUrl);

  const handleSaveCamera = async (pov: { heading: number; pitch: number; zoom: number; lat: number; lng: number }) => {
    const url = \`https://maps.google.com/maps?layer=c&cbll=\${pov.lat},\${pov.lng}&cbp=0,\${Math.round(pov.heading)},0,\${Math.round(pov.zoom)},\${Math.round(pov.pitch)}\`;
    setActiveSvUrl(url);
    if (onSaveStreetviewUrl) {
      onSaveStreetviewUrl(url);
    }
    localStorage.setItem('streetview_url', url);`;

const newVhSvBlock = `  const houseKey = (dossier.bag?.pandId || dossier.bag?.vboId || cleanFullAddress || '').toLowerCase().trim();
  const houseScopedSv = houseKey ? localStorage.getItem(\`streetview_url_\${houseKey}\`) : null;

  // Dedicated effect to resolve OUTDOOR street camera coordinates
  useEffect(() => {
    let isMounted = true;
    setResolvedOutdoorSv('');

    const raw = dossier.streetviewUrl || dossier.bag?.streetviewUrl || houseScopedSv;
    // If raw is already an outdoor coordinate embed with cbll, use it immediately
    if (raw && raw.includes('cbll=')) {
      setResolvedOutdoorSv(raw);
      return;
    }

    if (cleanFullAddress) {
      resolvePropertyMapPresentation(cleanFullAddress).then((res) => {
        if (isMounted && res?.embedUrl) {
          setResolvedOutdoorSv(res.embedUrl);
        }
      });
    }
    return () => { isMounted = false; };
  }, [dossier.streetviewUrl, dossier.bag?.streetviewUrl, cleanFullAddress, houseKey]);

  const [activeSvUrl, setActiveSvUrl] = useState<string>(() => {
    return dossier.streetviewUrl || dossier.bag?.streetviewUrl || houseScopedSv || '';
  });

  useEffect(() => {
    const next = dossier.streetviewUrl || dossier.bag?.streetviewUrl || houseScopedSv || '';
    setActiveSvUrl(next);
  }, [dossier.streetviewUrl, dossier.bag?.streetviewUrl, cleanFullAddress, houseKey]);

  const rawSv = activeSvUrl || dossier.streetviewUrl || dossier.bag?.streetviewUrl;
  const streetviewEmbedUrl = resolvedOutdoorSv || (rawSv && isGoogleStreetViewUrl(rawSv) && rawSv.includes('cbll=') ? rawSv : '');

  const savedSvUrl = activeSvUrl || dossier.streetviewUrl || dossier.bag?.streetviewUrl || houseScopedSv || '';
  const parsedSv = parseStreetViewUrl(savedSvUrl);

  const handleSaveCamera = async (pov: { heading: number; pitch: number; zoom: number; lat: number; lng: number }) => {
    const url = \`https://maps.google.com/maps?layer=c&cbll=\${pov.lat},\${pov.lng}&cbp=0,\${Math.round(pov.heading)},0,\${Math.round(pov.zoom)},\${Math.round(pov.pitch)}\`;
    setActiveSvUrl(url);
    if (onSaveStreetviewUrl) {
      onSaveStreetviewUrl(url);
    }
    if (houseKey) {
      localStorage.setItem(\`streetview_url_\${houseKey}\`, url);
    }`;

if (vh.includes(oldVhSvBlock)) {
  vh = vh.replace(oldVhSvBlock, newVhSvBlock);
  console.log('Successfully replaced oldVhSvBlock in VisualsHouseInfo.tsx');
} else {
  console.log('oldVhSvBlock not found directly, checking partial replacement');
}

fs.writeFileSync(vhPath, vh, 'utf8');
console.log('Updated VisualsHouseInfo.tsx');
