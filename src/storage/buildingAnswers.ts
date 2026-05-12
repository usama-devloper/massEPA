import type { FormData } from '../types';
import { idbGet, idbPut } from './idbKv';
import { ACTION_LIST_UI_DOCUMENT } from '../data/actionListMassEpaUiItems';
import type { AppSnapshotV1 } from './appSnapshot';

export type BuildingSnapshot = AppSnapshotV1['building'];

/** Values keyed by stable checklist id (`alist_${index}`) or free-form keys. */
export type ChecklistAnswers = Record<string, string | number | boolean | null | string[]>;

export type BuildingAnswersDocV1 = {
  v: 1;
  addressKey: string;
  addressDisplay: string;
  actionListVersion: number;
  updatedAt: number;
  lastEditedByEmail: string;
  lastEditedByName: string;
  building: BuildingSnapshot;
  /** Checklist-aligned answers; keys typically `alist_${index}` from action list */
  answers: ChecklistAnswers;
  /** Minimal profile for audit trail (who last touched this address) */
  profileHint?: Pick<FormData, 'fullName' | 'email' | 'phoneNumber'>;
};

const PREFIX = 'buildingAnswers:v1:';

export function normalizeAddressKey(address: string): string {
  const t = address.trim().toLowerCase().replace(/\s+/g, ' ');
  return t
    .replace(/[^a-z0-9\s\-_,.]/gi, '_')
    .replace(/\s+/g, '_')
    .slice(0, 240);
}

export function buildingAnswersIdbKey(addressKey: string): string {
  return `${PREFIX}${addressKey}`;
}

export async function loadBuildingAnswersDoc(address: string): Promise<BuildingAnswersDocV1 | null> {
  const key = normalizeAddressKey(address);
  if (!key) return null;
  const raw = await idbGet<unknown>(buildingAnswersIdbKey(key));
  if (!raw || typeof raw !== 'object' || (raw as BuildingAnswersDocV1).v !== 1) return null;
  return raw as BuildingAnswersDocV1;
}

export async function saveBuildingAnswersDoc(doc: BuildingAnswersDocV1): Promise<void> {
  const next: BuildingAnswersDocV1 = {
    ...doc,
    updatedAt: Date.now(),
    actionListVersion: ACTION_LIST_UI_DOCUMENT.version,
  };
  await idbPut(buildingAnswersIdbKey(next.addressKey), next);
}

export async function mergeBuildingAnswersDoc(
  address: string,
  patch: Partial<Pick<BuildingAnswersDocV1, 'building' | 'answers' | 'profileHint'>> & {
    lastEditedByEmail: string;
    lastEditedByName: string;
  },
): Promise<void> {
  const addressKey = normalizeAddressKey(address);
  if (!addressKey) return;

  const existing = (await loadBuildingAnswersDoc(address)) ?? {
    v: 1,
    addressKey,
    addressDisplay: address.trim(),
    actionListVersion: ACTION_LIST_UI_DOCUMENT.version,
    updatedAt: Date.now(),
    lastEditedByEmail: patch.lastEditedByEmail,
    lastEditedByName: patch.lastEditedByName,
    building: patch.building ?? {
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
      hasFloorPlans: null,
    },
    answers: {},
  };

  const merged: BuildingAnswersDocV1 = {
    ...existing,
    addressDisplay: address.trim() || existing.addressDisplay,
    lastEditedByEmail: patch.lastEditedByEmail,
    lastEditedByName: patch.lastEditedByName,
    building: patch.building ? { ...existing.building, ...patch.building } : existing.building,
    answers: patch.answers ? { ...existing.answers, ...patch.answers } : existing.answers,
    profileHint: patch.profileHint ? { ...existing.profileHint, ...patch.profileHint } : existing.profileHint,
    actionListVersion: ACTION_LIST_UI_DOCUMENT.version,
    updatedAt: Date.now(),
  };

  await saveBuildingAnswersDoc(merged);
}

/** Merge a single checklist answer (`alist_${index}`) for an address. */
export async function setChecklistAnswerForAddress(
  address: string,
  questionId: string,
  value: string | number | boolean | null,
  editor: { email: string; name: string },
): Promise<void> {
  await mergeBuildingAnswersDoc(address, {
    answers: { [questionId]: value },
    lastEditedByEmail: editor.email,
    lastEditedByName: editor.name,
  });
}
