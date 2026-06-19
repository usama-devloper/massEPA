// src/components/common/HouseDesignRoomsModal.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translateUploadFloor, translateUploadRoom } from '../../i18n/translateOptions';
import { useToast } from '../../hooks/useToast';
import { Toast } from './Toast';
import {
  KELDER_KEY,
  buildFloorRoomChipGroups,
  computeRoomAddPlan,
  computeRoomDeletePlan,
  getEffectiveStandardRooms,
  getRoomBaseName,
  generateRoomSuggestions,
  type RoomChipItem,
  type RoomSuggestion,
} from '../../utils/houseDesignRooms';
import {
  loadHouseDesignAlgemeenHints,
  loadHouseDesignPageRaw,
  saveHouseDesignPageMetaToStorage,
} from '../../storage/houseDesignPageData';
import { buildInteriorFloorSections } from '../../utils/interiorRoomsFromUpload';
import { syncRoomRemovalAcrossApp, HOUSE_DESIGN_ROOMS_CHANGED_EVENT } from '../../utils/roomDeleteSync';

const glassPanelStyle = {
  background: 'rgba(255, 255, 255, 0.35)',
  backdropFilter: 'blur(25px) saturate(180%)',
  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.45)',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
};

interface HouseDesignRoomsModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function HouseDesignRoomsModal({ open, onClose, onSave }: HouseDesignRoomsModalProps) {
  const { t } = useLanguage();
  const { toast, setToast, showToast } = useToast();

  const [selectedRooms, setSelectedRooms] = useState<Record<string, string[]>>({});
  const [customRooms, setCustomRooms] = useState<Record<string, string[]>>({});
  const [selectedCustomRooms, setSelectedCustomRooms] = useState<Record<string, string[]>>({});
  const [suppressedStandardRooms, setSuppressedStandardRooms] = useState<Record<string, string[]>>({});

  const [numberOfFloors, setNumberOfFloors] = useState(1);
  const [hasKelder, setHasKelder] = useState<boolean | null>(false);
  const [startFloorKey, setStartFloorKey] = useState('BG');

  const [activeFloor, setActiveFloor] = useState('BG');
  const [newRoomName, setNewRoomName] = useState('');
  const [suggestions, setSuggestions] = useState<RoomSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const [expandedFloor, setExpandedFloor] = useState<string | null>(null);
  const [activeAddFloor, setActiveAddFloor] = useState<string | null>(null);

  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load state from Storage
  useEffect(() => {
    if (!open) return;
    const parsed = loadHouseDesignPageRaw();
    setSelectedRooms(parsed.selectedRooms || {});
    setCustomRooms(parsed.customRooms || {});
    setSelectedCustomRooms(parsed.selectedCustomRooms || {});
    setSuppressedStandardRooms(parsed.suppressedStandardRooms || {});

    const hints = loadHouseDesignAlgemeenHints();
    setNumberOfFloors(hints.numberOfFloors);
    setHasKelder(hints.hasKelder);
    setStartFloorKey(hints.startFloorKey);

    const sections = buildInteriorFloorSections(hints.numberOfFloors, hints.hasKelder ?? false, hints.startFloorKey);
    if (sections.length > 0) {
      if (sections.includes('BG')) {
        setActiveFloor('BG');
        setExpandedFloor('BG');
      } else {
        setActiveFloor(sections[0]);
        setExpandedFloor(sections[0]);
      }
    }
  }, [open]);

  // Click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const sections = buildInteriorFloorSections(numberOfFloors, hasKelder ?? false, startFloorKey);

  const standardRooms = getEffectiveStandardRooms(
    activeFloor,
    suppressedStandardRooms[activeFloor] || [],
    startFloorKey
  );

  const getAllRoomsForFloor = (floor: string) => {
    const standard = getEffectiveStandardRooms(
      floor,
      suppressedStandardRooms[floor] || [],
      startFloorKey
    );
    const custom = customRooms[floor] || [];
    return [...standard, ...custom];
  };

