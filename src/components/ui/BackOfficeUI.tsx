import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  showHeader?: boolean;
}

export const CollapsibleSection: React.FC<SectionProps> = ({ 
  title, 
  children, 
  defaultOpen = true,
  showHeader = true 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`mb-5 ${showHeader ? 'border border-outline-variant/10 rounded-2xl bg-white shadow-sm' : ''}`}>
      {showHeader && (
        <div 
          className={`bg-primary text-white px-5 py-4 flex items-center justify-between font-display font-black text-sm select-none cursor-pointer hover:bg-primary-dark transition-all duration-200 ${isOpen ? 'rounded-t-2xl' : 'rounded-2xl'}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <span className="tracking-wide">{title}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      )}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="bg-white rounded-b-2xl"
          >
            <div className="p-5 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FieldGroup: React.FC<{ 
  label: string | React.ReactNode; 
  children: React.ReactNode; 
  labelClassName?: string; 
  className?: string 
}> = ({ label, children, labelClassName, className }) => (
  <div className={`grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-3 w-full min-w-0 ${className || ''}`}>
    {typeof label === 'string' ? (
      <label 
        className={`text-on-surface-variant/70 font-bold text-[10px] uppercase tracking-wider leading-tight w-full md:w-40 shrink-0 ${labelClassName || ''}`} 
        title={label}
      >
        {label}
      </label>
    ) : (
      label
    )}
    <div className="flex items-center min-w-0 flex-1 w-full">
      {children}
    </div>
  </div>
);

export const VerticalFieldGroup: React.FC<{ 
  label: string; 
  children: React.ReactNode 
}> = ({ label, children }) => (
  <div className="flex flex-col gap-1.5 w-full min-w-0">
    <label 
      className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tight" 
      title={label}
    >
      {label}
    </label>
    <div className="flex items-center min-w-0 w-full">
      {children}
    </div>
  </div>
);

export interface AppInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const AppInputField: React.FC<AppInputFieldProps> = ({ className, ...props }) => (
  <input
    className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${className || ''}`}
    {...props}
  />
);

export interface AppTextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const AppTextAreaField: React.FC<AppTextAreaFieldProps> = ({ className, ...props }) => (
  <textarea
    className={`bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold disabled:opacity-60 disabled:cursor-not-allowed resize-none ${className || ''}`}
    {...props}
  />
);
