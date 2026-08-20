import { InspectionData } from "../pages/backoffice/backofficeTypes";

export const extractInspectionData = async (input: string | { mimeType: string; data: string }): Promise<Partial<InspectionData>> => {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const text = typeof input === 'string' ? input : 'Sample Extracted Text from Image';
  
  // Basic mock keyword scanning
  const result: Partial<InspectionData> = {
    algemeen: {
      woning: {
        bouwfase: 'Bestaande bouw',
        opname: 'Basisopname',
        adres: 'Kerkstraat 45',
        gebouwtype: 'Detached house',
        subtype: 'Eengezinswoning',
        ligging: 'Tussenwoning',
        daktype: 'Hellend dak',
        gebouwhoogte: '9.0',
        postcode: '3511 ED',
        pandId: '0363010012148899',
        vboId: '0363010012148899',
        plaats: 'Utrecht',
        wijk: 'Binnenstad',
        gemeent: 'Utrecht',
        technischComplex: '',
        financieelComplex: '',
        svbStatus: '',
        bron: 'BAG'
      },
      bewoner: {
        nummer: '12',
        persoon: 'M. Janssen',
        adres: 'Kerkstraat 45',
        postcode: '3511 ED',
        plaats: 'Utrecht',
        telefoon: '06-87654321',
        email: 'm.janssen@example.com'
      },
      inspector: {
        adviseur: 'J. Inspector',
        adres: 'EcoWay 1',
        postcode: '2000 AA',
        plaats: 'Amsterdam',
        telefoon: '020-1112223',
        email: 'info@ecoinspect.nl',
        certificaathouder: 'EcoCert Nederland',
        gebruiker: 'inspector_j',
        opnamedatum: '2026-06-29',
        invoerdatum: '2026-06-29'
      },
      technical: {
        gboTs: ['85.5'],
        leidingdoorvoeren: 'Ja',
        aantal: '2',
        avr: 'Nee'
      },
      bidIntern: {
        fullName: '',
        phoneNumber: '',
        email: '',
        contactAddress: ''
      }
    }
  };

  // Override defaults based on simple regex parses if input is a string
  if (typeof input === 'string') {
    const addressMatch = input.match(/(?:adres|street|address)[:\s]+([^\n,]+)/i);
    if (addressMatch) {
      if (result.algemeen?.woning) result.algemeen.woning.adres = addressMatch[1].trim();
      if (result.algemeen?.bewoner) result.algemeen.bewoner.adres = addressMatch[1].trim();
    }
    const nameMatch = input.match(/(?:naam|name|persoon|person)[:\s]+([^\n,]+)/i);
    if (nameMatch && result.algemeen?.bewoner) {
      result.algemeen.bewoner.persoon = nameMatch[1].trim();
    }
    const cityMatch = input.match(/(?:plaats|city)[:\s]+([^\n,]+)/i);
    if (cityMatch) {
      if (result.algemeen?.woning) result.algemeen.woning.plaats = cityMatch[1].trim();
      if (result.algemeen?.bewoner) result.algemeen.bewoner.plaats = cityMatch[1].trim();
    }
    const pcMatch = input.match(/(?:postcode|postal|zip)[:\s]+([A-Z0-9\s]{4,8})/i);
    if (pcMatch) {
      if (result.algemeen?.woning) result.algemeen.woning.postcode = pcMatch[1].trim();
      if (result.algemeen?.bewoner) result.algemeen.bewoner.postcode = pcMatch[1].trim();
    }
  }

  return result;
};
