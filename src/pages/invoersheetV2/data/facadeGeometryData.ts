export interface KozijnDetail {
  id: string;
  code: string; // e.g. "D1", "D1W", "W2", "W4"
  name: string;
  category?: string; // e.g. "Buitendeur", "Raam", "Schuifpui", "Vast glas"
  categories?: string[]; // Multiple categories / tags
  width: number; // in meters (Breedte)
  height: number; // in meters (Hoogte)
  area: number; // in m² (Breedte × Hoogte)
  brandAndType?: string; // Formerly construction
  inputMethod?: string;
  insulationPresent?: 'yes' | 'no';
  insulationThickness?: number;
  uValue?: number;
  overstekBelemmering: string;
  zonwering: string;
  photoUrl: string; // Keep for backward compatibility
  photoUrls?: string[];
  photoDescription: string;
  glazingType?: string;
  gValue?: number;
}

export interface FacadeGeometry {
  id: string;
  title: string;
  subTitle?: string;
  code: string;
  gevelType?: string;
  construction: string;
  orientation: string;
  level: string;
  boundary: string;
  formula: string;
  length?: string;
  width?: string;
  areaTotal: number;
  kozijnListString: string;
  photoUrl: string; // Keep for backward compatibility
  photoUrls?: string[];
  cadDrawingType: 'voorgevel' | 'linkergevel' | 'rechtergevel' | 'achtergevel';
  cadFileUrl?: string;
  kozijnen: KozijnDetail[];
  notes?: string;
}

