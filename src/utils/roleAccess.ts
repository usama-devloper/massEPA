import { UserRole } from '../types';

/** BID Intern, Back Office, and Inspector can open the clients management area. */
export function canManageClients(role: UserRole): boolean {
  return (
    role === UserRole.BID_INTERN ||
    role === UserRole.BACK_OFFICE ||
    role === UserRole.INSPECTOR
  );
}
