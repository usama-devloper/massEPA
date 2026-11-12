import { ProjectDossier } from '../types';

export const initialProjectDossier: ProjectDossier = {
  dossierNumber: 'PROJECT 202605',
  status: 'Controle NTA 8800',
  inspectionDate: '09-09-2026',
  inspectorName: 'Joep Esser',
  inspectorCertNumber: '5923.3337.5020',
  certificationInstitute: 'SKG-IKOB Certificatie B.V.',
  calculationSoftware: 'MassEPA Rekenmodule Pro',
  softwareVersion: 'v4.8.2 (NTA 8800:2024)',
  protocolVersion: 'NTA 8800:2024 (Woningbouw)',
  bag: {
    pandId: '0034100000029155',
    vboId: '0034010000010168',
    address: 'Fintstraat',
    houseNumber: '1',
    postalCode: '1317 JA',
    city: 'Almere',
    municipality: 'Almere',
    constructionYear: 1994,
    usageFunction: 'Woonfunctie (eengezinswoning)',
    usableAreaAg: 76.1,
    lossAreaAls: 218.6,
    compactnessAlsAg: 2.87,
    volumeM3: 385.0,
    floorsCount: 2,
    buildingType: 'Kop-eind-of hoekligging'
  },
  envelope: [
    {
      id: 'env-1',
      code: 'GEV-01',
      name: 'Voorgevel metselwerk spouw na-isolatie',
      type: 'gevel',
      orientation: 'Z',
      area: 44.8,
      rc: 3.8,
      insulationType: 'HR++ EPS parels spouwvulling',
      insulationThicknessMm: 70,
      qualityStatement: true,
      bcrgCode: 'BCRG-20210419-01',
      verified: true,
      notes: 'Spouwmuurisolatie aangebracht in 2022. Factuur en boorgatenpatroon geverifieerd.',
      inspectionPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'env-2',
      code: 'GEV-02',
      name: 'Achtergevel metselwerk spouw na-isolatie',
      type: 'gevel',
      orientation: 'N',
      area: 42.1,
      rc: 3.8,
      insulationType: 'HR++ EPS parels spouwvulling',
      insulationThicknessMm: 70,
      qualityStatement: true,
      bcrgCode: 'BCRG-20210419-01',
      verified: true,
      notes: 'Achtergevel inspectie met endoscoop uitgevoerd.',
      inspectionPhotoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'env-3',
      code: 'DAK-01',
      name: 'Hellend dak pannen - dakisolatie binnenzijde',
      type: 'dak',
      orientation: 'Z',
      area: 52.4,
      rc: 4.5,
      insulationType: 'PIR renovatieplaten met dampremmer',
      insulationThicknessMm: 100,
      qualityStatement: true,
      bcrgCode: 'BCRG-20220911-04',
      verified: true,
      notes: 'Zolderverdieping voorzien van 100mm PIR platen en gipsafwerking.',
      inspectionPhotoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'env-4',
      code: 'DAK-02',
      name: 'Plat dak dakkapel achterzijde',
      type: 'dak',
      orientation: 'Horizontaal',
      area: 8.6,
      rc: 3.5,
      insulationType: 'Bitumen met PIR afschotisolatie',
      insulationThicknessMm: 90,
      qualityStatement: false,
      verified: true,
      notes: 'Dakkapel geplaatst in 2019.'
    },
    {
      id: 'env-5',
      code: 'VLO-01',
      name: 'Begane grondvloer kruipruimte bodemisolatie',
      type: 'vloer',
      orientation: 'Horizontaal',
      area: 54.2,
      rc: 3.6,
      insulationType: 'Thermokussens / Tonzon onder balklaag',
      insulationThicknessMm: 120,
      qualityStatement: true,
      bcrgCode: 'BCRG-20200318-12',
      verified: true,
      notes: 'Kruipruimte geïnspecteerd via kruipluik entreehal.'
    },
    {
      id: 'env-6',
      code: 'KOZ-01',
      name: 'Begane grond voorgevel kozijnen + voordeur',
      type: 'raam',
      orientation: 'Z',
      area: 11.2,
      uValue: 1.1,
      glazingType: 'HR+++ Triple',
      gValue: 0.52,
      insulationType: 'Geïsoleerd hardhouten kozijn met thermische onderbreking',
      insulationThicknessMm: 68,
      qualityStatement: true,
      bcrgCode: 'BCRG-20230115-08',
      verified: true,
      notes: 'Nieuwe kozijnen met afstandhouder en argon vulling.'
    },
    {
      id: 'env-7',
      code: 'KOZ-02',
      name: 'Begane grond schuifpui achtergevel',
      type: 'raam',
      orientation: 'N',
      area: 14.6,
      uValue: 1.2,
      glazingType: 'HR++',
      gValue: 0.60,
      insulationType: 'Aluminium kozijn met isolator',
      insulationThicknessMm: 75,
      qualityStatement: true,
      verified: true,
      notes: 'Schuifpui voorzien van HR++ beglazing.'
    },
    {
      id: 'env-8',
      code: 'KOZ-03',
      name: 'Verdieping slaapkamers ramen',
      type: 'raam',
      orientation: 'Z',
      area: 9.8,
      uValue: 1.3,
      glazingType: 'HR++',
      gValue: 0.60,
      insulationType: 'Hardhouten kozijnen',
      insulationThicknessMm: 67,
      qualityStatement: false,
      verified: true,
      notes: 'Glascode geverifieerd in spouwlat: AGC Thermobel 2021.'
    }
  ],
  installations: {
    heatingType: 'Stadsverwarming',
    heatingEfficiencyCOP: 1.0,
    tapwaterType: 'Stadsverwarming afleverset',
    ventilationType: 'Vraaggestuurde ventilatie CO2',
    wtwEfficiencyPct: 0,
    solarPvPanelsCount: 8,
    solarPvWpPerPanel: 400,
    solarPvOrientation: 'ZO',
    solarPvInclinationDeg: 13,
    hasSolarBoiler: false,
    coolingPresent: false
  },
  drawings: [
    {
      id: 'dwg-1',
      title: 'Gevelaanzichten & Maatvoering (CAD NTA 8800)',
      type: 'elevation',
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Architecturale situatietekening en opmetingen van de thermische schil (NEN 2580)',
      pins: [
        {
          id: 'pin-1',
          xPct: 24,
          yPct: 38,
          elementId: 'env-1',
          title: 'Voorgevel Spouwmuur (GEV-01)',
          tag: 'Rc 3.8',
          description: 'HR++ EPS parels 70mm, spouwvulling BCRG gecontroleerd',
          type: 'envelope',
          status: 'verified'
        },
        {
          id: 'pin-2',
          xPct: 35,
          yPct: 62,
          elementId: 'env-6',
          title: 'Drievoudig Glas HR+++ (KOZ-01)',
          tag: 'U 1.1',
          description: 'Hardhouten kozijn, thermische afstandhouder, g_gl=0.52',
          type: 'window',
          status: 'verified'
        },
        {
          id: 'pin-3',
          xPct: 68,
          yPct: 25,
          elementId: 'env-3',
          title: 'Hellend Dak PIR (DAK-01)',
          tag: 'Rc 4.5',
          description: '100mm PIR binnenzijde dakhelling 35°',
          type: 'envelope',
          status: 'verified'
        },
        {
          id: 'pin-4',
          xPct: 76,
          yPct: 15,
          title: '14x PV-panelen 420 Wp',
          tag: '5.88 kWp',
          description: 'Zuid-oriëntatie, hellingshoek 35°, SolarEdge omvormer',
          type: 'installation',
          status: 'verified'
        }
      ]
    },
    {
      id: 'dwg-2',
      title: 'Plattegrond & Zoneverdeling (Begane Grond)',
      type: 'blueprint',
      url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
      caption: 'Gebruiksoppervlakte Ag 146.5 m² verdeeld over 3 rekenzones',
      pins: [
        {
          id: 'pin-5',
          xPct: 20,
          yPct: 45,
          elementId: 'env-5',
          title: 'Vloerisolatie Kruipruimte (VLO-01)',
          tag: 'Rc 3.6',
          description: 'Tonzon thermokussens onder begane grondvloer',
          type: 'envelope',
          status: 'verified'
        },
        {
          id: 'pin-6',
          xPct: 82,
          yPct: 52,
          elementId: 'env-7',
          title: 'Schuifpui HR++ (KOZ-02)',
          tag: 'U 1.2',
          description: 'Aluminium kozijn met koudebrugonderbreking',
          type: 'window',
          status: 'verified'
        }
      ]
    },
    {
      id: 'dwg-3',
      title: 'Inspectiefoto: Spouwmuur & Gevelschil',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      caption: 'Boorgatenpatroon na-isolatie spouwmuur conform BRL 9500 dossier',
      pins: [
        {
          id: 'pin-7',
          xPct: 45,
          yPct: 50,
          elementId: 'env-1',
          title: 'Boorgatverificatie Spouwmuur',
          tag: 'BRL 9500',
          description: 'Gecontroleerde spouwbreedte 72mm gevuld met EPS parels',
          type: 'bcrg',
          status: 'verified'
        }
      ]
    },
    {
      id: 'dwg-4',
      title: 'Inspectiefoto: Installatieruimte (Warmtepomp + WTW)',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Lucht/water warmtepomp binnenunit (Daikin Altherma 3) en Zehnder WTW unit',
      pins: [
        {
          id: 'pin-8',
          xPct: 50,
          yPct: 42,
          title: 'Lucht/Water Warmtepomp',
          tag: 'COP 4.4',
          description: 'Typeplaatje geregistreerd: Daikin ERGA06EAV3H met 180L RVS boiler',
          type: 'installation',
          status: 'verified'
        },
        {
          id: 'pin-9',
          xPct: 72,
          yPct: 28,
          title: 'Balansventilatie WTW',
          tag: 'η 92%',
          description: 'Zehnder ComfoAir Q350 met enthalpiewisselaar en 100% bypass',
          type: 'installation',
          status: 'verified'
        }
      ]
    },
    {
      id: 'dwg-5',
      title: 'Inspectiefoto: Zonnepanelen Dakvlak',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=1200&q=80',
      caption: '14 stuks mono-kristallijn all-black PV-panelen op zadeldak zuidzijde',
      pins: [
        {
          id: 'pin-10',
          xPct: 48,
          yPct: 35,
          title: 'PV Array 14x 420 Wp',
          tag: '5880 Wp',
          description: 'Hellingshoek 35°, zuid, geen schaduwvorming door schoorsteen',
          type: 'installation',
          status: 'verified'
        }
      ]
    }
  ],
  validationRules: [
    {
      id: 'val-1',
      ruleCode: 'NTA-CHK-01',
      chapter: 'Identificatie',
      severity: 'success',
      title: 'BAG Pand en VBO Koppeling Actief',
      description: 'Geldige kadastrale identificator gevonden in Landelijke Voorziening BAG.',
      isResolved: true
    },
    {
      id: 'val-2',
      ruleCode: 'BRL-CHK-04',
      chapter: 'Schil - Isolatie',
      severity: 'success',
      title: 'BCRG Kwaliteitsverklaring Spouwvulling',
      description: 'Kwaliteitsverklaring BCRG-20210419-01 is geldig en gekoppeld aan GEV-01 en GEV-02.',
      isResolved: true
    },
    {
      id: 'val-3',
      ruleCode: 'BRL-CHK-08',
      chapter: 'Installaties',
      severity: 'success',
      title: 'Typeplaatje Warmtepomp Vastgelegd',
      description: 'Foto van typeplaatje Daikin Altherma aanwezig in inspectiedossier.',
      isResolved: true
    },
    {
      id: 'val-4',
      ruleCode: 'NTA-CHK-12',
      chapter: 'Geometrie',
      severity: 'warning',
      title: 'Plat Dak Dakkapel Geen BCRG Verklaring',
      description: 'Voor DAK-02 is de forfaitaire Rc-waarde van 3.5 toegepast conform tabel NTA 8800.',
      isResolved: true
    },
    {
      id: 'val-5',
      ruleCode: 'EPBD-CHK-02',
      chapter: 'Oververhitting',
      severity: 'info',
      title: 'TO_juli Risicobeoordeling',
      description: 'TO_juli waarde van 0.35 ligt ruim onder de wettelijke grenswaarde van 1.20.',
      isResolved: true
    }
  ]
};

