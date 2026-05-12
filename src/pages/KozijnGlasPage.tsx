// src/pages/KozijnGlasPage.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Frame, Layers, Plus, Upload, Camera, X, FileText, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { PageBackLink } from '../components/common/PageBackLink';
import { BackToTop } from '../components/common/BackToTop';
import { StepContinueFooter } from '../components/common/StepContinueFooter';
import { PhotoViewerModal } from '../components/common/PhotoViewerModal';
import { Toast } from '../components/common/Toast';
import { Step, UserRole } from '../types';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import {
  loadKozijnGlasFormFromStorage,
  loadKozijnDocumentImages,
  saveKozijnGlasFormToStorage,
  saveKozijnDocumentImages,
  saveKozijnGlasToStorage,
  fileToBase64,
  ensureKozijnImageSrc,
  createDefaultItem,
  type KozijnImageFile,
  type FrameGlassItem,
} from '../storage/kozijnGlasData';
import {
  MediaInstructionModal,
  type MediaInstructionStep,
} from '../components/common/MediaInstructionModal';
import {
  getMediaInstruction,
  type MediaInstructionVariant,
} from '../config/mediaInstructions';
import { mediaExampleImageUrl } from '../config/mediaExampleImages';
import {
  translateKozijnFloor,
  translateKozijnFrameType,
  translateKozijnGlassType,
  translateKozijnLocation,
} from '../i18n/translateOptions';
import { getInteriorFloorDisplayLabels } from '../utils/interiorRoomsFromUpload';
import { loadHouseDesignAlgemeenHints } from '../storage/houseDesignPageData';
import { AppSelect } from '../components/common/AppSelect';
import { usePhotoViewer } from '../hooks/usePhotoViewer';
import { slidesFromBase64Files } from '../utils/photoViewer';

async function filesToKozijnImages(files: File[]): Promise<KozijnImageFile[]> {
  const result: KozijnImageFile[] = [];
  for (const file of files) {
    const base64 = await fileToBase64(file);
    result.push({
      id: `${Date.now()}-${Math.random()}`,
      base64,
      type: file.type,
      name: file.name,
      size: file.size,
    });
  }
  return result;
}

interface KozijnGlasPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile?: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
}

// Options for dropdowns
import { KOZIJN_FRAME_TYPES, KOZIJN_GLASS_TYPES } from '../config/kozijnGlasOptions';
const LOCATIONS = ['Voor', 'Achter', 'Links', 'Rechts'];

