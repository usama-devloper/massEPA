import { UserRole } from '../types';
import doc from './actionListMassEpaUiItems.json';

/** Keys align with CSV columns Client / Intern / BO / Inspector */
export type UiQuestionRoleKey = 'client' | 'bidIntern' | 'backOffice' | 'inspector';

export type UiQuestionRoles = Record<UiQuestionRoleKey, boolean>;

export type UiQuestionItem = {
  order: number;
  section: string;
  category: string;
  question: string;
  roles: UiQuestionRoles;
};

export type ActionListUiDocument = {
  version: number;
  sourceFile: string;
  generatedAt: string;
  items: UiQuestionItem[];
};

export const ACTION_LIST_UI_DOCUMENT = doc as ActionListUiDocument;

export const ACTION_LIST_UI_ITEMS: readonly UiQuestionItem[] = ACTION_LIST_UI_DOCUMENT.items;

/** Stable id for checklist row `i` (matches regenerated JSON order). */
export function getActionListQuestionId(index: number): string {
  return `alist_${index}`;
}

export function getUiQuestionItemById(id: string): { index: number; item: UiQuestionItem } | undefined {
  const m = /^alist_(\d+)$/.exec(id);
  if (!m) return undefined;
  const index = Number(m[1]);
  const item = ACTION_LIST_UI_ITEMS[index];
  if (!item) return undefined;
  return { index, item };
}

/** Map UI insulation card title → category string as stored in CSV / JSON */
export function actionListCategoryForInsulationCard(uiCategory: string): string {
  const map: Record<string, string> = {
    'Gevel isolatie': 'Gevel isolatie',
    'Vloer isolatie': 'Vloer isolatie',
    'Dak isolatie': 'Dak isolatie',
    'Panelen isolatie': 'panelen isolatie',
  };
  return map[uiCategory] ?? uiCategory;
}

/**
 * Whether a checklist row applies to the role (same as JSON `roles.*`).
 * If no matching row is found, defaults to visible so the UI does not collapse unexpectedly.
 */
export function isActionListQuestionVisibleForRole(
  section: string,
  categoryCsv: string,
  question: string,
  role: UserRole,
): boolean {
  const roleKey = uiRoleKeyFromUserRole(role);
  const row = ACTION_LIST_UI_ITEMS.find(
    (i) => i.section === section && i.category === categoryCsv && i.question === question,
  );
  if (!row) return true;
  return row.roles[roleKey];
}

export function uiRoleKeyFromUserRole(role: UserRole): UiQuestionRoleKey {
  switch (role) {
    case UserRole.CLIENT:
      return 'client';
    case UserRole.BID_INTERN:
      return 'bidIntern';
    case UserRole.BACK_OFFICE:
      return 'backOffice';
    case UserRole.INSPECTOR:
      return 'inspector';
    default:
      return 'client';
  }
}

/** Questions visible for the given app role (Bewoner / Intern / Back Office / Inspector). */
export function getUiQuestionsForRole(role: UserRole): UiQuestionItem[] {
  const key = uiRoleKeyFromUserRole(role);
  return ACTION_LIST_UI_ITEMS.filter((row) => row.roles[key]);
}

export type UiSectionGroup = {
  section: string;
  categories: {
    category: string;
    questions: UiQuestionItem[];
  }[];
};

/** Nested view for section → category → questions (same row order as CSV). */
export function groupUiQuestionsBySection(items: readonly UiQuestionItem[]): UiSectionGroup[] {
  const sectionOrder: string[] = [];
  const map = new Map<string, Map<string, UiQuestionItem[]>>();

  for (const row of items) {
    if (!map.has(row.section)) {
      map.set(row.section, new Map());
      sectionOrder.push(row.section);
    }
    const catMap = map.get(row.section)!;
    if (!catMap.has(row.category)) {
      catMap.set(row.category, []);
    }
    catMap.get(row.category)!.push(row);
  }

  return sectionOrder.map((section) => {
    const catMap = map.get(section)!;
    const categories = [...catMap.keys()].map((category) => ({
      category,
      questions: catMap.get(category)!,
    }));
    return { section, categories };
  });
}