export const BCRG_DATABASE = [
  {
    code: 'BCRG-20210419-01',
    manufacturer: 'Supafil / Knauf Insulation',
    productName: 'Supafil Cavity Wall HR++ minerale inblaaswol',
    category: 'Spouwmuurisolatie',
    certifiedRc: 3.85,
    lambda: 0.034,
    validUntil: '2027-12-31'
  },
  {
    code: 'BCRG-20220911-04',
    manufacturer: 'Kingspan Insulation B.V.',
    productName: 'Kooltherm K12 Frame Board PIR dak/wand',
    category: 'Hellend dak & houtskeletbouw',
    certifiedRc: 4.55,
    lambda: 0.022,
    validUntil: '2028-06-30'
  },
  {
    code: 'BCRG-20200318-12',
    manufacturer: 'Tonzon B.V.',
    productName: 'Tonzon Thermokussens 3-kamersysteem kruipruimte',
    category: 'Vloerisolatie',
    certifiedRc: 3.80,
    lambda: 0.019,
    validUntil: '2026-10-15'
  },
  {
    code: 'BCRG-20230115-08',
    manufacturer: 'Saint-Gobain Building Glass',
    productName: 'Climatop One Triple Beglazing 4-15-4-15-4 argon',
    category: 'Beglazing',
    certifiedU: 0.70,
    gValue: 0.50,
    validUntil: '2029-01-01'
  },
  {
    code: 'BCRG-20230502-19',
    manufacturer: 'Daikin Europe N.V.',
    productName: 'Altherma 3 R W lucht-water split warmtepomp 6kW',
    category: 'Warmtepompen',
    certifiedCOP: 4.48,
    validUntil: '2028-11-30'
  },
  {
    code: 'BCRG-20221104-03',
    manufacturer: 'Zehnder Group Nederland',
    productName: 'ComfoAir Q350 Balansventilatie met WTW',
    category: 'Ventilatie met warmteterugwinning',
    efficiencyPct: 92.6,
    validUntil: '2027-09-15'
  }
];
