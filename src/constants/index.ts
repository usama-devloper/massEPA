// src/constants/index.ts
import { Home, Headset, Monitor, Shield } from 'lucide-react';
import { UserRole, AddressSuggestion } from '../types';

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
    id: 1,
    fullAddress: 'Admiraal De Ruijterweg 315-3, 1055 LX Amsterdam, Erasmusparkbuurt-Oost',
    street: 'Admiraal De Ruijterweg',
    houseNumber: '315-3',
    postalCode: '1055 LX',
    city: 'Amsterdam',
    neighborhood: 'Erasmusparkbuurt-Oost'
  },
  {
    id: 2,
    fullAddress: 'Irenelaan 2, 2421 CK Nieuwkoop, Nieuwkoop',
    street: 'Irenelaan',
    houseNumber: '2',
    postalCode: '2421 CK',
    city: 'Nieuwkoop',
    neighborhood: 'Nieuwkoop'
  },
  {
    id: 3,
    fullAddress: 'Hagelingerweg 277, 2071 CH Santpoort-Noord, Kerkpadbuurt',
    street: 'Hagelingerweg',
    houseNumber: '277',
    postalCode: '2071 CH',
    city: 'Santpoort-Noord',
    neighborhood: 'Kerkpadbuurt'
  },
  {
    id: 4,
    fullAddress: 'Surinamestraat 123, 3531 KK Utrecht, Laan van Nieuw-Guinea, Spinozaweg e.o.',
    street: 'Surinamestraat',
    houseNumber: '123',
    postalCode: '3531 KK',
    city: 'Utrecht',
    neighborhood: 'Laan van Nieuw-Guinea, Spinozaweg e.o.'
  },
  {
    id: 5,
    fullAddress: 'Schobbertsweg 9, 8166 KK Emst, Buitengebied Emst',
    street: 'Schobbertsweg',
    houseNumber: '9',
    postalCode: '8166 KK',
    city: 'Emst',
    neighborhood: 'Buitengebied Emst'
  }
];

export const ASSETS = {
  LOGO: '/logo.png', // Place your logo in public/logo.png
  TECH_BG: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2IPCyIu5_d78lIayEcoKiPigg5jdGE0HrXiGhkqbG23s7Am12xN9AsD5WtIf0QgiHbDTnOlCFfEDThqVf21sFxnfFUa8fe232rGufj3asPvOa5lp5zI5-u4XvMTOlyNs3iH3OU-3dBUMhNy95y9GKyjBx_XkTFoz3NZshuLhV-cQdsHv8y8NPuR5UoTuPswQn1_N8eJJBk3-y9N9X9QGRF2mC91a3xJeU9FKelahDurmAmR4Len2mbTsTF8xQN2opdsyZx6tKQQA',
};