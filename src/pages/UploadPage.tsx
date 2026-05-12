// src/pages/UploadPage.tsx
import { Menu, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { DevNav } from '../components/common/DevNav';
import { BackToTop } from '../components/common/BackToTop';
import { Step } from '../types';

export const UploadPage = ({ currentStep, setCurrentStep, onLogout, userName }: any) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#f8faf8] min-h-screen">
      <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2"><Menu size={24} /></button>
          <img src="/logo.png" alt="BuildingID" className="h-8 w-auto" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=B'} />
        </div>
        <button><HelpCircle size={24} /></button>
      </header>

      <AppSidebar currentStep={currentStep} handleStepChange={setCurrentStep} onLogout={onLogout} userName={userName} />
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentStep={currentStep} handleStepChange={setCurrentStep} onLogout={onLogout} userName={userName} />

      <main className="md:ml-64 px-4 py-6 pb-32">
        <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
        <BackToTop />
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-black mb-6">Upload Documents</h1>
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Upload functionality coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
};