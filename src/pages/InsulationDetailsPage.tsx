// src/pages/InsulationDetailsPage.tsx
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Plus, Trash2, FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { AppSelect } from '../components/common/AppSelect';
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
import {
  actionListCategoryForInsulationCard,
  isActionListQuestionVisibleForRole,
} from '../data/actionListMassEpaUiItems';
import { useLanguage } from '../context/LanguageContext';
import {
  INSULATION_CATEGORY_ICONS,
  INSULATION_CATEGORY_IDS,
  insulationCategoryLabel,
  insulationExampleImageUrl,
  type InsulationCategoryId,
} from '../i18n/insulationCategories';
import {
  loadInsulationFromStorage,
  loadInsulationImagesFromStorage,
  saveInsulationToStorage,
  saveInsulationImagesToStorage,
  type InsulationImageFile,
} from '../storage/insulationData';
import { filesToPersistedUploads, revokeFileUrlIfBlob } from '../utils/persistedFileUrl';
import {
  MediaInstructionModal,
  type MediaInstructionStep,
} from '../components/common/MediaInstructionModal';
import {
  getMediaInstruction,
  type MediaInstructionVariant,
} from '../config/mediaInstructions';
import { usePhotoViewer } from '../hooks/usePhotoViewer';
import { slidesFromUrlFiles } from '../utils/photoViewer';

const INSULATION_SECTION = 'Isolatie';
const Q_UPLOAD = 'Upload doc / Capture photo';

