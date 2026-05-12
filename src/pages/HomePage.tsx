import { useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { BackToTop } from '../components/common/BackToTop';
import { Step, UserRole, type FormData } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { loadAlgemeenFromStorage } from '../storage/algemeenData';
import { parseAddressBarParts } from '../utils/addressDisplay';
import {
  getAddressOnlyPropertyMap,
  resolvePropertyMapPresentation,
  type PropertyMapPresentation,
} from '../utils/propertyMap';

interface HomePageProps {
  formData: FormData;
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
}

function FloorLabel({ count, t }: { count: number; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const key = count === 1 ? 'home.floorsOne' : 'home.floorsMany';
  return (
    <p className="mt-2 text-center text-sm font-semibold text-on-surface-variant">
      {t(key, { count })}
    </p>
  );
}

export function HomePage({
  formData,
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
}: HomePageProps) {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [numberOfFloors, setNumberOfFloors] = useState<number | null>(null);
  const [propertyMap, setPropertyMap] = useState<PropertyMapPresentation | null>(null);
  const [mapLoading, setMapLoading] = useState(Boolean(formData.address?.trim()));

  useEffect(() => {
    const stored = loadAlgemeenFromStorage();
    if (typeof stored.numberOfFloors === 'number' && stored.numberOfFloors > 0) {
      setNumberOfFloors(stored.numberOfFloors);
    }
  }, []);

  useEffect(() => {
    const address = formData.address?.trim();
    if (!address) {
      setPropertyMap(null);
      setMapLoading(false);
      return;
    }

    let cancelled = false;
    setMapLoading(true);
    void resolvePropertyMapPresentation(address)
      .then((result) => {
        if (!cancelled) setPropertyMap(result);
      })
      .catch(() => {
        if (!cancelled) setPropertyMap(getAddressOnlyPropertyMap(address));
      })
      .finally(() => {
        if (!cancelled) setMapLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.address]);

  const displayName = formData.fullName?.trim() || userName;
  const { postalCode, street, city } = parseAddressBarParts(formData.address);
  const hasAddressBar = Boolean(postalCode || street || city);

  const handleStepChange = (step: Step) => setCurrentStep(step);

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        showMenu
        showUserMenu
        userName={userName}
        onMenuClick={() => setMobileMenuOpen(true)}
        onManageProfile={onManageProfile}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={onLogoClick}
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

      <main className="app-page-main md:ml-64 pb-28">
        <BackToTop />

        <div className="app-shell-content mx-auto max-w-lg px-4 pt-6 sm:px-6">
          {displayName && (
            <h1 className="text-center font-display text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
              {displayName}
            </h1>
          )}

          {numberOfFloors !== null && numberOfFloors > 0 && (
            <FloorLabel count={numberOfFloors} t={t} />
          )}

          {hasAddressBar && (
            <>
              {/* Mobile: stacked address — full text, no truncation */}
              <div className="mt-5 space-y-1 rounded-xl bg-primary px-4 py-3 text-white shadow-sm md:hidden">
                {street && (
                  <p className="text-center text-base font-black leading-snug">{street}</p>
                )}
                <p className="text-center text-xs font-semibold leading-snug opacity-95">
                  {[postalCode, city].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              {/* Desktop: three columns */}
              <div className="mt-5 hidden items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-white shadow-sm md:flex">
                <span className="shrink-0 text-sm font-bold tracking-wide">
                  {postalCode || '—'}
                </span>
                <span className="min-w-0 flex-1 text-center text-base font-black">
                  {street || '—'}
                </span>
                <span className="shrink-0 max-w-[40%] text-right text-sm font-bold leading-snug">
                  {city || '—'}
                </span>
              </div>
            </>
          )}

          {/* Map — full width on mobile; taller so Google UI (address chip + controls) fits */}
          <div className="relative mt-4 max-md:left-1/2 max-md:w-screen max-md:-translate-x-1/2 md:mx-0 md:w-full md:translate-x-0 md:overflow-hidden md:rounded-2xl md:border md:border-outline-variant/15 md:bg-white md:shadow-sm">
            {mapLoading ? (
              <div className="flex h-[min(52dvh,400px)] min-h-[300px] items-center justify-center bg-surface-container-low md:h-[min(42vh,320px)] md:min-h-[220px]">
                <p className="text-sm font-medium text-on-surface-variant">
                  {t('home.mapLoading')}
                </p>
              </div>
            ) : propertyMap?.embedUrl ? (
              <iframe
                key={propertyMap.embedUrl}
                title={street || t('home.streetView')}
                src={propertyMap.embedUrl}
                className="block h-[min(52dvh,400px)] min-h-[300px] w-full border-0 md:h-[min(42vh,320px)] md:min-h-[220px]"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-[min(52dvh,400px)] min-h-[300px] flex-col items-center justify-center gap-2 bg-surface-container-low px-6 text-center md:h-[min(42vh,320px)] md:min-h-[220px]">
                <MapPin size={28} className="text-on-surface-variant/50" />
                <p className="text-sm font-medium text-on-surface-variant">
                  {t('home.noMap')}
                </p>
              </div>
            )}
          </div>

          {propertyMap?.externalUrl && (
            <a
              href={propertyMap.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-0 mt-2 flex items-center justify-end gap-1 px-4 text-xs font-semibold text-primary hover:underline md:px-0"
            >
              {t('home.openStreetView')}
              <ExternalLink size={12} />
            </a>
          )}

          <button
            type="button"
            onClick={() => setCurrentStep(Step.DASHBOARD)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-black text-white shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            {t('home.startAudit')}
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
