import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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
  /** muted = gray-50 (wizard default); white = insulation-style fields; compact = 34px height for backoffice grids */
  variant?: 'muted' | 'white' | 'compact';
  searchable?: boolean;
  needsConfirmation?: boolean;
  onOpen?: () => void;
  validationStatus?: 'red' | 'yellow' | 'green' | null;
  hideLabelHtml?: boolean;
}

type MenuPlacement = {
  left?: number;
  right?: number;
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
  needsConfirmation = false,
  onOpen,
  validationStatus = null,
  hideLabelHtml = false,
}: AppSelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const isSearchable = false;

  const { t, locale } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      onOpen?.();
    }
  }, [open, onOpen]);

  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const selected = options.find((opt) => opt.value === value);
  const hasValue = value !== undefined && value !== null && value !== '';

  const getCleanFieldName = () => {
    if (label) {
      return label.replace(/\.\.\./g, '').trim();
    }
    if (placeholder) {
      const cleaned = placeholder
        .replace(/^(Kies|Selecteer|Select|Choose|Kies optie|Select option)\s+/i, '')
        .replace(/\.\.\./g, '')
        .trim();
      if (cleaned.length > 0 && !['optie', 'option', 'selecteer', 'kies', 'select'].includes(cleaned.toLowerCase())) {
        return cleaned;
      }
    }
    return '';
  };

  const cleanFieldName = getCleanFieldName();
  const computedPlaceholder = cleanFieldName
    ? (locale === 'nl' 
        ? `Kies ${cleanFieldName}...` 
        : `Select ${cleanFieldName}...`)
    : (placeholder ?? (locale === 'nl' ? 'Selecteer...' : 'Select...'));

  const displayLabel = selected?.label ?? (hasValue ? String(value) : computedPlaceholder);
  const showPlaceholder = !selected && !hasValue;

  const close = useCallback(() => {
    setOpen(false);
    setMenuPlacement(null);
    setSearchQuery('');
    setIsTyping(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    if (isMobile && isSearchable) return;
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

    const alignRight = rect.left + rect.width / 2 > window.innerWidth / 2;

    if (placement === 'below') {
      setMenuPlacement({
        left: alignRight ? undefined : rect.left,
        right: alignRight ? window.innerWidth - rect.right : undefined,
        width: rect.width,
        maxHeight,
        placement,
        top: rect.bottom + gap,
      });
    } else {
      setMenuPlacement({
        left: alignRight ? undefined : rect.left,
        right: alignRight ? window.innerWidth - rect.right : undefined,
        width: rect.width,
        maxHeight,
        placement,
        bottom: window.innerHeight - rect.top + gap,
      });
    }
  }, [isMobile, isSearchable]);

  useEffect(() => {
    if (!open) return;
    if (isMobile && isSearchable) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, isMobile, isSearchable, updateMenuPosition]);

  const filteredOptions = (isMobile && isSearchable)
    ? (searchQuery
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options)
    : (isSearchable && isTyping
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (isMobile && isSearchable) return;
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
  }, [open, close, filteredOptions, onChange, isMobile, isSearchable]);

  useEffect(() => {
    if (open && isMobile && isSearchable) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, isMobile, isSearchable]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...dragOffset };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setDragOffset({
      x: initialPos.current.x + dx,
      y: initialPos.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const triggerBg = variant === 'white' ? 'bg-white border-slate-200 hover:border-slate-300' : variant === 'compact' ? 'bg-transparent border-transparent' : 'bg-white border-slate-200 hover:border-slate-300';
  const showInputTrigger = isSearchable && !isMobile;

  let validationBorder = '';
  if (validationStatus === 'red') {
    validationBorder = '!border-red-500 !ring-2 !ring-red-100 !bg-red-50/20';
  } else if (validationStatus === 'yellow') {
    validationBorder = '!border-amber-500 !ring-2 !ring-amber-100 !bg-amber-50/20';
  } else if (validationStatus === 'green') {
    validationBorder = '!border-green-500 !ring-2 !ring-green-100 !bg-green-50/20';
  }

  const menu =
    open && isMobile && isSearchable
      ? createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 transition-opacity"
            onClick={close}
          >
            <div
              ref={menuRef}
              style={{
                transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
                touchAction: 'none',
              }}
              className="bg-white w-full max-w-[300px] rounded-2xl shadow-xl flex flex-col max-h-[60vh] border border-gray-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Drag Handle */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="px-4 pt-3 pb-2 flex flex-col border-b border-gray-100 cursor-grab active:cursor-grabbing select-none"
              >
                {/* Visual drag handle bar */}
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-2 pointer-events-none" />
                <div className="flex items-center justify-between pointer-events-none">
                  <span className="text-sm font-semibold text-gray-800">
                    {label ?? t('common.selectOption')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      close();
                    }}
                    className="p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors pointer-events-auto"
                    aria-label={t('common.close')}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Search Box */}
              {isSearchable && (
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder={t('common.search')}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsTyping(true);
                      }}
                      className="block w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-400"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsTyping(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="overflow-y-auto flex-1 min-h-0 py-1">
                <ul role="listbox" aria-labelledby={selectId}>

                  {filteredOptions.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-gray-400">
                      {t('common.noResults')}
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
                          className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-gray-50 last:border-b-0 hover:bg-primary/5 ${
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
              </div>
            </div>
          </div>,
          document.body
        )
      : (open && menuPlacement
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                left: menuPlacement.left !== undefined ? menuPlacement.left : 'auto',
                right: menuPlacement.right !== undefined ? menuPlacement.right : 'auto',
                minWidth: menuPlacement.width,
                width: 'max-content',
                maxWidth: 'min(480px, 90vw)',
                top: menuPlacement.top,
                bottom: menuPlacement.bottom,
                zIndex: 9999,
              }}
              className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
            >
              <div
                style={{ maxHeight: menuPlacement.maxHeight }}
                className="overflow-y-auto py-1"
              >
                <ul
                  role="listbox"
                  aria-labelledby={selectId}
                >

                  {filteredOptions.length === 0 ? (
                    <li className="px-3 py-4 text-center text-sm text-gray-400">
                      {t('common.noResults')}
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
                          className={`w-full px-3 py-2.5 text-left text-sm hover:bg-primary/10 whitespace-normal break-words ${
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
              </div>
            </div>,
            document.body,
          )
        : null);

  return (
    <div className={`w-full ${className}`} ref={rootRef}>
      {label && !hideLabelHtml && (
        <label
          htmlFor={selectId}
          className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {showInputTrigger ? (
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
            className={`w-full min-w-[140px] rounded-xl border px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 font-semibold ${
              open
                ? 'border-primary ring-2 ring-primary/20'
                : validationStatus
                  ? validationBorder
                  : needsConfirmation
                    ? 'border-red-400 ring-2 ring-red-100'
                    : `border-transparent ${triggerBg}`
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
              if (!disabled) {
                setOpen((prev) => {
                  const nextOpen = !prev;
                  if (nextOpen) {
                    setSearchQuery('');
                    setIsTyping(false);
                  }
                  return nextOpen;
                });
              }
            }}
            className={`flex w-full items-center justify-between gap-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 text-xs font-semibold ${
              variant === 'compact'
                ? 'p-0 pr-6 text-xs text-on-background border-none'
                : 'min-w-[140px] px-3 py-1.5 pr-8 rounded-lg border'
            } ${
              open
                ? 'border-primary ring-2 ring-primary/20'
                : validationStatus
                  ? validationBorder
                  : needsConfirmation
                    ? 'border-red-400 ring-2 ring-red-100'
                    : variant === 'compact' ? 'border-transparent' : triggerBg
            }`}
          >
            <span className={`block whitespace-nowrap truncate text-xs font-semibold ${showPlaceholder ? 'text-slate-400 font-normal' : 'text-slate-700'}`} title={displayLabel}>
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
              setSearchQuery(isMobile ? '' : (selected?.label ?? ''));
              setIsTyping(false);
              if (showInputTrigger) {
                (triggerRef.current as HTMLInputElement | null)?.focus();
              } else {
                (triggerRef.current as HTMLButtonElement | null)?.focus();
              }
            }
          }}
          className={`absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-60 ${variant === "compact" ? "right-0 h-4 w-4" : "right-2 h-8 w-8"}`}
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

