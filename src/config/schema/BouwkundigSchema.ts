import { FieldConfig } from './InstallatiesSchema';

export const BouwkundigSchema: FieldConfig[] = [
  {
    id: 'gevel',
    label: 'GEVEL TYPE',
    type: 'select',
    optionsFn: (v) => {
      const standard = ['Voorgevel', 'Achtergevel', 'Linkergevel', 'Rechtergevel'];
      const current = v.gevel && v.gevel !== '-' && !standard.includes(v.gevel) ? v.gevel : null;
      return [...standard, ...(current ? [current] : []), 'Aangepaste Gevel', '-'];
    },
    defaultValue: '',
    span: 1,
    showIf: (v) => v.type === 'Gevel'
  },
  {
    id: 'orientation',
    label: 'ORIENTATION',
    type: 'select',
    options: ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW', 'Horizontaal', '-'],
    defaultValue: '',
    span: 1,
    showIf: (v) => v.type === 'Gevel' || v.type === 'Dak'
  },
  {
    id: 'grenstAan',
    label: 'GRENST AAN',
    type: 'select',
    optionsFn: (v) => {
      if (v.type === 'Gevel') return ['Buitenlucht', 'Andere woning', 'Onverwarmde ruimte', 'Grond', '-'];
      if (v.type === 'Vloer') return ['Kruipruimte', 'Grond', 'Buitenlucht', 'Onverwarmde kelder', '-'];
      if (v.type === 'Dak') return ['Buitenlucht', 'Onverwarmde ruimte', 'Andere woning', '-'];
      return ['Buitenlucht', '-'];
    },
    defaultValue: 'Buitenlucht',
    span: 1,
    showIf: (v) => ['Gevel', 'Vloer', 'Dak'].includes(v.type)
  },
  {
    id: 'breedte',
    label: 'BREEDTE (M)',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => ['Gevel', 'Vloer', 'Dak', 'Deur', 'Raam', 'Paneel'].includes(v.type) // Or maybe just don't conditionally hide if it's universal
  },
  {
    id: 'hoogte',
    label: 'HOOGTE (M)',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => ['Gevel', 'Vloer', 'Dak', 'Deur', 'Raam', 'Paneel'].includes(v.type)
  },
  {
    id: 'perimeter',
    label: 'PERIMETER (M)',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => v.type === 'Vloer'
  },
  {
    id: 'rc',
    label: 'RC WAARDE',
    type: 'text',
    defaultValue: '',
    span: 1,
    readonly: true,
    showIf: (v) => v.type === 'Vloer'
  },
  {
    id: 'oppervlakte',
    label: 'OPPERVLAKTE (M²)',
    type: 'text',
    defaultValue: '',
    span: 1
  },
  {
    id: 'hellingshoek',
    label: 'HELLINGSHOEK',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => v.type === 'Dak'
  }
];