export const KozijnGlasPage = ({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
}: KozijnGlasPageProps) => {
  const { t } = useLanguage();
  const { toast, setToast, showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Load saved data from storage on mount
  const savedForm = loadKozijnGlasFormFromStorage();
  
  // State
  const [allKozijnenSame, setAllKozijnenSame] = useState<boolean | null>(savedForm.allKozijnenSame);
  const [allGlasSame, setAllGlasSame] = useState<boolean | null>(savedForm.allGlasSame);
  const [kozijnItems, setKozijnItems] = useState<FrameGlassItem[]>(savedForm.kozijnItems);
  const [glasItems, setGlasItems] = useState<FrameGlassItem[]>(savedForm.glasItems);
  const [floorOptions, setFloorOptions] = useState<string[]>(() => {
    const hints = loadHouseDesignAlgemeenHints();
    return getInteriorFloorDisplayLabels(hints.numberOfFloors, hints.startFloorKey);
  });
  const [documentImages, setDocumentImages] = useState<KozijnImageFile[]>([]);
  
  // UI state - Accordion sections (collapsed by default)
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  // Modal state
  const photoViewer = usePhotoViewer();
  
  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imagesHydratedRef = useRef(false);
  const documentImagesRef = useRef<KozijnImageFile[]>([]);

  const [mediaGuideOpen, setMediaGuideOpen] = useState(false);
  const [mediaGuideStep, setMediaGuideStep] = useState<MediaInstructionStep>('instructions');
  const [mediaGuideVariant, setMediaGuideVariant] = useState<MediaInstructionVariant>('camera');
  const [pendingGuideFiles, setPendingGuideFiles] = useState<KozijnImageFile[]>([]);
  const kozijnMediaGuide = getMediaInstruction('kozijn', mediaGuideVariant);

  const isClient = selectedRole === UserRole.CLIENT;

  const getFloorOptions = (): string[] => floorOptions;

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? [] : [section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  // Handle YES/NO with double-click to unselect
  const handleAllKozijnenSameClick = (value: boolean) => {
    if (allKozijnenSame === value) {
      setAllKozijnenSame(null);
    } else {
      setAllKozijnenSame(value);
    }
  };

  const handleAllGlasSameClick = (value: boolean) => {
    if (allGlasSame === value) {
      setAllGlasSame(null);
    } else {
      setAllGlasSame(value);
    }
  };

  // Load floor list from Algemeen (start floor + count)
  useEffect(() => {
    const hints = loadHouseDesignAlgemeenHints();
    setFloorOptions(getInteriorFloorDisplayLabels(hints.numberOfFloors, hints.startFloorKey));
  }, [currentStep]);

  useEffect(() => {
    let cancelled = false;
    void loadKozijnDocumentImages().then((images) => {
      if (cancelled) return;
      setDocumentImages((prev) => {
        const merged = prev.length > 0 ? prev : images;
        documentImagesRef.current = merged;
        return merged;
      });
      imagesHydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    documentImagesRef.current = documentImages;
  }, [documentImages]);

  useEffect(() => {
    try {
      saveKozijnGlasFormToStorage({
        allKozijnenSame: allKozijnenSame as boolean,
        allGlasSame: allGlasSame as boolean,
        kozijnItems,
        glasItems,
      });
    } catch {
      /* form payload is small; ignore */
    }
  }, [allKozijnenSame, allGlasSame, kozijnItems, glasItems]);

  useEffect(() => {
    if (!imagesHydratedRef.current) return;

    let cancelled = false;
    void saveKozijnDocumentImages(documentImages).catch(() => {
      if (!cancelled) {
        showToast(t('upload.toast.storageQuotaFailed'), 'error');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [documentImages, showToast, t]);

  useEffect(() => {
    return () => {
      if (imagesHydratedRef.current) {
        void saveKozijnDocumentImages(documentImagesRef.current);
      }
    };
  }, []);

  // Validation function - Role-based: CLIENT has NO mandatory fields
  const isFormComplete = (): boolean => {
    // For CLIENT role: No questions are mandatory
    if (isClient) {
      return true;
    }
    
    // For BACK_OFFICE and INSPECTOR: Check Kozijn section
    if (allKozijnenSame === null) return false;
    
    if (allKozijnenSame === true) {
      const firstItem = kozijnItems[0];
      if (!firstItem.location || firstItem.location === '') return false;
      if (!firstItem.frameType || firstItem.frameType === '') return false;
    } else {
      // Multiple items - each item needs frame type, location, floor
      for (const item of kozijnItems) {
        if (!item.frameType || item.frameType === '') return false;
        if (!item.location || item.location === '') return false;
        if (!item.floor || item.floor === '') return false;
      }
    }
    
    // Check Glas section for BACK_OFFICE and INSPECTOR
    if (allGlasSame === null) return false;
    
    if (allGlasSame === true) {
      const firstItem = glasItems[0];
      if (!firstItem.location || firstItem.location === '') return false;
      if (!firstItem.glassType || firstItem.glassType === '') return false;
    } else {
      // Multiple items - each item needs glass type, location, floor
      for (const item of glasItems) {
        if (!item.glassType || item.glassType === '') return false;
        if (!item.location || item.location === '') return false;
        if (!item.floor || item.floor === '') return false;
      }
    }
    
    return true;
  };

  const isComplete = isFormComplete();
  const nextPageLabel = t('kozijn.continueToPhotos', { page: t('photos.title') });

  // Kozijn Items Management
  const addKozijnItem = () => {
    setKozijnItems([...kozijnItems, createDefaultItem()]);
  };

  const removeKozijnItem = (id: string) => {
    if (kozijnItems.length > 1) {
      setKozijnItems(kozijnItems.filter(item => item.id !== id));
    }
  };

  const updateKozijnItem = (id: string, field: keyof FrameGlassItem, value: string) => {
    setKozijnItems(kozijnItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Glas Items Management
  const addGlasItem = () => {
    setGlasItems([...glasItems, createDefaultItem()]);
  };

  const removeGlasItem = (id: string) => {
    if (glasItems.length > 1) {
      setGlasItems(glasItems.filter(item => item.id !== id));
    }
  };

  const updateGlasItem = (id: string, field: keyof FrameGlassItem, value: string) => {
    setGlasItems(glasItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const closeMediaGuide = () => {
    setPendingGuideFiles([]);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
  };

  const openMediaGuide = (variant: MediaInstructionVariant) => {
    setPendingGuideFiles([]);
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

  const removePendingGuideFile = (index: number) => {
    setPendingGuideFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMediaGuideDone = () => {
    const count = pendingGuideFiles.length;
    if (count === 0) return;
    setDocumentImages((prev) => [...prev, ...pendingGuideFiles]);
    setPendingGuideFiles([]);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
    showToast(t('upload.toast.filesUploaded', { count }), 'success');
  };

  // Handle file upload - Convert to Base64 for storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newFiles = await filesToKozijnImages(Array.from(files));
        if (mediaGuideOpen) {
          setPendingGuideFiles((prev) => [...prev, ...newFiles]);
          setMediaGuideStep('review');
        } else {
          setDocumentImages((prev) => [...prev, ...newFiles]);
          showToast(t('upload.toast.filesUploaded', { count: files.length }), 'success');
        }
      } catch {
        showToast(t('upload.toast.filesUploadFailed'), 'error');
      }
    }
    e.target.value = '';
  };

  // Handle camera capture - Convert to Base64 for storage
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newFiles = await filesToKozijnImages(Array.from(files));
        if (mediaGuideOpen) {
          setPendingGuideFiles((prev) => [...prev, ...newFiles]);
          setMediaGuideStep('review');
        } else {
          setDocumentImages((prev) => [...prev, ...newFiles]);
          showToast(t('upload.toast.photoCaptured'), 'success');
        }
      } catch {
        showToast(t('upload.toast.filesUploadFailed'), 'error');
      }
    }
    e.target.value = '';
  };

  // Delete image
  const deleteImage = (index: number) => {
    setDocumentImages(prev => prev.filter((_, i) => i !== index));
    showToast(t('upload.toast.fileDeleted'), 'success');
  };

  const openImageModal = (file: KozijnImageFile) => {
    const fileIndex = documentImages.findIndex((f) => f.id === file.id);
    if (fileIndex < 0) return;
    photoViewer.openAt(fileIndex);
  };

  // Handle continue click
  const handleContinue = async () => {
    try {
      await saveKozijnGlasToStorage({
        allKozijnenSame: allKozijnenSame ?? false,
        allGlasSame: allGlasSame ?? false,
        kozijnItems,
        glasItems,
        documentImages,
      });
      setCurrentStep(Step.PHOTO_CAPTURE);
    } catch {
      showToast(t('upload.toast.storageQuotaFailed'), 'error');
    }
  };

  // Render item form (reusable for both kozijn and glas)
  const renderItemForm = (
    item: FrameGlassItem,
    updateField: (field: keyof FrameGlassItem, value: string) => void,
    isGlas: boolean = false,
    showFullForm: boolean = true
  ) => {
    const options = isGlas ? KOZIJN_GLASS_TYPES : KOZIJN_FRAME_TYPES;
    const selectedValue = isGlas ? item.glassType : item.frameType;
    const fieldName = isGlas ? 'glassType' : 'frameType';
    const typeLabel = isGlas ? t('kozijn.glassType') : t('kozijn.frameType');
    const typePlaceholder = isGlas ? t('kozijn.selectGlassType') : t('kozijn.selectFrameType');
    const translateType = isGlas ? translateKozijnGlassType : translateKozijnFrameType;

    const locationField = (
      <AppSelect
        label={t('kozijn.location')}
        value={item.location}
        onChange={(v) => updateField('location', v)}
        placeholder={t('kozijn.selectLocation')}
        options={LOCATIONS.map((opt) => ({
          value: opt,
          label: translateKozijnLocation(opt, t),
        }))}
      />
    );

    const typeField = (
      <AppSelect
        label={typeLabel}
        value={selectedValue}
        onChange={(v) => updateField(fieldName, v)}
        placeholder={typePlaceholder}
        options={options.map((opt) => ({
          value: opt,
          label: translateType(opt, t),
        }))}
      />
    );

    const floorField = (
      <AppSelect
        label={t('kozijn.floor')}
        value={item.floor}
        onChange={(v) => updateField('floor', v)}
        placeholder={t('kozijn.selectFloor')}
        options={getFloorOptions().map((floor) => ({
          value: floor,
          label: translateKozijnFloor(floor, t),
        }))}
      />
    );

    // All same: Locatie → type (no floor)
    if (!showFullForm) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locationField}
          {typeField}
        </div>
      );
    }

    // Multiple locations: Locatie → type → verdieping
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {locationField}
        {typeField}
        {floorField}
      </div>
    );
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

      {/* Changed pb-8 to pb-28 to prevent button overlap */}
      <main className="app-page-main md:ml-64 pb-28">
        <BackToTop />
        
        <div className="app-shell-content">
          <PageBackLink label={t('kozijn.backToInstallatie')} onClick={() => setCurrentStep(Step.INSTALLATIE)} />

          <header className="app-page-title text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">{t('kozijn.title')}</h1>
          </header>

          <div className="space-y-4">
            {/* 1. Kozijn details */}
            <div
              className={`${isExpanded('kozijn') ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border border-outline-variant/10 transition-all overflow-hidden`}
            >
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => toggleSection('kozijn')}
              >
                <div>
                  <h2 className="font-display font-black text-lg flex items-center gap-2 text-primary">
                    <Frame size={20} />
                    {t('kozijn.kozijnDetails')}
                  </h2>
                  {allKozijnenSame === false && kozijnItems.length > 1 && (
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5">
                      {t('kozijn.locationsAdded', { count: kozijnItems.length })}
                    </p>
                  )}
                </div>
                <div className="text-gray-400">
                  {isExpanded('kozijn') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded('kozijn') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-white rounded-b-2xl">
                      {/* All frames same question */}
                      <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-xl gap-4 mb-4">
                        <span className="font-bold text-sm">{t('kozijn.allKozijnenSame')}</span>
                        <div className="flex bg-white p-1 rounded-xl shadow-sm">
                          <button 
                            onClick={() => handleAllKozijnenSameClick(true)}
                            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${allKozijnenSame === true ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {t('common.yes')} {allKozijnenSame === true && '✓'}
                          </button>
                          <button 
                            onClick={() => handleAllKozijnenSameClick(false)}
                            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${allKozijnenSame === false ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {t('common.no')} {allKozijnenSame === false && '✓'}
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Items List */}
                      <div className="space-y-4">
                        {(allKozijnenSame === true ? kozijnItems.slice(0, 1) : kozijnItems).map((item, idx) => (
                          <div key={item.id} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                                {t('kozijn.frameLocationN', { n: idx + 1 })}
                              </span>
                              {allKozijnenSame === false && kozijnItems.length > 1 && (
                                <button
                                  onClick={() => removeKozijnItem(item.id)}
                                  className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            {renderItemForm(
                              item,
                              (field, val) => updateKozijnItem(item.id, field, val),
                              false,
                              allKozijnenSame === false
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add button (only when NO is selected) */}
                      {allKozijnenSame === false && (
                        <button
                          onClick={addKozijnItem}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-primary text-xs font-bold hover:bg-gray-50 transition-all"
                        >
                          <Plus size={14} />
                          {t('kozijn.addFrameLocation')}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Glass details */}
            <div
              className={`${isExpanded('glas') ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border border-outline-variant/10 transition-all overflow-hidden`}
            >
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => toggleSection('glas')}
              >
                <div>
                  <h2 className="font-display font-black text-lg flex items-center gap-2 text-primary">
                    <Layers size={20} />
                    {t('kozijn.glasDetails')}
                  </h2>
                  {allGlasSame === false && glasItems.length > 1 && (
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5">
                      {t('kozijn.locationsAdded', { count: glasItems.length })}
                    </p>
                  )}
                </div>
                <div className="text-gray-400">
                  {isExpanded('glas') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded('glas') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-white rounded-b-2xl">
                      {/* All glass same question */}
                      <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-xl gap-4 mb-4">
                        <span className="font-bold text-sm">{t('kozijn.allGlasSame')}</span>
                        <div className="flex bg-white p-1 rounded-xl shadow-sm">
                          <button 
                            onClick={() => handleAllGlasSameClick(true)}
                            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${allGlasSame === true ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {t('common.yes')} {allGlasSame === true && '✓'}
                          </button>
                          <button 
                            onClick={() => handleAllGlasSameClick(false)}
                            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${allGlasSame === false ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {t('common.no')} {allGlasSame === false && '✓'}
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Items List */}
                      <div className="space-y-4">
                        {(allGlasSame === true ? glasItems.slice(0, 1) : glasItems).map((item, idx) => (
                          <div key={item.id} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                                {t('kozijn.glassLocationN', { n: idx + 1 })}
                              </span>
                              {allGlasSame === false && glasItems.length > 1 && (
                                <button
                                  onClick={() => removeGlasItem(item.id)}
                                  className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            {renderItemForm(
                              item,
                              (field, val) => updateGlasItem(item.id, field, val),
                              true,
                              allGlasSame === false
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add button (only when NO is selected) */}
                      {allGlasSame === false && (
                        <button
                          onClick={addGlasItem}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-primary text-xs font-bold hover:bg-gray-50 transition-all"
                        >
                          <Plus size={14} />
                          {t('kozijn.addGlassLocation')}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Documentatie */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <h2 className="font-display font-black text-lg mb-4 flex items-center gap-2 text-primary">
                <Upload size={20} />
                {t('kozijn.documentation')}
              </h2>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileUpload}
              />
              <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleCameraCapture}
              />

              <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="font-bold text-sm text-gray-600">{t('kozijn.uploadKozijnDocs')}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openMediaGuide('upload')}
                      className="p-2 rounded-lg transition-all bg-primary/10 text-primary hover:bg-primary hover:text-white"
                      aria-label={t('kozijn.guide.upload.continue')}
                    >
                      <Upload size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openMediaGuide('camera')}
                      className="p-2 rounded-lg transition-all bg-primary/10 text-primary hover:bg-primary hover:text-white"
                      aria-label={t('kozijn.guide.camera.continue')}
                    >
                      <Camera size={20} />
                    </button>
                  </div>
                </div>

                {documentImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-1.5 mt-4">
                    {documentImages.map((file, idx) => (
                      <div key={file.id} className="relative flex-shrink-0 group">
                        <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                          {file.type === 'application/pdf' ? (
                            <button
                              type="button"
                              onClick={() => openImageModal(file)}
                              className="flex h-full w-full flex-col items-center justify-center border-red-200 bg-red-50 transition-colors hover:border-red-400"
                            >
                              <FileText size={14} className="text-red-500" />
                              <span className="mt-0.5 text-[7px] font-bold text-red-500">PDF</span>
                            </button>
                          ) : (
                            <img
                              src={ensureKozijnImageSrc(file.base64, file.type)}
                              className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-80"
                              alt={t('kozijn.documentation')}
                              onClick={() => openImageModal(file)}
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteImage(idx);
                          }}
                          className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-red-500 p-0.5 text-white shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <StepContinueFooter
        visible={isClient || isComplete}
        onClick={handleContinue}
        label={nextPageLabel}
      />

      <PhotoViewerModal
        open={photoViewer.isOpen}
        onClose={photoViewer.close}
        slides={slidesFromBase64Files(documentImages, ensureKozijnImageSrc, t('upload.modalAlt'))}
        index={photoViewer.index}
        onPrev={() => photoViewer.prev(documentImages.length)}
        onNext={() => photoViewer.next(documentImages.length)}
        alt={t('upload.modalAlt')}
        pdfDownloadLabel={t('kozijn.downloadPdf')}
      />

      {kozijnMediaGuide && (
        <MediaInstructionModal
          open={mediaGuideOpen}
          step={mediaGuideStep}
          onClose={closeMediaGuide}
          entry={kozijnMediaGuide}
          variant={mediaGuideVariant}
          pendingFiles={pendingGuideFiles.map((file) => ({
            url: ensureKozijnImageSrc(file.base64, file.type),
            type: file.type,
            name: file.name,
            size: file.size,
          }))}
          onRemovePending={removePendingGuideFile}
          onContinueFromInstructions={triggerMediaGuidePicker}
          onAddMore={triggerMediaGuidePicker}
          onDone={handleMediaGuideDone}
          reviewKeyPrefix="kozijn.guide"
          exampleImageUrl={mediaExampleImageUrl('kozijn', mediaGuideVariant)}
          layout="bottomSheet"
          zIndex={6000}
        />
      )}

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};