import raw from './devTestUsers.json';
import type { UserRole } from '../types';

export type DevTestUserRecord = {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  hints: readonly string[];
};

type DevTestUsersFile = {
  version: number;
  description?: string;
  defaultPassword: string;
  users: Array<{
    email: string;
    password?: string;
    role: string;
    displayName: string;
    hints: string[];
  }>;
};

const file = raw as DevTestUsersFile;

function asUserRole(value: string): UserRole {
  return value as UserRole;
}

export const DEV_TEST_USERS: readonly DevTestUserRecord[] = file.users.map((u) => ({
  email: u.email.trim(),
  password: (u.password ?? file.defaultPassword).trim(),
  role: asUserRole(u.role),
  displayName: u.displayName.trim(),
  hints: u.hints.map((h) => h.trim().toLowerCase()).filter(Boolean),
}));

export function getDevTestUserByEmail(email: string): DevTestUserRecord | undefined {
  const key = email.trim().toLowerCase();
  return DEV_TEST_USERS.find((u) => u.email.toLowerCase() === key);
}

type Scored = { user: DevTestUserRecord; score: number };

/** Suggest demo accounts when the user types initials (e.g. cli → bewoner, beo → bewoner, int → intern). */
export function suggestDevTestUsers(query: string, limit = 6): DevTestUserRecord[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored: Scored[] = [];

  for (const user of DEV_TEST_USERS) {
    let best = 0;
    const local = user.email.split('@')[0]?.toLowerCase() ?? '';

    if (user.email.toLowerCase() === q) best = Math.max(best, 100);
    if (user.email.toLowerCase().startsWith(q)) best = Math.max(best, 80);
    if (local.startsWith(q)) best = Math.max(best, 70);

    for (const hint of user.hints) {
      if (hint === q) best = Math.max(best, 95);
      else if (hint.startsWith(q)) best = Math.max(best, 85);
      else if (q.length >= 3 && hint.includes(q)) best = Math.max(best, 50);
    }

    if (best > 0) scored.push({ user, score: best });
  }

  scored.sort((a, b) => b.score - a.score || a.user.email.localeCompare(b.user.email));
  const seen = new Set<string>();
  const out: DevTestUserRecord[] = [];
  for (const { user } of scored) {
    if (seen.has(user.email)) continue;
    seen.add(user.email);
    out.push(user);
    if (out.length >= limit) break;
  }
  return out;
}
