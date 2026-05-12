// src/pages/CompletePage.tsx
import { useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { DevNav } from '../components/common/DevNav';
import { BackToTop } from '../components/common/BackToTop';
import { PageBackLink } from '../components/common/PageBackLink';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Step, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CompletePageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile?: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
}

export function CompletePage({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
}: CompletePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = () => {
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    alert('Application submitted successfully!');
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

      <main className="app-page-main md:ml-64 pb-8">
        <BackToTop />

        <div className="app-shell-content">
          <PageBackLink label={t('complete.backToReview')} onClick={() => setCurrentStep(Step.FINAL_REVIEW)} />

          <div className="flex min-h-[70vh] flex-col items-center justify-center text-center w-full">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black mb-4 tracking-tighter">{t('complete.title')}</h1>
          <p className="text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed">
            {t('complete.message')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setCurrentStep(Step.DASHBOARD)}
              className="px-8 py-3 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
            >
              {t('complete.backDashboard')}
            </button>
            <button 
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl font-black uppercase tracking-widest bg-primary text-white shadow-xl hover:brightness-110 transition-all"
            >
              {t('complete.submit')}
            </button>
          </div>
        </div>
        </div>
      </main>

      <ConfirmModal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)} 
        onConfirm={confirmSubmit} 
        title="Final Submission" 
        message="Are you ready to submit your application? Please review all information before confirming." 
      />
    </div>
  );
}