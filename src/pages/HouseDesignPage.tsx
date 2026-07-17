// src/pages/HouseDesignPage.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, HelpCircle, Camera, X, ArrowRight, CloudUpload, Plus, Trash2, ChevronDown, ChevronUp, FileText, Search, AlertTriangle } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { BackToTop } from '../components/common/BackToTop';
import { StepContinueFooter } from '../components/common/StepContinueFooter';
import { PageBackLink } from '../components/common/PageBackLink';
import { PhotoViewerModal } from '../components/common/PhotoViewerModal';
import { Toast } from '../components/common/Toast';
import { Step, UserRole } from '../types';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import {
  translateUploadConstruction,
  translateUploadFloor,
  translateUploadRoom,
} from '../i18n/translateOptions';
import {
  filesToPersistedUploads,
  revokeFileUrlIfBlob,
  sanitizePersistedFiles,
} from '../utils/persistedFileUrl';
import { AppSelect } from '../components/common/AppSelect';
import { buildInteriorFloorSections } from '../utils/interiorRoomsFromUpload';
import { syncRoomRemovalAcrossApp } from '../utils/roomDeleteSync';
import {
  KELDER_KEY,
  buildFloorRoomChipGroups,
  computeRoomAddPlan,
  computeRoomDeletePlan,
  defaultRoomCategories,
  generateRoomSuggestions,
  getEffectiveStandardRooms,
  normalizeRoomName,
  pruneTopFloorOnlyRoomRecords,
  reconcileHouseDesignRoomMeta,
  getRoomBaseName,
  type RoomChipItem,
  type RoomSuggestion,
} from '../utils/houseDesignRooms';
import {
  loadHouseDesignAlgemeenHints,
  loadHouseDesignPageRaw,
  loadHouseDesignFilesFromStorage,
  saveHouseDesignPageMetaToStorage,
  saveHouseDesignFilesToStorage,
  type HouseDesignFileEntry,
} from '../storage/houseDesignPageData';
import {
  MediaInstructionModal,
  type MediaInstructionStep,
} from '../components/common/MediaInstructionModal';
import {
  getMediaInstruction,
  type MediaInstructionVariant,
} from '../config/mediaInstructions';
import { mediaExampleImageUrl } from '../config/mediaExampleImages';
import { usePhotoViewer } from '../hooks/usePhotoViewer';
import { slidesFromUrlFiles } from '../utils/photoViewer';

interface HouseDesignPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  /** From Algemeen: if false, floor-plan uploads are not required on this step */
  hasFloorPlans: boolean | null;
  selectedRole: UserRole;
  vloerenType: string;
  setVloerenType: (v: string) => void;
  wandenType: string;
  setWandenType: (v: string) => void;
  gboT: string;
  setGboT: (v: string) => void;
  leidingdoorvoeren: string;
  setLeidingdoorvoeren: (v: string) => void;
  avr: string;
  setAvr: (v: string) => void;
  profilePhoto?: string;
}

type UploadedFile = HouseDesignFileEntry;

type Suggestion = RoomSuggestion;

function getDisplaySectionKeys(
  numberOfFloors: number,
  hasKelder: boolean | null,
  startFloorKey: string,
): string[] {
  return buildInteriorFloorSections(numberOfFloors, hasKelder === true, startFloorKey);
}

