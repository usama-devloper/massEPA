import type { FormData } from '../types';
import { idbGet, idbPut } from './idbKv';
import { mergeBuildingAnswersDoc } from './buildingAnswers';

export type ClientRecord = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type ClientsRegistryV1 = {
  v: 1;
  updatedAt: number;
  clients: ClientRecord[];
};

const REGISTRY_KEY = 'clientsRegistry:v1';

function newId(): string {
  return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_CLIENTS: ClientRecord[] = [
  {
    id: 'cli_mock1',
    fullName: 'J. de Vries',
    email: 'j.devries@email.com',
    phoneNumber: '06-12345678',
    address: 'Hoofdstraat 123 Amsterdam',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'cli_mock2',
    fullName: 'M. Janssen',
    email: 'm.janssen@example.com',
    phoneNumber: '06-87654321',
    address: 'Kerkstraat 45 Utrecht',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'cli_mock3',
    fullName: 'G. Bakhuizen',
    email: 'g.bakhuizen@planet.nl',
    phoneNumber: '06-99887766',
    address: 'Dorpsstraat 8 Haarlem',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  }
];

export function createEmptyRegistry(): ClientsRegistryV1 {
  return { v: 1, updatedAt: Date.now(), clients: MOCK_CLIENTS };
}

export async function loadClientsRegistry(): Promise<ClientsRegistryV1> {
  const raw = await idbGet<unknown>(REGISTRY_KEY);
  if (!raw || typeof raw !== 'object' || (raw as ClientsRegistryV1).v !== 1) {
    const seeded = { v: 1 as const, updatedAt: Date.now(), clients: MOCK_CLIENTS };
    await idbPut(REGISTRY_KEY, seeded);
    return seeded;
  }
  const doc = raw as ClientsRegistryV1;
  return {
    v: 1,
    updatedAt: typeof doc.updatedAt === 'number' ? doc.updatedAt : Date.now(),
    clients: Array.isArray(doc.clients) && doc.clients.length > 0 ? doc.clients : MOCK_CLIENTS,
  };
}

async function saveRegistry(registry: ClientsRegistryV1): Promise<void> {
  await idbPut(REGISTRY_KEY, { ...registry, updatedAt: Date.now() });
}

export type ClientInput = Pick<ClientRecord, 'fullName' | 'email' | 'phoneNumber' | 'address'>;

export async function addClient(input: ClientInput): Promise<ClientRecord> {
  const registry = await loadClientsRegistry();
  const now = Date.now();
  const client: ClientRecord = {
    id: newId(),
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phoneNumber: input.phoneNumber.trim(),
    address: input.address.trim(),
    createdAt: now,
    updatedAt: now,
  };
  registry.clients = [client, ...registry.clients];
  await saveRegistry(registry);
  return client;
}

export async function updateClient(id: string, input: ClientInput): Promise<ClientRecord | null> {
  const registry = await loadClientsRegistry();
  const idx = registry.clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const prev = registry.clients[idx];
  const next: ClientRecord = {
    ...prev,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phoneNumber: input.phoneNumber.trim(),
    address: input.address.trim(),
    updatedAt: Date.now(),
  };
  registry.clients = [...registry.clients.slice(0, idx), next, ...registry.clients.slice(idx + 1)];
  await saveRegistry(registry);
  return next;
}

export async function deleteClient(id: string): Promise<boolean> {
  const registry = await loadClientsRegistry();
  const before = registry.clients.length;
  registry.clients = registry.clients.filter((c) => c.id !== id);
  if (registry.clients.length === before) return false;
  await saveRegistry(registry);
  return true;
}

export async function getClientById(id: string): Promise<ClientRecord | null> {
  const registry = await loadClientsRegistry();
  return registry.clients.find((c) => c.id === id) ?? null;
}

/** Persist profile hint on the address dossier when saving a client. */
export async function syncClientToBuildingDoc(
  client: ClientRecord,
  editor: { email: string; name: string },
): Promise<void> {
  if (!client.address.trim()) return;
  const profile: Pick<FormData, 'fullName' | 'email' | 'phoneNumber'> = {
    fullName: client.fullName,
    email: client.email,
    phoneNumber: client.phoneNumber,
  };
  await mergeBuildingAnswersDoc(client.address, {
    profileHint: profile,
    lastEditedByEmail: editor.email,
    lastEditedByName: editor.name,
  });
}
