import React from 'react';
import { AppFlagPicker } from './AppFlagPicker';

interface AppFlaggedLabelProps {
  label: string;
  value: 'red' | 'yellow' | 'green' | null | undefined;
  onChange: (value: 'red' | 'yellow' | 'green' | null) => void;
  className?: string;
}

export const AppFlaggedLabel: React.FC<AppFlaggedLabelProps> = ({
  label,
  value,
  onChange,
  className = '',
}) => {
  let labelNode;

  if (value === 'red') {
    labelNode = (
      <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider block w-fit">
        {label}
      </span>
    );
  } else if (value === 'yellow') {
    labelNode = (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider block w-fit">
        {label}
      </span>
    );
  } else if (value === 'green') {
    labelNode = (
      <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider block w-fit">
        {label}
      </span>
    );
  } else {
    labelNode = (
      <span className="text-on-surface-variant/70 font-bold text-[10px] uppercase tracking-wider leading-tight">
        {label}
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-1 w-full md:w-40 shrink-0 select-none ${className}`}>
      {labelNode}
      <AppFlagPicker value={value} onChange={onChange} size="sm" className="mt-0.5" />
    </div>
  );
};
export default AppFlaggedLabel;