  const getSelectedCount = (floor: string) => {
    const suppressed = suppressedStandardRooms[floor] || [];
    const standardCount = (selectedRooms[floor] || []).filter(
      (room) => !suppressed.includes(room),
    ).length;
    const customCount = (selectedCustomRooms[floor] || []).length;
    return standardCount + customCount;
  };

  const getSelectedRoomList = (floor: string): string[] => {
    const suppressed = suppressedStandardRooms[floor] || [];
    const standard = (selectedRooms[floor] || []).filter((room) => !suppressed.includes(room));
    const custom = selectedCustomRooms[floor] || [];
    return [...standard, ...custom];
  };

  const toggleFloor = (floor: string) => {
    setExpandedFloor(expandedFloor === floor ? null : floor);
    setActiveAddFloor(null);
  };

  const getSectionDisplayName = (section: string) => {
    if (section === KELDER_KEY) {
      return t('Kelder') || 'Kelder';
    }
    return translateUploadFloor(section, t);
  };

  // Helper to persist to localStorage & fire sync removal across app
  const persistRoomMetaAndSyncRemoval = (
    floor: string,
    removedRoom: string,
    renamedRooms: { from: string; to: string }[],
    nextMeta: {
      selectedRooms: Record<string, string[]>;
      customRooms: Record<string, string[]>;
      selectedCustomRooms: Record<string, string[]>;
      suppressedStandardRooms: Record<string, string[]>;
    },
  ) => {
    saveHouseDesignPageMetaToStorage(nextMeta);
    syncRoomRemovalAcrossApp(floor, removedRoom, renamedRooms);
  };

  const toggleRoom = (floor: string, room: string) => {
    const current = selectedRooms[floor] || [];
    const isRemoving = current.includes(room);

    if (isRemoving) {
      const next = current.filter((r) => r !== room);
      const nextSelectedRooms = { ...selectedRooms };
      if (next.length === 0) {
        delete nextSelectedRooms[floor];
      } else {
        nextSelectedRooms[floor] = next;
      }
      setSelectedRooms(nextSelectedRooms);
      persistRoomMetaAndSyncRemoval(floor, room, [], {
        selectedRooms: nextSelectedRooms,
        customRooms,
        selectedCustomRooms,
        suppressedStandardRooms,
      });
      return;
    }

    setSelectedRooms((prev) => ({ ...prev, [floor]: [...current, room] }));
  };

  const applyCustomRoomDelete = (floor: string, roomName: string, notify: boolean) => {
    const plan = computeRoomDeletePlan(
      floor,
      roomName,
      suppressedStandardRooms[floor] || [],
      customRooms[floor] || [],
      selectedRooms[floor] || [],
      selectedCustomRooms[floor] || [],
    );

    const nextSuppressedStandardRooms = { ...suppressedStandardRooms };
    if (plan.suppressedStandardRooms.length > 0) {
      nextSuppressedStandardRooms[floor] = plan.suppressedStandardRooms;
    } else {
      delete nextSuppressedStandardRooms[floor];
    }

    const nextCustomRooms = { ...customRooms };
    if (plan.customRooms.length > 0) {
      nextCustomRooms[floor] = plan.customRooms;
    } else {
      delete nextCustomRooms[floor];
    }

    const nextSelectedRooms = { ...selectedRooms };
    if (plan.selectedRooms.length > 0) {
      nextSelectedRooms[floor] = plan.selectedRooms;
    } else {
      delete nextSelectedRooms[floor];
    }

    const nextSelectedCustomRooms = { ...selectedCustomRooms };
    if (plan.selectedCustomRooms.length > 0) {
      nextSelectedCustomRooms[floor] = plan.selectedCustomRooms;
    } else {
      delete nextSelectedCustomRooms[floor];
    }

    setSuppressedStandardRooms(nextSuppressedStandardRooms);
    setCustomRooms(nextCustomRooms);
    setSelectedRooms(nextSelectedRooms);
    setSelectedCustomRooms(nextSelectedCustomRooms);

    persistRoomMetaAndSyncRemoval(floor, roomName, plan.renamedRooms, {
      selectedRooms: nextSelectedRooms,
      customRooms: nextCustomRooms,
      selectedCustomRooms: nextSelectedCustomRooms,
      suppressedStandardRooms: nextSuppressedStandardRooms,
    });

    if (notify) {
      showToast(t('upload.toast.roomDeleted', { name: roomName }), 'success');
    }
  };

