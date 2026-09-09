import { FieldConfig } from './InstallatiesSchema';

export const ConstructiesSchema: FieldConfig[] = [
  {
    id: 'invoer',
    label: 'INVOER',
    type: 'select',
    options: ['Beslisschema', 'Kwaliteitsverklaring'],
    defaultValue: 'Beslisschema',
    span: 2
  },
  {
    id: 'merk',
    label: 'MERK & TYPE',
    type: 'text',
    defaultValue: '',
    span: 2,
    showIf: (v) => v.invoer === 'Kwaliteitsverklaring'
  },
  {
    id: 'kozijn',
    label: 'KOZIJN',
    type: 'select',
    options: ['Hout', 'Kunststof', 'Metaal thermisch onderbroken', 'Metaal niet thermisch onderbroken'],
    defaultValue: 'Kunststof',
    span: 2,
    showIf: (v) => v.type === 'Raam' || v.type === 'Paneel'
  },
  {
    id: 'glas',
    label: 'GLAS',
    type: 'select',
    options: ['Enkel glas', 'Dubbel glas', 'HR glas', 'HR+ glas', 'HR++ glas', 'Triple (HR+++) glas'],
    defaultValue: 'HR++',
    span: 2,
    showIf: (v) => v.type === 'Raam'
  },
  {
    id: 'uNiet',
    label: 'U NIET-GRENZEND',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => v.type === 'Raam'
  },
  {
    id: 'uGren',
    label: 'U GRENZEND',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => v.type === 'Raam'
  },
  {
    id: 'isolatie',
    label: 'ISOLATIE AANWEZIG',
    type: 'select',
    options: ['Ja', 'Nee', 'Onbekend'],
    defaultValue: 'Ja',
    span: 2,
    showIf: (v) => v.type !== 'Raam'
  },
  {
    id: 'dikte',
    label: 'DIKTE',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => v.isolatie === 'Ja'
  },
  {
    id: 'bouwjaar',
    label: 'BOUWJAAR',
    type: 'text',
    defaultValue: '',
    span: 1,
    showIf: (v) => v.type !== 'Raam' && v.type !== 'Deur' && v.type !== 'Paneel'
  }
];
