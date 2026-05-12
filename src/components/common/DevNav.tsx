// src/components/common/DevNav.tsx
import { Step } from '../../types';

interface DevNavProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
}

export const DevNav = ({ currentStep, setCurrentStep }: DevNavProps) => {
  const appPages = [Step.DASHBOARD, Step.UPLOAD, Step.INSULATION_DETAILS, Step.INSTALLATIE, Step.KOZIJN_GLAS, Step.COMPLETE];
  if (!appPages.includes(currentStep)) return null;

  return (
    <div className="fixed bottom-2 left-2 right-2 z-40 bg-[#24512c] backdrop-blur-md px-3 py-2 rounded-xl shadow-2xl border border-white/20">
      <div className="flex flex-wrap gap-1 justify-center mb-1">
        {appPages.map((step) => (
          <button
            key={step}
            onClick={() => setCurrentStep(step)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
              currentStep === step 
                ? 'bg-white text-[#24512c] shadow-md' 
                : 'text-white/80 hover:text-white hover:bg-white/20'
            }`}
          >
            {step === Step.DASHBOARD && 'Info'}
            {step === Step.UPLOAD && 'Upload'}
            {step === Step.INSULATION_DETAILS && 'Ins'}
            {step === Step.INSTALLATIE && 'Inst'}
            {step === Step.KOZIJN_GLAS && 'Koz'}
            {step === Step.COMPLETE && 'Done'}
          </button>
        ))}
      </div>
      <div className="text-center text-white/40 text-[8px] font-bold uppercase tracking-wider border-t border-white/15 pt-1 mt-1">
        © 2026 BuildingID
      </div>
    </div>
  );
};