import { Home, Headset, Monitor, Shield } from 'lucide-react';
import { UserRole } from './types';

export const ASSETS = {
  TECH_BG: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2IPCyIu5_d78lIayEcoKiPigg5jdGE0HrXiGhkqbG23s7Am12xN9AsD5WtIf0QgiHbDTnOlCFfEDThqVf21sFxnfFUa8fe232rGufj3asPvOa5lp5zI5-u4XvMTOlyNs3iH3OU-3dBUMhNy95y9GKyjBx_XkTFoz3NZshuLhV-cQdsHv8y8NPuR5UoTuPswQn1_N8eJJBk3-y9N9X9QGRF2mC91a3xJeU9FKelahDurmAmR4Len2mbTsTF8xQN2opdsyZx6tKQQA',
  SIDEBAR_ILLO: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZLrmtM9Qh3GSiN9_N6UwnRp9IuGY6xPYX6V5L8F3MYpIFayuhXndMjsB86NFNzOVB-nr28w6h2Ciu3ZlrPF2qgv4HwfGRhTNxo7EAVMN84G_nLrOt_z4gjmGMNN6kdhG2lMU2cTMIZ7boDYNPZOiQ83QF-QN_8YEyglY5DvPnkfXHkYtbLhKLY7yMNg1Lfibc3dMmfVbw91nncyTW44Ve1AKaK2Ss0EJMwQiLknmnGw8ZIfGmW3SQpoBrLNQhfllZvPZYujtrrBQ'
};

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
