import { ArrowRight } from 'lucide-react';

type StepContinueFooterProps = {
  /** When false, button is not rendered (per-page validation unchanged). */
  visible?: boolean;
  onClick: () => void;
  label: string;
};

/** Floating continue control — same style as Photo Capture (pill, bottom-right). */
export function StepContinueFooter({
  visible = true,
  onClick,
  label,
}: StepContinueFooterProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-20 md:right-8">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {label}
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
