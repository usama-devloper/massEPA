// src/pages/PhotoCapturePage.tsx
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera, Trash2, CheckCircle, X, Plus,
  DoorClosed, Zap, Sofa, Utensils, Accessibility, SettingsIcon, Bath, Bed, DoorOpen, Home, Package, ChevronDown, ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { BackToTop } from '../components/common/BackToTop';
import { StepContinueFooter } from '../components/common/StepContinueFooter';
import { PageBackLink } from '../components/common/PageBackLink';
import { PhotoViewerModal } from '../components/common/PhotoViewerModal';
import { Step, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  emptyExteriorPhotos,
  loadPhotoCaptureFromStorage,
  savePhotoCaptureToStorage,
  type ExteriorPhotos,
  type InteriorCategoryDetail,
  type InteriorCategoryDetails,
  type InteriorPhotos,
} from '../storage/photoCaptureData';
import {
  loadHouseDesignAlgemeenHints,
  loadHouseDesignPageRaw,
} from '../storage/houseDesignPageData';
import {
  buildInteriorFloorSections,
  getSelectedRoomsForFloor,
} from '../utils/interiorRoomsFromUpload';
import { HOUSE_DESIGN_ROOMS_CHANGED_EVENT } from '../utils/roomDeleteSync';
import {
  buildPhotoCaptureCategoryList,
  buildPhotoCaptureCategoryInstance,
  buildPhotoCaptureSectionOrder,
  countPhotoCaptureCategoryInstances,
  getPhotoCaptureCategories,
  getPhotoCaptureCategoryBase,
  getPhotoCaptureCategoryNumber,
  getPhotoCaptureRoomKey,
  isPhotoCaptureDoorCategory,
  isPhotoCaptureMultiInstanceCategory,
  isPhotoCaptureWindowCategory,
  nextPhotoCaptureCategoryInstance,
  sortPhotoCaptureRoomsForFloor,
  type PhotoCaptureSection,
} from '../utils/photoCaptureRooms';
import { KOZIJN_FRAME_TYPES, KOZIJN_GLASS_TYPES } from '../config/kozijnGlasOptions';
import { AppSelect } from '../components/common/AppSelect';
import { HouseDesignRoomsModal } from '../components/common/HouseDesignRoomsModal';
import { translateKozijnFrameType, translateKozijnGlassType, translatePhotoCategory, translateUploadRoom, translateUploadFloor } from '../i18n/translateOptions';
import {
  filesToPersistedUrls,
  revokeFileUrlIfBlob,
} from '../utils/persistedFileUrl';
import {
  MediaInstructionModal,
  type MediaInstructionStep,
} from '../components/common/MediaInstructionModal';
import { getMediaInstruction } from '../config/mediaInstructions';
import {
  photoExteriorExampleImageUrl,
  photoInteriorExampleImageUrl,
} from '../config/mediaExampleImages';
import { usePhotoViewer } from '../hooks/usePhotoViewer';
import { slidesFromUrls } from '../utils/photoViewer';

/** Interior Capture modal camera control — reuse on all Photo Capture camera actions. */
const CAMERA_CAPTURE_BTN_CLASS =
  'p-2 rounded-lg transition-all bg-primary/10 text-primary hover:bg-primary hover:text-white flex-shrink-0';

// Room icons (same as before - keep your existing code)
const ROOM_ICONS: { [key: string]: React.ReactNode } = {
  'WOONKAMER': <Sofa size={20} />,
  'SLAAPKAMER': <Bed size={20} />,
  'KEUKEN': <Utensils size={20} />,
  'BADKAMER': <Bath size={20} />,
  'HAL': <DoorClosed size={20} />,
  'MK': <Zap size={20} />,
  'WC': <Accessibility size={20} />,
  'BERGING': <Package size={20} />,
  'TECHNICAL ROOM': <SettingsIcon size={20} />,
  'WASRUIMTE': <Bath size={20} />,
  'EETKAMER': <Utensils size={20} />,
  'AANBOUW': <Home size={20} />,
  'ZOLDER': <Home size={20} />,
  'DAKKAPEL': <Home size={20} />,
  'SERRE': <Home size={20} />,
  'VLOERISOLATIE': <Home size={20} />,
  'OVERLUIP': <DoorOpen size={20} />,
  'BALKON': <Home size={20} />,
  'default': <Home size={20} />
};

// Exterior sections
const EXTERIOR_SECTIONS = [
  { id: 'voor', label: 'VOOR Facade', name: 'Voor Facade', emoji: '📸' },
  { id: 'achter', label: 'ACHTER Facade', name: 'Achter Facade', emoji: '📸' },
  { id: 'links', label: 'LINKS Facade', name: 'Links Facade', emoji: '📸' },
  { id: 'rechts', label: 'RECHTS Facade', name: 'Rechts Facade', emoji: '📸' }
];

// Floor display names (modal / labels)
const FLOOR_NAMES: { [key: string]: string } = {
  'BG': 'BG (Begane grond)',
  'KELDER': 'KELDER',
  '1e': '1e (Eerste verdieping)',
  '2e': '2e (Tweede verdieping)',
  '3e': '3e (Derde verdieping)',
  '4e': '4e (Vierde verdieping)',
  '5e': '5e (Vijfde verdieping)',
  '6e': '6e (Zesde verdieping)',
  '7e': '7e (Zevende verdieping)',
  '8e': '8e (Achtste verdieping)',
  '9e': '9e (Negende verdieping)',
};


interface PhotoCapturePageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile?: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
  profilePhoto?: string;
}

interface RoomWithUniqueId {
  uniqueId: string;
  name: string;
  floor: string;
}

interface FloorGroup {
  floor: string;
  displayName: string;
  rooms: RoomWithUniqueId[];
}