function pruneRecordToKeys<T extends string[]>(
  record: Record<string, T>,
  allowedKeys: string[],
): Record<string, T> {
  const allowed = new Set(allowedKeys);
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (allowed.has(key) && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

/** Custom room chips only exist while selected — keep lists aligned. */
function syncCustomRoomsToSelected(
  selectedCustom: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [floor, rooms] of Object.entries(selectedCustom)) {
    if (rooms.length > 0) result[floor] = [...rooms];
  }
  return result;
}

function sanitizeRoomMeta(
  meta: {
    selectedRooms: Record<string, string[]>;
    customRooms: Record<string, string[]>;
    selectedCustomRooms: Record<string, string[]>;
    suppressedStandardRooms: Record<string, string[]>;
  },
  allowedKeys: string[],
): {
  selectedRooms: Record<string, string[]>;
  customRooms: Record<string, string[]>;
  selectedCustomRooms: Record<string, string[]>;
  suppressedStandardRooms: Record<string, string[]>;
} {
  const selectedRooms = pruneRecordToKeys(meta.selectedRooms, allowedKeys);
  const selectedCustomRooms = pruneRecordToKeys(meta.selectedCustomRooms, allowedKeys);
  const customRooms = syncCustomRoomsToSelected(selectedCustomRooms);
  const suppressedStandardRooms = pruneRecordToKeys(meta.suppressedStandardRooms, allowedKeys);
  return { selectedRooms, customRooms, selectedCustomRooms, suppressedStandardRooms };
}

function clearFloorsFromRecord<T extends string[]>(
  record: Record<string, T>,
  floorKeys: string[],
): Record<string, T> {
  if (floorKeys.length === 0) return record;
  const next = { ...record };
  for (const key of floorKeys) {
    delete next[key];
  }
  return next;
}

/** If Kelder already has numbered VLOERISOLATIE entries, hide the duplicate default pill. */
function repairKelderRoomState(
  customByFloor: Record<string, string[]>,
  suppressed: Record<string, string[]>,
  selectedRooms: Record<string, string[]>,
): { suppressed: Record<string, string[]>; selectedRooms: Record<string, string[]> } {
  const kelderCustom = customByFloor[KELDER_KEY] || [];
  const hasNumbered = kelderCustom.some((room) => /^VLOERISOLATIE \d+$/i.test(room));
  if (!hasNumbered) {
    return { suppressed, selectedRooms };
  }

  const kelderSuppressed = new Set(suppressed[KELDER_KEY] || []);
  kelderSuppressed.add('VLOERISOLATIE');

  const kelderSelected = selectedRooms[KELDER_KEY] || [];
  const nextSelected =
    kelderSelected.length > 0
      ? {
          ...selectedRooms,
          [KELDER_KEY]: kelderSelected.filter((room) => room !== 'VLOERISOLATIE'),
        }
      : selectedRooms;

  return {
    suppressed: { ...suppressed, [KELDER_KEY]: [...kelderSuppressed] },
    selectedRooms: nextSelected,
  };
}

function createInitialUploadState() {
  const hints = loadHouseDesignAlgemeenHints();
  const allowedKeys = getDisplaySectionKeys(
    hints.numberOfFloors,
    hints.hasKelder,
    hints.startFloorKey,
  );
  const parsed = loadHouseDesignPageRaw();
  const loadedRooms = parsed.selectedRooms || {};
  const hasAnyRoom = Object.values(loadedRooms).some(
    (rooms) => Array.isArray(rooms) && rooms.length > 0,
  );
  
  const startFloorChanged = parsed.startFloorKey
    ? parsed.startFloorKey !== hints.startFloorKey
    : (hasAnyRoom && (
        !loadedRooms[hints.startFloorKey] ||
        Object.entries(loadedRooms).some(([floor, rooms]) => 
          floor !== hints.startFloorKey && rooms.some(r => r === 'MK' || r === 'WOONKAMER' || r === 'KEUKEN')
        )
      ));
  const initialSelected = (hasAnyRoom && !startFloorChanged)
    ? loadedRooms
    : { [hints.startFloorKey]: ['HAL', 'MK'] };
    
  const repaired = startFloorChanged
    ? { suppressed: {}, selectedRooms: initialSelected }
    : repairKelderRoomState(
        parsed.customRooms || {},
        parsed.suppressedStandardRooms || {},
        initialSelected,
      );

  const reconciled = reconcileHouseDesignRoomMeta(
    {
      selectedRooms: repaired.selectedRooms,
      customRooms: startFloorChanged ? {} : (parsed.customRooms || {}),
      selectedCustomRooms: startFloorChanged ? {} : (parsed.selectedCustomRooms || {}),
      suppressedStandardRooms: repaired.suppressed,
    },
    allowedKeys,
    hints.startFloorKey,
    hints.numberOfFloors,
  );

  const rooms = sanitizeRoomMeta(reconciled, allowedKeys);

  return {
    uploadedFiles: [],
    ...rooms,
  };
}

export const HouseDesignPage = ({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  hasFloorPlans,
  selectedRole,
  vloerenType,
  setVloerenType,
  wandenType,
  setWandenType,
  gboT,
  setGboT,
  leidingdoorvoeren,
  setLeidingdoorvoeren,
  avr,
  setAvr,
  profilePhoto,
}: HouseDesignPageProps) => {
  const { t } = useLanguage();
  const initialUploadRef = useRef<ReturnType<typeof createInitialUploadState> | null>(null);
  if (initialUploadRef.current === null) {
    initialUploadRef.current = createInitialUploadState();
  }
  const uploadInit = initialUploadRef.current;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(uploadInit.uploadedFiles);
  const [selectedRooms, setSelectedRooms] = useState<{ [key: string]: string[] }>(
    uploadInit.selectedRooms,
  );
  const [customRooms, setCustomRooms] = useState<{ [key: string]: string[] }>(uploadInit.customRooms);
  const [selectedCustomRooms, setSelectedCustomRooms] = useState<{ [key: string]: string[] }>(
    uploadInit.selectedCustomRooms,
  );
  /** Standard room ids hidden on a floor after renumbering to `ROOM 1` in custom list. */
  const [suppressedStandardRooms, setSuppressedStandardRooms] = useState<Record<string, string[]>>(
    uploadInit.suppressedStandardRooms,
  );
  const photoViewer = usePhotoViewer();
  const [activeAddFloor, setActiveAddFloor] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [numberOfFloors, setNumberOfFloors] = useState(
    () => loadHouseDesignAlgemeenHints().numberOfFloors,
  );
  const [hasKelder, setHasKelder] = useState<boolean | null>(
    () => loadHouseDesignAlgemeenHints().hasKelder,
  );
  const [startFloorKey, setStartFloorKey] = useState<string>(
    () => loadHouseDesignAlgemeenHints().startFloorKey,
  );
  const [expandedFloor, setExpandedFloor] = useState<string | null>(null);
  const [didAutoExpand, setDidAutoExpand] = useState(false);

  useEffect(() => {
    if (didAutoExpand) return;

    if (hasKelder === true) {
      const kelderStandardSelected = (selectedRooms[KELDER_KEY] || []).length;
      const kelderCustomSelected = (selectedCustomRooms[KELDER_KEY] || []).length;
      const kelderSelectedRooms = kelderStandardSelected + kelderCustomSelected;
      if (kelderSelectedRooms === 0) {
        setExpandedFloor(KELDER_KEY);
        setDidAutoExpand(true);
        return;
      }
    }

    const totalSelected = Object.values(selectedRooms).flat().length +
                          Object.values(selectedCustomRooms).flat().length;
    if (totalSelected === 0) {
      setExpandedFloor(startFloorKey);
    }
    setDidAutoExpand(true);
  }, [hasKelder, startFloorKey, selectedRooms, selectedCustomRooms, didAutoExpand]);
  const lastSectionKeysRef = useRef<string[]>(
    getDisplaySectionKeys(numberOfFloors, hasKelder, startFloorKey),
  );
  const lastStartFloorKeyRef = useRef<string>(startFloorKey);

  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { toast, setToast, showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const filesHydratedRef = useRef(false);
  const uploadedFilesRef = useRef<UploadedFile[]>([]);
  const [mediaGuideOpen, setMediaGuideOpen] = useState(false);
  const [mediaGuideStep, setMediaGuideStep] = useState<MediaInstructionStep>('instructions');
  const [mediaGuideVariant, setMediaGuideVariant] = useState<MediaInstructionVariant>('camera');
  const [pendingGuideFiles, setPendingGuideFiles] = useState<UploadedFile[]>([]);
  const uploadMediaGuide = getMediaInstruction('upload', mediaGuideVariant);

  useEffect(() => {
    const hints = loadHouseDesignAlgemeenHints();
    const newSections = getDisplaySectionKeys(
      hints.numberOfFloors,
      hints.hasKelder,
      hints.startFloorKey,
    );
    const prevSections = new Set(lastSectionKeysRef.current);
    const addedSections = newSections.filter((key) => !prevSections.has(key));
    const allowedSet = new Set(newSections);

    setNumberOfFloors(hints.numberOfFloors);
    setHasKelder(hints.hasKelder);
    setStartFloorKey(hints.startFloorKey);

    const startFloorChanged = hints.startFloorKey !== lastStartFloorKeyRef.current;
    if (startFloorChanged) {
      lastStartFloorKeyRef.current = hints.startFloorKey;
      setSelectedRooms({ [hints.startFloorKey]: ['HAL', 'MK'] });
      setSelectedCustomRooms({});
      setCustomRooms({});
      setSuppressedStandardRooms({});
      lastSectionKeysRef.current = newSections;
      return;
    }

    const applyFloorBoundary = <T extends string[]>(record: Record<string, T>) => {
      let next = clearFloorsFromRecord(record, addedSections);
      const pruned: Record<string, T> = {};
      for (const [key, value] of Object.entries(next)) {
        if (allowedSet.has(key) && value.length > 0) {
          pruned[key] = value;
        }
      }
      return pruned;
    };

    const sectionsChanged =
      addedSections.length > 0 ||
      newSections.length !== lastSectionKeysRef.current.length ||
      newSections.some((key) => !prevSections.has(key));

    if (sectionsChanged) {
      setSelectedCustomRooms((prev) => applyFloorBoundary(prev));
      setCustomRooms((prev) => applyFloorBoundary(prev));
      setSuppressedStandardRooms((prev) => applyFloorBoundary(prev));
    }

    const pruneTopFloorRooms = (record: Record<string, string[]>) =>
      pruneTopFloorOnlyRoomRecords(
        record,
        newSections,
        hints.startFloorKey,
        hints.numberOfFloors,
      );

    setSelectedCustomRooms((prev) => {
      const bounded = sectionsChanged ? applyFloorBoundary(prev) : prev;
      const next = pruneTopFloorRooms(bounded);
      const prevFlat = Object.values(bounded).flat().sort().join();
      const nextFlat = Object.values(next).flat().sort().join();
      if (Object.keys(bounded).sort().join() === Object.keys(next).sort().join() && prevFlat === nextFlat) {
        return prev;
      }
      return next;
    });

    setCustomRooms((prev) => {
      const bounded = sectionsChanged ? applyFloorBoundary(prev) : prev;
      const next = pruneTopFloorRooms(bounded);
      const prevFlat = Object.values(bounded).flat().sort().join();
      const nextFlat = Object.values(next).flat().sort().join();
      if (Object.keys(bounded).sort().join() === Object.keys(next).sort().join() && prevFlat === nextFlat) {
        return prev;
      }
      return next;
    });

    setSelectedRooms((prev) => {
      const bounded = sectionsChanged ? applyFloorBoundary(prev) : prev;
      const next =
        reconcileHouseDesignRoomMeta(
          { selectedRooms: bounded, selectedCustomRooms: {}, customRooms: {}, suppressedStandardRooms: {} },
          newSections,
          hints.startFloorKey,
          hints.numberOfFloors,
        ).selectedRooms ?? {};
      const prevFlat = Object.values(bounded).flat().sort().join();
      const nextFlat = Object.values(next).flat().sort().join();
      if (Object.keys(bounded).sort().join() === Object.keys(next).sort().join() && prevFlat === nextFlat) {
        return prev;
      }
      return next;
    });

    lastSectionKeysRef.current = newSections;
  }, [currentStep]);

  useEffect(() => {
    let cancelled = false;
    void loadHouseDesignFilesFromStorage().then((files) => {
      if (cancelled) return;
      setUploadedFiles((prev) => {
        const merged = prev.length > 0 ? prev : files;
        uploadedFilesRef.current = merged;
        return merged;
      });
      filesHydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const allowedKeys = getDisplaySectionKeys(numberOfFloors, hasKelder, startFloorKey);
      saveHouseDesignPageMetaToStorage({
        ...sanitizeRoomMeta(
          { selectedRooms, customRooms, selectedCustomRooms, suppressedStandardRooms },
          allowedKeys,
        ),
        startFloorKey,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedRooms, customRooms, selectedCustomRooms, suppressedStandardRooms, numberOfFloors, hasKelder, startFloorKey]);

  useEffect(() => {
    if (!filesHydratedRef.current) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void saveHouseDesignFilesToStorage(uploadedFiles).catch(() => {
        if (!cancelled) {
          showToast(t('upload.toast.storageQuotaFailed'), 'error');
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [uploadedFiles, showToast, t]);

  useEffect(() => {
    return () => {
      if (filesHydratedRef.current) {
        void saveHouseDesignFilesToStorage(uploadedFilesRef.current);
      }
    };
  }, []);

  // Get all display sections (Kelder first when on BG, then from Algemeen start floor)
  const getDisplaySections = (): string[] => {
    return buildInteriorFloorSections(numberOfFloors, hasKelder === true, startFloorKey);
  };

  const getStandardRoomsForFloor = (floor: string): string[] => {
    return getEffectiveStandardRooms(floor, suppressedStandardRooms[floor] || [], startFloorKey);
  };

  // Get all rooms for a floor (standard + custom)
  const getAllRoomsForFloor = (floor: string) => {
    const standardRooms = getStandardRoomsForFloor(floor);
    const custom = customRooms[floor] || [];
    return [...standardRooms, ...custom];
  };

  // Helper functions for collapsible cards
  const getSelectedCount = (floor: string) => {
    const suppressed = suppressedStandardRooms[floor] || [];
    const standardCount = (selectedRooms[floor] || []).filter(
      (room) => !suppressed.includes(room),
    ).length;
    const customCount = (selectedCustomRooms[floor] || []).length;
    return standardCount + customCount;
  };

  const getSelectedRoomList = (floor: string): string[] => {
    const suppressed = suppressedStandardRooms[floor] || [];
    const standard = (selectedRooms[floor] || []).filter((room) => !suppressed.includes(room));
    const custom = selectedCustomRooms[floor] || [];
    return [...standard, ...custom];
  };

  const toggleFloor = (floor: string) => {
    setExpandedFloor(expandedFloor === floor ? null : floor);
  };

  // Generate room suggestions based on user input
  const generateSuggestions = (input: string, floor: string): Suggestion[] =>
    generateRoomSuggestions(input, getAllRoomsForFloor(floor));

  // Handle input change for new room
  const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>, floor: string) => {
    const value = e.target.value;
    setNewRoomName(value);
    
    if (value.trim()) {
      const newSuggestions = generateSuggestions(value, floor);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const appendCustomRoom = (floor: string, rawName: string) => {
    const plan = computeRoomAddPlan(
      floor,
      rawName,
      suppressedStandardRooms[floor] || [],
      customRooms[floor] || [],
      selectedRooms[floor] || [],
      selectedCustomRooms[floor] || [],
    );

    setSuppressedStandardRooms((prev) => ({ ...prev, [floor]: plan.suppressedStandardRooms }));
    setCustomRooms((prev) => {
      const next = { ...prev, [floor]: plan.customRooms };
      if (plan.customRooms.length === 0) delete next[floor];
      return next;
    });
    setSelectedRooms((prev) => {
      const next = { ...prev, [floor]: plan.selectedRooms };
      if (plan.selectedRooms.length === 0) delete next[floor];
      return next;
    });
    setSelectedCustomRooms((prev) => {
      const next = { ...prev, [floor]: plan.selectedCustomRooms };
      if (plan.selectedCustomRooms.length === 0) delete next[floor];
      return next;
    });

    setNewRoomName('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveAddFloor(null);
    showToast(t('upload.toast.roomAdded', { name: plan.addedRoom }), 'success');
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: Suggestion, floor: string) => {
    appendCustomRoom(floor, suggestion.name);
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent, floor: string) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && newRoomName.trim()) {
        addCustomRoom(floor);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex], floor);
        } else if (suggestions.length > 0) {
          selectSuggestion(suggestions[0], floor);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newFiles = await filesToPersistedUploads(Array.from(files));
        if (mediaGuideOpen) {
          setPendingGuideFiles((prev) => [...prev, ...newFiles]);
          setMediaGuideStep('review');
        } else {
          setUploadedFiles((prev) => [...prev, ...newFiles]);
          showToast(t('upload.toast.filesUploaded', { count: files.length }), 'success');
        }
      } catch {
        showToast(t('upload.toast.filesUploadFailed'), 'error');
      }
    }
    e.target.value = '';
  };

  // Handle camera capture
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newFiles = await filesToPersistedUploads(Array.from(files));
        if (mediaGuideOpen) {
          setPendingGuideFiles((prev) => [...prev, ...newFiles]);
          setMediaGuideStep('review');
        } else {
          setUploadedFiles((prev) => [...prev, ...newFiles]);
          showToast(t('upload.toast.photoCaptured'), 'success');
        }
      } catch {
        showToast(t('upload.toast.filesUploadFailed'), 'error');
      }
    }
    e.target.value = '';
  };

  // Delete file
  const deleteFile = (index: number) => {
    revokeFileUrlIfBlob(uploadedFiles[index].url);
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    showToast(t('upload.toast.fileDeleted'), 'success');
  };

  const discardPendingGuideFiles = () => {
    pendingGuideFiles.forEach((file) => revokeFileUrlIfBlob(file.url));
    setPendingGuideFiles([]);
  };

  const closeMediaGuide = () => {
    discardPendingGuideFiles();
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
  };



  const openMediaGuide = (variant: MediaInstructionVariant) => {
    discardPendingGuideFiles();
    setMediaGuideVariant(variant);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(true);
  };

  const triggerMediaGuidePicker = () => {
    if (mediaGuideVariant === 'camera') {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleContinueFromInstructions = (selectedVariant?: 'camera' | 'upload') => {
    if (selectedVariant) {
      setMediaGuideVariant(selectedVariant);
      setTimeout(() => {
        if (selectedVariant === 'camera') {
          cameraInputRef.current?.click();
        } else {
          fileInputRef.current?.click();
        }
      }, 100);
    } else {
      triggerMediaGuidePicker();
    }
  };

  const removePendingGuideFile = (index: number) => {
    const file = pendingGuideFiles[index];
    if (file) revokeFileUrlIfBlob(file.url);
    setPendingGuideFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMediaGuideDone = () => {
    const count = pendingGuideFiles.length;
    if (count === 0) return;
    setUploadedFiles((prev) => [...prev, ...pendingGuideFiles]);
    setPendingGuideFiles([]);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
    showToast(t('upload.toast.filesUploaded', { count }), 'success');
  };

  const openUploadedFile = (fileIndex: number) => {
    if (!uploadedFiles[fileIndex]) return;
    photoViewer.openAt(fileIndex);
  };

  const renderFloorPlanThumbnailStrip = () => {
    if (uploadedFiles.length === 0) return null;

    return (
      <div className="flex gap-2 overflow-x-auto border-gray-200/80 pb-1 pt-1.5">
        {uploadedFiles.map((file, idx) => (
          <div
            key={`${file.url}-${idx}`}
            className="relative flex-shrink-0 group"
            title={file.name}
          >
            <div className="h-10 w-10 rounded-md border border-gray-200 bg-gray-50 overflow-hidden">
              {file.type === 'application/pdf' ? (
                <button
                  type="button"
                  onClick={() => openUploadedFile(idx)}
                  className="flex h-full w-full flex-col items-center justify-center border-red-200 bg-red-50 transition-colors hover:border-red-400"
                >
                  <FileText size={14} className="text-red-500" />
                  <span className="mt-0.5 text-[7px] font-bold text-red-500">PDF</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openUploadedFile(idx)}
                  className="block h-full w-full transition-all hover:opacity-80"
                >
                  <img
                    src={file.url}
                    alt={t('upload.floorPlanAlt', { n: idx + 1 })}
                    className="h-full w-full object-cover"
                  />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteFile(idx);
              }}
              className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-red-500 p-0.5 text-white shadow-md opacity-100 transition-colors hover:bg-red-600 md:opacity-0 md:group-hover:opacity-100"
              aria-label={t('common.delete')}
            >
              <Trash2 size={8} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const persistRoomMetaAndSyncRemoval = (
    floor: string,
    removedRoom: string,
    renamedRooms: { from: string; to: string }[],
    nextMeta: {
      selectedRooms: Record<string, string[]>;
      customRooms: Record<string, string[]>;
      selectedCustomRooms: Record<string, string[]>;
      suppressedStandardRooms: Record<string, string[]>;
    },
  ) => {
    const allowedKeys = getDisplaySectionKeys(numberOfFloors, hasKelder, startFloorKey);
    saveHouseDesignPageMetaToStorage(sanitizeRoomMeta(nextMeta, allowedKeys));
    syncRoomRemovalAcrossApp(floor, removedRoom, renamedRooms);
  };

  // Toggle room selection (for standard rooms)
  const toggleRoom = (floor: string, room: string) => {
    const current = selectedRooms[floor] || [];
    const isRemoving = current.includes(room);

    if (isRemoving) {
      const next = current.filter((r) => r !== room);
      const nextSelectedRooms = { ...selectedRooms };
      if (next.length === 0) {
        delete nextSelectedRooms[floor];
      } else {
        nextSelectedRooms[floor] = next;
      }
      setSelectedRooms(nextSelectedRooms);
      persistRoomMetaAndSyncRemoval(floor, room, [], {
        selectedRooms: nextSelectedRooms,
        customRooms,
        selectedCustomRooms,
        suppressedStandardRooms,
      });
      return;
    }

    setSelectedRooms((prev) => ({ ...prev, [floor]: [...current, room] }));
  };

  const applyCustomRoomDelete = (floor: string, roomName: string, notify: boolean) => {
    const plan = computeRoomDeletePlan(
      floor,
      roomName,
      suppressedStandardRooms[floor] || [],
      customRooms[floor] || [],
      selectedRooms[floor] || [],
      selectedCustomRooms[floor] || [],
    );

    const nextSuppressedStandardRooms = { ...suppressedStandardRooms };
    if (plan.suppressedStandardRooms.length > 0) {
      nextSuppressedStandardRooms[floor] = plan.suppressedStandardRooms;
    } else {
      delete nextSuppressedStandardRooms[floor];
    }

    const nextCustomRooms = { ...customRooms };
    if (plan.customRooms.length > 0) {
      nextCustomRooms[floor] = plan.customRooms;
    } else {
      delete nextCustomRooms[floor];
    }

    const nextSelectedRooms = { ...selectedRooms };
    if (plan.selectedRooms.length > 0) {
      nextSelectedRooms[floor] = plan.selectedRooms;
    } else {
      delete nextSelectedRooms[floor];
    }

    const nextSelectedCustomRooms = { ...selectedCustomRooms };
    if (plan.selectedCustomRooms.length > 0) {
      nextSelectedCustomRooms[floor] = plan.selectedCustomRooms;
    } else {
      delete nextSelectedCustomRooms[floor];
    }

    setSuppressedStandardRooms(nextSuppressedStandardRooms);
    setCustomRooms(nextCustomRooms);
    setSelectedRooms(nextSelectedRooms);
    setSelectedCustomRooms(nextSelectedCustomRooms);

    persistRoomMetaAndSyncRemoval(floor, roomName, plan.renamedRooms, {
      selectedRooms: nextSelectedRooms,
      customRooms: nextCustomRooms,
      selectedCustomRooms: nextSelectedCustomRooms,
      suppressedStandardRooms: nextSuppressedStandardRooms,
    });

    if (notify) {
      showToast(t('upload.toast.roomDeleted', { name: roomName }), 'success');
    }
  };

  // Unselecting a custom room removes it entirely from this floor
  const toggleCustomRoom = (floor: string, roomName: string) => {
    applyCustomRoomDelete(floor, roomName, false);
  };

  // Add custom room — auto-numbers when the name already exists on this floor
  const addCustomRoom = (floor: string) => {
    if (!newRoomName.trim()) {
      showToast(t('upload.toast.roomNameRequired'), 'error');
      return;
    }

    appendCustomRoom(floor, newRoomName.trim());
  };

  // Delete custom room — collapses `BASE 1` → `BASE` when it is the only one left
  const deleteCustomRoom = (floor: string, roomName: string) => {
    applyCustomRoomDelete(floor, roomName, true);
  };

  const handleRoomChipClick = (floor: string, chip: RoomChipItem) => {
    if (chip.isNext) {
      appendCustomRoom(floor, chip.room);
      return;
    }
    if (chip.isStandardChip) {
      toggleRoom(floor, chip.room);
      return;
    }
    if (chip.selected) {
      toggleCustomRoom(floor, chip.room);
    }
  };

  const renderRoomChip = (floor: string, chip: RoomChipItem) => {
    const label = translateUploadRoom(chip.room, t);
    const baseClass =
      'px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all';

    if (chip.isNext) {
      return (
        <button
          key={chip.room}
          type="button"
          onClick={() => handleRoomChipClick(floor, chip)}
          className={`${baseClass} border-2 border-dashed border-primary bg-primary/5 text-primary hover:bg-primary/10`}
        >
          {label}
        </button>
      );
    }

    const isSelected = chip.selected;
    const showTrash = !chip.isStandardChip && isSelected;

    return (
      <div key={chip.room} className="relative group">
        <button
          type="button"
          onClick={() => handleRoomChipClick(floor, chip)}
          className={`${baseClass} ${
            isSelected
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
        {showTrash && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteCustomRoom(floor, chip.room);
            }}
            className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-red-500 p-0.5 text-white shadow-md transition-colors hover:bg-red-600"
            aria-label={t('common.delete')}
          >
            <Trash2 size={8} />
          </button>
        )}
      </div>
    );
  };

  // Handle continue button
  const handleContinue = () => {
    setCurrentStep(Step.INSULATION_DETAILS);
  };

  // Validation function - check if form is complete
  const isFormComplete = (): boolean => {
    // Floor plans validation: optional
    const requiresDrawings = false;
    if (requiresDrawings && uploadedFiles.length === 0) return false;
    
    // At least one room selected across all floors
    const totalSelectedRooms = Object.values(selectedRooms).flat().length +
                                Object.values(selectedCustomRooms).flat().length;
    if (totalSelectedRooms === 0) return false;
    
    // If Kelder exists, user must select at least one room in Kelder section
    if (hasKelder === true) {
      const kelderStandardSelected = (selectedRooms[KELDER_KEY] || []).length;
      const kelderCustomSelected = (selectedCustomRooms[KELDER_KEY] || []).length;
      const kelderSelectedRooms = kelderStandardSelected + kelderCustomSelected;
      
      if (kelderSelectedRooms === 0) return false;
    }
    
    return true;
  };

  const isComplete = isFormComplete();

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
  };

  const displaySections = getDisplaySections();

  // Helper to get display name for a section
  const getSectionDisplayName = (section: string) => {
    if (section === KELDER_KEY) {
      return t('Kelder');
    }
    return translateUploadFloor(section, t);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Changed pb-8 to pb-28 to prevent button overlap */}
      <main className="app-page-main md:ml-64 pb-28">
        <BackToTop />

        <div className="app-shell-content">
          <PageBackLink label={t('back.algemeen')} onClick={() => setCurrentStep(Step.ALGEMEEN)} />

          {/* Header - Centered */}
          <header className="app-page-title text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">{t('upload.title')}</h1>
          </header>

          <div className="space-y-6">


            {/* Upload Section */}
            {(() => {
              const isUploadIncomplete = false;
              return (
                <div
                  className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                    isUploadIncomplete ? 'border-amber-500/30' : 'border-outline-variant/10'
                  }`}
                  style={isUploadIncomplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                >
                  {hasFloorPlans === false && (
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                        {t('upload.uploadLabelSkip')}
                      </span>
                    </div>
                  )}

                  {/* Hidden file inputs */}
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileUpload} />
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" multiple onChange={handleCameraCapture} />

                  {/* Floor plans */}
                  {hasFloorPlans === false ? (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-700">
                        {t('upload.noPlansHintPrefix')}
                        <span className="font-bold">{t('upload.noPlansBold')}</span>
                        {t('upload.noPlansHintSuffix')}
                      </p>
                    </div>
                  ) : (
                    uploadedFiles.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <button
                          type="button"
                          onClick={() => openMediaGuide('upload')}
                          className="font-display font-black text-sm uppercase text-gray-800 hover:text-primary transition-colors flex items-center gap-2 focus:outline-none w-full"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span>{t('upload.floorPlansTitle')}</span>
                            {isUploadIncomplete && (
                              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <CloudUpload size={16} className="text-gray-400 hover:text-primary transition-colors flex-shrink-0" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-xl bg-gray-50 p-4 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => openMediaGuide('upload')}
                            className="font-display font-black text-sm uppercase text-gray-800 hover:text-primary transition-colors flex items-center gap-2 focus:outline-none"
                          >
                            <span>{t('upload.floorPlansTitle')}</span>
                            <CloudUpload size={16} className="text-gray-400 hover:text-primary transition-colors flex-shrink-0" />
                          </button>
                        </div>

                        {renderFloorPlanThumbnailStrip()}
                      </div>
                    )
                  )}
                </div>
              );
            })()}

            {/* Technical Assessment Details */}
            {(selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR) && (
              <div className="rounded-2xl border border-outline-variant/10 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-black text-primary">{t('upload.technicalTitle')}</h2>
                <p className="mb-4 text-xs text-gray-500">{t('upload.technicalSubtitle')}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AppSelect
                    label={t('upload.labels.floorConstruction')}
                    value={vloerenType}
                    onChange={setVloerenType}
                    options={(['Licht', 'Zwaar', 'Zeer zwaar'] as const).map((value) => ({
                      value,
                      label: translateUploadConstruction(value, t),
                    }))}
                  />
                  <AppSelect
                    label={t('upload.labels.wallConstruction')}
                    value={wandenType}
                    onChange={setWandenType}
                    options={(['Licht', 'Zwaar', 'Zeer zwaar'] as const).map((value) => ({
                      value,
                      label: translateUploadConstruction(value, t),
                    }))}
                  />
                  {selectedRole === UserRole.BACK_OFFICE && (
                    <>
                      <div>
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t('upload.labels.gboT')}
                        </label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={gboT}
                            onChange={(e) => setGboT(e.target.value)}
                            placeholder={t('upload.placeholders.gboT')}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="ml-1 text-[10px] font-bold uppercase text-gray-400">m²</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t('upload.labels.pipePenetrations')}
                        </label>
                        <input
                          type="text"
                          value={leidingdoorvoeren}
                          onChange={(e) => setLeidingdoorvoeren(e.target.value)}
                          placeholder={t('upload.placeholders.input')}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="sm:col-span-2 sm:max-w-md">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t('upload.labels.avr')}
                        </label>
                        <input
                          type="text"
                          value={avr}
                          onChange={(e) => setAvr(e.target.value)}
                          placeholder={t('upload.placeholders.input')}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Rooms Section */}
            <motion.div
              className={`bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 relative ${
                showSuggestions && activeAddFloor ? 'z-40' : 'z-0'
              }`}
            >
              <h2 className="font-display font-black text-lg mb-4 text-primary">{t('upload.roomsTitle')}</h2>

              <div className="space-y-3">
                {displaySections.map((section) => {
                  const standardRooms = getStandardRoomsForFloor(section);
                  const standardSlots = getEffectiveStandardRooms(section, [], startFloorKey);
                  const custom = customRooms[section] || [];
                  const selectedCount = getSelectedCount(section);
                  const selectedRoomList = getSelectedRoomList(section);
                  const isExpanded = expandedFloor === section;
                  const selectedForFloor = selectedRooms[section] || [];
                  const selectedCustomForFloor = selectedCustomRooms[section] || [];
                  const isKelder = section === KELDER_KEY;
                  const isKelderIncomplete = isKelder && hasKelder === true && selectedCount === 0;

                  return (
                    <motion.div
                      key={section}
                      className={`border transition-all rounded-xl ${
                        isKelderIncomplete ? 'border-amber-500/30' : 'border-gray-100'
                      }`}
                      style={isKelderIncomplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleFloor(section)}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-display font-black text-base text-gray-800">
                                {getSectionDisplayName(section)}
                              </span>
                              {isKelderIncomplete && (
                                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
                              )}
                              {selectedCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  {t('upload.roomsCount', { count: selectedCount })}
                                </span>
                              )}
                            </div>
                            {selectedRoomList.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {selectedRoomList.map((room) => (
                                  <span
                                    key={room}
                                    className="inline-block max-w-full break-words rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium leading-snug text-gray-600"
                                  >
                                    {translateUploadRoom(room, t)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 text-gray-400 pt-0.5">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-visible"
                          >
                            <div className="p-4 pt-3 border-t border-gray-100 space-y-3">
                              {(() => {
                                const chipGroups = buildFloorRoomChipGroups(
                                  standardRooms,
                                  selectedForFloor,
                                  custom,
                                  selectedCustomForFloor,
                                  standardSlots,
                                );
                                if (chipGroups.length === 0) return null;

                                const row1: React.ReactNode[] = [];
                                const row2: React.ReactNode[] = [];
                                const row3: React.ReactNode[] = [];
                                const row4: React.ReactNode[] = [];

                                chipGroups.forEach((group) => {
                                  const roomBase = getRoomBaseName(group.kind === 'chain' ? group.base : group.chip.room);
                                  const element = group.kind === 'chain' ? (
                                    <div
                                      key={`chain-${group.base}`}
                                      className="flex flex-wrap items-center gap-2"
                                    >
                                      {group.chips.map((chip) => renderRoomChip(section, chip))}
                                    </div>
                                  ) : (
                                    renderRoomChip(section, group.chip)
                                  );

                                  if (roomBase === 'HAL' || roomBase === 'OVERLUIP' || roomBase === 'MK') {
                                    row1.push(element);
                                  } else if (roomBase === 'KEUKEN' || roomBase === 'WOONKAMER') {
                                    row2.push(element);
                                  } else if (roomBase === 'SLAAPKAMER' || roomBase === 'WC' || roomBase === 'BADKAMER') {
                                    row3.push(element);
                                  } else {
                                    row4.push(element);
                                  }
                                });

                                return (
                                  <div className="flex flex-col gap-3">
                                    {row1.length > 0 && <div className="flex flex-wrap gap-2">{row1}</div>}
                                    {row2.length > 0 && <div className="flex flex-wrap gap-2">{row2}</div>}
                                    {row3.length > 0 && <div className="flex flex-wrap gap-2">{row3}</div>}
                                    {row4.length > 0 && <div className="flex flex-wrap gap-2">{row4}</div>}
                                  </div>
                                );
                              })()}

                              {/* Add Room Button */}
                              <div className="relative z-50" ref={suggestionRef}>
                                {activeAddFloor !== section ? (
                                  <button
                                    onClick={() => {
                                      setActiveAddFloor(section);
                                      setNewRoomName('');
                                      setSuggestions([]);
                                      setShowSuggestions(false);
                                      setTimeout(() => inputRef.current?.focus(), 100);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-gray-100 text-primary hover:bg-primary/10 flex items-center gap-1"
                                  >
                                    <Plus size={12} />
                                    {t('upload.addRoom')}
                                  </button>
                                ) : (
                                  <div className="relative">
                                    <div className="flex gap-2">
                                      <div className="relative flex-1 min-w-0">
                                        <input
                                          ref={inputRef}
                                          type="text"
                                          value={newRoomName}
                                          onChange={(e) => handleRoomInputChange(e, section)}
                                          onKeyDown={(e) => handleKeyDown(e, section)}
                                          placeholder={t('upload.roomNamePlaceholder')}
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 pr-8"
                                          autoFocus
                                        />
                                        <Search size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                      </div>
                                      <button
                                        onClick={() => addCustomRoom(section)}
                                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/80"
                                      >
                                        {t('common.add')}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveAddFloor(null);
                                          setNewRoomName('');
                                          setSuggestions([]);
                                          setShowSuggestions(false);
                                        }}
                                        className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-300"
                                      >
                                        {t('common.cancel')}
                                      </button>
                                    </div>
                                    
                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                      <div className="absolute left-0 right-0 top-full z-[100] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {suggestions.map((suggestion, idx) => (
                                          <button
                                            key={suggestion.name}
                                            onClick={() => selectSuggestion(suggestion, section)}
                                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex justify-between items-center ${
                                              idx === selectedSuggestionIndex ? 'bg-gray-50' : ''
                                            }`}
                                          >
                                            <span className="text-sm font-medium">
                                              {translateUploadRoom(suggestion.name, t)}
                                            </span>
                                            {suggestion.isNew && (
                                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                                {suggestion.existingCount ? `+${suggestion.existingCount + 1}` : 'NEW'}
                                              </span>
                                            )}
                                            {!suggestion.isNew && (
                                              <span className="text-[10px] text-gray-400">
                                                {t('upload.existingRoom')}
                                              </span>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <StepContinueFooter
        visible={isComplete}
        onClick={handleContinue}
        label={t('upload.continueInsulation')}
      />

      <PhotoViewerModal
        open={photoViewer.isOpen}
        onClose={photoViewer.close}
        slides={slidesFromUrlFiles(uploadedFiles, t('upload.modalAlt'))}
        index={photoViewer.index}
        onPrev={() => photoViewer.prev(uploadedFiles.length)}
        onNext={() => photoViewer.next(uploadedFiles.length)}
        alt={t('upload.modalAlt')}
        pdfDownloadLabel={t('kozijn.downloadPdf')}
      />

      {uploadMediaGuide && (
        <MediaInstructionModal
          open={mediaGuideOpen}
          step={mediaGuideStep}
          onClose={closeMediaGuide}
          entry={uploadMediaGuide}
          variant={mediaGuideVariant}
          pendingFiles={pendingGuideFiles}
          onRemovePending={removePendingGuideFile}
          onContinueFromInstructions={handleContinueFromInstructions}
          onAddMore={triggerMediaGuidePicker}
          onDone={handleMediaGuideDone}
          exampleImageUrl={mediaExampleImageUrl('upload', mediaGuideVariant)}
          layout="bottomSheet"
          allowBothVariants={true}
        />
      )}

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};