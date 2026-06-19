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
  searchable?: boolean;
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
  searchable = true,
}: AppSelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? placeholder ?? '';
  const showPlaceholder = !selected && !!placeholder;

  const close = useCallback(() => {
    setOpen(false);
    setMenuPlacement(null);
    setSearchQuery('');
    setIsTyping(false);
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

  const filteredOptions = searchable && isTyping
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

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
      if (event.key === 'Enter' && open) {
        if (filteredOptions.length > 0) {
          onChange(filteredOptions[0].value);
          close();
        }
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close, filteredOptions, onChange]);

  const triggerBg = variant === 'white' ? 'bg-white' : 'bg-gray-50';

  const menu =
    open && menuPlacement
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              left: menuPlacement.left,
              width: menuPlacement.width,
              maxHeight: menuPlacement.maxHeight,
              top: menuPlacement.top,
              bottom: menuPlacement.bottom,
              zIndex: 9999,
            }}
            className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
          >
            <ul
              role="listbox"
              aria-labelledby={selectId}
              className="overflow-y-auto py-1 flex-1"
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
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-gray-400">
                  Geen resultaten gevonden
                </li>
              ) : (
                filteredOptions.map((opt) => (
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
                ))
              )}
            </ul>
          </div>,
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
        {searchable ? (
          <input
            ref={triggerRef as React.RefObject<HTMLInputElement>}
            id={selectId}
            type="text"
            disabled={disabled}
            value={open ? searchQuery : (selected?.label ?? '')}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsTyping(true);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
                setSearchQuery(selected?.label ?? '');
                setIsTyping(false);
                setTimeout(() => {
                  (triggerRef.current as HTMLInputElement | null)?.select();
                }, 0);
              }
            }}
            placeholder={placeholder}
            className={`w-full rounded-xl border border-gray-200 p-3 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${triggerBg} ${
              open ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
          />
        ) : (
          <button
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            id={selectId}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => {
              if (!disabled) setOpen((prev) => !prev);
            }}
            className={`flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 p-3 pr-10 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${triggerBg} ${
              open ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
          >
            <span className={showPlaceholder ? 'text-gray-400' : 'text-gray-900'}>
              {displayLabel}
            </span>
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (open) {
              close();
            } else {
              setOpen(true);
              setSearchQuery(selected?.label ?? '');
              setIsTyping(false);
              if (searchable) {
                (triggerRef.current as HTMLInputElement | null)?.focus();
              } else {
                (triggerRef.current as HTMLButtonElement | null)?.focus();
              }
            }
          }}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-60"
        >
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      {menu}
    </div>
  );
}
