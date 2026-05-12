import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export type AppSelectOption = {
  value: string;
  label: string;
};

interface AppSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** muted = gray-50 (wizard default); white = insulation-style fields */
  variant?: 'muted' | 'white';
}

type MenuPlacement = {
  left: number;
  width: number;
  maxHeight: number;
  placement: 'below' | 'above';
  top?: number;
  bottom?: number;
};

export function AppSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
  id,
  variant = 'muted',
}: AppSelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? placeholder ?? '';
  const showPlaceholder = !selected && !!placeholder;

  const close = useCallback(() => {
    setOpen(false);
    setMenuPlacement(null);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 4;
    const viewportPadding = 8;
    const preferredMax = 224;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;

    let placement: 'below' | 'above' = 'below';
    let maxHeight = Math.min(preferredMax, spaceBelow - gap);

    if (maxHeight < 120 && spaceAbove > spaceBelow) {
      placement = 'above';
      maxHeight = Math.min(preferredMax, spaceAbove - gap);
    }

    maxHeight = Math.max(96, maxHeight);

    if (placement === 'below') {
      setMenuPlacement({
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement,
        top: rect.bottom + gap,
      });
    } else {
      setMenuPlacement({
        left: rect.left,
        width: rect.width,
        maxHeight,
        placement,
        bottom: window.innerHeight - rect.top + gap,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        close();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  const triggerBg = variant === 'white' ? 'bg-white' : 'bg-gray-50';

  const menu =
    open && menuPlacement
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            aria-labelledby={selectId}
            style={{
              position: 'fixed',
              left: menuPlacement.left,
              width: menuPlacement.width,
              maxHeight: menuPlacement.maxHeight,
              top: menuPlacement.top,
              bottom: menuPlacement.bottom,
              zIndex: 300,
            }}
            className="overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            {placeholder && (
              <li role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ''}
                  onClick={() => {
                    onChange('');
                    close();
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm text-gray-400 hover:bg-primary/10 ${
                    value === '' ? 'bg-primary/5 font-medium' : ''
                  }`}
                >
                  {placeholder}
                </button>
              </li>
            )}
            {options.map((opt) => (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    close();
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-primary/10 ${
                    value === opt.value
                      ? 'bg-primary font-semibold text-white hover:bg-primary'
                      : 'text-gray-900'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={className} ref={rootRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
          className={`flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 p-3 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${triggerBg} ${
            open ? 'border-primary ring-2 ring-primary/20' : ''
          }`}
        >
          <span className={showPlaceholder ? 'text-gray-400' : 'text-gray-900'}>
            {displayLabel}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {menu}
    </div>
  );
}
