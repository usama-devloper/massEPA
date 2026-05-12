// src/constants.ts
import { Home, Headset, Monitor, Shield } from 'lucide-react';
import { UserRole, AddressSuggestion } from './types';

export const ROLE_CONFIG = {
  [UserRole.CLIENT]: {
    icon: Home,
    description: 'Request and manage energy labels for your residential property portfolio.',
    color: 'bg-primary-container',
  },
  [UserRole.BID_INTERN]: {
    icon: Headset,
    description: 'Internal support and data validation for building identification processes.',
    color: 'bg-surface-container-highest',
  },
  [UserRole.BACK_OFFICE]: {
    icon: Monitor,
    description: 'Administrative oversight, data management, and operational controls.',
    color: 'bg-surface-container-highest',
  },
  [UserRole.INSPECTOR]: {
    icon: Shield,
    description: 'Conduct on-site evaluations and formal energy audits for buildings.',
    color: 'bg-surface-container-highest',
  },
};

export const SAMPLE_ADDRESSES: AddressSuggestion[] = [
  {
    id: '1',
    fullAddress: 'Admiraal De Ruijterweg 315-3, 1055 LX Amsterdam, Erasmusparkbuurt-Oost',
    street: 'Admiraal De Ruijterweg',
    houseNumber: '315-3',
    postalCode: '1055 LX',
    city: 'Amsterdam',
    neighborhood: 'Erasmusparkbuurt-Oost'
  },
  {
    id: '2',
    fullAddress: 'Irenelaan 2, 2421 CK Nieuwkoop, Nieuwkoop',
    street: 'Irenelaan',
    houseNumber: '2',
    postalCode: '2421 CK',
    city: 'Nieuwkoop',
    neighborhood: 'Nieuwkoop'
  },
  {
    id: '3',
    fullAddress: 'Hagelingerweg 277, 2071 CH Santpoort-Noord, Kerkpadbuurt',
    street: 'Hagelingerweg',
    houseNumber: '277',
    postalCode: '2071 CH',
    city: 'Santpoort-Noord',
    neighborhood: 'Kerkpadbuurt'
  },
  {
    id: '4',
    fullAddress: 'Surinamestraat 123, 3531 KK Utrecht, Laan van Nieuw-Guinea, Spinozaweg e.o.',
    street: 'Surinamestraat',
    houseNumber: '123',
    postalCode: '3531 KK',
    city: 'Utrecht',
    neighborhood: 'Laan van Nieuw-Guinea, Spinozaweg e.o.'
  },
  {
    id: '5',
    fullAddress: 'Schobbertsweg 9, 8166 KK Emst, Buitengebied Emst',
    street: 'Schobbertsweg',
    houseNumber: '9',
    postalCode: '8166 KK',
    city: 'Emst',
    neighborhood: 'Buitengebied Emst'
  }
];

export const ASSETS = {
  LOGO: '/logo.png',
};

/** From `buildingid _14052026/src/constants.ts` (INTERIOR_ROOMS). `icon` matches reference ICON_MAP keys. */
export const INTERIOR_ROOMS = [
  { id: 'hal', name: 'Hal', subtitle: 'Entrance', icon: 'DoorClosed' },
  { id: 'meterkast', name: 'Meterkast', subtitle: 'Utility Box', icon: 'Zap' },
  { id: 'woonkamer', name: 'Woonkamer', subtitle: 'Living Room', icon: 'Sofa' },
  { id: 'keuken', name: 'Keuken', subtitle: 'Kitchen', icon: 'Utensils' },
  { id: 'wc', name: 'WC', subtitle: 'Toilet', icon: 'Accessibility' },
  { id: 'technische_ruimte', name: 'Technische Ruimte', subtitle: 'Technical Room', icon: 'SettingsIcon' },
  { id: 'badkamer', name: 'Badkamer', subtitle: 'Bathroom', icon: 'Bath' },
  { id: 'slaapkamer', name: 'Slaapkamer', subtitle: 'Bedroom', icon: 'Bed' },
  { id: 'luik', name: 'Luik', subtitle: 'Hatch / Trap', icon: 'DoorOpen' },
  { id: 'algemeen', name: 'Algemeen', subtitle: 'General Area', icon: 'LayoutGrid' },
  { id: 'roof', name: 'Roof', subtitle: 'Exterior Roof', icon: 'Home' },
];

/** From `buildingid _14052026/src/constants.ts` (ROOM_SUB_CATEGORIES). */
export const ROOM_SUB_CATEGORIES: { [key: string]: { label: string; detail: string }[] } = {
  hal: [
    { label: 'Door', detail: 'Main entrance security door' },
    { label: 'Window', detail: 'Entrance hall sidelight' },
  ],
  meterkast: [{ label: 'mk', detail: 'Meter cupboard overview' }],
  woonkamer: [
    { label: 'Full room view', detail: 'Panoramic overview of the area' },
    { label: 'Window(s)', detail: 'Living area facade glazing' },
    { label: 'Heating control panel', detail: 'Thermostat or zone control' },
    { label: 'Ventilation panel', detail: 'CO2 or mechanical vents' },
  ],
  keuken: [
    { label: 'Window', detail: 'Kitchen area natural lighting' },
    { label: 'CO₂ sensor (if available)', detail: 'Indoor air quality monitoring' },
  ],
  wc: [{ label: 'Windows', detail: 'Small frosted glass units' }],
  technische_ruimte: [
    { label: 'Any installed systems', detail: 'Heat pumps, boilers, or storage' },
  ],
  badkamer: [
    { label: 'Window', detail: 'Bathroom ventilation window' },
    { label: 'Heating system (afgiftesysteem)', detail: 'Radiator or underfloor manifold' },
  ],
  slaapkamer: [
    { label: 'Window', detail: 'Bedroom exterior window' },
    { label: 'Heating system (Panel / afgiftesysteem)', detail: 'Room heating unit' },
  ],
  luik: [
    {
      label: 'Floor isolation (Use measure tape to show thickness)',
      detail: 'Evidence of crawl space insulation',
    },
  ],
  algemeen: [
    {
      label: 'Any additional relevant elements not covered above',
      detail: 'Miscellaneous technical features',
    },
  ],
  roof: [
    { label: 'Ventilatie outdoor (If any)', detail: 'Roof ventilation outlets' },
    { label: 'Zonne-panelen (Close)', detail: 'Solar array inspection' },
    { label: 'Text box (Size of zonne-panel)', detail: 'Specify size in m²' },
  ],
};

export const PHOTO_EXTERIOR_VIEWS = ['Front', 'Back', 'Side'] as const;
export type PhotoExteriorView = (typeof PHOTO_EXTERIOR_VIEWS)[number];

/** UI checklist from `Action List_massEPA - UI items.csv` (regenerate with `npm run generate:ui-questions`). */
export {
  ACTION_LIST_UI_DOCUMENT,
  ACTION_LIST_UI_ITEMS,
  getUiQuestionsForRole,
  groupUiQuestionsBySection,
  uiRoleKeyFromUserRole,
  type ActionListUiDocument,
  type UiQuestionItem,
  type UiQuestionRoleKey,
  type UiSectionGroup,
} from './data/actionListMassEpaUiItems';