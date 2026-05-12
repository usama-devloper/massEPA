// src/components/common/MobileSidebar.tsx
import { motion } from 'motion/react';
import { X, LogOut, Edit3, Upload, Shield, Building2, Frame, CheckCircle } from 'lucide-react';
import { Step } from '../../types';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: Step;
  handleStepChange: (step: Step) => void;
  onLogout: () => void;
  userName: string;
}

export const MobileSidebar = ({ isOpen, onClose, currentStep, handleStepChange, onLogout, userName }: MobileSidebarProps) => {
  const appPages = [Step.DASHBOARD, Step.UPLOAD, Step.INSULATION_DETAILS, Step.INSTALLATIE, Step.KOZIJN_GLAS, Step.COMPLETE];
  if (!isOpen) return null;

  const menuItems = [
    { step: Step.DASHBOARD, label: 'Algemeen', icon: Edit3 },
    { step: Step.UPLOAD, label: 'Upload Documenten', icon: Upload },
    { step: Step.INSULATION_DETAILS, label: 'Isolatie Details', icon: Shield },
    { step: Step.INSTALLATIE, label: 'Installaties', icon: Building2 },
    { step: Step.KOZIJN_GLAS, label: 'Kozijn & Glas', icon: Frame },
    { step: Step.COMPLETE, label: 'Compleet', icon: CheckCircle },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[150]" onClick={onClose} />
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        className="fixed left-0 top-0 h-full w-64 bg-[#f3f4ee] p-5 z-[160] shadow-xl flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <img src="/logo.png" alt="BuildingID" className="h-10 w-auto" onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=B';
          }} />
          <button onClick={onClose} className="p-1"><X size={20} /></button>
        </div>

        <div className="mb-6 p-3 bg-primary/10 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary/60">Logged in as</p>
          <p className="font-display font-black text-md text-primary">{userName || 'Bewoner'}</p>
        </div>

        <nav className="space-y-1 flex-grow">
          {menuItems.map((item) => (
            <button
              key={item.step}
              onClick={() => { handleStepChange(item.step); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                currentStep === item.step ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-gray-200'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => { onLogout(); onClose(); }}
          className="mt-6 flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm w-full"
        >
          <LogOut size={18} />
          Uitloggen
        </button>
      </motion.aside>
    </>
  );
};