  const toggleCustomRoom = (floor: string, roomName: string) => {
    applyCustomRoomDelete(floor, roomName, false);
  };

  const appendCustomRoom = (floor: string, rawName: string) => {
    const plan = computeRoomAddPlan(
      floor,
      rawName,
      suppressedStandardRooms[floor] || [],
      customRooms[floor] || [],
      selectedRooms[floor] || [],
      selectedCustomRooms[floor] || [],
    );

    setSuppressedStandardRooms((prev) => ({ ...prev, [floor]: plan.suppressedStandardRooms }));
    setCustomRooms((prev) => {
      const next = { ...prev, [floor]: plan.customRooms };
      if (plan.customRooms.length === 0) delete next[floor];
      return next;
    });
    setSelectedRooms((prev) => {
      const next = { ...prev, [floor]: plan.selectedRooms };
      if (plan.selectedRooms.length === 0) delete next[floor];
      return next;
    });
    setSelectedCustomRooms((prev) => {
      const next = { ...prev, [floor]: plan.selectedCustomRooms };
      if (plan.selectedCustomRooms.length === 0) delete next[floor];
      return next;
    });

    setNewRoomName('');
    setSuggestions([]);
    setShowSuggestions(false);
    showToast(t('upload.toast.roomAdded', { name: plan.addedRoom }), 'success');
  };

  const deleteCustomRoom = (floor: string, roomName: string) => {
    applyCustomRoomDelete(floor, roomName, true);
  };

  const addCustomRoom = (floor: string) => {
    if (!newRoomName.trim()) {
      showToast(t('upload.toast.roomNameRequired'), 'error');
      return;
    }
    appendCustomRoom(floor, newRoomName.trim());
  };

  const handleRoomChipClick = (floor: string, chip: RoomChipItem) => {
    if (chip.isNext) {
      appendCustomRoom(floor, chip.room);
      return;
    }
    if (chip.isStandardChip) {
      toggleRoom(floor, chip.room);
      return;
    }
    if (chip.selected) {
      toggleCustomRoom(floor, chip.room);
    }
  };

