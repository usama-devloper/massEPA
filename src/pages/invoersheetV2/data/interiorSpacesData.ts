export interface SpacePhoto {
  id: string;
  url: string;
  caption: string;
  tag?: string;
}

export interface InteriorSpaceCard {
  id: string;
  spaceName: string;
  spaceType: string;
  floorLevel?: string;
  sectionTitle: string; // e.g. "Vloer", "Verwarming", "Tapwater", "Zonne-Energie", "Ventilatie", "Kozijn", "Koeling"
  category: 'floor' | 'heating' | 'tapwater' | 'solar' | 'ventilation' | 'window' | 'door' | 'cooling';
  icon: string;
  badgeCode: string; // e.g. "(VLO)", "(VERW)", "(TAP)", "(PV)", "(VENT)", "(WC)", "(KEUK)", "(SLAAP)"
  specs: {
    label: string;
    value: string;
    length?: string;
    width?: string;
    bcrg?: string;
    highlight?: boolean;
  }[];
  photos: SpacePhoto[];
  notes?: string;
  verifiedNta?: boolean;
}

export const INTERIOR_SPACES_DATA: InteriorSpaceCard[] = [
  {
    id: 'space-hal-vloer',
    spaceName: 'Hal',
    spaceType: 'Hal',
    sectionTitle: 'Vloer',
    category: 'floor',
    icon: 'Layers',
    badgeCode: '(VLO)',
    specs: [
      { label: 'Isolatie', value: '90 mm Isolatie (Rc = 2.15)', highlight: true },
      { label: 'Grenst aan', value: 'Kruipruimte' },
      { label: 'Area', value: '42.90 m2' },
      { label: 'Perimeter', value: '18.70 m' },
      { label: 'Bodemisolatie kruipruimte', value: 'Ongeisoleerd' },
      { label: 'Rbw-waarde wanden kruipruimte', value: 'Voorgevel' }
    ],
    photos: [
      {
        id: 'hal-photo-1',
        url: '/assets/v2/images/hallway_crawlspace_1789462254540.jpg',
        caption: 'Entreehal overzicht met garderoberuimte en toegangsvloer',
        tag: 'Hal Entree'
      },
      {
        id: 'hal-photo-2',
        url: '/assets/v2/images/crawlspace_measure_1789462372486.jpg',
        caption: 'Kruipluik meting met duimstok (controle kruipruimtehoogte)',
        tag: 'Kruipluik Maatvoering'
      },
      {
        id: 'hal-photo-3',
        url: '/assets/v2/images/crawlspace_eps_1789462410806.jpg',
        caption: 'Vloerisolatie onderzijde begane grondvloer (90 mm EPS/Rc 2.15)',
        tag: 'Vloerconstructie'
      }
    ],
    notes: 'Begane grondvloer grenzend aan geventileerde kruipruimte. Inspectie via kruipluik entree.',
    verifiedNta: true
  },
  {
    id: 'space-mk-verwarming',
    spaceName: 'MK',
    spaceType: 'MK',
    sectionTitle: 'Verwarming',
    category: 'heating',
    icon: 'Flame',
    badgeCode: '(VERW)',
    specs: [
      { label: 'Systeem', value: 'Warmtelevering derden individueel' },
      { label: 'Brand & Type', value: 'Vattenfall Stadswarmte', highlight: true },
      { label: 'BCRG', value: '20240131GK', bcrg: '20240131GK', highlight: true },
      { label: 'Type opwekker', value: 'Secundair warmtenet' },
      { label: 'Distributiemedium', value: 'Water' },
      { label: 'Wateraanvoertemperatuur', value: '90/70 °C' },
      { label: 'Afgiftesysteem', value: 'Radiatoren / convectoren' },
      { label: 'Regeling', value: 'Regeling in hoofdvertrek' }
    ],
    photos: [
      {
        id: 'mk-photo-1',
        url: '/assets/v2/images/meterkast_technical_1789462275069.jpg',
        caption: 'Meterkast technische verdeler & elektrische aansluiting',
        tag: 'Meterkast'
      },
      {
        id: 'mk-photo-2',
        url: '/assets/v2/images/heating_afleverset_1789462293792.jpg',
        caption: 'Vattenfall Stadswarmte afleverset met isolatieschaal',
        tag: 'Stadswarmte Afleverset'
      },
      {
        id: 'mk-photo-3',
        url: '/assets/v2/images/solar_inverter_1789462310898.jpg',
        caption: 'Omvormer PV-systeem in meterkast gemonteerd',
        tag: 'PV Omvormer'
      }
    ],
    notes: 'Secundair warmtenet aangesloten op stadsverwarming Flevoland (Vattenfall). BCRG 20240131GK.',
    verifiedNta: true
  },
  {
    id: 'space-mk-tapwater',
    spaceName: 'MK',
    spaceType: 'MK',
    sectionTitle: 'Tapwater',
    category: 'tapwater',
    icon: 'Droplets',
    badgeCode: '(TAP)',
    specs: [
      { label: 'Systeem', value: 'Externe warmtelevering via individuele' },
      { label: 'Brand & Type', value: 'Vattenfall Stadswarmte', highlight: true },
      { label: 'BCRG', value: '20240131GK', bcrg: '20240131GK', highlight: true },
      { label: 'Opwekker', value: 'Externe levering via een afleverset' },
      { label: 'Aflevertemperatuur', value: 'Onbekend' },
      { label: 'Afgiftesysteem keuken', value: '<2 m' },
      { label: 'Afgiftesysteem badkamer', value: '<2 m <= l < 4 m' },
      { label: 'Circulatieleiding aanwezig', value: 'Nee' }
    ],
    photos: [
      {
        id: 'mk-tap-1',
        url: '/assets/v2/images/meterkast_technical_1789462275069.jpg',
        caption: 'Meterkast leidingdoorvoeren, watermeter en stadsverwarmingsaansluiting',
        tag: 'Tapwater Distributie'
      },
      {
        id: 'mk-tap-2',
        url: '/assets/v2/images/heating_afleverset_1789462293792.jpg',
        caption: 'Doorstroomwarmtewisselaar tapwater in afleverset behuizing',
        tag: 'Warmtewisselaar'
      }
    ],
    notes: 'Directe warmtewisselaar tapwater zonder voorraadvat. Leidinglengte naar tappunten conform NTA 8800.',
    verifiedNta: true
  },
  {
    id: 'space-mk-zonne-energie',
    spaceName: 'MK',
    spaceType: 'MK',
    sectionTitle: 'Zonne-Energie',
    category: 'solar',
    icon: 'Sun',
    badgeCode: '(PV)',
    specs: [
      { label: 'Brand & Type', value: 'DMEGC – DM400M10/B54HBB', highlight: true },
      { label: 'BCRG', value: '20201695GK', bcrg: '20201695GK', highlight: true },
      { label: 'Hellingshoek', value: '13°' },
      { label: 'Aantal', value: '8 panelen' },
      { label: 'Orientatie', value: 'Zuidoost' },
      { label: 'Wattpiekvermogen', value: '205.13 Wp/m² (Tot. ~3.200 Wp)', highlight: true },
      { label: 'Bouwintegratie', value: 'Sterk geventileerd' }
    ],
    photos: [
      {
        id: 'pv-photo-1',
        url: '/assets/v2/images/meterkast_technical_1789462275069.jpg',
        caption: 'AC-aansluiting en PV-aardlekschakelaar in meterkast',
        tag: 'Groepenkast PV'
      },
      {
        id: 'pv-photo-2',
        url: '/assets/v2/images/heating_afleverset_1789462293792.jpg',
        caption: 'Afleverset en technische installaties overzicht',
        tag: 'Installatieruimte'
      },
      {
        id: 'pv-photo-3',
        url: '/assets/v2/images/solar_inverter_1789462310898.jpg',
        caption: 'PV String Omvormer met LED statusindicatoren',
        tag: 'Omvormer Status'
      }
    ],
    notes: '8 stuks DMEGC DM400M10 panelen op plat dak (13° hellingshoek). Gecontroleerd via BCRG 20201695GK.',
    verifiedNta: true
  },
  {
    id: 'space-livingroom-ventilatie',
    spaceName: 'Livingroom',
    spaceType: 'Livingroom',
    sectionTitle: 'Ventilatie',
    category: 'ventilation',
    icon: 'Wind',
    badgeCode: '(VENT)',
    specs: [
      { label: 'Systeem', value: 'Individual' },
      { label: 'Brand & Type', value: 'Climarad - Classic Solution', highlight: true },
      { label: 'BCRG', value: '-' },
      { label: 'Ventilatiesysteem', value: 'C Mechanische afvoer' },
      { label: 'Subsysteem', value: 'C5a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-m', highlight: true },
      { label: 'Luchtdichtheidsklasse', value: 'LUKA A, B of C' },
      { label: 'Opgave ventilatoren', value: 'Onbekend' },
      { label: 'Type elektromotor', value: 'Gelijkstroom' },
      { label: 'Natuurlijke ventilatie', value: 'Nee' }
    ],
    photos: [
      {
        id: 'vent-photo-1',
        url: '/assets/v2/images/ventilation_climarad_1789462350173.jpg',
        caption: 'Climarad Classic Solution wandbedieningsmodule met CO2-sensor',
        tag: 'Climarad Wandmodule'
      },
      {
        id: 'vent-photo-2',
        url: '/assets/v2/images/ventilation_climarad_1789462350173.jpg',
        caption: 'Luchtafvoerventiel in plafondhoek living',
        tag: 'Ventiel Plafond'
      },
      {
        id: 'vent-photo-3',
        url: '/assets/v2/images/livingroom_view_1789462334656.jpg',
        caption: 'Woonkamer overzicht met leefruimte, zithoek en gevelkozijn',
        tag: 'Livingroom Overzicht'
      },
      {
        id: 'vent-photo-4',
        url: '/assets/v2/images/window_trickle_vent_1789462391330.jpg',
        caption: 'Kozijndetail met ventilatierooster / buitentoevoer',
        tag: 'Toevoerrooster Raam'
      }
    ],
    notes: 'Climarad decentraal vraaggestuurd ventilatiesysteem C5a met gelijkstroomventilatoren en CO2-sturing.',
    verifiedNta: true
  },
  {
    id: 'space-wc-kozijn',
    spaceName: 'WC',
    spaceType: 'WC',
    sectionTitle: 'Kozijn',
    category: 'window',
    icon: 'AppWindow',
    badgeCode: '(WC)',
    specs: [
      { label: 'Brand & Type', value: 'K-Vision HR++' },
      { label: 'Oppervlakte', value: '0.82 m2', length: '0.63', width: '1.30' },
      { label: 'Invoermethode', value: 'Decision Tree' },
      { label: 'Isolatie aanwezig', value: 'Nee' },
      { label: 'U-waarde', value: '1.10' },
      { label: 'g [-]', value: '0.46' },
      { label: 'Overstek & Belemmering', value: 'Minimal obstruction' },
      { label: 'Zonwering', value: 'Geen zonwering' }
    ],
    photos: [
      {
        id: 'wc-photo-1',
        url: '/assets/v2/images/vent_valve_corner_1789463082349.jpg',
        caption: 'Afvoerventiel toiletruimte wand/plafond',
        tag: 'Ventilatie'
      },
      {
        id: 'wc-photo-2',
        url: '/assets/v2/images/wc_interior_audit_1789462936044.jpg',
        caption: 'Toiletruimte begane grond overzicht met wandcloset en fontein',
        tag: 'WC Overzicht'
      },
      {
        id: 'wc-photo-3',
        url: '/assets/v2/images/wc_frosted_window_1789462970370.jpg',
        caption: 'K-Vision HR++ kunststof raamkozijn met ornamentglas (0.82 m²)',
        tag: 'Kozijn Detail'
      }
    ],
    notes: 'Toiletruimte begane grond met K-Vision HR++ kunststof kozijn en mechanische afzuiging.',
    verifiedNta: true
  },
  {
    id: 'space-keuken-kozijn',
    spaceName: 'Keuken',
    spaceType: 'Keuken',
    sectionTitle: 'Kozijn',
    category: 'window',
    icon: 'AppWindow',
    badgeCode: '(KEUK)',
    specs: [
      { label: 'Brand & Type', value: 'K-Vision HR++' },
      { label: 'Oppervlakte', value: '2.58 m2', length: '1.83', width: '1.41' },
      { label: 'Invoermethode', value: 'Decision Tree' },
      { label: 'Isolatie aanwezig', value: 'Nee' },
      { label: 'U-waarde', value: '1.10' },
      { label: 'g [-]', value: '0.46' },
      { label: 'Overstek & Belemmering', value: 'Minimal obstruction' },
      { label: 'Zonwering', value: 'Geen zonwering' }
    ],
    photos: [
      {
        id: 'keuk-photo-1',
        url: '/assets/v2/images/kitchen_interior_1789462995772.jpg',
        caption: 'Keukenruimte overzicht met werkblad, spoelbak en gevelkozijn',
        tag: 'Keuken Overzicht'
      },
      {
        id: 'keuk-photo-2',
        url: '/assets/v2/images/vent_valve_corner_1789463082349.jpg',
        caption: 'Afvoerventiel plafondhoek keuken',
        tag: 'Ventilatie'
      },
      {
        id: 'keuk-photo-3',
        url: '/assets/v2/images/window_trickle_vent_1789462391330.jpg',
        caption: 'K-Vision HR++ gevelkozijn met ventilatierooster (2.58 m²)',
        tag: 'Kozijn Gevel'
      }
    ],
    notes: 'Keukenruimte voorzien van K-Vision HR++ kozijn (U=1.10) en mechanisch afvoerventiel.',
    verifiedNta: true
  },
  {
    id: 'space-slaapkamer-kozijn',
    spaceName: 'Slaapkamer',
    spaceType: 'Slaapkamer',
    sectionTitle: 'Kozijn',
    category: 'window',
    icon: 'AppWindow',
    badgeCode: '(SLAAP)',
    specs: [
      { label: 'Brand & Type', value: 'K-Vision HR++' },
      { label: 'Oppervlakte', value: '2.58 m2', length: '1.83', width: '1.41' },
      { label: 'Invoermethode', value: 'Decision Tree' },
      { label: 'Isolatie aanwezig', value: 'Nee' },
      { label: 'U-waarde', value: '1.10' },
      { label: 'g [-]', value: '0.46' },
      { label: 'Overstek/belemm.', value: 'Geen' },
      { label: 'Zonwering', value: 'Geen' }
    ],
    photos: [
      {
        id: 'slaap-photo-1',
        url: '/assets/v2/images/bedroom_interior_1789463010828.jpg',
        caption: 'Slaapkamer overzicht met bed en natuurlijk daglicht',
        tag: 'Slaapkamer Overzicht'
      },
      {
        id: 'slaap-photo-2',
        url: '/assets/v2/images/vent_valve_corner_1789463082349.jpg',
        caption: 'Afvoerventiel plafondhoek slaapkamer',
        tag: 'Ventilatie'
      },
      {
        id: 'slaap-photo-3',
        url: '/assets/v2/images/window_trickle_vent_1789462391330.jpg',
        caption: 'K-Vision HR++ gevelkozijn met ventilatierooster (2.58 m²)',
        tag: 'Kozijn Gevel'
      }
    ],
    notes: 'Slaapkamer met K-Vision HR++ kunststof beglazing en gecombineerde ventilatievoorziening.',
    verifiedNta: true
  }
];
