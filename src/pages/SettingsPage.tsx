// src/pages/SettingsPage.tsx
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Check, Languages, Palette, RotateCcw } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { PageBackLink } from '../components/common/PageBackLink';
import { BackToTop } from '../components/common/BackToTop';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { Step, UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LOCALES, type Locale } from '../i18n/types';
import { THEME_ORDER, THEME_PRESETS, type ThemeId } from '../theme/themePresets';

interface SettingsPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
  onResetUserData?: () => void | Promise<void>;
}

export const SettingsPage = ({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
  onResetUserData,
}: SettingsPageProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { themeId, setThemeId } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const { toast, setToast, showToast } = useToast();

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
  };

  const handleResetData = async () => {
    if (!onResetUserData) return;
    if (!window.confirm(t('settings.reset.confirm'))) return;

    setResetting(true);
    try {
      await onResetUserData();
      showToast(t('settings.reset.success'), 'success');
    } catch {
      showToast(t('settings.reset.error'), 'error');
    } finally {
      setResetting(false);
    }
  };

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
          <PageBackLink
            label={t('settings.backToAlgemeen')}
            onClick={() => setCurrentStep(Step.ALGEMEEN)}
          />

          <header className="mb-8 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Palette size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-on-background tracking-tighter">
                {t('settings.title')}
              </h1>
              <p className="text-gray-600 text-sm mt-1">{t('settings.subtitle')}</p>
            </div>
          </header>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <Languages size={14} />
              {t('settings.language.title')}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {t('settings.language.description')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LOCALES.map((id: Locale) => {
                const selected = locale === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLocale(id)}
                    className={`text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md ${
                      selected
                        ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-black text-base text-on-background">
                        {t(`settings.language.${id}`)}
                      </span>
                      {selected && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4">
              {t('settings.colorScheme')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEME_ORDER.map((id: ThemeId) => {
                const preset = THEME_PRESETS[id];
                const selected = themeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setThemeId(id)}
                    className={`text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md ${
                      selected
                        ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-display font-black text-base text-on-background">
                        {t(`themes.${id}.label`)}
                      </span>
                      {selected && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{t(`themes.${id}.description`)}</p>
                    <div className="flex gap-1.5 rounded-lg overflow-hidden h-3 ring-1 ring-black/5">
                      <span className="flex-1" style={{ background: preset.primary }} title="Primary" />
                      <span className="flex-1" style={{ background: preset.surface }} title="Surface" />
                      <span className="flex-1" style={{ background: preset.sidebar }} title="Sidebar" />
                      <span className="flex-1" style={{ background: preset.background }} title="Background" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
              <RotateCcw size={14} />
              {t('settings.reset.title')}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {t('settings.reset.description')}
            </p>
            <button
              type="button"
              onClick={() => void handleResetData()}
              disabled={resetting || !onResetUserData}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} className={resetting ? 'animate-spin' : undefined} />
              {resetting ? t('settings.reset.working') : t('settings.reset.button')}
            </button>
          </section>
        </div>
      </main>

      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
};
