import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Building2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { BackToTop } from '../components/common/BackToTop';
import { PageBackLink } from '../components/common/PageBackLink';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import { Step, UserRole, type FormData } from '../types';
import {
  addClient,
  deleteClient,
  loadClientsRegistry,
  syncClientToBuildingDoc,
  updateClient,
  type ClientRecord,
  type ClientInput,
} from '../storage/clientsRegistry';
import { loadBuildingAnswersDoc, type BuildingAnswersDocV1 } from '../storage/buildingAnswers';
import type { AppSnapshotV1 } from '../storage/appSnapshot';

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
    hasFloorPlans: null,
  };
}

function filledBuildingCount(building: AppSnapshotV1['building']): { filled: number; total: number } {
  const fields: Array<string | boolean | null | undefined> = [
    building.renovationStatus,
    building.renovationYear,
    building.bouwjaar,
    building.floorArea,
    building.vloerenType,
    building.wandenType,
    building.gboT,
    building.leidingdoorvoeren,
    building.avr,
    building.buurt,
    building.wijk,
    building.gemeente,
    building.gebouwhoogte,
  ];
  const total = fields.length;
  const filled =
    fields.filter((v) => typeof v === 'string' ? v.trim().length > 0 : Boolean(v)).length;
  return { filled, total };
}

type ClientForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
};

function emptyForm(): ClientForm {
  return { fullName: '', email: '', phoneNumber: '', address: '' };
}

function formFromClient(c: ClientRecord): ClientForm {
  return {
    fullName: c.fullName,
    email: c.email,
    phoneNumber: c.phoneNumber,
    address: c.address,
  };
}

function buildingFromDoc(doc: BuildingAnswersDocV1 | null | undefined): AppSnapshotV1['building'] {
  return doc?.building ?? defaultBuilding();
}

interface ClientsPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
  editorEmail: string;
  onOpenClientDossier: (profile: FormData, building: AppSnapshotV1['building']) => void;
  profilePhoto?: string;
}

