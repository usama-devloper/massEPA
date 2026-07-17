// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { dashboardCategoryIcon } from '../components/common/NavCategoryIcon';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { BackToTop } from '../components/common/BackToTop';
import { Toast } from '../components/common/Toast';
import { Step, UserRole } from '../types';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import { HOUSE_DESIGN_PAGE_STORAGE_KEY } from '../storage/houseDesignPageData';
import { loadPhotoCaptureFromStorage } from '../storage/photoCaptureData';
import { computePhotoCaptureProgress } from '../utils/photoCaptureProgress';
import { idbGet } from '../storage/idbKv';

interface DashboardPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile: () => void;
  userName: string;
  selectedRole: UserRole;
  onLogoClick?: () => void;
  profilePhoto?: string;
  onOpenSettings?: () => void;
}

interface CategoryProgress {
  name: string;
  icon: React.ReactNode;
  step: Step;
  progress: number;
  subtext: string;
}

/** Pastel fill by progress band (0 / 1–24 / 25–49 / 50–74 / 75–99 / 100). */
function getProgressFillClass(progress: number): string {
  if (progress >= 100) return 'bg-[#86efac]';
  if (progress >= 75) return 'bg-[#a7f3d0]';
  if (progress >= 50) return 'bg-[#bfdbfe]';
  if (progress >= 25) return 'bg-[#fde68a]';
  if (progress >= 1) return 'bg-[#fecaca]';
  return '';
}

function getProgressStatusLabel(progress: number, completeLabel: string): string {
  if (progress >= 100) return completeLabel;
  return '';
}

