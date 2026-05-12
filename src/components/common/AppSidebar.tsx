// src/components/common/AppSidebar.tsx
import { Step } from '../../types';
import { Edit3, Upload, Shield, Building2, Frame, CheckCircle, LogOut } from 'lucide-react';

interface AppSidebarProps {
  currentStep: Step;
  handleStepChange: (step: Step) => void;
  onLogout: () => void;
  userName: string;
}

export const AppSidebar = ({ currentStep, handleStepChange, onLogout, userName }: AppSidebarProps) => {
  const appPages = [Step.DASHBOARD, Step.UPLOAD, Step.INSULATION_DETAILS, Step.INSTALLATIE, Step.KOZIJN_GLAS, Step.COMPLETE];
  if (!appPages.includes(currentStep)) return null;

  const menuItems = [
    { step: Step.DASHBOARD, label: 'Algemeen', icon: Edit3 },
    { step: Step.UPLOAD, label: 'Upload Documenten', icon: Upload },
    { step: Step.INSULATION_DETAILS, label: 'Isolatie Details', icon: Shield },
    { step: Step.INSTALLATIE, label: 'Installaties', icon: Building2 },
    { step: Step.KOZIJN_GLAS, label: 'Kozijn & Glas', icon: Frame },
    { step: Step.COMPLETE, label: 'Compleet', icon: CheckCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 hidden md:flex flex-col bg-[#f3f4ee] p-5 z-50 border-r border-outline-variant/10">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <img src="/logo.png" alt="BuildingID" className="h-12 w-auto" onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=B';
        }} />
      </div>

      {/* User Name */}
      <div className="mb-6 p-3 bg-primary/10 rounded-xl">
        <p className="text-[10px] font-black uppercase tracking-wider text-primary/60">Logged in as</p>
        <p className="font-display font-black text-md text-primary">{userName || 'Bewoner'}</p>
      </div>

      <nav className="flex-grow space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.step}
            onClick={() => handleStepChange(item.step)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm font-bold transition-all ${
              currentStep === item.step ? 'bg-primary text-white' : 'text-on-surface-variant/60 hover:bg-surface-container-high'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="mt-auto mb-2 flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
      >
        <LogOut size={18} />
        Uitloggen
      </button>
    </aside>
  );
};