export interface AppSelectWithOptionsProps {
  value?: string;
  onChange?: (e: any) => void;
  defaultValue?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  label?: string;
  children: React.ReactNode;
  validationStatus?: 'red' | 'yellow' | 'green' | null;
}

export const AppSelectWithOptions: React.FC<AppSelectWithOptionsProps> = ({ 
  value, 
  onChange, 
  defaultValue, 
  className, 
  disabled, 
  id, 
  placeholder, 
  label,
  children,
  validationStatus = null
}) => {
  const options: { value: string; label: string }[] = [];

  const processChild = (child: React.ReactNode) => {
    if (!React.isValidElement(child)) return;

    if (child.type === 'option') {
      const props = child.props as { value?: string; children?: React.ReactNode };
      options.push({
        value: String(props.value ?? props.children),
        label: String(props.children),
      });
    } else if (child.type === React.Fragment) {
      const props = child.props as { children?: React.ReactNode };
      React.Children.forEach(props.children, processChild);
    }
  };

  React.Children.forEach(children, processChild);

  const [localVal, setLocalVal] = useState(value ?? defaultValue ?? '');

  useEffect(() => {
    if (value !== undefined) {
      setLocalVal(value);
    }
  }, [value]);

  const handleChange = (val: string) => {
    setLocalVal(val);
    if (onChange) {
      onChange({
        target: {
          value: val,
          name: '',
        }
      });
    }
  };

  return (
    <AppSelect
      id={id}
      value={localVal}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      variant="muted"
      validationStatus={validationStatus}
      label={label}
      hideLabelHtml={true}
    />
  );
};