// Progress Row Component
const ProgressRow = ({
  category,
  completeLabel,
  onClick,
}: {
  category: CategoryProgress;
  completeLabel: string;
  onClick: () => void;
}) => {
  const progress = category.progress;
  const fillClass = getProgressFillClass(progress);
  const statusLabel = getProgressStatusLabel(progress, completeLabel);
  const isComplete = progress >= 100;

  return (
    <div
      className="relative h-12 cursor-pointer transition-all hover:shadow-md rounded-lg overflow-hidden bg-white border border-gray-300"
      onClick={onClick}
    >
      {progress > 0 && (
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-500 rounded-l-lg ${fillClass}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between w-full px-3 h-full min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="shrink-0 text-gray-600">{category.icon}</div>
          <span className="font-black text-xs sm:text-sm text-gray-900 whitespace-nowrap shrink-0">
            {category.name}
          </span>
          {!isComplete && (
            <span className="text-[10px] text-gray-500 truncate hidden sm:inline">
              {category.subtext}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span
            className={`font-bold text-xs sm:text-sm ${isComplete ? 'text-emerald-800' : 'text-gray-800'}`}
          >
            {statusLabel}
          </span>
          <ArrowRight size={14} className="text-gray-600" />
        </div>
      </div>
    </div>
  );
};

function recalcCompleteProgress(categories: CategoryProgress[]): CategoryProgress[] {
  const sectionRows = categories.filter((item) => item.step !== Step.COMPLETE);
  const avgProgress =
    sectionRows.length > 0
      ? Math.round(sectionRows.reduce((sum, item) => sum + item.progress, 0) / sectionRows.length)
      : 0;

  return categories.map((item) =>
    item.step === Step.COMPLETE
      ? { ...item, progress: avgProgress, subtext: `${avgProgress}%` }
      : item,
  );
}

export function DashboardPage({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  userName,
  selectedRole,
  onLogoClick,
  profilePhoto,
  onOpenSettings,
}: DashboardPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast, setToast, showToast } = useToast();
  const { t } = useLanguage();

  const [progressData, setProgressData] = useState<CategoryProgress[]>([
    { name: t('dashboard.categories.algemeen'), icon: dashboardCategoryIcon(Step.ALGEMEEN), step: Step.ALGEMEEN, progress: 0, subtext: '0/5 fields' },
    { name: t('dashboard.categories.upload'), icon: dashboardCategoryIcon(Step.UPLOAD), step: Step.UPLOAD, progress: 0, subtext: '0/2 sections' },
    { name: t('dashboard.categories.insulation'), icon: dashboardCategoryIcon(Step.INSULATION_DETAILS), step: Step.INSULATION_DETAILS, progress: 0, subtext: '0/4 cats' },
    { name: t('dashboard.categories.installatie'), icon: dashboardCategoryIcon(Step.INSTALLATIE), step: Step.INSTALLATIE, progress: 0, subtext: '0/8 sec' },
    { name: t('dashboard.categories.photos'), icon: dashboardCategoryIcon(Step.PHOTO_CAPTURE), step: Step.PHOTO_CAPTURE, progress: 0, subtext: '0/4 items' },
  ]);

  // Load progress from localStorage
  useEffect(() => {
    let cancelled = false;

    const applyProgress = (patch: Partial<Record<Step, { progress: number; subtext: string }>>) => {
      if (cancelled) return;
      setProgressData((prev) =>
        recalcCompleteProgress(
          prev.map((item) => (patch[item.step] ? { ...item, ...patch[item.step]! } : item)),
        ),
      );
    };

    const patch: Partial<Record<Step, { progress: number; subtext: string }>> = {};

    // ALGEMEEN Progress
    const algemeenData = localStorage.getItem('algemeenData');
    if (algemeenData) {
      try {
        const parsed = JSON.parse(algemeenData);
        let filledFields = 0;
        if (parsed.buildingType && parsed.buildingType !== '') filledFields++;
        if (parsed.position && parsed.position !== '') filledFields++;
        if (parsed.location && parsed.location !== '') filledFields++;
        if (parsed.numberOfFloors && parsed.numberOfFloors !== null) filledFields++;
        if (parsed.hasFloorPlans !== undefined && parsed.hasFloorPlans !== null) filledFields++;
        const progress = Math.round((filledFields / 5) * 100);
        patch[Step.ALGEMEEN] = { progress, subtext: `${filledFields}/5 fields` };
      } catch {
        /* ignore */
      }
    }

    // UPLOAD Progress (requires async IDB read for files)
    void idbGet<any[]>('massEPA_upload_files_v1').then((files) => {
      if (cancelled) return;
      const fileCount = files ? files.length : 0;
      const uploadData = localStorage.getItem(HOUSE_DESIGN_PAGE_STORAGE_KEY);
      if (uploadData) {
        try {
          const parsed = JSON.parse(uploadData);
          let sectionsCompleted = 0;

          // Check if floor plans are required based on algemeenData
          const algemeenData = localStorage.getItem('algemeenData');
          let requiresDrawings = true;
          if (algemeenData) {
            const parsedAlgemeen = JSON.parse(algemeenData);
            if (parsedAlgemeen.hasFloorPlans === false) {
              requiresDrawings = false;
            }
          }

          const totalSections = requiresDrawings ? 2 : 1;

          if (requiresDrawings && fileCount > 0) {
            sectionsCompleted++;
          }

          const selectedRooms = parsed.selectedRooms || {};
          const customSelectedRooms = parsed.selectedCustomRooms || {};
          const totalRooms =
            Object.values(selectedRooms).flat().length +
            Object.values(customSelectedRooms).flat().length;
          if (totalRooms > 0) sectionsCompleted++;

          const progress = Math.round((sectionsCompleted / totalSections) * 100);
          applyProgress({
            [Step.UPLOAD]: {
              progress,
              subtext: `${sectionsCompleted}/${totalSections} sec`,
            },
          });
        } catch {
          /* ignore */
        }
      }
    });

    // ISOLATIE Progress
    const insulationData = localStorage.getItem('massEPA_insulation_v1');
    if (insulationData) {
      try {
        const parsed = JSON.parse(insulationData);
        const selectedCategories = parsed.selectedCategories || [];
        let completedCategories = 0;
        for (const category of selectedCategories) {
          const spec = parsed.insulationSpecs?.[category];
          const isComplete = selectedRole === UserRole.CLIENT || (
            spec &&
            spec.material &&
            spec.material !== '' &&
            spec.thickness &&
            parseInt(spec.thickness) > 0 &&
            spec.yearBuilt &&
            spec.yearBuilt !== ''
          );
          if (isComplete) {
            completedCategories++;
          }
        }
        const progress =
          selectedCategories.length > 0
            ? Math.round((completedCategories / selectedCategories.length) * 100)
            : 0;
        patch[Step.INSULATION_DETAILS] = {
          progress,
          subtext: `${completedCategories}/${selectedCategories.length} cats`,
        };
      } catch {
        /* ignore */
      }
    }

    // INSTALLATIE Progress (only ticked sections count)
    const installatieData = localStorage.getItem('massEPA_installatie_v1');
    if (installatieData) {
      try {
        const parsed = JSON.parse(installatieData);
        const selected: string[] = Array.isArray(parsed.selectedSections) ? parsed.selectedSections : [];
        const isSectionDone = (id: string): boolean => {
          switch (id) {
            case 'ventilation':
              return parsed.ventilationCo2 !== null && parsed.ventilationCo2 !== undefined;
            case 'heating':
              return !!(parsed.heatingSystemType && parsed.heatingLocation);
            case 'tapwater':
              return parsed.heatingSameAsWater !== null && parsed.heatingSameAsWater !== undefined;
            case 'solar':
              return parsed.solarPanels !== null && parsed.solarPanels !== undefined;
            case 'cooling':
              return parsed.activeCooling !== null && parsed.activeCooling !== undefined;
            default:
              return false;
          }
        };
        const totalSections = selected.length;
        const sectionsCompleted = selected.filter(isSectionDone).length;
        const progress =
          totalSections > 0 ? Math.round((sectionsCompleted / totalSections) * 100) : 0;
        patch[Step.INSTALLATIE] = {
          progress,
          subtext: `${sectionsCompleted}/${totalSections} sec`,
        };
      } catch {
        /* ignore */
      }
    }

    applyProgress(patch);

    void loadPhotoCaptureFromStorage().then((photoState) => {
      if (cancelled) return;
      const stats = computePhotoCaptureProgress(photoState.exterior, photoState.interior);
      applyProgress({
        [Step.PHOTO_CAPTURE]: {
          progress: stats.progress,
          subtext: `${stats.completed}/${stats.total} items`,
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setProgressData((prev) =>
      prev.map((item) => {
        switch (item.step) {
          case Step.ALGEMEEN:
            return { ...item, name: t('dashboard.categories.algemeen') };
          case Step.UPLOAD:
            return { ...item, name: t('dashboard.categories.upload') };
          case Step.INSULATION_DETAILS:
            return { ...item, name: t('dashboard.categories.insulation') };
          case Step.INSTALLATIE:
            return { ...item, name: t('dashboard.categories.installatie') };
          case Step.PHOTO_CAPTURE:
            return { ...item, name: t('dashboard.categories.photos') };
          case Step.COMPLETE:
            return { ...item, name: t('dashboard.categories.complete') };
          default:
            return item;
        }
      }),
    );
  }, [t]);

  const handleNavigate = (step: Step) => {
    setCurrentStep(step);
  };

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
  };

  return (
    <div className="bg-[#f8faf8] min-h-screen">
      <TopBar
        showMenu={true}
        showUserMenu={true}
        userName={userName}
        onMenuClick={() => setMobileMenuOpen(true)}
        onManageProfile={onManageProfile}
        onLogout={onLogout}
        onLogoClick={onLogoClick}
        profilePhoto={profilePhoto}
        onOpenSettings={onOpenSettings}
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

      <main className="app-page-main md:ml-64 pb-8">
        <BackToTop />

        <div className="app-shell-content">
          {/* Header */}
          <header className="app-page-title text-center mb-6">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-on-surface tracking-tighter">
              {t('dashboard.title')}
            </h1>
          </header>

          {/* Progress Cards */}
          <div className="space-y-2">
            {progressData.map((category, idx) => (
              <ProgressRow
                key={idx}
                category={category}
                completeLabel={t('dashboard.progressComplete')}
                onClick={() => handleNavigate(category.step)}
              />
            ))}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}