export function ClientsPage({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
  editorEmail,
  onOpenClientDossier,
  profilePhoto,
}: ClientsPageProps) {
  const { toast, setToast, showToast } = useToast();
  const { locale, t } = useLanguage();
  const dateLocale = locale === 'nl' ? 'nl-NL' : 'en-GB';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view');
  const [form, setForm] = useState<ClientForm>(emptyForm());
  const [dossier, setDossier] = useState<{
    hasBuilding: boolean;
    updatedAt?: number;
    lastEditorName?: string;
    filled: { filled: number; total: number };
    building: AppSnapshotV1['building'];
  } | null>(null);

  const canSee = useMemo(() => {
    return selectedRole === UserRole.BID_INTERN || selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR;
  }, [selectedRole]);

  const refreshClients = useCallback(async () => {
    const reg = await loadClientsRegistry();
    setClients(reg.clients);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void refreshClients().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshClients]);

  const selected = useMemo(() => clients.find((c) => c.id === selectedId) ?? null, [clients, selectedId]);

  // Load dossier meta for selected client
  useEffect(() => {
    if (!selected) {
      setDossier(null);
      return;
    }
    let cancelled = false;
    const addr = selected.address;
    void loadBuildingAnswersDoc(addr).then((doc) => {
      if (cancelled) return;
      const building = buildingFromDoc(doc);
      const filled = filledBuildingCount(building);
      setDossier({
        hasBuilding: Boolean(doc),
        updatedAt: doc?.updatedAt,
        lastEditorName: doc?.lastEditedByName,
        filled,
        building,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q)
      );
    });
  }, [clients, search]);

  const resetFormForSelected = (c: ClientRecord) => {
    setForm(formFromClient(c));
    setMode('view');
  };

  const startAdd = () => {
    setMode('add');
    setSelectedId(null);
    setForm(emptyForm());
    setDossier(null);
  };

  const startEdit = () => {
    if (!selected) return;
    setMode('edit');
    setForm(formFromClient(selected));
  };

  const cancelEdit = () => {
    if (selected) {
      resetFormForSelected(selected);
    } else {
      setMode('view');
      setForm(emptyForm());
      setDossier(null);
    }
  };

  const validate = () => {
    if (!form.fullName.trim()) return t('clients.validation.nameRequired');
    if (!form.address.trim()) return t('clients.validation.addressRequired');
    if (!form.email.trim() || !form.email.includes('@')) return t('clients.validation.emailRequired');
    return null;
  };

  const handleSaveAdd = async () => {
    const err = validate();
    if (err) {
      showToast(err, 'error');
      return;
    }
    const input: ClientInput = {
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      address: form.address,
    };
    try {
      const client = await addClient(input);
      await syncClientToBuildingDoc(client, { email: editorEmail, name: userName });
      await refreshClients();
      setSelectedId(client.id);
      setMode('view');
      showToast(t('clients.toast.added'), 'success');
    } catch {
      showToast(t('clients.toast.saveFailed'), 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    const err = validate();
    if (err) {
      showToast(err, 'error');
      return;
    }
    const input: ClientInput = {
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      address: form.address,
    };
    try {
      const updated = await updateClient(selected.id, input);
      if (!updated) {
        showToast(t('clients.toast.notFound'), 'error');
        return;
      }
      await syncClientToBuildingDoc(updated, { email: editorEmail, name: userName });
      await refreshClients();
      setMode('view');
      showToast(t('clients.toast.updated'), 'success');
    } catch {
      showToast(t('clients.toast.updateFailed'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Client "${selected.fullName}" verwijderen?`)) return;
    try {
      await deleteClient(selected.id);
      setSelectedId(null);
      setMode('view');
      setForm(emptyForm());
      setDossier(null);
      await refreshClients();
      showToast(t('clients.toast.deleted'), 'success');
    } catch {
      showToast(t('clients.toast.deleteFailed'), 'error');
    }
  };

  if (!canSee) {
    return (
      <div className="bg-background min-h-screen">
        <TopBar
          showMenu={true}
          showUserMenu={true}
          userName={userName}
          onManageProfile={onManageProfile}
          onLogout={onLogout}
          onOpenSettings={onOpenSettings}
          onLogoClick={onLogoClick}
          onMenuClick={() => setMobileMenuOpen(true)}
          profilePhoto={profilePhoto}
        />
        <main className="app-page-main md:ml-64 pb-8">
          <div className="app-shell-content">
            <h1 className="font-display text-2xl font-black text-primary">{t('clients.title')}</h1>
            <p className="mt-2 text-on-surface-variant text-sm">{t('clients.denied')}</p>
            <button
              type="button"
              onClick={() => setCurrentStep(Step.DASHBOARD)}
              className="mt-6 px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm"
            >
              {t('clients.back')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <TopBar
        showMenu={true}
        showUserMenu={true}
        userName={userName}
        onMenuClick={() => setMobileMenuOpen(true)}
        onManageProfile={onManageProfile}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={onLogoClick}
        profilePhoto={profilePhoto}
      />

      <AppSidebar
        currentStep={currentStep}
        handleStepChange={setCurrentStep}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentStep={currentStep}
        handleStepChange={setCurrentStep}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      <main className="app-page-main md:ml-64 pb-8">
        <BackToTop />

        <div className="app-shell-content">
          <PageBackLink label={t('clients.backToDashboard')} onClick={() => setCurrentStep(Step.DASHBOARD)} />

          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-black tracking-tighter text-on-surface">{t('clients.title')}</h1>
              <p className="mt-1 text-on-surface-variant text-sm">{t('clients.subtitle')}</p>
            </div>

            <button
              type="button"
              onClick={startAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-110"
            >
              <UserPlus size={18} />
              {t('clients.newClient')}
            </button>
          </header>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('clients.searchPlaceholder')}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* List */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-outline-variant/10 bg-white shadow-sm overflow-hidden">
                {loading ? (
                  <p className="p-6 text-sm text-gray-500">{t('clients.loading')}</p>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">
                    <p className="font-bold">{t('clients.emptyTitle')}</p>
                    <p className="mt-1">{t('clients.emptyHint')}</p>
                  </div>
                ) : (
                  <ul className="max-h-[min(36rem,55vh)] overflow-y-auto">
                    {filtered.map((c) => {
                      const active = c.id === selectedId && mode === 'view';
                      return (
                        <li key={c.id} className="border-b border-gray-100 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(c.id);
                              setMode('view');
                            }}
                            className={`w-full px-4 py-3 text-left transition-colors ${
                              active ? 'bg-primary/10' : 'hover:bg-gray-50'
                            }`}
                          >
                            <p className="font-bold text-sm text-on-surface">{c.fullName || t('clients.unnamed')}</p>
                            <p className="truncate text-[12px] text-gray-500">{c.address || t('clients.noAddress')}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{c.email}</p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-3">
              {!selected && mode !== 'add' ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">{t('clients.selectHint')}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-outline-variant/10 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-display text-lg font-black text-primary">
                        {mode === 'add' ? t('clients.newClient') : selected ? selected.fullName : t('clients.title')}
                      </h2>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {selected ? selected.address : t('clients.fillDetails')}
                      </p>
                    </div>
                    {mode === 'view' && selected && (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-white px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5"
                      >
                        <Pencil size={14} />
                        {t('clients.edit')}
                      </button>
                    )}
                  </div>

                  {/* Form */}
                  {(mode === 'add' || mode === 'edit') ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('clients.form.fullName')}</label>
                        <input
                          value={form.fullName}
                          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('clients.form.email')}</label>
                        <input
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('clients.form.phone')}</label>
                        <input
                          value={form.phoneNumber}
                          onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{t('clients.form.address')}</label>
                        <input
                          value={form.address}
                          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={mode === 'add' ? handleSaveAdd : handleSaveEdit}
                          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md hover:brightness-110"
                        >
                          <Check size={16} />
                          {t('clients.save')}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                        >
                          <X size={16} />
                          {t('clients.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">{t('clients.form.fullName')}</p>
                          <p className="text-sm font-semibold text-on-surface mt-1">{selected?.fullName ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">{t('clients.form.email')}</p>
                          <p className="text-sm font-semibold text-on-surface mt-1">{selected?.email ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">{t('clients.form.phone')}</p>
                          <p className="text-sm font-semibold text-on-surface mt-1">{selected?.phoneNumber ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">{t('clients.form.address')}</p>
                          <p className="text-sm font-semibold text-on-surface mt-1">{selected?.address ?? '—'}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-outline-variant/10 bg-gray-50 p-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Building2 size={16} />
                          <span className="text-xs font-black uppercase tracking-wider">{t('clients.dossier.title')}</span>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                          <div>
                            <span className="font-bold text-on-surface">{t('clients.dossier.label')}</span>{' '}
                            {dossier?.hasBuilding ? t('clients.dossier.present') : t('clients.dossier.notFound')}
                          </div>
                          <div>
                            <span className="font-bold text-on-surface">{t('clients.dossier.fill')}</span>{' '}
                            {dossier ? `${dossier.filled.filled}/${dossier.filled.total}` : '—'}
                          </div>
                          {dossier?.updatedAt && (
                            <div>
                              <span className="font-bold text-on-surface">{t('clients.dossier.updated')}</span>{' '}
                              {new Date(dossier.updatedAt).toLocaleString(dateLocale)}
                            </div>
                          )}
                          {dossier?.lastEditorName && (
                            <div>
                              <span className="font-bold text-on-surface">{t('clients.dossier.by')}</span> {dossier.lastEditorName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary/5"
                          onClick={() => {
                            if (!selected) return;
                            onOpenClientDossier(
                              {
                                fullName: selected.fullName,
                                email: selected.email,
                                phoneNumber: selected.phoneNumber,
                                address: selected.address,
                              },
                              dossier?.building ?? defaultBuilding(),
                            );
                          }}
                        >
                          <ExternalLink size={16} />
                          {t('clients.openDossier')}
                        </button>
                        {selected && (
                          <button
                            type="button"
                            className="ml-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200"
                            onClick={handleDelete}
                          >
                            <Trash2 size={16} />
                            {t('clients.delete')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