export function PhotoCapturePage({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
  profilePhoto,
}: PhotoCapturePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast, setToast, showToast } = useToast();
  const { t } = useLanguage();
  const getExteriorLabel = (sectionId: string): string => {
    const labels: Record<string, string> = {
      'voor': t('photos.exterior.voor'),
      'achter': t('photos.exterior.achter'),
      'links': t('photos.exterior.links'),
      'rechts': t('photos.exterior.rechts')
    };
    return labels[sectionId] || sectionId;
  };

  const [exteriorPhotos, setExteriorPhotos] = useState<ExteriorPhotos>(emptyExteriorPhotos);
  const [interiorPhotos, setInteriorPhotos] = useState<InteriorPhotos>({});
  const [interiorDetails, setInteriorDetails] = useState<InteriorCategoryDetails>({});
  const [extraInteriorCategories, setExtraInteriorCategories] = useState<Record<string, string[]>>({});
  const photosPersistReadyRef = useRef(false);

  const photoViewer = usePhotoViewer();
  const [viewerPhotoUrls, setViewerPhotoUrls] = useState<string[]>([]);

  const [interiorModalOpen, setInteriorModalOpen] = useState(false);
  const [selectedInteriorRoomId, setSelectedInteriorRoomId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [currentFloorForModal, setCurrentFloorForModal] = useState<string>('');
  const [currentRoomIndex, setCurrentRoomIndex] = useState<number>(0);

  const [floorGroups, setFloorGroups] = useState<FloorGroup[]>([]);
  const [sectionOrder, setSectionOrder] = useState<PhotoCaptureSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [availableFloors, setAvailableFloors] = useState<Set<string>>(new Set());
  const [editRoomsModalOpen, setEditRoomsModalOpen] = useState(false);

  const captureSessionInputRef = useRef<HTMLInputElement>(null);

  const [mediaGuideOpen, setMediaGuideOpen] = useState(false);
  const [mediaGuideStep, setMediaGuideStep] = useState<MediaInstructionStep>('instructions');
  const [pendingGuidePhotos, setPendingGuidePhotos] = useState<string[]>([]);
  const [captureTargetSection, setCaptureTargetSection] = useState<string | null>(null);
  const [captureTargetRoomId, setCaptureTargetRoomId] = useState<string | null>(null);
  const [captureTargetCategory, setCaptureTargetCategory] = useState<string | null>(null);
  const photoMediaGuide = getMediaInstruction('photoCapture', 'camera');
  const savedExpandedSections = useRef<string[]>([]);

  const refreshInteriorRooms = () => {
    try {
      const selection = loadHouseDesignPageRaw();
      const { numberOfFloors, hasKelder, startFloorKey: startKey } = loadHouseDesignAlgemeenHints();
      const floorSections = buildInteriorFloorSections(numberOfFloors, hasKelder, startKey);

      const groups: FloorGroup[] = [];
      const presentFloors = new Set<string>();

      floorSections.forEach((floor) => {
        const rooms = getSelectedRoomsForFloor(selection, floor);
        if (rooms.length === 0) return;

        const sortedRooms = sortPhotoCaptureRoomsForFloor(floor, [...new Set(rooms)], startKey);
        groups.push({
          floor,
          displayName: FLOOR_NAMES[floor] || floor,
          rooms: sortedRooms.map((room) => ({
            uniqueId: `${floor}_${room}`,
            name: room,
            floor,
          })),
        });
        presentFloors.add(floor);
      });

      setFloorGroups(groups);
      setAvailableFloors(presentFloors);
      setSectionOrder(buildPhotoCaptureSectionOrder(floorSections, startKey));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refreshInteriorRooms();
  }, []);

  useEffect(() => {
    const handleHouseDesignRoomsChanged = () => {
      refreshInteriorRooms();
      void loadPhotoCaptureFromStorage().then((data) => {
        setInteriorPhotos(data.interior);
        setInteriorDetails(data.interiorDetails ?? {});
        setExtraInteriorCategories(data.extraInteriorCategories ?? {});
      });
    };

    window.addEventListener(HOUSE_DESIGN_ROOMS_CHANGED_EVENT, handleHouseDesignRoomsChanged);
    return () => {
      window.removeEventListener(HOUSE_DESIGN_ROOMS_CHANGED_EVENT, handleHouseDesignRoomsChanged);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPhotoCaptureFromStorage().then((data) => {
      if (cancelled) return;
      setExteriorPhotos(data.exterior);
      setInteriorPhotos(data.interior);
      setInteriorDetails(data.interiorDetails ?? {});
      setExtraInteriorCategories(data.extraInteriorCategories ?? {});
      photosPersistReadyRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!photosPersistReadyRef.current) return;
    const timer = window.setTimeout(() => {
      void savePhotoCaptureToStorage({
        exterior: exteriorPhotos,
        interior: interiorPhotos,
        interiorDetails,
        extraInteriorCategories,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [exteriorPhotos, interiorPhotos, interiorDetails, extraInteriorCategories]);



  const getExteriorPhotos = (sectionId: string): string[] => exteriorPhotos[sectionId as keyof ExteriorPhotos] || [];
  const getExteriorPhotoCount = (sectionId: string): number => exteriorPhotos[sectionId as keyof ExteriorPhotos]?.length || 0;

  const getInteriorPhotoCount = (uniqueId: string, roomName: string): number => {
    const categories = getCategoriesForRoom(uniqueId, roomName);
    let completed = 0;
    categories.forEach(cat => {
      if ((interiorPhotos[uniqueId]?.[cat]?.length || 0) > 0) completed++;
    });
    return completed;
  };

  const getTotalCategoriesCount = (uniqueId: string, roomName: string): number => {
    return getCategoriesForRoom(uniqueId, roomName).length;
  };

  const isInteriorRoomComplete = (roomId: string, roomName: string): boolean => {
    const categories = getCategoriesForRoom(roomId, roomName);
    if (categories.length === 0) return false;
    for (const cat of categories) {
      const photos = interiorPhotos[roomId]?.[cat] || [];
      if (photos.length === 0) return false;

      if (selectedRole !== UserRole.CLIENT) {
        if (isPhotoCaptureDoorCategory(cat)) {
          const doorVal = interiorDetails[roomId]?.[cat]?.doorIsolated;
          if (doorVal !== true && doorVal !== false) return false;
        }
        if (isPhotoCaptureWindowCategory(cat)) {
          const glass = interiorDetails[roomId]?.[cat]?.glassType;
          const frame = interiorDetails[roomId]?.[cat]?.frameType;
          if (!glass || !frame) return false;
        }
      }
    }
    return true;
  };

  const [didAutoExpand, setDidAutoExpand] = useState(false);
  useEffect(() => {
    if (!photosPersistReadyRef.current || floorGroups.length === 0 || didAutoExpand) return;

    const toExpand: string[] = [];

    // Check facades
    EXTERIOR_SECTIONS.forEach((sect) => {
      const isFacadeRequired = sect.id === 'voor' || sect.id === 'achter';
      const photos = exteriorPhotos[sect.id as keyof ExteriorPhotos] || [];
      if (isFacadeRequired && photos.length === 0) {
        toExpand.push(sect.id);
      }
    });

    // Check floors
    floorGroups.forEach((group) => {
      const hasIncompleteRoom = group.rooms.some((roomItem) => !isInteriorRoomComplete(roomItem.uniqueId, roomItem.name));
      if (hasIncompleteRoom) {
        toExpand.push(group.floor);
      }
    });

    if (toExpand.length > 0) {
      setExpandedSections(toExpand);
    }
    setDidAutoExpand(true);
  }, [photosPersistReadyRef.current, floorGroups, exteriorPhotos, interiorPhotos, interiorDetails, extraInteriorCategories, selectedRole, didAutoExpand]);

  const getRoomIcon = (roomName: string): React.ReactNode =>
    ROOM_ICONS[getPhotoCaptureRoomKey(roomName)] || ROOM_ICONS.default;

  const getCategoriesForRoom = (roomId: string, roomName: string): string[] =>
    buildPhotoCaptureCategoryList(
      roomName,
      roomId,
      extraInteriorCategories,
      interiorPhotos,
      interiorDetails,
    );

  const getInteriorRoomNameById = (roomId: string): string | undefined => {
    for (const group of floorGroups) {
      const room = group.rooms.find((r) => r.uniqueId === roomId);
      if (room) return room.name;
    }
    return undefined;
  };

  const migrateInteriorCategoryKey = (roomId: string, from: string, to: string) => {
    if (from === to) return;

    setInteriorPhotos((prev) => {
      const room = { ...(prev[roomId] ?? {}) };
      if (room[from]) {
        room[to] = room[from];
        delete room[from];
      }
      if (Object.keys(room).length === 0) {
        const next = { ...prev };
        delete next[roomId];
        return next;
      }
      return { ...prev, [roomId]: room };
    });

    setInteriorDetails((prev) => {
      const room = { ...(prev[roomId] ?? {}) };
      if (room[from]) {
        room[to] = room[from];
        delete room[from];
      }
      if (Object.keys(room).length === 0) {
        const next = { ...prev };
        delete next[roomId];
        return next;
      }
      return { ...prev, [roomId]: room };
    });

    setExtraInteriorCategories((prev) => {
      const list = prev[roomId];
      if (!list?.length) return prev;
      const nextList = list.map((c) => (c === from ? to : c));
      return { ...prev, [roomId]: nextList };
    });
  };

  const addExtraCategoryInstance = (roomId: string, roomName: string, baseCategory: string) => {
    const existing = getCategoriesForRoom(roomId, roomName);
    const numberedFirst = buildPhotoCaptureCategoryInstance(baseCategory, 1);
    const instances = existing.filter((c) => getPhotoCaptureCategoryBase(c) === baseCategory);

    if (instances.length === 1 && instances[0] === baseCategory) {
      migrateInteriorCategoryKey(roomId, baseCategory, numberedFirst);
      const nextCategory = buildPhotoCaptureCategoryInstance(baseCategory, 2);
      setExtraInteriorCategories((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), nextCategory],
      }));
      return;
    }

    const nextCategory = nextPhotoCaptureCategoryInstance(existing, baseCategory);
    setExtraInteriorCategories((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] ?? []), nextCategory],
    }));
  };

  const removeExtraCategoryInstance = (roomId: string, roomName: string, category: string) => {
    const base = getPhotoCaptureCategoryBase(category);
    const numberedFirst = buildPhotoCaptureCategoryInstance(base, 1);
    if (getPhotoCaptureCategoryNumber(category) <= 1 && category !== numberedFirst) return;

    const existing = getCategoriesForRoom(roomId, roomName);
    const afterRemove = existing.filter((c) => c !== category);
    const siblingsAfter = afterRemove.filter((c) => getPhotoCaptureCategoryBase(c) === base);
    const shouldCollapseToBase =
      siblingsAfter.length === 1 && siblingsAfter[0] === numberedFirst;

    setExtraInteriorCategories((prev) => {
      const next = { ...prev };
      const filtered = (next[roomId] ?? []).filter((c) => c !== category);
      if (filtered.length > 0) next[roomId] = filtered;
      else delete next[roomId];
      return next;
    });

    const photos = interiorPhotos[roomId]?.[category] ?? [];
    photos.forEach((url) => revokeFileUrlIfBlob(url));

    setInteriorPhotos((prev) => {
      const room = { ...(prev[roomId] ?? {}) };
      delete room[category];
      if (Object.keys(room).length === 0) {
        const next = { ...prev };
        delete next[roomId];
        return next;
      }
      return { ...prev, [roomId]: room };
    });

    setInteriorDetails((prev) => {
      const room = { ...(prev[roomId] ?? {}) };
      delete room[category];
      if (Object.keys(room).length === 0) {
        const next = { ...prev };
        delete next[roomId];
        return next;
      }
      return { ...prev, [roomId]: room };
    });

    if (shouldCollapseToBase) {
      migrateInteriorCategoryKey(roomId, numberedFirst, base);
    }

    showToast(t('photos.category.instanceRemoved'), 'success');
  };

  const getCategoryDetail = (roomId: string, category: string): InteriorCategoryDetail =>
    interiorDetails[roomId]?.[category] ?? {};

  const patchCategoryDetail = (
    roomId: string,
    category: string,
    patch: Partial<InteriorCategoryDetail>,
  ) => {
    setInteriorDetails((prev) => {
      const roomCategories = { ...(prev[roomId] ?? {}) };
      const merged: InteriorCategoryDetail = { ...roomCategories[category], ...patch };

      if (merged.doorIsolated !== true && merged.doorIsolated !== false) {
        delete merged.doorIsolated;
      }
      if (!merged.glassType) delete merged.glassType;
      if (!merged.frameType) delete merged.frameType;

      if (Object.keys(merged).length === 0) {
        delete roomCategories[category];
      } else {
        roomCategories[category] = merged;
      }

      if (Object.keys(roomCategories).length === 0) {
        const next = { ...prev };
        delete next[roomId];
        return next;
      }

      return { ...prev, [roomId]: roomCategories };
    });
  };

  const toggleDoorIsolated = (roomId: string, category: string, value: boolean) => {
    const current = getCategoryDetail(roomId, category).doorIsolated ?? null;
    patchCategoryDetail(roomId, category, {
      doorIsolated: current === value ? null : value,
    });
  };

  const renderCategoryQuestions = (roomId: string, category: string) => {
    const detail = getCategoryDetail(roomId, category);

    if (isPhotoCaptureDoorCategory(category)) {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-white/25 px-3 py-2.5">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-700">
            {t('photos.category.doorIsolated')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleDoorIsolated(roomId, category, true)}
              className={`rounded-lg px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${detail.doorIsolated === true
                ? 'bg-primary text-white shadow-md'
                : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
            >
              {t('common.yes')}
            </button>
            <button
              type="button"
              onClick={() => toggleDoorIsolated(roomId, category, false)}
              className={`rounded-lg px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${detail.doorIsolated === false
                ? 'bg-primary text-white shadow-md'
                : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
            >
              {t('common.no')}
            </button>
          </div>
        </div>
      );
    }

    if (isPhotoCaptureWindowCategory(category)) {
      return (
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-white/25 px-3 py-2.5">
          <AppSelect
            label={t('photos.category.glassType')}
            value={detail.glassType ?? ''}
            onChange={(value) => patchCategoryDetail(roomId, category, { glassType: value })}
            placeholder={t('kozijn.selectGlassType')}
            variant="white"
            options={KOZIJN_GLASS_TYPES.map((opt) => ({
              value: opt,
              label: translateKozijnGlassType(opt, t),
            }))}
          />
          <AppSelect
            label={t('photos.category.frameType')}
            value={detail.frameType ?? ''}
            onChange={(value) => patchCategoryDetail(roomId, category, { frameType: value })}
            placeholder={t('kozijn.selectFrameType')}
            variant="white"
            options={KOZIJN_FRAME_TYPES.map((opt) => ({
              value: opt,
              label: translateKozijnFrameType(opt, t),
            }))}
          />
        </div>
      );
    }

    return null;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => prev.includes(sectionId) ? [] : [sectionId]);
  };

  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);

  const openModal = (photos: string[], index: number) => {
    setViewerPhotoUrls(photos || []);
    photoViewer.openAt(index);
  };

  const discardPendingGuidePhotos = () => {
    pendingGuidePhotos.forEach((url) => revokeFileUrlIfBlob(url));
    setPendingGuidePhotos([]);
  };

  const closeMediaGuide = () => {
    discardPendingGuidePhotos();
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
    setCaptureTargetSection(null);
    setCaptureTargetRoomId(null);
    setCaptureTargetCategory(null);
  };

  const openCaptureSession = (options: {
    sectionId?: string;
    roomId?: string;
    category?: string;
  }) => {
    discardPendingGuidePhotos();
    setCaptureTargetSection(options.sectionId || null);
    setCaptureTargetRoomId(options.roomId || null);
    setCaptureTargetCategory(options.category || null);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(true);
  };

  const triggerMediaGuidePicker = () => {
    captureSessionInputRef.current?.click();
  };

  const handleTempCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      e.target.value = '';
      return;
    }

    try {
      const newPhotos = await filesToPersistedUrls(Array.from(files));

      if (mediaGuideOpen) {
        setPendingGuidePhotos((prev) => [...prev, ...newPhotos]);
        setMediaGuideStep('review');
      }
    } catch {
      showToast(t('upload.toast.filesUploadFailed'), 'error');
    }
    e.target.value = '';
  };

  const removePendingGuidePhoto = (index: number) => {
    const photoToRemove = pendingGuidePhotos[index];
    revokeFileUrlIfBlob(photoToRemove);
    setPendingGuidePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMediaGuideDone = () => {
    const count = pendingGuidePhotos.length;
    if (count === 0) return;

    savedExpandedSections.current = [...expandedSections];

    if (captureTargetSection) {
      setExteriorPhotos((prev) => ({
        ...prev,
        [captureTargetSection]: [
          ...(prev[captureTargetSection as keyof ExteriorPhotos] || []),
          ...pendingGuidePhotos,
        ],
      }));
    }

    if (captureTargetRoomId && captureTargetCategory) {
      setInteriorPhotos((prev) => ({
        ...prev,
        [captureTargetRoomId]: {
          ...(prev[captureTargetRoomId] || {}),
          [captureTargetCategory]: [
            ...((prev[captureTargetRoomId] || {})[captureTargetCategory] || []),
            ...pendingGuidePhotos,
          ],
        },
      }));
    }

    setPendingGuidePhotos([]);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
    setCaptureTargetSection(null);
    setCaptureTargetRoomId(null);
    setCaptureTargetCategory(null);

    showToast(t('photos.guide.savedToast', { count }), 'success');

    setTimeout(() => {
      if (savedExpandedSections.current.length > 0) {
        setExpandedSections(savedExpandedSections.current);
        savedExpandedSections.current = [];
      }
    }, 100);
  };

  // Legacy direct capture handlers (unused by UI; kept for hidden inputs)
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const inputId = e.target.id;
      let sectionId: keyof ExteriorPhotos | '' = '';
      if (inputId === 'camera-input-voor') sectionId = 'voor';
      else if (inputId === 'camera-input-achter') sectionId = 'achter';
      else if (inputId === 'camera-input-links') sectionId = 'links';
      else if (inputId === 'camera-input-rechts') sectionId = 'rechts';

      if (sectionId) {
        try {
          const newPhotos = await filesToPersistedUrls(Array.from(files));
          savedExpandedSections.current = [...expandedSections];

          setExteriorPhotos((prev) => ({
            ...prev,
            [sectionId]: [...(prev[sectionId] || []), ...newPhotos],
          }));
          showToast(t('upload.toast.filesUploaded', { count: newPhotos.length }), 'success');

          setTimeout(() => {
            if (savedExpandedSections.current.length > 0) {
              setExpandedSections(savedExpandedSections.current);
              savedExpandedSections.current = [];
            }
          }, 100);
        } catch {
          showToast(t('upload.toast.filesUploadFailed'), 'error');
        }
      }
    }
    e.target.value = '';
  };

  // Handle interior camera capture
  const handleInteriorCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && selectedInteriorRoomId && selectedCategory) {
      try {
        const newPhotos = await filesToPersistedUrls(Array.from(files));
        savedExpandedSections.current = [...expandedSections];

        setInteriorPhotos((prev) => ({
          ...prev,
          [selectedInteriorRoomId]: {
            ...(prev[selectedInteriorRoomId] || {}),
            [selectedCategory]: [
              ...((prev[selectedInteriorRoomId] || {})[selectedCategory] || []),
              ...newPhotos,
            ],
          },
        }));
        showToast(t('upload.toast.filesUploaded', { count: newPhotos.length }), 'success');

        setTimeout(() => {
          if (savedExpandedSections.current.length > 0) {
            setExpandedSections(savedExpandedSections.current);
            savedExpandedSections.current = [];
          }
        }, 100);
      } catch {
        showToast(t('upload.toast.filesUploadFailed'), 'error');
      }
    }
    e.target.value = '';
  };

  const deleteExteriorPhoto = (sectionId: string, photoIndex: number) => {
    const photoToDelete =
      exteriorPhotos[sectionId as keyof ExteriorPhotos]?.[photoIndex];

    revokeFileUrlIfBlob(photoToDelete);

    setExteriorPhotos(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId as keyof ExteriorPhotos] || []).filter(
        (_, i) => i !== photoIndex
      )
    }));

    if (photoViewer.isOpen && getExteriorPhotos(sectionId).length <= 1) {
      photoViewer.close();
    }

    showToast('Photo deleted', 'success');
  };

  const deleteInteriorPhoto = (
    uniqueId: string,
    category: string,
    photoIndex: number
  ) => {
    const photoToDelete =
      interiorPhotos[uniqueId]?.[category]?.[photoIndex];

    revokeFileUrlIfBlob(photoToDelete);

    setInteriorPhotos(prev => ({
      ...prev,
      [uniqueId]: {
        ...(prev[uniqueId] || {}),
        [category]: (prev[uniqueId]?.[category] || []).filter(
          (_: any, i: number) => i !== photoIndex
        )
      }
    }));

    showToast('Photo deleted', 'success');
  };

  const openInteriorCapture = (roomId: string, floor: string, roomIdx: number) => {
    setSelectedInteriorRoomId(roomId);
    setCurrentFloorForModal(floor);
    setCurrentRoomIndex(roomIdx);
    setInteriorModalOpen(true);
  };

  const goToRoomAtIndex = (roomIdx: number) => {
    const floorGroup = floorGroups.find(g => g.floor === currentFloorForModal);
    if (floorGroup && floorGroup.rooms[roomIdx]) {
      setSelectedInteriorRoomId(floorGroup.rooms[roomIdx].uniqueId);
      setCurrentRoomIndex(roomIdx);
      setSelectedCategory(null);
    }
  };

  const goToPreviousRoom = () => {
    if (currentRoomIndex > 0) {
      goToRoomAtIndex(currentRoomIndex - 1);
    }
  };

  const goToNextRoom = () => {
    const floorGroup = floorGroups.find(g => g.floor === currentFloorForModal);
    if (floorGroup && currentRoomIndex < floorGroup.rooms.length - 1) {
      goToRoomAtIndex(currentRoomIndex + 1);
    }
  };

  const closeInteriorModal = () => {
    setInteriorModalOpen(false);
    setSelectedInteriorRoomId(null);
    setSelectedCategory(null);
    setCurrentFloorForModal('');
    setCurrentRoomIndex(0);
  };

  const handleContinue = () => {
    void savePhotoCaptureToStorage({
      exterior: exteriorPhotos,
      interior: interiorPhotos,
      interiorDetails,
      extraInteriorCategories,
    });
    setCurrentStep(Step.DASHBOARD);
  };
  const handleStepChange = (step: Step) => setCurrentStep(step);
  const handleLogoClick = () => {
    if (onLogoClick) onLogoClick();
    else setCurrentStep(Step.DASHBOARD);
  };
  const getFloorGroup = (floorId: string): FloorGroup | undefined => floorGroups.find(g => g.floor === floorId);
  const shouldShowFloor = (floorId: string): boolean => availableFloors.has(floorId);

  const interiorCaptureRoomName = captureTargetRoomId
    ? getInteriorRoomNameById(captureTargetRoomId)
    : undefined;

  return (
    <div className="bg-background min-h-screen">
      <TopBar
        showMenu={true}
        showUserMenu={true}
        userName={userName}
        onMenuClick={() => setMobileMenuOpen(true)}
        onManageProfile={onManageProfile || (() => { })}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={handleLogoClick}
        profilePhoto={profilePhoto}
      />

      <AppSidebar
        currentStep={currentStep}
        handleStepChange={handleStepChange}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentStep={currentStep}
        handleStepChange={handleStepChange}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      {/* Hidden camera inputs for exterior sections */}
      <input
        id="camera-input-voor"
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleCameraCapture}
      />
      <input
        id="camera-input-achter"
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleCameraCapture}
      />
      <input
        id="camera-input-links"
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleCameraCapture}
      />
      <input
        id="camera-input-rechts"
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleCameraCapture}
      />
      <input
        ref={captureSessionInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleTempCameraCapture}
      />

      {/* Hidden camera input for interior rooms */}
      <input
        id="interior-camera-input"
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleInteriorCameraCapture}
      />

      <main className="app-page-main md:ml-64 pb-28">
        <BackToTop />

        <div className="app-shell-content max-w-2xl mx-auto px-4">
          <PageBackLink
            label={t('back.installatie')}
            onClick={() => setCurrentStep(Step.INSTALLATIE)}
          />

          <header className="app-page-title text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">
              {t('photos.title')}
            </h1>

          </header>

          <div className="space-y-4">
            {sectionOrder.map((section) => {
              if (section.type === 'floor') {
                if (!shouldShowFloor(section.id)) return null;
                const floorGroup = getFloorGroup(section.id);
                if (!floorGroup) return null;

                const isExpandedSection = isExpanded(section.id);

                return (
                  <div
                    key={section.id}
                    className="rounded-3xl overflow-hidden shadow-lg transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(15px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(15px) saturate(160%)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div
                      className="p-5 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{section.emoji}</span>
                        <h2 className="font-bold text-lg text-gray-900">
                          {translateUploadFloor(section.id, t)}
                        </h2>
                      </div>
                      <div className="text-gray-500">
                        {isExpandedSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpandedSection && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 space-y-3">
                            {floorGroup.rooms.map((roomItem, roomIdx) => {
                              const photoCount = getInteriorPhotoCount(roomItem.uniqueId, roomItem.name);
                              const totalCategories = getTotalCategoriesCount(roomItem.uniqueId, roomItem.name);
                              const roomProgress = totalCategories > 0 ? (photoCount / totalCategories) * 100 : 0;
                              const isComplete = isInteriorRoomComplete(roomItem.uniqueId, roomItem.name);

                              return (
                                <div
                                  key={roomItem.uniqueId}
                                  onClick={() => openInteriorCapture(roomItem.uniqueId, section.id, roomIdx)}
                                  className={`w-full flex items-center p-4 rounded-2xl transition-all cursor-pointer hover:bg-white/30 ${
                                    !isComplete ? 'border border-amber-500/30 bg-amber-500/5' : ''
                                  }`}
                                  style={{
                                    background: !isComplete ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.2)',
                                    border: !isComplete ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)'
                                  }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                      {getRoomIcon(roomItem.name)}
                                    </div>
                                    <div className="text-left">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 text-sm">
                                          {translateUploadRoom(roomItem.name, t)}
                                        </h4>
                                        {isComplete ? (
                                          <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                                        ) : (
                                          <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 animate-pulse" />
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-600 font-medium">
                                        {photoCount} / {totalCategories} categories
                                      </p>
                                      <div className="w-24 h-1.5 bg-white/30 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                          className="h-full bg-primary rounded-full transition-all"
                                          style={{ width: `${roomProgress}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <div className="pt-2 flex justify-start">
                              <button
                                type="button"
                                onClick={() => setEditRoomsModalOpen(true)}
                                className="px-4 py-2 border border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                              >
                                <Home size={12} />
                                {t('upload.editRoomsButton') || 'Edit House Design Rooms'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              if (section.type === 'exterior') {
                const photos = getExteriorPhotos(section.id);
                const photoCount = photos.length;
                const isExpandedSection = isExpanded(section.id);
                const isEmptyFacade = photoCount === 0;
                const isFacadeRequired = section.id === 'voor' || section.id === 'achter';
                const isFacadeIncomplete = isFacadeRequired && isEmptyFacade;

                const handleFacadeHeaderClick = () => {
                  if (isEmptyFacade) {
                    openCaptureSession({ sectionId: section.id });
                  } else {
                    toggleSection(section.id);
                  }
                };

                return (
                  <div
                    key={section.id}
                    className={`rounded-3xl overflow-hidden shadow-lg transition-all ${isEmptyFacade ? 'cursor-pointer' : ''} ${
                      isFacadeIncomplete ? 'border-amber-500/30' : ''
                    }`}
                    style={{
                      background: isFacadeIncomplete ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(15px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(15px) saturate(160%)',
                      border: isFacadeIncomplete ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    onClick={isEmptyFacade ? () => openCaptureSession({ sectionId: section.id }) : undefined}
                    onKeyDown={
                      isEmptyFacade
                        ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openCaptureSession({ sectionId: section.id });
                          }
                        }
                        : undefined
                    }
                    role={isEmptyFacade ? 'button' : undefined}
                    tabIndex={isEmptyFacade ? 0 : undefined}
                  >
                    <div
                      className="p-5 flex items-center justify-between transition-colors hover:bg-white/10"
                      onClick={(e) => {
                        if (!isEmptyFacade) {
                          e.stopPropagation();
                          handleFacadeHeaderClick();
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📸</span>
                        <h2 className="font-bold text-lg text-gray-900">
                          {getExteriorLabel(section.id)}
                        </h2>
                        {photoCount > 0 ? (
                          <span className="text-xs font-medium bg-white/30 px-2 py-0.5 rounded-full text-gray-700">
                            {photoCount}
                          </span>
                        ) : (
                          isFacadeRequired && (
                            <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
                          )
                        )}
                      </div>
                      {isEmptyFacade ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {t('photos.capturePhoto')}
                        </span>
                      ) : (
                        <div className="text-gray-500">
                          {isExpandedSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {!isEmptyFacade && isExpandedSection && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-sm text-gray-600 font-medium">
                                {t('photos.guide.reviewTitle', { label: getExteriorLabel(section.id) })}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCaptureSession({ sectionId: section.id });
                                }}
                                className={CAMERA_CAPTURE_BTN_CLASS}
                                aria-label={t('photos.guide.reviewTitle', { label: getExteriorLabel(section.id) })}
                              >
                                <Camera size={16} />
                              </button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {photos.map((photo, idx) => (
                                <div key={idx} className="relative flex-shrink-0 group">
                                  <div className="h-10 w-10 overflow-hidden rounded-md border border-white/40 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModal(photos, idx);
                                      }}
                                      className="block h-full w-full"
                                    >
                                      <img
                                        src={photo}
                                        alt={`${getExteriorLabel(section.id)} ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteExteriorPhoto(section.id, idx);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-red-500 p-0.5 text-white shadow-md"
                                  >
                                    <Trash2 size={8} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </main>

      {/* Interior Capture Modal - Glass Effect */}
      {/* Interior Capture Modal - Glass Effect with Swipe Gestures */}
      <AnimatePresence>
        {interiorModalOpen && selectedInteriorRoomId && (() => {
          let roomName = '';
          let roomFloor = '';
          let currentRoomIndexInGroup = currentRoomIndex;
          let totalRooms = 0;

          const floorGroup = floorGroups.find(g => g.floor === currentFloorForModal);
          if (floorGroup) {
            totalRooms = floorGroup.rooms.length;
            const currentRoom = floorGroup.rooms[currentRoomIndexInGroup];
            if (currentRoom) {
              roomName = currentRoom.name;
              roomFloor = translateUploadFloor(currentFloorForModal, t);
            }
          }

          const hasPrevious = currentRoomIndexInGroup > 0;
          const hasNext = floorGroup ? currentRoomIndexInGroup < floorGroup.rooms.length - 1 : false;

          const truncateName = (name: string, maxLength: number = 12) => {
            if (name.length > maxLength) {
              return name.substring(0, maxLength - 3) + '...';
            }
            return name;
          };

          return (
            <div
              className="fixed inset-0 z-[3700] flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[var(--app-topbar-height)] sm:pt-4 bg-black/20 backdrop-blur-sm"
              onClick={closeInteriorModal}
            >
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg mx-2 sm:mx-auto overflow-hidden flex flex-col shadow-2xl max-h-full sm:max-h-[85vh] min-h-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(25px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Specular Highlight - Top Edge */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] z-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)'
                  }}
                />

                {/* Modal Header */}
                <div
                  className="relative p-4 border-b border-white/20 flex justify-between items-center"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div>
                    <h2 className="font-black text-lg text-gray-900 tracking-tight">
                      {translateUploadRoom(roomName, t)}
                    </h2>
                    <p className="text-xs text-gray-600 font-medium">{roomFloor}</p>
                  </div>
                  <div className="bg-white/40 border border-white/50 px-3 py-1 rounded-full text-sm font-bold text-gray-700 whitespace-nowrap">
                    {currentRoomIndexInGroup + 1} / {totalRooms}
                  </div>
                </div>

                {/* Modal Content - with Swipe Gestures */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, info) => {
                    const swipeThreshold = 50;
                    if (info.offset.x > swipeThreshold && hasPrevious) {
                      goToPreviousRoom();
                    } else if (info.offset.x < -swipeThreshold && hasNext) {
                      goToNextRoom();
                    }
                  }}
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4"
                >
                  {(() => {
                    const categories = getCategoriesForRoom(selectedInteriorRoomId, roomName);
                    type Row =
                      | { kind: 'category'; category: string }
                      | { kind: 'add'; base: string; variant: 'door' | 'window' };

                    const rows: Row[] = [];
                    categories.forEach((category, idx) => {
                      rows.push({ kind: 'category', category });
                      if (!isPhotoCaptureMultiInstanceCategory(category)) return;
                      const next = categories[idx + 1];
                      if (!next || getPhotoCaptureCategoryBase(next) !== getPhotoCaptureCategoryBase(category)) {
                        rows.push({
                          kind: 'add',
                          base: getPhotoCaptureCategoryBase(category),
                          variant: isPhotoCaptureDoorCategory(category) ? 'door' : 'window',
                        });
                      }
                    });

                    return rows.map((row, idx) => {
                      if (row.kind === 'add') {
                        return (
                          <button
                            key={`add-${row.base}-${idx}`}
                            type="button"
                            onClick={() =>
                              addExtraCategoryInstance(selectedInteriorRoomId, roomName, row.base)
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/40 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-700 transition-all hover:bg-white/25 active:scale-[0.99]"
                          >
                            <Plus size={14} />
                            {row.variant === 'door'
                              ? t('photos.category.addAnotherDoor')
                              : t('photos.category.addAnotherWindow')}
                          </button>
                        );
                      }

                      const { category } = row;
                      const photos = interiorPhotos[selectedInteriorRoomId]?.[category] || [];
                      const isCatPhotosComplete = photos.length > 0;
                      let isCatQuestionsComplete = true;
                      if (selectedRole !== UserRole.CLIENT) {
                        if (isPhotoCaptureDoorCategory(category)) {
                          const doorVal = getCategoryDetail(selectedInteriorRoomId, category).doorIsolated;
                          if (doorVal !== true && doorVal !== false) isCatQuestionsComplete = false;
                        }
                        if (isPhotoCaptureWindowCategory(category)) {
                          const glass = getCategoryDetail(selectedInteriorRoomId, category).glassType;
                          const frame = getCategoryDetail(selectedInteriorRoomId, category).frameType;
                          if (!glass || !frame) isCatQuestionsComplete = false;
                        }
                      }
                      const isCatComplete = isCatPhotosComplete && isCatQuestionsComplete;
                      
                      const isExtraInstance = getPhotoCaptureCategoryNumber(category) > 1;
                      const categoryLabel = translatePhotoCategory(category, t, {
                        siblingCount: countPhotoCaptureCategoryInstances(
                          categories,
                          getPhotoCaptureCategoryBase(category),
                        ),
                      });

                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openCaptureSession({
                                  roomId: selectedInteriorRoomId,
                                  category,
                                })
                              }
                              className={`flex flex-1 items-center gap-2 rounded-xl border transition-all hover:bg-white/40 active:scale-[0.99] ${
                                !isCatComplete
                                  ? 'border-amber-500/30 bg-amber-500/5 text-amber-900'
                                  : 'border-white/30 bg-white/20 text-gray-800'
                              }`}
                            >
                              <span
                                className="flex-1 truncate font-bold text-sm"
                                title={categoryLabel}
                              >
                                {categoryLabel}
                              </span>
                              {isCatComplete ? (
                                <CheckCircle size={12} className="flex-shrink-0 text-emerald-500" />
                              ) : (
                                <AlertTriangle size={12} className="flex-shrink-0 text-amber-500 animate-pulse" />
                              )}
                            </button>
                            {isExtraInstance && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeExtraCategoryInstance(
                                    selectedInteriorRoomId,
                                    roomName,
                                    category,
                                  )
                                }
                                className="flex-shrink-0 rounded-lg border border-white/40 bg-white/20 p-2 text-gray-600 hover:bg-red-500/20 hover:text-red-600"
                                aria-label={t('common.delete')}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          {photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 pt-1 pl-1">
                              {photos.map((photo: string, pIdx: number) => (
                                <div key={pIdx} className="relative flex-shrink-0 group">
                                  <div className="h-10 w-10 overflow-hidden rounded-md border border-white/40 bg-white/10 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => openModal(photos, pIdx)}
                                      className="block h-full w-full"
                                    >
                                      <img
                                        src={photo}
                                        alt={`${categoryLabel} ${pIdx + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteInteriorPhoto(selectedInteriorRoomId, category, pIdx)
                                    }
                                    className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-red-500 p-0.5 text-white shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    aria-label={t('photos.deletePhoto')}
                                  >
                                    <Trash2 size={8} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </motion.div>

                {/* Modal Footer — room strip + DONE */}
                <div
                  className="p-4 border-t border-white/20"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5">
                      {floorGroup?.rooms.map((room, roomIdx) => {
                        const isActive = roomIdx === currentRoomIndexInGroup;
                        return (
                          <button
                            key={room.uniqueId}
                            type="button"
                            onClick={() => goToRoomAtIndex(roomIdx)}
                            className={`flex-shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${isActive
                              ? 'bg-primary text-white shadow-md'
                              : 'border border-white/50 bg-white/40 text-gray-700 hover:bg-white/60'
                              }`}
                            title={room.name}
                          >
                            {truncateName(translateUploadRoom(room.name, t), 12)}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={closeInteriorModal}
                      className="flex-shrink-0 min-w-[80px] py-3 bg-primary text-white rounded-2xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-primary/20 hover:brightness-110 transition-all px-4"
                    >
                      {t('common.close').toUpperCase()}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {photoMediaGuide && (
        <MediaInstructionModal
          open={mediaGuideOpen}
          step={mediaGuideStep}
          onClose={closeMediaGuide}
          entry={photoMediaGuide}
          variant="camera"
          pendingFiles={pendingGuidePhotos.map((url, idx) => ({
            url,
            type: 'image/jpeg',
            name: `photo-${idx + 1}.jpg`,
            size: 0,
          }))}
          onRemovePending={removePendingGuidePhoto}
          onContinueFromInstructions={triggerMediaGuidePicker}
          onAddMore={triggerMediaGuidePicker}
          onDone={handleMediaGuideDone}
          reviewKeyPrefix="photos.guide"
          contextLabel={
            captureTargetSection
              ? getExteriorLabel(captureTargetSection)
              : captureTargetCategory && interiorCaptureRoomName && captureTargetRoomId
                ? `${translateUploadRoom(interiorCaptureRoomName, t)} — ${translatePhotoCategory(captureTargetCategory, t, {
                  siblingCount: countPhotoCaptureCategoryInstances(
                    getCategoriesForRoom(captureTargetRoomId, interiorCaptureRoomName),
                    getPhotoCaptureCategoryBase(captureTargetCategory),
                  ),
                })}`
                : captureTargetCategory
                  ? translatePhotoCategory(captureTargetCategory, t)
                  : undefined
          }
          exampleImageUrl={
            captureTargetSection
              ? photoExteriorExampleImageUrl(captureTargetSection)
              : interiorCaptureRoomName && captureTargetCategory
                ? photoInteriorExampleImageUrl(interiorCaptureRoomName, captureTargetCategory)
                : undefined
          }
          layout="bottomSheet"
          zIndex={3700}
          reviewChildren={
            mediaGuideStep === 'review' &&
              captureTargetRoomId &&
              captureTargetCategory &&
              pendingGuidePhotos.length > 0
              ? renderCategoryQuestions(captureTargetRoomId, captureTargetCategory)
              : null
          }
        />
      )}

      <PhotoViewerModal
        open={photoViewer.isOpen}
        onClose={photoViewer.close}
        slides={slidesFromUrls(viewerPhotoUrls)}
        index={photoViewer.index}
        onPrev={() => photoViewer.prev(viewerPhotoUrls.length)}
        onNext={() => photoViewer.next(viewerPhotoUrls.length)}
        onImageError={photoViewer.close}
      />

      <AnimatePresence>
        {editRoomsModalOpen && (
          <HouseDesignRoomsModal
            open={editRoomsModalOpen}
            onClose={() => setEditRoomsModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <StepContinueFooter onClick={handleContinue} label={t('photos.continueReview')} />

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}