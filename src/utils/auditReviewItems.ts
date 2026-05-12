import { Step, UserRole } from '../types';
import type { TranslateFn } from '../context/LanguageContext';
import { HOUSE_DESIGN_PAGE_STORAGE_KEY } from '../storage/houseDesignPageData';

export type AuditReviewItem = {
  title: string;
  description: string;
  complete: boolean;
  actionLabel: string;
  targetStep: Step;
};

type InsulationSpecs = Record<string, { material: string; thickness: string }>;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getConstructieDescription(
  isolatieStatus: boolean | null,
  insulationSpecs: InsulationSpecs,
  doorIsolated: boolean | null,
  selectedRole: UserRole,
  t: TranslateFn,
): string {
  if (isolatieStatus === null) return t('finalReview.items.constructie.descriptionNotSelected');
  if (isolatieStatus === false) return t('finalReview.items.constructie.descriptionVerified');

  const hasSpecs = Object.values(insulationSpecs).some(
    (spec) => spec.material.trim() !== '' && spec.thickness.trim() !== '',
  );
  const needsDoor =
    selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR;

  const missing: string[] = [];
  if (!hasSpecs) missing.push(t('finalReview.items.constructie.missingSpecs'));
  if (needsDoor && doorIsolated === null) missing.push(t('finalReview.items.constructie.missingDoor'));

  if (missing.length === 0) return t('finalReview.items.constructie.descriptionVerified');
  return t('finalReview.items.constructie.descriptionMissing', { items: missing.join(', ') });
}

export function buildAuditReviewItems(
  input: {
    bouwjaar: string;
    buurt: string;
    wijk: string;
    gemeente: string;
    hasFloorPlans: boolean | null;
    selectedRole: UserRole;
  },
  t: TranslateFn,
): AuditReviewItem[] {
  const upload = readJson<{
    files?: unknown[];
    hasInsulation?: boolean | null;
  }>(HOUSE_DESIGN_PAGE_STORAGE_KEY);

  const photos = readJson<{
    exterior?: { front?: unknown[]; back?: unknown[]; side?: unknown[] };
  }>('massEPA_photos_v1');

  const installatie = readJson<{
    ventilationCo2?: boolean | null;
    heatingLocation?: string;
    solarPanels?: boolean | null;
  }>('massEPA_installatie_v1');

  const insulation = readJson<{
    insulationSpecs?: InsulationSpecs;
    doorIsolated?: boolean | null;
  }>('massEPA_insulation_v1');

  const isolatieStatus = upload?.hasInsulation ?? null;
  const insulationSpecs = insulation?.insulationSpecs ?? {};
  const doorIsolated = insulation?.doorIsolated ?? null;

  const isVerificationComplete = true;
  const isAlgemeenComplete = Boolean(
    input.bouwjaar.trim() && input.buurt.trim() && input.wijk.trim() && input.gemeente.trim(),
  );
  const isDrawingComplete =
    input.hasFloorPlans === false || (upload?.files?.length ?? 0) > 0;

  const isConstructieComplete =
    isolatieStatus === false ||
    (isolatieStatus === true &&
      Object.values(insulationSpecs).some(
        (spec) => spec.material.trim() !== '' && spec.thickness.trim() !== '',
      ) &&
      (input.selectedRole !== UserRole.BACK_OFFICE && input.selectedRole !== UserRole.INSPECTOR
        ? true
        : doorIsolated !== null));

  const isInstallatieComplete =
    installatie?.ventilationCo2 != null &&
    Boolean(installatie?.heatingLocation?.trim()) &&
    installatie?.solarPanels != null;

  const front = photos?.exterior?.front?.length ?? 0;
  const back = photos?.exterior?.back?.length ?? 0;
  const isPhotoComplete = front > 0 && back > 0;

  const constructieDescription = isConstructieComplete
    ? t('finalReview.items.constructie.descriptionVerified')
    : getConstructieDescription(isolatieStatus, insulationSpecs, doorIsolated, input.selectedRole, t);

  return [
    {
      title: t('finalReview.items.verification.title'),
      description: t('finalReview.items.verification.description'),
      complete: isVerificationComplete,
      actionLabel: t('finalReview.items.verification.action'),
      targetStep: Step.ALGEMEEN,
    },
    {
      title: t('finalReview.items.algemeen.title'),
      description: t('finalReview.items.algemeen.description'),
      complete: isAlgemeenComplete,
      actionLabel: t('finalReview.items.algemeen.action'),
      targetStep: Step.ALGEMEEN,
    },
    {
      title: t('finalReview.items.drawing.title'),
      description: t('finalReview.items.drawing.description'),
      complete: isDrawingComplete,
      actionLabel: t('finalReview.items.drawing.action'),
      targetStep: Step.UPLOAD,
    },
    {
      title: t('finalReview.items.constructie.title'),
      description: constructieDescription,
      complete: isConstructieComplete,
      actionLabel: t('finalReview.items.constructie.action'),
      targetStep: Step.INSULATION_DETAILS,
    },
    {
      title: t('finalReview.items.installatie.title'),
      description: t('finalReview.items.installatie.description'),
      complete: isInstallatieComplete,
      actionLabel: t('finalReview.items.installatie.action'),
      targetStep: Step.INSTALLATIE,
    },
    {
      title: t('finalReview.items.photo.title'),
      description: t('finalReview.items.photo.description'),
      complete: isPhotoComplete,
      actionLabel: t('finalReview.items.photo.action'),
      targetStep: Step.PHOTO_CAPTURE,
    },
  ];
}
