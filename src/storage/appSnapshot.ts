import { Step, UserRole, type FormData } from '../types';
import { idbGet, idbPut } from './idbKv';

export const APP_SNAPSHOT_IDB_KEY = 'appSnapshot_v1';
/** Legacy key — migrated once into IndexedDB */
export const LEGACY_FORM_LOCALSTORAGE_KEY = 'buildingID_formData';

export type AppSnapshotV1 = {
  v: 1;
  updatedAt: number;
  session: {
    isLoggedIn: boolean;
    loggedInUser: string;
    currentStep: Step;
    selectedRole: UserRole;
  };
  /** Last email used on mock sign-in (never store passwords). */
  lastLoginEmail: string;
  profile: FormData;
  building: {
    renovationStatus: string;
    renovationYear: string;
    bouwjaar: string;
    floorArea: string;
    vloerenType: string;
    wandenType: string;
    gboT: string;
    leidingdoorvoeren: string;
    avr: string;
    buurt: string;
    wijk: string;
    gemeente: string;
    gebouwhoogte: string;
    hasFloorPlans: boolean | null;
  };
};

const stepValues = new Set<string>(Object.values(Step));
const roleValues = new Set<string>(Object.values(UserRole));

function coerceStep(value: unknown): Step {
  if (typeof value === 'string') {
    if (value === 'PHOTOS') return Step.PHOTO_CAPTURE;
    if (value === 'Foto buiten') return Step.PHOTO_CAPTURE;
    if (value === 'Foto binnen') return Step.PHOTO_INTERIOR;
    if (value === 'Eindcontrole') return Step.FINAL_REVIEW;
    if (stepValues.has(value)) return value as Step;
  }
  return Step.LOGIN;
}

function coerceRole(value: unknown): UserRole {
  if (typeof value === 'string' && roleValues.has(value)) return value as UserRole;
  return UserRole.CLIENT;
}

function defaultProfile(): FormData {
  return { fullName: '', phoneNumber: '', email: '', address: '' };
}

function defaultBuilding(): AppSnapshotV1['building'] {
  return {
    renovationStatus: 'Nee',
    renovationYear: '',
    bouwjaar: '',
    floorArea: '',
    vloerenType: 'Licht',
    wandenType: 'Licht',
    gboT: '',
    leidingdoorvoeren: '',
    avr: '',
    buurt: '',
    wijk: '',
    gemeente: '',
    gebouwhoogte: '',
    hasFloorPlans: true,
  };
}

export function createDefaultSnapshot(): AppSnapshotV1 {
  return {
    v: 1,
    updatedAt: Date.now(),
    session: {
      isLoggedIn: false,
      loggedInUser: '',
      currentStep: Step.LOGIN,
      selectedRole: UserRole.CLIENT,
    },
    lastLoginEmail: '',
    profile: defaultProfile(),
    building: defaultBuilding(),
  };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function reviveSnapshot(raw: unknown): AppSnapshotV1 | null {
  if (!isRecord(raw) || raw.v !== 1) return null;
  const session = isRecord(raw.session) ? raw.session : {};
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const building = isRecord(raw.building) ? raw.building : {};

  const base = createDefaultSnapshot();
  return {
    v: 1,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    session: {
      isLoggedIn: Boolean(session.isLoggedIn),
      loggedInUser: typeof session.loggedInUser === 'string' ? session.loggedInUser : '',
      currentStep: coerceStep(session.currentStep),
      selectedRole: coerceRole(session.selectedRole),
    },
    lastLoginEmail: typeof raw.lastLoginEmail === 'string' ? raw.lastLoginEmail : '',
    profile: {
      ...base.profile,
      fullName: typeof profile.fullName === 'string' ? profile.fullName : '',
      phoneNumber: typeof profile.phoneNumber === 'string' ? profile.phoneNumber : '',
      email: typeof profile.email === 'string' ? profile.email : '',
      address: typeof profile.address === 'string' ? profile.address : '',
      companyName: typeof profile.companyName === 'string' ? profile.companyName : undefined,
      inspectorName: typeof profile.inspectorName === 'string' ? profile.inspectorName : undefined,
      certificaathouder: typeof profile.certificaathouder === 'string' ? profile.certificaathouder : undefined,
      profilePhoto: typeof profile.profilePhoto === 'string' ? profile.profilePhoto : undefined,
    },
    building: {
      renovationStatus: typeof building.renovationStatus === 'string' ? building.renovationStatus : base.building.renovationStatus,
      renovationYear: typeof building.renovationYear === 'string' ? building.renovationYear : '',
      bouwjaar: typeof building.bouwjaar === 'string' ? building.bouwjaar : '',
      floorArea: typeof building.floorArea === 'string' ? building.floorArea : '',
      vloerenType: typeof building.vloerenType === 'string' ? building.vloerenType : base.building.vloerenType,
      wandenType: typeof building.wandenType === 'string' ? building.wandenType : base.building.wandenType,
      gboT: typeof building.gboT === 'string' ? building.gboT : '',
      leidingdoorvoeren: typeof building.leidingdoorvoeren === 'string' ? building.leidingdoorvoeren : '',
      avr: typeof building.avr === 'string' ? building.avr : '',
      buurt: typeof building.buurt === 'string' ? building.buurt : '',
      wijk: typeof building.wijk === 'string' ? building.wijk : '',
      gemeente: typeof building.gemeente === 'string' ? building.gemeente : '',
      gebouwhoogte: typeof building.gebouwhoogte === 'string' ? building.gebouwhoogte : '',
      hasFloorPlans:
        building.hasFloorPlans === true || building.hasFloorPlans === false ? building.hasFloorPlans : null,
    },
  };
}

/** One-time migration from `buildingID_formData` in localStorage. */
function readLegacyProfile(): Partial<FormData> | null {
  try {
    const raw = localStorage.getItem(LEGACY_FORM_LOCALSTORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    return parsed as Partial<FormData>;
  } catch {
    return null;
  }
}

export async function loadAppSnapshot(): Promise<AppSnapshotV1> {
  const raw = await idbGet<unknown>(APP_SNAPSHOT_IDB_KEY);
  const revived = raw ? reviveSnapshot(raw) : null;
  if (revived) return revived;

  const snap = createDefaultSnapshot();
  const legacy = readLegacyProfile();
  if (legacy) {
    snap.profile = { ...snap.profile, ...legacy };
    try {
      localStorage.removeItem(LEGACY_FORM_LOCALSTORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  await idbPut(APP_SNAPSHOT_IDB_KEY, snap);
  return snap;
}

export async function saveAppSnapshot(snapshot: AppSnapshotV1): Promise<void> {
  const next: AppSnapshotV1 = { ...snapshot, updatedAt: Date.now() };
  await idbPut(APP_SNAPSHOT_IDB_KEY, next);
}
