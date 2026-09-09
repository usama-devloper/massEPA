import React from 'react';
import { AppFlagPicker } from './AppFlagPicker';

interface AppFlaggedLabelProps {
  label: string;
  value: 'red' | 'yellow' | 'green' | null | undefined;
  onChange: (value: 'red' | 'yellow' | 'green' | null) => void;
  className?: string;
  role?: string;
}

export const AppFlaggedLabel: React.FC<AppFlaggedLabelProps> = ({
  label,
  value,
  onChange,
  className = '',
  role = 'SYS',
}) => {
  let labelNode;

  if (value === 'red') {
    labelNode = (
      <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider block w-fit font-sans leading-none">
        {label}
      </span>
    );
  } else if (value === 'yellow') {
    labelNode = (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider block w-fit font-sans leading-none">
        {label}
      </span>
    );
  } else if (value === 'green') {
    labelNode = (
      <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider block w-fit font-sans leading-none">
        {label}
      </span>
    );
  } else {
    labelNode = (
      <span className="text-on-surface-variant/70 font-bold text-[10px] uppercase tracking-wider leading-tight font-sans block mb-0.5">
        {label}
      </span>
    );
  }

  return (
    <div className={`py-1 w-full md:w-[160px] shrink-0 select-none ${className}`}>
      {labelNode}
      <div className="flex items-center gap-1.5 mt-1 ml-0.5">
        {role && (
          <span className="text-[9px] font-black text-neutral-500 tracking-wider leading-none">
            {role}
          </span>
        )}
        <AppFlagPicker value={value} onChange={onChange} size="sm" />
      </div>
    </div>
  );
};
export default AppFlaggedLabel;