function InsulationCategoryIcon({
  category,
  selected,
}: {
  category: InsulationCategoryId;
  selected: boolean;
}) {
  const Icon = INSULATION_CATEGORY_ICONS[category];
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${selected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
        }`}
      aria-hidden
    >
      <Icon size={20} strokeWidth={2} />
    </span>
  );
}

const materialOptionsByCategory: { [key: string]: string[] } = {
  'Gevel isolatie': [
    'H2FOAM LITE',
    'Therma TW50 Spouwplaat',
    'Mupan Ultra XS',
    'Mupan Façade',
    'Systemroll 1000',
    'Duits wall foam',
    'EPS-parels',
    'PS-schuim',
    'Anders',
  ],
  'Vloer isolatie': [
    'PIF Floor',
    'Anders',
  ],
  'Dak isolatie': [
    'PUR/PIR',
    'Therma TR26',
    'Therma TT46',
    'Kingspan TM Tr 26',
    'Recticel',
    'Unidek Reno Dekfolie',
    'Interieur TG',
    'Anders',
  ],
  'Panelen isolatie': [
    'PanHOHPL',
    'Renoslim',
    'BlueVac XE',
    'Anders',
  ],
};

// Helper function to get material options for a category
const getMaterialOptionsForCategory = (category: string): string[] => {
  return materialOptionsByCategory[category] || materialOptionsByCategory['Gevel isolatie'];
};

const yearOptions = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => {
  const year = (2026 - i).toString();
  return { value: year, label: year };
});

interface InsulationDetailsPageProps {
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

export const InsulationDetailsPage = ({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
  profilePhoto,
}: InsulationDetailsPageProps) => {
  const { t } = useLanguage();
  const savedOnMount = loadInsulationFromStorage();
  const { toast, setToast, showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedInsulation, setExpandedInsulation] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState(savedOnMount.selectedCategories);
  const [hasNewInsulation, setHasNewInsulation] = useState<boolean | null>(savedOnMount.hasNewInsulation);

  const [insulationImages, setInsulationImages] = useState<Record<string, InsulationImageFile[]>>(
    {},
  );
  const [insulationSpecs, setInsulationSpecs] = useState(savedOnMount.insulationSpecs);
  const [doorIsolated, setDoorIsolated] = useState<boolean | null>(savedOnMount.doorIsolated);

  // Media instruction modal (glass guide + review)
  const [mediaGuideOpen, setMediaGuideOpen] = useState(false);
  const [mediaGuideStep, setMediaGuideStep] = useState<MediaInstructionStep>('instructions');
  const [mediaGuideVariant, setMediaGuideVariant] = useState<MediaInstructionVariant>('camera');
  const [pendingGuideFiles, setPendingGuideFiles] = useState<InsulationImageFile[]>([]);
  const [pendingCategoryForCamera, setPendingCategoryForCamera] = useState<string | null>(null);
  const insulationMediaGuide = getMediaInstruction('insulation', mediaGuideVariant);

  // Modal state
  const photoViewer = usePhotoViewer();
  const [currentCategory, setCurrentCategory] = useState<string>('');

  // File input refs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const cameraInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const imagesHydratedRef = useRef(false);
  const insulationImagesRef = useRef<Record<string, InsulationImageFile[]>>({});

  const categories = INSULATION_CATEGORY_IDS;

  useEffect(() => {
    let cancelled = false;
    void loadInsulationImagesFromStorage().then((images) => {
      if (cancelled) return;
      setInsulationImages((prev) => {
        const prevHas = Object.values(prev).some((list) => list.length > 0);
        const merged = prevHas ? prev : images;
        insulationImagesRef.current = merged;
        return merged;
      });
      imagesHydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    insulationImagesRef.current = insulationImages;
  }, [insulationImages]);

  useEffect(() => {
    saveInsulationToStorage({
      insulationSpecs,
      doorIsolated,
      hasNewInsulation,
      selectedCategories,
    });
  }, [insulationSpecs, doorIsolated, hasNewInsulation, selectedCategories]);

  useEffect(() => {
    if (!imagesHydratedRef.current) return;

    let cancelled = false;
    void saveInsulationImagesToStorage(insulationImages).catch(() => {
      if (!cancelled) {
        showToast(t('upload.toast.storageQuotaFailed'), 'error');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [insulationImages, showToast, t]);

  useEffect(() => {
    return () => {
      if (imagesHydratedRef.current) {
        void saveInsulationImagesToStorage(insulationImagesRef.current);
      }
    };
  }, []);

  // SYNC: On page load, ensure categories with photos are selected when answer is YES
  useEffect(() => {
    if (hasNewInsulation === true) {
      Object.entries(insulationImages).forEach(([category, images]) => {
        if (images.length > 0) {
          setSelectedCategories((prev) =>
            prev.includes(category) ? prev : [...prev, category],
          );
        }
      });
    }
  }, []); // Run only once on mount

  // SYNC: Whenever photos are added, ensure that category is selected (when answer is YES)
  useEffect(() => {
    if (hasNewInsulation === true) {
      Object.entries(insulationImages).forEach(([category, images]) => {
        if (images.length > 0) {
          setSelectedCategories((prev) =>
            prev.includes(category) ? prev : [...prev, category],
          );
        }
      });
    }
  }, [insulationImages, hasNewInsulation]);

  const toggleExpand = (category: string) => {
    // Only one section can be expanded at a time (accordion behavior)
    setExpandedInsulation(prev =>
      prev.includes(category) ? [] : [category]
    );
  };

  const toggleCategorySelection = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle new insulation button click (toggle behavior - double tap to unselect)
  const handleNewInsulationClick = (value: boolean) => {
    if (hasNewInsulation === value) {
      // Double tap on same button - unselect
      setHasNewInsulation(null);
      // Also clear selected categories when unselecting
      setSelectedCategories([]);
    } else {
      setHasNewInsulation(value);
      // If selecting NO, clear all selected categories
      if (value === false) {
        setSelectedCategories([]);
      }
    }
  };

  // Handle door isolated click (toggle behavior - not mandatory)
  const handleDoorIsolatedClick = (value: boolean) => {
    if (doorIsolated === value) {
      setDoorIsolated(null);  // Deselect on second click
    } else {
      setDoorIsolated(value);
    }
  };

  const discardPendingGuideFiles = () => {
    pendingGuideFiles.forEach((file) => revokeFileUrlIfBlob(file.url));
    setPendingGuideFiles([]);
  };

  const closeMediaGuide = () => {
    discardPendingGuideFiles();
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
    setPendingCategoryForCamera(null);
  };

  const openMediaGuide = (category: string, variant: MediaInstructionVariant) => {
    discardPendingGuideFiles();
    setPendingCategoryForCamera(category);
    setMediaGuideVariant(variant);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(true);
  };

  const triggerMediaGuidePicker = () => {
    const category = pendingCategoryForCamera;
    if (!category) return;
    if (mediaGuideVariant === 'camera') {
      cameraInputRefs.current[`camera-input-${category}`]?.click();
    } else {
      fileInputRefs.current[`file-input-${category}`]?.click();
    }
  };

  const handleContinueFromInstructions = (selectedVariant?: 'camera' | 'upload') => {
    const category = pendingCategoryForCamera;
    if (!category) return;
    if (selectedVariant) {
      setMediaGuideVariant(selectedVariant);
      setTimeout(() => {
        if (selectedVariant === 'camera') {
          cameraInputRefs.current[`camera-input-${category}`]?.click();
        } else {
          fileInputRefs.current[`file-input-${category}`]?.click();
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

  const applyCategoryEffectsAfterSave = (category: string) => {
    if (hasNewInsulation === true && !selectedCategories.includes(category)) {
      toggleCategorySelection(category);
      showToast(
        `${insulationCategoryLabel(category as InsulationCategoryId, t)} selected automatically`,
        'success',
      );
    }
  };

  const handleMediaGuideDone = () => {
    const category = pendingCategoryForCamera;
    const count = pendingGuideFiles.length;
    if (!category || count === 0) return;

    setInsulationImages((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), ...pendingGuideFiles],
    }));
    applyCategoryEffectsAfterSave(category);
    setPendingGuideFiles([]);
    setMediaGuideStep('instructions');
    setMediaGuideOpen(false);
    setPendingCategoryForCamera(null);
    showToast(t('upload.toast.filesUploaded', { count }), 'success');
  };

  // Handle tick mark click
  const handleTickClick = (category: string) => {
    const isSelected = selectedCategories.includes(category);

    if (isSelected) {
      // Already selected → unselect AND remove all photos
      toggleCategorySelection(category);

      // Remove all images for this category
      const imagesToDelete = insulationImages[category] || [];
      imagesToDelete.forEach(file => {
        revokeFileUrlIfBlob(file.url);
      });

      setInsulationImages(prev => ({
        ...prev,
        [category]: []
      }));

      setExpandedInsulation((prev) => (prev.includes(category) ? [] : prev));
      showToast(`${insulationCategoryLabel(category as InsulationCategoryId, t)} deselected and photos removed`, 'success');
    } else {
      toggleCategorySelection(category);
      setExpandedInsulation([category]);
    }
  };

  // Handle file upload for a specific category
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newFiles = await filesToPersistedUploads(Array.from(files));

        if (mediaGuideOpen && pendingCategoryForCamera === category) {
          setPendingGuideFiles((prev) => [...prev, ...newFiles]);
          setMediaGuideStep('review');
        } else {
          setInsulationImages((prev) => ({
            ...prev,
            [category]: [...(prev[category] || []), ...newFiles],
          }));
          applyCategoryEffectsAfterSave(category);
          showToast(t('upload.toast.filesUploaded', { count: files.length }), 'success');
        }
      } catch {
        showToast(t('upload.toast.filesUploadFailed'), 'error');
      }
    }
    e.target.value = '';
  };

  // Handle camera capture for a specific category
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const newFiles = await filesToPersistedUploads(Array.from(files));

        if (mediaGuideOpen && pendingCategoryForCamera === category) {
          setPendingGuideFiles((prev) => [...prev, ...newFiles]);
          setMediaGuideStep('review');
        } else {
          setInsulationImages((prev) => ({
            ...prev,
            [category]: [...(prev[category] || []), ...newFiles],
          }));
          applyCategoryEffectsAfterSave(category);
          showToast(t('upload.toast.photoCaptured'), 'success');
        }
      } catch {
        showToast(t('upload.toast.filesUploadFailed'), 'error');
      }
    }
    e.target.value = '';
  };

  // Delete image from a specific category
  const deleteImage = (category: string, index: number) => {
    const imageToDelete = insulationImages[category]?.[index];
    if (imageToDelete) {
      revokeFileUrlIfBlob(imageToDelete.url);
    }

    const updatedImages = insulationImages[category].filter((_, i) => i !== index);

    setInsulationImages(prev => ({
      ...prev,
      [category]: updatedImages
    }));

    showToast(t('upload.toast.fileDeleted'), 'success');
  };

  // Open modal for a specific category
  const openModal = (category: string, imageIndex: number) => {
    setCurrentCategory(category);
    photoViewer.openAt(imageIndex);
  };

  const getCurrentImages = () => {
    return insulationImages[currentCategory] || [];
  };

  // Update material specification
  const updateMaterial = (category: string, material: string) => {
    setInsulationSpecs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        material,
        // Clear customMaterial when not Anders
        customMaterial: material === 'Anders' ? prev[category].customMaterial : ''
      }
    }));
  };

  const updateCustomMaterial = (category: string, customMaterial: string) => {
    setInsulationSpecs(prev => ({
      ...prev,
      [category]: { ...prev[category], customMaterial }
    }));
  };

  const updateThickness = (category: string, thickness: string) => {
    setInsulationSpecs(prev => ({
      ...prev,
      [category]: { ...prev[category], thickness }
    }));
  };

  const updateYearBuilt = (category: string, yearBuilt: string) => {
    setInsulationSpecs(prev => ({
      ...prev,
      [category]: { ...prev[category], yearBuilt }
    }));
  };

  /** Mobile keyboard Done/Next — blur closes the keyboard. */
  const dismissKeyboardOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const showMaterialSpecs = selectedRole !== UserRole.CLIENT;

  const isInsulationCategoryComplete = (category: string): boolean => {
    if (selectedRole === UserRole.CLIENT) return true;
    const spec = insulationSpecs[category];
    const hasMaterial =
      spec &&
      (spec.material === 'Anders'
        ? (spec.customMaterial || '').trim() !== ''
        : (spec.material || '').trim() !== '');
    const hasThickness = spec && (spec.thickness || '').trim() !== '';
    const hasYearBuilt = spec && (spec.yearBuilt || '').trim() !== '';

    return !!(hasMaterial && hasThickness && hasYearBuilt);
  };

  const [didAutoExpand, setDidAutoExpand] = useState(false);
  useEffect(() => {
    if (hasNewInsulation !== true || selectedCategories.length === 0 || didAutoExpand) return;

    const toExpand = selectedCategories.filter((cat) => !isInsulationCategoryComplete(cat));
    if (toExpand.length > 0) {
      setExpandedInsulation(toExpand);
    }
    setDidAutoExpand(true);
  }, [hasNewInsulation, selectedCategories, insulationSpecs, selectedRole, didAutoExpand]);

  // Continue on No, or Yes only when at least one category is ticked — photos/specs optional.
  const isFormComplete = (): boolean => {
    if (hasNewInsulation === false) return true;
    if (hasNewInsulation === true) return selectedCategories.length > 0;
    return false;
  };

  const isComplete = isFormComplete();

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

      <main className="app-page-main md:ml-64 pb-24">
        <BackToTop />

        <div className="app-shell-content">
          <PageBackLink label={t('insulation.backToUpload')} onClick={() => setCurrentStep(Step.UPLOAD)} />

          <header className="app-page-title text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">{t('insulation.title')}</h1>
          </header>

          <div className="space-y-4">
            {/* New Insulation Question */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <p className="text-sm font-bold text-gray-700 mb-3">
                {t('upload.insulationQuestion')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleNewInsulationClick(true)}
                  className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${hasNewInsulation === true
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {t('common.yes')}
                </button>
                <button
                  onClick={() => handleNewInsulationClick(false)}
                  className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${hasNewInsulation === false
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {t('common.no')}
                </button>
              </div>
            </div>

            {/* Insulation Categories - Only shown when hasNewInsulation === true */}
            {hasNewInsulation === true && (
              <>
                {categories.map((category) => {
                  const isExpanded = expandedInsulation.includes(category);
                  const isSelected = selectedCategories.includes(category);
                  const images = insulationImages[category] || [];
                  const catCsv = actionListCategoryForInsulationCard(category);
                  const showUpload = isActionListQuestionVisibleForRole(
                    INSULATION_SECTION,
                    catCsv,
                    Q_UPLOAD,
                    selectedRole,
                  );
                  const spec = insulationSpecs[category] || { material: '', customMaterial: '', thickness: '', yearBuilt: '' };

                  // Hidden file inputs
                  const fileInputId = `file-input-${category}`;
                  const cameraInputId = `camera-input-${category}`;

                  const isCatComplete = !isSelected || isInsulationCategoryComplete(category);

                  return (
                    <div
                      key={category}
                      className={`${isExpanded ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border transition-all overflow-hidden ${
                        !isCatComplete
                          ? 'border-amber-500/30'
                          : 'border-outline-variant/10'
                      }`}
                      style={!isCatComplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                    >
                      {/* Header */}
                      <div className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Tick mark */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTickClick(category);
                              }}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${isSelected
                                ? 'bg-primary text-white'
                                : 'border-2 border-gray-300 bg-white'
                                }`}
                              title={t('insulation.selectCategory')}
                            >
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </button>

                            <InsulationCategoryIcon
                              category={category as InsulationCategoryId}
                              selected={isSelected}
                            />

                            {/* Text + Expand/Collapse area */}
                            <div
                              className="cursor-pointer flex-1 flex items-center justify-between sm:justify-start gap-3 min-w-0"
                              onClick={() => toggleExpand(category)}
                            >
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h3 className="font-display font-black text-base text-on-surface truncate">
                                    {insulationCategoryLabel(category as InsulationCategoryId, t)}
                                  </h3>
                                  {!isCatComplete && (
                                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 animate-pulse" />
                                  )}
                                </div>
                                {images.length > 0 && (
                                  <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5 truncate">
                                    {t('photo Added', { count: images.length })}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="w-28 sm:w-40 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <AppSelect
                                    value={spec.yearBuilt || ''}
                                    onChange={(v) => updateYearBuilt(category, v)}
                                    placeholder={t('insulation.yearBuilt')}
                                    options={yearOptions}
                                    variant="white"
                                    searchable={true}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                          </div>
                        </div>

                        {/* Thumbnail strip in collapsed view */}
                        {!isExpanded && images.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-1 mt-3 ml-10">
                            {images.map((file, idx) => (
                              <div
                                key={`${file.url}-${idx}`}
                                className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(category, idx);
                                }}
                              >
                                {file.type === 'application/pdf' ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center">
                                    <FileText size={14} className="text-red-500" />
                                  </div>
                                ) : (
                                  <img src={file.url} className="w-full h-full object-cover" alt="" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteImage(category, idx);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                >
                                  <Trash2 size={8} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-0 border-t border-gray-200">
                              {/* Material Specifications - Two columns on desktop */}
                              {showMaterialSpecs && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                  {/* Material Type Column */}
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                      {t('insulation.materialType')}
                                    </label>
                                    {spec.material !== 'Anders' ? (
                                      <AppSelect
                                        value={spec.material}
                                        onChange={(v) => updateMaterial(category, v)}
                                        placeholder={t('insulation.selectMaterial')}
                                        variant="white"
                                        options={getMaterialOptionsForCategory(category).map(
                                          (option) => ({ value: option, label: option }),
                                        )}
                                      />
                                    ) : (
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={spec.customMaterial}
                                          onChange={(e) => updateCustomMaterial(category, e.target.value)}
                                          onKeyDown={dismissKeyboardOnEnter}
                                          enterKeyHint="done"
                                          placeholder={t('insulation.customMaterialPlaceholder')}
                                          className="w-full rounded-xl border border-gray-200 bg-white p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateMaterial(category, '')}
                                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
                                          aria-label={t('insulation.backToMaterialSelect')}
                                          title={t('insulation.backToMaterialSelect')}
                                        >
                                          <ChevronDown size={18} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Thickness Column */}
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                      {t('insulation.thickness')}
                                    </label>
                                    <div className="flex items-center">
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        enterKeyHint="done"
                                        value={spec.thickness}
                                        onChange={(e) => updateThickness(category, e.target.value)}
                                        onKeyDown={dismissKeyboardOnEnter}
                                        placeholder={t('insulation.thicknessPlaceholder')}
                                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      />
                                      <span className="ml-2 text-sm text-gray-500">mm</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Thumbnails in expanded view */}
                              {images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-1 mt-4">
                                  {images.map((file, idx) => (
                                    <div
                                      key={`${file.url}-${idx}`}
                                      className="relative flex-shrink-0 w-10 h-10 rounded-md overflow-hidden border border-gray-200 group bg-gray-50"
                                    >
                                      {file.type === 'application/pdf' ? (
                                        <div
                                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                                          onClick={() => openModal(category, idx)}
                                        >
                                          <FileText size={14} className="text-red-500" />
                                        </div>
                                      ) : (
                                        <img
                                          src={file.url}
                                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                          alt="evidence"
                                          onClick={() => openModal(category, idx)}
                                        />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => deleteImage(category, idx)}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                      >
                                        <Trash2 size={8} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </>
            )}

            {/* Door Isolated Question - Only for BACK_OFFICE and INSPECTOR (Not mandatory, with deselect) */}
            {(selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR) && (() => {
              const isDoorIsolatedIncomplete = doorIsolated === null;
              return (
                <section
                  className={`mt-8 flex flex-row items-center justify-between gap-3 rounded-xl border p-4 shadow-sm transition-all ${
                    isDoorIsolatedIncomplete
                      ? 'border-amber-500/30'
                      : 'border-outline-variant/10 bg-white'
                  }`}
                  style={isDoorIsolatedIncomplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                >
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 leading-tight">
                      {t('insulation.doorIsolated')}
                    </p>
                    {isDoorIsolatedIncomplete && (
                      <AlertTriangle size={14} className="text-amber-500 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDoorIsolatedClick(true)}
                      className={`rounded-lg px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${doorIsolated === true
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-white'
                        }`}
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDoorIsolatedClick(false)}
                      className={`rounded-lg px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${doorIsolated === false
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-white'
                        }`}
                    >
                      {t('common.no')}
                    </button>
                  </div>
                </section>
              );
            })()}
          </div>
        </div>
      </main>

      {insulationMediaGuide && (
        <MediaInstructionModal
          open={mediaGuideOpen}
          step={mediaGuideStep}
          onClose={closeMediaGuide}
          entry={insulationMediaGuide}
          variant={mediaGuideVariant}
          pendingFiles={pendingGuideFiles}
          onRemovePending={removePendingGuideFile}
          onContinueFromInstructions={handleContinueFromInstructions}
          onAddMore={triggerMediaGuidePicker}
          onDone={handleMediaGuideDone}
          reviewKeyPrefix="insulation.guide"
          contextLabel={
            pendingCategoryForCamera && INSULATION_CATEGORY_IDS.includes(pendingCategoryForCamera as InsulationCategoryId)
              ? insulationCategoryLabel(pendingCategoryForCamera as InsulationCategoryId, t)
              : undefined
          }
          exampleImageUrl={
            pendingCategoryForCamera ? insulationExampleImageUrl(pendingCategoryForCamera) : undefined
          }
          layout="bottomSheet"
          zIndex={6000}
          allowBothVariants={true}
        />
      )}

      <PhotoViewerModal
        open={photoViewer.isOpen}
        onClose={photoViewer.close}
        slides={slidesFromUrlFiles(getCurrentImages(), t('upload.modalAlt'))}
        index={photoViewer.index}
        onPrev={() => photoViewer.prev(getCurrentImages().length)}
        onNext={() => photoViewer.next(getCurrentImages().length)}
        alt={t('upload.modalAlt')}
        pdfDownloadLabel={t('kozijn.downloadPdf')}
      />

      <StepContinueFooter
        visible={isComplete}
        onClick={() => {
          void (async () => {
            saveInsulationToStorage({
              insulationSpecs,
              doorIsolated,
              hasNewInsulation,
              selectedCategories,
            });
            try {
              await saveInsulationImagesToStorage(insulationImages);
              setCurrentStep(Step.INSTALLATIE);
            } catch {
              showToast(t('upload.toast.storageQuotaFailed'), 'error');
            }
          })();
        }}
        label={t('insulation.continueInstallatie')}
      />
    </div>
  );
};