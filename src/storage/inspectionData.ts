import { idbGet, idbPut } from './idbKv';
import { normalizeAddressKey } from './buildingAnswers';
import { InspectionData } from '../pages/backoffice/backofficeTypes';

const PREFIX = 'backofficeInspectionData:v1:';

export function createDefaultInspectionData(address: string, fullName = '', email = '', phone = ''): InspectionData {
  return {
    algemeen: {
      woning: {
        bouwfase: 'Bestaande bouw',
        opname: 'Basisopname',
        adres: address,
        gebouwtype: 'Detached house',
        subtype: 'Eengezinswoning',
        ligging: 'Tussenwoning',
        daktype: 'Zadeldek',
        gebouwhoogte: '8.5',
        postcode: '',
        pandId: '0363010012145564',
        vboId: '0363010012145564',
        plaats: 'Amsterdam',
        wijk: 'Centrum',
        gemeent: 'Amsterdam',
        technischComplex: '',
        financieelComplex: '',
        svbStatus: '',
        bron: 'BAG'
      },
      bewoner: {
        nummer: '1',
        persoon: fullName,
        adres: address,
        postcode: '',
        plaats: '',
        telefoon: phone,
        email: email
      },
      inspector: {
        adviseur: '',
        adres: '',
        postcode: '',
        plaats: '',
        telefoon: '',
        email: '',
        certificaathouder: '',
        gebruiker: '',
        opnamedatum: new Date().toISOString().split('T')[0],
        invoerdatum: new Date().toISOString().split('T')[0]
      },
      technical: {
        gboTs: [''],
        leidingdoorvoeren: '',
        aantal: '',
        avr: ''
      },
      bidIntern: {
        fullName: '',
        phoneNumber: '',
        email: '',
        contactAddress: ''
      }
    },
    constructies: [
      { id: 'c1', type: 'Gevel', naam: 'Gevel isolatiedikte onbekend (1992-2013, Rc = 2.50)', isolatie: 'Ja', dikte: 'Onbekend', bouwjaar: 'Van 1992 t/m 2013', rc: '2.5' },
      { id: 'c2', type: 'Vloer', naam: 'Vloer 250 mm isolatie (Rc = 5.71)', isolatie: 'Ja', dikte: '250', rc: '5.71' },
      { id: 'c3', type: 'Dak', naam: 'Dak hellend isolatiedikte onbekend (1992-2013, Rc = 2.50)', dakType: 'Hellend dak', isolatie: 'Ja', dikte: 'Onbekend', rc: '2.5' },
      { id: 'c4', type: 'Raam', naam: 'Raam HR++ glas (Hout, U = 1.80, g = 0.60)', kozijn: 'Hout', glas: 'HR++', area: '1.20', uGren: '1.8', g: '0.6' }
    ],
    kozijnen: [
      { id: 'k1', gevel: 'Achtergevel', naam: 'W1', width: '1.20', height: '1.50', area: '1.80', constructieId: 'c4' }
    ],
    installations: {
      ventSysteem: 'Mechanische afvoer',
      ventMerkType: 'Itho Daalderop CVE-S',
      ventSpecsBcrg: 'BCRG 2023.0124',
      ventVentilatiesysteem: 'Type C.4a',
      ventSubsysteem: 'Woonhuisventilator',
      ventLuchtdichtheid: 'Klasse 2',
      ventVentilatoren: 'Gelijkstroom',
      ventTypeVentilator: 'Centrifugaal',
      ventCode: 'V-01-IDCVE',

      verwarmSysteem: 'HR-Combiketel',
      verwarmMerkType: 'Nefit Trendline HRC30',
      verwarmSpecsBcrg: 'BCRG 2022.0911',
      verwarmTypeopwekker: 'Gasgestookte ketel',
      verwarmTypeToestel: 'Individueel',
      verwarmDistributiemedium: 'Water',
      verwarmWatertemprater: '55°C / 45°C',
      verwarmAfgiftesysteem: 'LT Radiatoren + Vloer',
      verwarmCode: 'W-01-NEF-T',
      verwarmRegeling: 'Weersafhankelijk',

      tapSysteem: 'Gecombineerd met CV',
      tapMerkType: 'Nefit Trendline (Interne)',
      tapSpecsBcrg: '-',
      tapTypeInstallatie: 'Individueel',
      tapTypeOpwekker: '-',
      tapTypeToestel: '-',
      tapCode: 'TW-01-COMBI',
      tapAfgifteKeuken: 'L <= 3m',
      tapAfgifteBadkamer: 'L <= 1m',
      tapCirculatieleiding: 'Niet aanwezig',
      tapDwtw: 'Niet aanwezig',

      koelSysteem: 'Niet aanwezig',
      koelMerkType: '-',
      koelSpecsBcrg: '-',
      koelTypeInstallatie: '-',
      koelExpansie: '-',
      koelCode: '-',
      koelDistributiemedium: '-',
      koelWatertemprater: '-',
      koelAfgiftesysteem: '-',
      koelRegeling: '-',

      zonSysteem: 'PV-panelen',
      zonMerkType: 'JA Solar Mono',
      zonSpecsBcrg: '-',
      zonAantal: '12 stuks',
      zonHellingshook: '35° (Zuid-West)',
      zonCode: 'PV-01-JASOL',
      zonOppPerPanelen: '1.75 m²',
      zonWattpiekvermogen: '410 Wp / paneel',
      zonBouwintegratie: 'Op dakbedekking'
    }
  };
}

export function inspectionDataIdbKey(addressKey: string): string {
  return `${PREFIX}${addressKey}`;
}

export async function loadInspectionData(address: string, fallbackProfile?: { fullName?: string, email?: string, phone?: string }): Promise<InspectionData> {
  const addressKey = normalizeAddressKey(address);
  if (!addressKey) {
    return createDefaultInspectionData(address, fallbackProfile?.fullName, fallbackProfile?.email, fallbackProfile?.phone);
  }
  const raw = await idbGet<unknown>(inspectionDataIdbKey(addressKey));
  if (!raw || typeof raw !== 'object') {
    return createDefaultInspectionData(address, fallbackProfile?.fullName, fallbackProfile?.email, fallbackProfile?.phone);
  }
  return raw as InspectionData;
}

export async function saveInspectionData(address: string, data: InspectionData): Promise<void> {
  const addressKey = normalizeAddressKey(address);
  if (!addressKey) return;
  await idbPut(inspectionDataIdbKey(addressKey), data);
}