  const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>, floor: string) => {
    const val = e.target.value;
    setNewRoomName(val);

    if (val.trim()) {
      const newSuggestions = generateRoomSuggestions(val, getAllRoomsForFloor(floor));
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: RoomSuggestion, floor: string) => {
    appendCustomRoom(floor, suggestion.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent, floor: string) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && newRoomName.trim()) {
        addCustomRoom(floor);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          selectSuggestion(suggestions[selectedSuggestionIndex], floor);
        } else if (newRoomName.trim()) {
          addCustomRoom(floor);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSaveAndClose = () => {
    saveHouseDesignPageMetaToStorage({
      selectedRooms,
      customRooms,
      selectedCustomRooms,
      suppressedStandardRooms,
      startFloorKey,
    });
    // Trigger cross-app synchronization event
    const event = new CustomEvent(HOUSE_DESIGN_ROOMS_CHANGED_EVENT);
    window.dispatchEvent(event);

    if (onSave) onSave();
    onClose();
  };

  const renderRoomChip = (floor: string, chip: RoomChipItem) => {
    const label = translateUploadRoom(chip.room, t);
    const baseClass =
      'px-3 py-1.5 rounded-lg font-semibold text-[11px] uppercase tracking-wider transition-all';

    if (chip.isNext) {
      return (
        <button
          key={chip.room}
          type="button"
          onClick={() => handleRoomChipClick(floor, chip)}
          className={`${baseClass} border-2 border-dashed border-primary bg-primary/5 text-primary hover:bg-primary/10`}
        >
          {label}
        </button>
      );
    }

    const isSelected = chip.selected;
    const showTrash = !chip.isStandardChip && isSelected;

    return (
      <div key={chip.room} className="relative group">
        <button
          type="button"
          onClick={() => handleRoomChipClick(floor, chip)}
          className={`${baseClass} ${
            isSelected
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
        {showTrash && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteCustomRoom(floor, chip.room);
            }}
            className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md transition-colors hover:bg-red-600 active:scale-95"
            aria-label={t('common.delete')}
          >
            <Trash2 size={10} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[4000]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-[92%] max-w-sm sm:max-w-xl overflow-hidden flex flex-col shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] mx-auto max-h-[80vh]"
          style={glassPanelStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-20"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            }}
          />

          {/* Header */}
          <div className="relative p-4 sm:p-5 border-b border-white/30 flex items-center justify-between gap-3 bg-white/40">
            <div>
              <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">
                {t('upload.editRooms') || 'Edit House Rooms'}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {t('upload.editRoomsSubtitle') || 'Select active rooms or add custom areas'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
            <h2 className="font-display font-black text-lg mb-2 text-primary">{t('upload.roomsTitle')}</h2>

            <div className="space-y-3">
              {sections.map((section) => {
                const standardRooms = getEffectiveStandardRooms(section, suppressedStandardRooms[section] || [], startFloorKey);
                const standardSlots = getEffectiveStandardRooms(section, [], startFloorKey);
                const custom = customRooms[section] || [];
                const selectedCount = getSelectedCount(section);
                const selectedRoomList = getSelectedRoomList(section);
                const isExpanded = expandedFloor === section;
                const selectedForFloor = selectedRooms[section] || [];
                const selectedCustomForFloor = selectedCustomRooms[section] || [];

                return (
                  <motion.div key={section} className="border border-gray-200/50 bg-white rounded-2xl shadow-md">
                    <div
                      className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-2xl"
                      onClick={() => toggleFloor(section)}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-display font-black text-base text-gray-900">
                              {getSectionDisplayName(section)}
                            </span>
                            {selectedCount > 0 && (
                              <span className="text-xs text-gray-500 font-bold">
                                {t('upload.roomsCount', { count: selectedCount })}
                              </span>
                            )}
                          </div>
                          {selectedRoomList.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedRoomList.map((room) => (
                                <span
                                  key={room}
                                  className="inline-block max-w-full break-words rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-bold leading-snug text-gray-600 border border-gray-200/60 shadow-sm"
                                >
                                  {translateUploadRoom(room, t)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-gray-500 pt-0.5">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-visible"
                        >
                          <div className="p-3 sm:p-4 pt-2 sm:pt-3 border-t border-gray-100 bg-white space-y-2.5 sm:space-y-3">
                            {(() => {
                              const chipGroups = buildFloorRoomChipGroups(
                                standardRooms,
                                selectedForFloor,
                                custom,
                                selectedCustomForFloor,
                                standardSlots,
                              );
                              if (chipGroups.length === 0) return null;

                              const row1: React.ReactNode[] = [];
                              const row2: React.ReactNode[] = [];
                              const row3: React.ReactNode[] = [];
                              const row4: React.ReactNode[] = [];

                              chipGroups.forEach((group) => {
                                const roomBase = getRoomBaseName(group.kind === 'chain' ? group.base : group.chip.room);
                                const element = group.kind === 'chain' ? (
                                  <div
                                    key={`chain-${group.base}`}
                                    className="flex flex-wrap items-center gap-2"
                                  >
                                    {group.chips.map((chip) => renderRoomChip(section, chip))}
                                  </div>
                                ) : (
                                  renderRoomChip(section, group.chip)
                                );

                                if (roomBase === 'HAL' || roomBase === 'OVERLUIP' || roomBase === 'MK') {
                                  row1.push(element);
                                } else if (roomBase === 'KEUKEN' || roomBase === 'WOONKAMER') {
                                  row2.push(element);
                                } else if (roomBase === 'SLAAPKAMER' || roomBase === 'WC' || roomBase === 'BADKAMER') {
                                  row3.push(element);
                                } else {
                                  row4.push(element);
                                }
                              });

                              return (
                                <div className="flex flex-col gap-2">
                                  {row1.length > 0 && <div className="flex flex-wrap gap-2">{row1}</div>}
                                  {row2.length > 0 && <div className="flex flex-wrap gap-2">{row2}</div>}
                                  {row3.length > 0 && <div className="flex flex-wrap gap-2">{row3}</div>}
                                  {row4.length > 0 && <div className="flex flex-wrap gap-2">{row4}</div>}
                                </div>
                              );
                            })()}

                            {/* Add Room Button */}
                            <div className="relative z-50 pt-2 border-t border-gray-100" ref={suggestionRef}>
                              {activeAddFloor !== section ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveAddFloor(section);
                                    setNewRoomName('');
                                    setSuggestions([]);
                                    setShowSuggestions(false);
                                    setTimeout(() => inputRef.current?.focus(), 100);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-gray-50 text-primary hover:bg-primary/10 flex items-center gap-1 border border-gray-200/80 shadow-sm"
                                >
                                  <Plus size={12} />
                                  {t('upload.addRoom') || 'Add Room'}
                                </button>
                              ) : (
                                <div className="relative">
                                  <div className="flex gap-2">
                                    <div className="relative flex-1 min-w-0">
                                      <input
                                        ref={inputRef}
                                        type="text"
                                        value={newRoomName}
                                        onChange={(e) => handleRoomInputChange(e, section)}
                                        onKeyDown={(e) => handleKeyDown(e, section)}
                                        placeholder={t('upload.roomNamePlaceholder')}
                                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 pr-8"
                                        autoFocus
                                      />
                                      <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addCustomRoom(section)}
                                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/80 shadow-md shadow-primary/10"
                                    >
                                      {t('common.add') || 'Add'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveAddFloor(null);
                                        setNewRoomName('');
                                        setSuggestions([]);
                                        setShowSuggestions(false);
                                      }}
                                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold border border-gray-200/50"
                                    >
                                      {t('common.cancel') || 'Cancel'}
                                    </button>
                                  </div>
                                  
                                  {/* Suggestions Dropdown */}
                                  {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-[100] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                      {suggestions.map((suggestion, idx) => (
                                        <button
                                          key={suggestion.name}
                                          type="button"
                                          onClick={() => selectSuggestion(suggestion, section)}
                                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex justify-between items-center ${
                                            idx === selectedSuggestionIndex ? 'bg-gray-50' : ''
                                          }`}
                                        >
                                          <span className="text-sm font-medium">
                                            {translateUploadRoom(suggestion.name, t)}
                                          </span>
                                          {suggestion.isNew && (
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                              {suggestion.existingCount ? `+${suggestion.existingCount + 1}` : 'NEW'}
                                            </span>
                                          )}
                                          {!suggestion.isNew && (
                                            <span className="text-[10px] text-gray-400">
                                              {t('upload.existingRoom') || 'Existing room'}
                                            </span>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 border-t border-white/30 bg-white/40 flex justify-end gap-2 sm:gap-2.5">
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2 sm:py-2.5 border border-white/40 bg-white/30 text-gray-800 hover:bg-white/50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
            >
              {t('common.save') || 'Save'}
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}
