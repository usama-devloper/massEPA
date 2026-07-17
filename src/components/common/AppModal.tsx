import React from 'react';
import { Edit3, X } from 'lucide-react';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  saveLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  saveLabel = 'Opslaan',
  cancelLabel = 'Sluiten',
  children
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-outline-variant/10 flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50 bg-slate-50/50">
          <div className="flex items-center gap-2 text-primary">
            <Edit3 size={16} />
            <h3 className="text-xs font-black text-on-background uppercase tracking-wider">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-250 text-on-surface-variant/50 hover:text-on-background rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Form Fields */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[65vh]">
          {children}
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-4 border-t border-outline-variant/10 bg-gray-50 flex items-center justify-end gap-2 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-outline-variant/15 hover:bg-gray-150 text-on-surface-variant/80 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider active:scale-[0.98]"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppModal;
