// src/components/common/DevNav.tsx
import { Step } from '../../types';

interface DevNavProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
}

/** Steps that show the main app chrome + dev bar (subset of `Step` used in the flow). */
const DEV_NAV_STEPS: Step[] = [
  Step.HOME,
  Step.DASHBOARD,
  Step.ALGEMEEN,
  Step.UPLOAD,
  Step.INSULATION_DETAILS,
  Step.INSTALLATIE,
  Step.KOZIJN_GLAS,
  Step.PHOTO_CAPTURE,
  Step.PHOTO_INTERIOR,
  Step.FINAL_REVIEW,
  Step.COMPLETE,
  Step.SETTINGS,
];

const DEV_NAV_BUTTONS: { step: Step; label: string }[] = [
  { step: Step.HOME, label: 'Home' },
  { step: Step.DASHBOARD, label: 'Dash' },
  { step: Step.ALGEMEEN, label: 'Alg' },
  { step: Step.UPLOAD, label: 'Upload' },
  { step: Step.INSULATION_DETAILS, label: 'Ins' },
  { step: Step.INSTALLATIE, label: 'Inst' },
  { step: Step.KOZIJN_GLAS, label: 'Koz' },
  { step: Step.PHOTO_CAPTURE, label: 'Photo' },
  { step: Step.FINAL_REVIEW, label: 'Final Review' },
  { step: Step.COMPLETE, label: 'Done' },
  { step: Step.SETTINGS, label: 'Set' },
];

function isPhotoCaptureNavActive(navStep: Step, current: Step): boolean {
  return (
    navStep === Step.PHOTO_CAPTURE &&
    (current === Step.PHOTO_CAPTURE || current === Step.PHOTO_INTERIOR)
  );
}

export const DevNav = ({ currentStep, setCurrentStep }: DevNavProps) => {
  if (!DEV_NAV_STEPS.includes(currentStep)) return null;

  return (
    <div className="fixed bottom-2 left-2 right-2 z-40 bg-primary backdrop-blur-md px-3 py-2 rounded-xl shadow-2xl border border-white/20">
      <div className="flex flex-wrap gap-1 justify-center">
        {DEV_NAV_BUTTONS.map(({ step, label }) => (
          <button
            key={step}
            type="button"
            onClick={() => setCurrentStep(step)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide transition-all ${
              currentStep === step || isPhotoCaptureNavActive(step, currentStep)
                ? 'bg-white text-primary shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="text-center text-white/40 text-[8px] font-bold uppercase tracking-wider border-t border-white/15 pt-1 mt-1">
        © 2026 BuildingID
      </div>
    </div>
  );
};
