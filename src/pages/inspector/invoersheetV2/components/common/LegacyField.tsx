import React from 'react';

export const renderV1Field = (
  label: string, 
  value: string | number | undefined, 
  roleBadge: string,          // 'BWO' | 'INS' | 'SYS' | 'BAG' | 'PV' etc.
  flagColor: 'red' | 'yellow' | 'green' | 'none',
  onUpdate?: (v: string) => void,
  type = "text",
  options?: any[],
  customInputNode?: React.ReactNode,
  flagValue?: 'red' | 'yellow' | 'green' | null,
  onFlagChange?: (val: 'red' | 'yellow' | 'green' | null) => void,
  overrideRoleBadge?: string,
  onAutoInspect?: () => void,
  placeholder?: string
) => {
  const activeFlag = flagValue !== undefined ? flagValue : (flagColor !== 'none' ? flagColor : null);
  const displayRoleBadge = overrideRoleBadge || roleBadge;

  const handleInputChange = (v: string) => {
    onUpdate?.(v);
    onAutoInspect?.();
  };

  const handleCycleFlag = () => {
    if (!onFlagChange) return;
    if (!activeFlag) {
      onFlagChange('red');
    } else if (activeFlag === 'red') {
      onFlagChange('yellow');
    } else if (activeFlag === 'yellow') {
      onFlagChange('green');
    } else {
      onFlagChange(null);
    }
  };

  const getBorderStyle = () => {
    if (activeFlag === 'red') return 'border-2 !border-red-500 bg-red-50/40 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]';
    if (activeFlag === 'yellow') return 'border-2 !border-amber-500 bg-amber-50/40 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]';
    if (activeFlag === 'green') return 'border-2 !border-emerald-500 bg-emerald-50/40 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]';
    return 'border border-slate-200/90 bg-slate-50/40';
  };

  const getLabelBadgeStyle = () => {
    if (activeFlag === 'red') return 'bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-tight block w-fit font-sans leading-none truncate';
    if (activeFlag === 'yellow') return 'bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-tight block w-fit font-sans leading-none truncate';
    if (activeFlag === 'green') return 'bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-tight block w-fit font-sans leading-none truncate';
    return 'text-[9px] font-bold text-slate-500/90 tracking-tight block uppercase font-sans truncate';
  };

  const getDotStyle = () => {
    if (activeFlag === 'red') return 'bg-red-500 border-red-600 shadow-[0_0_6px_rgba(239,68,68,0.6)]';
    if (activeFlag === 'yellow') return 'bg-amber-400 border-amber-500 shadow-[0_0_6px_rgba(251,191,36,0.6)]';
    if (activeFlag === 'green') return 'bg-green-500 border-green-600 shadow-[0_0_6px_rgba(34,197,94,0.6)]';
    return 'bg-neutral-200/90 border-neutral-300 hover:bg-neutral-300';
  };

  const defaultPlaceholder = placeholder !== undefined 
    ? placeholder 
    : (type === 'number' ? '0' : 'Vul in...');

  return (
    <div className="w-full flex flex-col transition-all duration-300">
      {/* Label row — Badge pill for flagged labels, Role Badge & Cycle Clicker Dot on right */}
      <div className="flex items-center justify-between w-full mb-1 px-0.5 overflow-hidden gap-1 min-h-[22px]">
        <label title={label} className="truncate min-w-0 flex-1">
          <span className={getLabelBadgeStyle()}>
            {label}
          </span>
        </label>
        
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {displayRoleBadge && (
            <span className="text-[9px] font-black text-neutral-400 tracking-wider leading-none select-none uppercase shrink-0">
              {displayRoleBadge}
            </span>
          )}
          <button
            type="button"
            onClick={handleCycleFlag}
            disabled={!onFlagChange}
            className={`w-2.5 h-2.5 rounded-full border transition-all duration-150 transform hover:scale-110 flex-shrink-0 focus:outline-none ${onFlagChange ? 'cursor-pointer' : 'cursor-default'} ${getDotStyle()}`}
            title={`Status: ${activeFlag || 'geen'}. Klik om te wisselen (Geen -> Rood -> Geel -> Groen)`}
          />
        </div>
      </div>

      {/* Input area – SINGLE clean border container without inner duplicate border */}
      <div className={`relative rounded-xl transition-all overflow-hidden [&_.v2-inline-input]:!border-none [&_.v2-inline-input]:!bg-transparent [&_.v2-inline-input]:!min-h-[36px] [&_.v2-inline-select-wrap_button]:!border-none [&_.v2-inline-select-wrap_button]:!bg-transparent ${getBorderStyle()}`}>
        {customInputNode ? (
          customInputNode
        ) : options ? (
          <select
            value={value ?? ''}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={!onUpdate}
            className="w-full min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-50 appearance-none bg-transparent outline-none border-none truncate"
            title={String(value ?? '')}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value ?? ''}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={!onUpdate}
            className="w-full min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 bg-transparent outline-none border-none truncate"
            placeholder={defaultPlaceholder}
            title={String(value ?? '')}
          />
        )}
      </div>
    </div>
  );
};

