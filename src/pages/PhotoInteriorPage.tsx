import { useEffect, useRef, useState, type ComponentType } from 'react';
import * as Lucide from 'lucide-react';

const { ArrowRight, Camera, CheckCircle, Plus, Trash2, X } = Lucide;
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { DevNav } from '../components/common/DevNav';
import { PageBackLink } from '../components/common/PageBackLink';
import { BackToTop } from '../components/common/BackToTop';
import { INTERIOR_ROOMS, ROOM_SUB_CATEGORIES } from '../constants';
import { Step, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getUiQuestionsForRole } from '../data/actionListMassEpaUiItems';

const LS_INTERIOR = 'massEPA_photoInterior_v1';
const LS_INTERIOR_ROOMS = 'massEPA_photoInteriorRooms_v1';

interface PhotoInteriorPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile?: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
}

type InteriorPhotos = Record<string, string[]>;

type InteriorRoomRow = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
};

function cloneInteriorRoomsFromConstants(): InteriorRoomRow[] {
  return INTERIOR_ROOMS.map((r) => ({ ...r }));
}

function RoomIcon({ name }: { name: string }) {
  if (name === 'SettingsIcon') {
    const S = Lucide.Settings;
    return <S size={26} />;
  }
  const Cmp = (Lucide as unknown as Record<string, ComponentType<{ size?: number; className?: string }>>)[name];
  if (Cmp) return <Cmp size={26} />;
  return <Camera size={26} />;
}

