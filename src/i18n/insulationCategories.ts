/** Storage keys in localStorage — display via `t('insulation.categories.*')`. */
import type { LucideIcon } from 'lucide-react';
import {
  AlignVerticalSpaceAround,
  BrickWall,
  PanelsTopLeft,
  Triangle,
} from 'lucide-react';

export const INSULATION_CATEGORY_IDS = [
  'Gevel isolatie',
  'Vloer isolatie',
  'Dak isolatie',
  'Panelen isolatie',
] as const;

export type InsulationCategoryId = (typeof INSULATION_CATEGORY_IDS)[number];

export const INSULATION_CATEGORY_ICONS: Record<InsulationCategoryId, LucideIcon> = {
  'Gevel isolatie': BrickWall,
  'Vloer isolatie': AlignVerticalSpaceAround,
  'Dak isolatie': Triangle,
  'Panelen isolatie': PanelsTopLeft,
};

const CATEGORY_I18N_KEY: Record<InsulationCategoryId, string> = {
  'Gevel isolatie': 'insulation.categories.gevel',
  'Vloer isolatie': 'insulation.categories.vloer',
  'Dak isolatie': 'insulation.categories.dak',
  'Panelen isolatie': 'insulation.categories.panelen',
};

export function insulationCategoryLabel(
  id: InsulationCategoryId,
  t: (key: string) => string,
): string {
  return t(CATEGORY_I18N_KEY[id]);
}

const INSULATION_EXAMPLE_IMAGES: Record<InsulationCategoryId, string> = {
  'Gevel isolatie': '/images/examples/insulation/gevel.jpg',
  'Vloer isolatie': '/images/examples/insulation/vloer.jpg',
  'Dak isolatie': '/images/examples/insulation/dak.jpg',
  'Panelen isolatie': '/images/examples/insulation/panelen.jpg',
};

export function insulationExampleImageUrl(categoryId: string): string | undefined {
  if (!(categoryId in INSULATION_EXAMPLE_IMAGES)) return undefined;
  return INSULATION_EXAMPLE_IMAGES[categoryId as InsulationCategoryId];
}
