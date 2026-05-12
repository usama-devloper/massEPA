import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Search, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translateUploadRoom } from '../../i18n/translateOptions';
import {
  addOrSelectRoomInHouseDesign,
  generateRoomSuggestions,
  getRoomsForSuggestions,
  type RoomSuggestion,
} from '../../utils/houseDesignRooms';

type CustomRoomAndersInputProps = {
  floorId: string;
  onCancel: () => void;
  onRoomAdded: (roomName: string) => void;
  placeholder?: string;
};

type MenuPlacement = {
  left: number;
  width: number;
  top: number;
  maxHeight: number;
};

export function CustomRoomAndersInput({
  floorId,
  onCancel,
  onRoomAdded,
  placeholder,
}: CustomRoomAndersInputProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<RoomSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const gap = 4;
    const viewportPadding = 8;
    const preferredMax = 240;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const maxHeight = Math.max(120, Math.min(preferredMax, spaceBelow - gap));

    setMenuPlacement({
      left: rect.left,
      width: rect.width,
      top: rect.bottom + gap,
      maxHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!showSuggestions || suggestions.length === 0) {
      setMenuPlacement(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [showSuggestions, suggestions.length, updateMenuPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshSuggestions = (input: string) => {
    const existingRooms = getRoomsForSuggestions(floorId);
    const next = generateRoomSuggestions(input, existingRooms);
    setSuggestions(next);
    setShowSuggestions(next.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const commitRoom = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;

    const roomName = addOrSelectRoomInHouseDesign(floorId, trimmed);
    if (!roomName) return;

    setValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    onRoomAdded(roomName);
  };

  const handleSelectSuggestion = (suggestion: RoomSuggestion) => {
    commitRoom(suggestion.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && value.trim()) {
        commitRoom(value);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
        } else if (suggestions.length > 0) {
          handleSelectSuggestion(suggestions[0]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const suggestionsMenu =
    showSuggestions && suggestions.length > 0 && menuPlacement
      ? createPortal(
          <div
            ref={menuRef}
            className="overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl"
            style={{
              position: 'fixed',
              left: menuPlacement.left,
              top: menuPlacement.top,
              width: menuPlacement.width,
              maxHeight: menuPlacement.maxHeight,
              zIndex: 7000,
            }}
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion.name}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                  idx === selectedSuggestionIndex ? 'bg-gray-50' : ''
                }`}
              >
                <span className="text-sm font-medium">{translateUploadRoom(suggestion.name, t)}</span>
                {suggestion.isNew ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {suggestion.existingCount ? `+${suggestion.existingCount + 1}` : 'NEW'}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">{t('upload.existingRoom')}</span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative mt-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              refreshSuggestions(e.target.value);
            }}
            onFocus={() => {
              if (value.trim()) refreshSuggestions(value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? t('upload.roomNamePlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
          aria-label={t('common.cancel')}
        >
          <X size={18} />
        </button>
        <button
          type="button"
          onClick={() => commitRoom(value)}
          disabled={!value.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('common.add')}
        >
          <Check size={18} />
        </button>
      </div>
      {suggestionsMenu}
    </div>
  );
}
