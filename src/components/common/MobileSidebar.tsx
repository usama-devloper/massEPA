// src/components/common/MobileSidebar.tsx
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { Step, UserRole } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { canManageClients } from '../../utils/roleAccess';
import { NavCategoryIcon } from './NavCategoryIcon';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: Step;
  handleStepChange: (step: Step) => void;
  onLogout: () => void;
  userName: string;
  selectedRole?: UserRole;
}

function isMobileItemActive(itemStep: Step, current: Step): boolean {
  if (itemStep === Step.PHOTO_CAPTURE) {
    return current === Step.PHOTO_CAPTURE || current === Step.PHOTO_INTERIOR;
  }
  return current === itemStep;
}

export const MobileSidebar = ({
  isOpen,
  onClose,
  currentStep,
  handleStepChange,
  onLogout,
  userName,
  selectedRole = UserRole.CLIENT,
}: MobileSidebarProps) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 z-[3800]"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -320, opacity: 0 }}
        transition={{ type: 'spring', damping: 35, stiffness: 200 }}
        className="app-sidebar fixed left-0 top-[var(--app-topbar-height)] h-[calc(100dvh-var(--app-topbar-height))] h-[calc(100vh-var(--app-topbar-height))] w-64 bg-sidebar p-5 z-[3900] shadow-xl flex flex-col"
      >
        <div className="mb-6 p-3 bg-primary/10 rounded-xl">
          <p className="font-display font-black text-md text-primary">{userName || 'Bewoner'}</p>
        </div>

        <nav className="space-y-1 flex-grow">
          {menuItems.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => {
                handleStepChange(item.step);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                isMobileItemActive(item.step, currentStep)
                  ? 'bg-primary text-white'
                  : 'text-on-surface-variant hover:bg-gray-200'
              }`}
            >
              <NavCategoryIcon step={item.step} size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="mt-6 flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm w-full"
        >
          <LogOut size={18} />
          {t('common.logout')}
        </button>
      </motion.aside>
    </>
  );
};
