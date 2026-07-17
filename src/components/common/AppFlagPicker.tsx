import React from 'react';

interface AppFlagPickerProps {
  value: 'red' | 'yellow' | 'green' | null | undefined;
  onChange: (value: 'red' | 'yellow' | 'green' | null) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const AppFlagPicker: React.FC<AppFlagPickerProps> = ({
  value,
  onChange,
  className = '',
  size = 'md',
}) => {
  const heightClass = size === 'sm' ? 'h-[10px] w-16' : 'h-[14px] w-20';
  const roundedClass = size === 'sm' ? 'rounded-[3px]' : 'rounded-lg';
  const innerRound = size === 'sm' ? 'rounded-[1px]' : 'rounded-[5px]';
  const paddingClass = size === 'sm' ? 'p-[1px]' : 'p-[2px]';
  const gapClass = size === 'sm' ? 'gap-[1px]' : 'gap-0.5';

  return (
    <div 
      className={`flex items-center bg-slate-100 border border-slate-200/60 ${heightClass} ${roundedClass} overflow-hidden ${paddingClass} ${gapClass} shadow-xs select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onChange(value === 'red' ? null : 'red')}
        className={`h-full flex-1 transition-all duration-150 cursor-pointer ${innerRound} ${
          value === 'red' ? 'bg-red-600 scale-y-110 shadow-xs' : 'bg-red-200/30 hover:bg-red-200/60'
        }`}
        title="Rood - Actie vereist / Fout"
      />
      <button
        type="button"
        onClick={() => onChange(value === 'yellow' ? null : 'yellow')}
        className={`h-full flex-1 transition-all duration-150 cursor-pointer ${innerRound} ${
          value === 'yellow' ? 'bg-amber-500 scale-y-110 shadow-xs' : 'bg-amber-200/30 hover:bg-amber-200/60'
        }`}
        title="Geel - Twijfel / In beoordeling"
      />
      <button
        type="button"
        onClick={() => onChange(value === 'green' ? null : 'green')}
        className={`h-full flex-1 transition-all duration-150 cursor-pointer ${innerRound} ${
          value === 'green' ? 'bg-green-600 scale-y-110 shadow-xs' : 'bg-green-200/30 hover:bg-green-200/60'
        }`}
        title="Groen - Akkoord / Bevestigd"
      />
    </div>
  );
};
export default AppFlagPicker;
