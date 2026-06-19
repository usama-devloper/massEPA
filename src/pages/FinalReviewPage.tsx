import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { BackToTop } from '../components/common/BackToTop';
import { PageBackLink } from '../components/common/PageBackLink';
import { Step, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { idbGet } from '../storage/idbKv';
import type { PhotoCaptureStoredData } from '../storage/photoCaptureData';
import { buildAuditReviewItems } from '../utils/auditReviewItems';

interface FinalReviewPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile?: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
  bouwjaar: string;
  buurt: string;
  wijk: string;
  gemeente: string;
  hasFloorPlans: boolean | null;
  vloerenType: string;
  wandenType: string;
  gboT: string;
  leidingdoorvoeren: string;
  avr: string;
}

export function FinalReviewPage({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
  bouwjaar,
  buurt,
  wijk,
  gemeente,
  hasFloorPlans,
  vloerenType,
  wandenType,
  gboT,
  leidingdoorvoeren,
  avr,
}: FinalReviewPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);
  const [photoCaptureData, setPhotoCaptureData] = useState<PhotoCaptureStoredData | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    idbGet<any[]>('massEPA_upload_files_v1').then((files) => {
      if (cancelled) return;
      setUploadedFilesCount(files ? files.length : 0);
    });

    idbGet<PhotoCaptureStoredData>('massEPA_photos_v1').then((data) => {
      if (cancelled) return;
      if (data) {
        setPhotoCaptureData(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const reviewItems = useMemo(
    () =>
      buildAuditReviewItems(
        {
          bouwjaar,
          buurt,
          wijk,
          gemeente,
          hasFloorPlans,
          selectedRole,
          vloerenType,
          wandenType,
          gboT,
          leidingdoorvoeren,
          avr,
          uploadedFilesCount,
          photoCaptureData,
        },
        t,
      ),
    [
      bouwjaar,
      buurt,
      wijk,
      gemeente,
      hasFloorPlans,
      selectedRole,
      vloerenType,
      wandenType,
      gboT,
      leidingdoorvoeren,
      avr,
      uploadedFilesCount,
      photoCaptureData,
      refreshKey,
      t,
    ],
  );

  const completedCount = reviewItems.filter((item) => item.complete).length;
  const progressPercent = reviewItems.length
    ? Math.round((completedCount / reviewItems.length) * 100)
    : 0;
  const isReadyForSubmission = completedCount === reviewItems.length;
  const pendingCount = reviewItems.length - completedCount;

  const navigate = (step: Step) => {
    setRefreshKey((k) => k + 1);
    setCurrentStep(step);
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
        handleStepChange={navigate}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentStep={currentStep}
        handleStepChange={navigate}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      <main className="app-page-main md:ml-64 pb-8">
        <BackToTop />

        <div className="app-shell-content">
          <PageBackLink label={t('finalReview.backToPhotos')} onClick={() => navigate(Step.PHOTO_CAPTURE)} />

          <motion.div
            className="mb-10 flex items-center justify-between gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm sm:flex">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-gray-900 sm:text-4xl">
                {t('finalReview.title')}
              </h1>
            </div>
            <div className="shrink-0 rounded-full border border-gray-100 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 shadow-sm">
              {isReadyForSubmission ? t('finalReview.ready') : t('finalReview.initial')}
            </div>
          </motion.div>

          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-primary">
                {t('finalReview.percentCompleted', { percent: progressPercent })}
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                {t('finalReview.itemsPending', { count: pendingCount })}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-primary"
              />
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-red-500">
              {t('finalReview.pendingTitle')}
            </h2>
          </div>

          <div className="space-y-3">
            {reviewItems.map((item) => (
              <motion.div
                key={item.title}
                layout
                className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 ${
                  item.complete
                    ? 'border-primary/10 bg-white opacity-75'
                    : 'border-gray-100 bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      item.complete ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {item.complete ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-display text-sm font-black leading-tight ${
                          item.complete
                            ? 'text-gray-400'
                            : 'text-gray-900 transition-colors group-hover:text-primary'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          item.complete
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.complete ? t('common.done') : t('finalReview.pending')}
                      </span>
                      <span className="rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-[9px] font-black">
                        {item.answeredCount}/{item.totalCount}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] leading-snug text-gray-400 sm:whitespace-normal">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(item.targetStep)}
                  disabled={item.complete}
                  className={`shrink-0 whitespace-nowrap rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    item.complete
                      ? 'cursor-not-allowed bg-gray-100 text-gray-300 shadow-none'
                      : 'bg-primary text-white shadow-lg shadow-primary/10 hover:brightness-110'
                  }`}
                >
                  {item.complete ? t('common.done') : item.actionLabel}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-8 border-t border-gray-200 pt-10 md:flex-row">
            <div className="flex flex-1 items-start gap-4">
              <div className="rounded-lg bg-primary/5 p-2 text-primary">
                <HelpCircle size={20} />
              </div>
              <p className="text-sm font-medium leading-relaxed text-gray-500">
                {t('finalReview.footerHint', { count: pendingCount })}
                <br />
                <span className="font-normal text-gray-300">{t('finalReview.footerSub')}</span>
              </p>
            </div>

            <button
              type="button"
              disabled={!isReadyForSubmission}
              onClick={() => setCurrentStep(Step.COMPLETE)}
              className={`flex w-full items-center justify-center gap-3 rounded-3xl px-10 py-5 text-sm font-black uppercase tracking-widest transition-all md:w-auto ${
                isReadyForSubmission
                  ? 'bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed bg-gray-100 text-gray-300 shadow-none'
              }`}
            >
              <Lock size={18} />
              <span>{t('finalReview.submitAudit')}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
