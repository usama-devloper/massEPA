// src/components/common/AppSidebar.tsx
import { Step, UserRole } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { canManageClients } from '../../utils/roleAccess';
import { LogOut } from 'lucide-react';
import { NavCategoryIcon } from './NavCategoryIcon';

interface AppSidebarProps {
  currentStep: Step;
  handleStepChange: (step: Step) => void;
  onLogout: () => void;
  userName: string;
  selectedRole?: UserRole;
}

function isSidebarItemActive(itemStep: Step, current: Step): boolean {
  if (itemStep === Step.PHOTO_CAPTURE) {
    return current === Step.PHOTO_CAPTURE || current === Step.PHOTO_INTERIOR;
  }
  return current === itemStep;
}

export const AppSidebar = ({
  currentStep,
  handleStepChange,
  onLogout,
  userName,
  selectedRole = UserRole.CLIENT,
}: AppSidebarProps) => {
  const { t } = useLanguage();

  const appPages: Step[] = [
    Step.HOME,
    Step.DASHBOARD,
    Step.ALGEMEEN,
    Step.UPLOAD,
    Step.INSULATION_DETAILS,
    Step.INSTALLATIE,
    Step.KOZIJN_GLAS,
    Step.PHOTO_CAPTURE,
    Step.FINAL_REVIEW,
    Step.COMPLETE,
    Step.SETTINGS,
    Step.CLIENTS,
  ];
  if (!appPages.includes(currentStep) && currentStep !== Step.PHOTO_INTERIOR) return null;

  const menuItems: { step: Step; label: string }[] = [
    ...(canManageClients(selectedRole)
      ? [{ step: Step.CLIENTS, label: t('nav.clients') }]
      : []),
    { step: Step.HOME, label: t('nav.home') },
    { step: Step.DASHBOARD, label: t('nav.dashboard') },
    { step: Step.ALGEMEEN, label: t('nav.algemeen') },
    { step: Step.UPLOAD, label: t('nav.upload') },
    { step: Step.INSULATION_DETAILS, label: t('nav.insulation') },
    { step: Step.INSTALLATIE, label: t('nav.installatie') },
    { step: Step.KOZIJN_GLAS, label: t('nav.kozijnGlas') },
    { step: Step.PHOTO_CAPTURE, label: t('nav.photos') },
    { step: Step.FINAL_REVIEW, label: t('nav.finalReview') },
    { step: Step.COMPLETE, label: t('nav.complete') },
    { step: Step.SETTINGS, label: t('nav.settings') },
  ];

  return (
    <aside className="app-sidebar fixed left-0 top-[var(--app-topbar-height)] hidden md:flex h-[calc(100dvh-var(--app-topbar-height))] h-[calc(100vh-var(--app-topbar-height))] w-64 flex-col bg-sidebar p-5 z-[100] border-r border-outline-variant/10">
      <div className="mb-6 p-3 bg-primary/10 rounded-xl">
        <p className="font-display font-black text-md text-primary">{userName || 'Bewoner'}</p>
      </div>

      <nav className="flex-grow space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.step}
            type="button"
            onClick={() => handleStepChange(item.step)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm font-bold transition-all ${
              isSidebarItemActive(item.step, currentStep)
                ? 'bg-primary text-white'
                : 'text-on-surface-variant/60 hover:bg-surface-container-high'
            }`}
          >
            <NavCategoryIcon step={item.step} size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-auto mb-2 flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
      >
        <LogOut size={18} />
        {t('common.logout')}
      </button>
    </aside>
  );
};