export function PhotoInteriorPage({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
}: PhotoInteriorPageProps) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rooms, setRooms] = useState<InteriorRoomRow[]>(() => cloneInteriorRoomsFromConstants());
  const [interiorPhotos, setInteriorPhotos] = useState<InteriorPhotos>({});
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const interiorHint = getUiQuestionsForRole(selectedRole).find(
    (i) => i.section === 'Photo capture' && i.category === 'Interior',
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_INTERIOR);
      if (raw) setInteriorPhotos(JSON.parse(raw) as InteriorPhotos);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_INTERIOR, JSON.stringify(interiorPhotos));
    } catch {
      /* quota */
    }
  }, [interiorPhotos]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_INTERIOR_ROOMS);
      if (!raw) return;
      const parsed = JSON.parse(raw) as InteriorRoomRow[];
      if (Array.isArray(parsed) && parsed.length >= INTERIOR_ROOMS.length && parsed.every((r) => r?.id && r?.name)) {
        setRooms(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_INTERIOR_ROOMS, JSON.stringify(rooms));
    } catch {
      /* ignore */
    }
  }, [rooms]);

  const addBedroom = () => {
    setRooms((prev) => {
      const existingBedrooms = prev.filter((r) => r.id.startsWith('slaapkamer'));
      const bedroomCount = existingBedrooms.length;
      const newId = `slaapkamer_${bedroomCount + 1}`;
      const newRoom: InteriorRoomRow = {
        id: newId,
        name: `Slaapkamer ${bedroomCount + 1}`,
        subtitle: `Bedroom ${bedroomCount + 1}`,
        icon: 'Bed',
      };
      const newRooms = [...prev];
      let lastSlaapkamerIndex = -1;
      for (let i = 0; i < newRooms.length; i++) {
        if (newRooms[i].id.startsWith('slaapkamer')) {
          lastSlaapkamerIndex = i;
        }
      }
      newRooms.splice(lastSlaapkamerIndex + 1, 0, newRoom);
      return newRooms;
    });
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const subCategoriesFor = (roomId: string) =>
    ROOM_SUB_CATEGORIES[roomId] ??
    (roomId.startsWith('slaapkamer') ? ROOM_SUB_CATEGORIES['slaapkamer'] : undefined) ?? [
      { label: 'General View', detail: 'Primary overview of the space' },
    ];

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const key = activeSubCat;
    if (!files?.length || !key) return;
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setInteriorPhotos((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), ...urls],
    }));
    setActiveSubCat(null);
    e.target.value = '';
  };

  const deleteInteriorPhoto = (subCatId: string, pIdx: number) => {
    setInteriorPhotos((prev) => {
      const list = [...(prev[subCatId] ?? [])];
      const removed = list[pIdx];
      if (removed?.startsWith('blob:')) URL.revokeObjectURL(removed);
      list.splice(pIdx, 1);
      return { ...prev, [subCatId]: list };
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <TopBar
        showMenu={true}
        showUserMenu={true}
        userName={userName}
        onMenuClick={() => setMobileMenuOpen(true)}
        onManageProfile={onManageProfile || (() => {})}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={onLogoClick}
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

      <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />

      <main className="app-page-main app-page-main--devnav md:ml-64 pb-8">
        <div className="app-shell-content">
        <BackToTop />

        <PageBackLink label={t('photoInterior.backToPhotos')} onClick={() => setCurrentStep(Step.PHOTO_CAPTURE)} />

        <header className="app-page-title">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">
            {t('photoInterior.title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t('photoInterior.subtitle')}
          </p>
          {interiorHint && (
            <p className="text-xs text-primary font-bold mt-3 bg-primary/5 border border-primary/15 rounded-xl p-3">
              {interiorHint.question}
            </p>
          )}
        </header>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onFileChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const subs = subCategoriesFor(room.id);
            const completedCount = subs.filter((_, idx) => {
              const id = `${room.id}_${idx}`;
              return (interiorPhotos[id] ?? []).length > 0;
            }).length;
            const progress = subs.length ? (completedCount / subs.length) * 100 : 0;
            const isFullyComplete = progress === 100;
            const isPrimarySlaapkamer = room.id === 'slaapkamer';

            return (
              <div
                key={room.id}
                className="relative flex items-stretch gap-1 rounded-2xl border border-outline-variant/10 bg-white shadow-sm hover:border-primary/30 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className="relative flex flex-1 min-w-0 items-center gap-4 p-5 text-left overflow-hidden active:scale-[0.99] transition-transform"
                >
                  <div
                    className="absolute inset-0 bg-primary/5 origin-left pointer-events-none transition-all"
                    style={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
                  />
                  <div className="relative z-10 w-14 h-14 shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <RoomIcon name={room.icon} />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface truncate">{room.name}</span>
                      {isFullyComplete && <CheckCircle size={16} className="text-primary shrink-0" />}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-0.5">
                      {completedCount}/{subs.length} {room.subtitle}
                    </div>
                  </div>
                </button>
                {isPrimarySlaapkamer && (
                  <button
                    type="button"
                    title="Add more bedrooms"
                    onClick={(e) => {
                      e.preventDefault();
                      addBedroom();
                    }}
                    className="relative z-20 shrink-0 w-12 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors border-l border-outline-variant/10"
                    aria-label="Add more bedrooms"
                  >
                    <Plus size={22} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setCurrentStep(Step.FINAL_REVIEW)}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-primary text-white shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            {t('photos.continueReview')}
            <ArrowRight size={18} />
          </button>
        </div>
        </div>
      </main>

      {selectedRoom && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm border-0 cursor-default"
            aria-label="Close"
            onClick={() => setSelectedRoomId(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-outline-variant/10 flex justify-between items-center gap-3">
              <div className="min-w-0">
                <h2 className="font-display font-black text-lg text-on-surface border-l-4 border-primary pl-3 truncate">
                  {selectedRoom.name} Sub-categories
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-1 pl-3">
                  Evidence categories for {selectedRoom.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoomId(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-on-surface-variant shrink-0"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {subCategoriesFor(selectedRoom.id).map((item, idx) => {
                const subCatId = `${selectedRoom.id}_${idx}`;
                const photos = interiorPhotos[subCatId] ?? [];
                const hasPhotos = photos.length > 0;
                return (
                  <div
                    key={subCatId}
                    className="flex flex-col gap-3 p-4 border border-outline-variant/10 rounded-2xl bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`font-bold text-base ${hasPhotos ? 'text-primary' : 'text-on-surface'}`}
                        >
                          {item.label}
                        </span>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{item.detail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubCat(subCatId);
                          fileRef.current?.click();
                        }}
                        className={`p-3 rounded-xl shrink-0 transition-all ${
                          hasPhotos
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-primary text-white shadow-md hover:brightness-110'
                        }`}
                        aria-label="Add photo"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                    {hasPhotos && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/10">
                        {photos.map((photo, pIdx) => (
                          <div
                            key={`${photo}-${pIdx}`}
                            className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-outline-variant/15 group/photo"
                          >
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => deleteInteriorPhoto(subCatId, pIdx)}
                              className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity"
                              aria-label="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubCat(subCatId);
                            fileRef.current?.click();
                          }}
                          className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed border-outline-variant/25 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary"
                        >
                          <Plus size={18} />
                          <span className="text-[8px] font-black uppercase">Add</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-outline-variant/10 bg-surface-container-low">
              <button
                type="button"
                className="w-full py-3 text-primary font-black uppercase tracking-widest text-xs hover:bg-primary/5 rounded-xl transition-colors"
                onClick={() => setSelectedRoomId(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