export const FACADE_GEOMETRY_DATA: FacadeGeometry[] = [
  {
    id: 'facade-voor',
    title: 'Voorgevel',
    subTitle: 'Entreezijde straatbeeld (Fintstraat)',
    code: 'GEV-01',
    construction: 'H2FOAM LITE (60 mm, Rc= 1.56)',
    orientation: 'Noord-Oost',
    level: 'BG',
    boundary: 'Buitenlucht',
    formula: '10.20 m * 2.7 m = 27.56 m2',
    areaTotal: 27.56,
    kozijnListString: 'D1, D1W, W2, W4',
    photoUrl: '/assets/v2/images/voorgevel_house_1789458929544.jpg',
    photoUrls: ['/assets/v2/images/voorgevel_house_1789458929544.jpg'],
    cadDrawingType: 'voorgevel',
    notes: 'Begane grond voorgevel inclusief entreepartij en kozijnsparingen gecontroleerd.',
    kozijnen: [
      {
        id: 'koz-d1',
        code: 'D1',
        name: 'Voordeur Entree',
        category: 'Buitendeur',
        categories: ['Buitendeur'],
        width: 0.93,
        height: 2.11,
        area: 1.96,
        brandAndType: 'Geisoleerd',
        overstekBelemmering: '-',
        zonwering: '-',
        photoUrl: '/assets/v2/images/d1_front_door_1789458960163.jpg',
        photoUrls: ['/assets/v2/images/d1_front_door_1789458960163.jpg'],
        photoDescription: 'Geïsoleerde voordeur met centrale glasstrook en tochtprofielen'
      },
      {
        id: 'koz-d1w',
        code: 'D1W',
        name: 'Deurstrook Glas',
        category: 'Glasstrook',
        categories: ['Glasstrook / Vast glas'],
        width: 0.20,
        height: 1.40,
        area: 0.28,
        brandAndType: 'TripleHR Kunstof',
        overstekBelemmering: 'Geen',
        zonwering: 'Geen',
        photoUrl: '/assets/v2/images/d1w_window_frame_1789458987761.jpg',
        photoUrls: ['/assets/v2/images/d1w_window_frame_1789458987761.jpg'],
        photoDescription: 'Drievoudige beglazing met kunststof afstandhouder en rubberdichting'
      },
      {
        id: 'koz-w2',
        code: 'W2',
        name: 'Slaapkamer Raam 1e Verd.',
        category: 'Draai-kiepraam',
        categories: ['Raam (draai-kiep)'],
        width: 1.75,
        height: 1.40,
        area: 2.45,
        brandAndType: 'HR++ Kunststof',
        inputMethod: 'Decision Tree',
        insulationPresent: 'no',
        uValue: 1.4,
        overstekBelemmering: 'Geen',
        zonwering: 'Screens',
        photoUrl: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=600&q=80',
        photoUrls: ['https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=600&q=80'],
        photoDescription: 'Bovendorpel met ingebouwd ventilatierooster en HR++ beglazing'
      },
      {
        id: 'koz-w4',
        code: 'W4',
        name: 'Overloop Raam',
        category: 'Vast raam',
        categories: ['Vast raam'],
        width: 0.80,
        height: 1.15,
        area: 0.92,
        brandAndType: 'HR++ Kunststof',
        inputMethod: 'Decision Tree',
        insulationPresent: 'no',
        uValue: 1.4,
        overstekBelemmering: 'Geen',
        zonwering: 'Geen',
        photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        photoDescription: 'Vast raamkozijn overloop met HR++ isolatieglas'
      }
    ]
  },
  {
    id: 'facade-linker',
    title: 'Linkergevel',
    subTitle: 'Linergevel / Zijgevel links (Hoekligging)',
    code: 'GEV-03',
    construction: 'Metselwerk spouwmuur (na-geïsoleerd HR++ EPS parels, Rc= 3.80)',
    orientation: 'Zuid-Oost',
    level: 'BG + 1e Verdieping',
    boundary: 'Buitenlucht',
    formula: '8.50 m * 5.75 m = 48.88 m2',
    areaTotal: 48.88,
    kozijnListString: 'W11, W12',
    photoUrl: '/assets/v2/images/linkergevel_house_1789459010118.jpg',
    cadDrawingType: 'linkergevel',
    notes: 'Kopgevel hoekwoning voorzien van spouwmuurisolatie conform BRL 9500 dossier.',
    kozijnen: [
      {
        id: 'koz-w11',
        code: 'W11',
        name: 'Zijraam Begane Grond',
        category: 'Raam',
        categories: ['Raam'],
        width: 0.90,
        height: 1.50,
        area: 1.35,
        brandAndType: 'HR++ Kunststof',
        inputMethod: 'Decision Tree',
        insulationPresent: 'no',
        uValue: 1.4,
        overstekBelemmering: 'Geen',
        zonwering: 'Geen',
        photoUrl: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=600&q=80',
        photoDescription: 'Zijraam keuken/eetkamer met HR++ isolatieglas en spouwlat'
      },
      {
        id: 'koz-w12',
        code: 'W12',
        name: 'Zijraam Verdieping',
        category: 'Raam',
        categories: ['Raam'],
        width: 0.90,
        height: 1.50,
        area: 1.35,
        brandAndType: 'HR++ Kunststof',
        inputMethod: 'Decision Tree',
        insulationPresent: 'no',
        uValue: 1.4,
        overstekBelemmering: 'Geen',
        zonwering: 'Geen',
        photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        photoDescription: 'Zijgevelraam trapgat / overloop verdieping'
      }
    ]
  },
  {
    id: 'facade-rechter',
    title: 'Rechtergevel',
    subTitle: 'reachter gevel / Bouwmuur scheiding buurpand',
    code: 'GEV-04',
    construction: 'Kalkzandsteen ankerloze spouwmuur (Woningscheidend, Rc= 0.00)',
    orientation: 'Noord-West',
    level: 'BG + 1e Verdieping',
    boundary: 'Aangrenzend gebouw (AOR - Verwarmde belending Fintstraat 3)',
    formula: '8.50 m * 5.75 m = 48.88 m2',
    areaTotal: 48.88,
    kozijnListString: 'Geen (blinde bouwmuur)',
    photoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    cadDrawingType: 'rechtergevel',
    notes: 'Aangrenzende verwarmde tussenwand conform NTA 8800 §6.1. Geen transmissieverlies berekend.',
    kozijnen: []
  },
  {
    id: 'facade-achter',
    title: 'Achtergevel',
    subTitle: 'Tuinzijde & Schuifpui (Zuidwest)',
    code: 'GEV-02',
    construction: 'H2FOAM LITE (60 mm, Rc= 1.56) / Metselwerk na-geïsoleerd',
    orientation: 'Zuid-West',
    level: 'BG + 1e Verdieping',
    boundary: 'Buitenlucht (Achtertuin)',
    formula: '10.20 m * 5.75 m - kozijnen = 42.10 m2',
    areaTotal: 42.10,
    kozijnListString: 'D2, W21, W22',
    photoUrl: '/assets/v2/images/achtergevel_house_1789459032173.jpg',
    cadDrawingType: 'achtergevel',
    notes: 'Achtergevel voorzien van grote schuifpui en verdiepingsramen slaapkamers.',
    kozijnen: [
      {
        id: 'koz-d2',
        code: 'D2',
        name: 'Schuifpui Begane Grond',
        category: 'Schuifpui',
        categories: ['Schuifpui'],
        width: 2.70,
        height: 2.00,
        area: 5.40,
        brandAndType: 'HR++ Aluminium schuifpui met koudebrugonderbreking',
        overstekBelemmering: 'Overstek 0.60 m',
        zonwering: 'Knikarmscherm',
        photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        photoDescription: 'Grote driedelige schuifpui met HR++ isolatieglas naar achtertuin'
      },
      {
        id: 'koz-w21',
        code: 'W21',
        name: 'Slaapkamer Achter 1',
        category: 'Draai-kiepraam',
        categories: ['Raam (draai-kiep)'],
        width: 1.20,
        height: 1.50,
        area: 1.80,
        brandAndType: 'HR++ Kunststof draai-kiep',
        overstekBelemmering: 'Geen',
        zonwering: 'Rolluik',
        photoUrl: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=600&q=80',
        photoDescription: 'Draai-kiepraam voorzien van geïsoleerd rolluik'
      },
      {
        id: 'koz-w22',
        code: 'W22',
        name: 'Slaapkamer Achter 2',
        category: 'Draai-kiepraam',
        categories: ['Raam (draai-kiep)'],
        width: 1.20,
        height: 1.50,
        area: 1.80,
        brandAndType: 'HR++ Kunststof draai-kiep',
        overstekBelemmering: 'Geen',
        zonwering: 'Rolluik',
        photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        photoDescription: 'Verdiepingsraam achtergevel met HR++ veiligheidsglas'
      }
    ]
  }
];
