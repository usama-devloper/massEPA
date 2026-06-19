import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Check, CheckCircle, FileText, Trash2, Upload, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { MediaInstructionEntry, MediaInstructionVariant } from '../../config/mediaInstructions';

export type MediaInstructionStep = 'instructions' | 'review';

export type MediaInstructionLayout = 'center' | 'bottomSheet';

export type MediaInstructionPendingFile = {
  url: string;
  type: string;
  name: string;
  size: number;
};

type MediaInstructionModalProps = {
  open: boolean;
  step: MediaInstructionStep;
  onClose: () => void;
  entry: MediaInstructionEntry;
  variant: MediaInstructionVariant;
  pendingFiles: MediaInstructionPendingFile[];
  onRemovePending: (index: number) => void;
  onContinueFromInstructions: (variant?: 'camera' | 'upload') => void;
  onAddMore: () => void;
  onDone: () => void;
  /** i18n prefix for review step, e.g. `upload.guide` or `insulation.guide` */
  reviewKeyPrefix?: string;
  /** Slide up from bottom on mobile (Photo Capture style) */
  layout?: MediaInstructionLayout;
  /** Category / section label shown in review tips header */
  contextLabel?: string;
  /** Example photo shown on the instructions step (replaces emoji when set) */
  exampleImageUrl?: string;
  /** Compact tips shown in review step above thumbnails */
  reviewTipsKeys?: string[];
  zIndex?: number;
  /** Extra content shown on review step below photo thumbnails (e.g. category questions) */
  reviewChildren?: React.ReactNode;
  children?: React.ReactNode;
  allowBothVariants?: boolean;
};

const glassPanelStyle = {
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(25px) saturate(180%)',
  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
};

export const MediaInstructionModal = ({
  open,
  step,
  onClose,
  entry,
  variant,
  pendingFiles,
  onRemovePending,
  onContinueFromInstructions,
  onAddMore,
  onDone,
  reviewKeyPrefix = 'upload.guide',
  layout = 'bottomSheet',
  contextLabel,
  exampleImageUrl,
  reviewTipsKeys,
  zIndex = 250,
  reviewChildren,
  children,
  allowBothVariants = false,
}: MediaInstructionModalProps) => {
  const { t } = useLanguage();
  const isReview = step === 'review';
  const isBottomSheet = layout === 'bottomSheet';
  const nativePickerActiveRef = useRef(false);

  useEffect(() => {
    if (!open) {
      nativePickerActiveRef.current = false;
      return;
    }
    const clearPickerLock = () => {
      nativePickerActiveRef.current = false;
    };
    window.addEventListener('focus', clearPickerLock);
    return () => window.removeEventListener('focus', clearPickerLock);
  }, [open]);

  useEffect(() => {
    if (pendingFiles.length > 0) {
      nativePickerActiveRef.current = false;
    }
  }, [pendingFiles.length]);

  const handleBackdropClose = () => {
    if (nativePickerActiveRef.current) return;
    onClose();
  };

  const runPickerAction = (action: () => void) => {
    nativePickerActiveRef.current = true;
    action();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 bg-black/20 backdrop-blur-sm ${
            isBottomSheet
              ? 'flex items-end sm:items-center justify-center p-0 sm:p-4'
              : 'flex items-center justify-center p-4'
          }`}
          style={{ zIndex }}
          onClick={handleBackdropClose}
        >
          <motion.div
            initial={
              isBottomSheet
                ? { y: 100, opacity: 0 }
                : { opacity: 0, scale: 0.95 }
            }
            animate={
              isBottomSheet
                ? { y: 0, opacity: 1 }
                : { opacity: 1, scale: 1 }
            }
            exit={
              isBottomSheet
                ? { y: 100, opacity: 0 }
                : { opacity: 0, scale: 0.95 }
            }
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-lg overflow-hidden flex flex-col shadow-2xl ${
              isBottomSheet
                ? 'rounded-t-[2.5rem] sm:rounded-[2.5rem] mx-0 sm:mx-auto max-h-[85vh] sm:max-h-[70vh]'
                : 'rounded-[2.5rem] max-h-[70vh]'
            }`}
            style={glassPanelStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px] z-20"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              }}
            />

            <div className="relative p-5 border-b border-white/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shadow-inner">
                    {variant === 'camera' ? (
                      <Camera size={22} className="text-primary" />
                    ) : (
                      <Upload size={22} className="text-primary" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <CheckCircle size={10} className="text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-lg text-gray-900 tracking-tight truncate">
                    {isReview && contextLabel
                      ? t(`${reviewKeyPrefix}.reviewTitle`, { label: contextLabel })
                      : t(entry.titleKey)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5 truncate">
                    {isReview
                      ? t(`${reviewKeyPrefix}.reviewSubtitle`, { count: pendingFiles.length })
                      : contextLabel
                        ? t(`${reviewKeyPrefix}.subtitleWithContext`, { label: contextLabel })
                        : t(entry.subtitleKey)}
                  </p>
                </div>
              </div>
              {isReview && (
                <div className="flex-shrink-0 px-3 py-1 rounded-full bg-white/40 border border-white/50 text-xs font-semibold text-gray-700">
                  {t(`${reviewKeyPrefix}.selectedCount`, { count: pendingFiles.length })}
                </div>
              )}
            </div>

            <div className="relative flex-1 overflow-y-auto min-h-0">
              {!isReview ? (
                <>
                  <div className="p-4">
                    <div className="bg-white/20 rounded-xl p-4 flex items-center justify-center border border-white/30">
                      {exampleImageUrl ? (
                        <div className="w-full text-center">
                          <div className="flex min-h-48 max-h-56 w-full items-center justify-center rounded-lg border border-white/40 bg-black/5 p-2">
                            <img
                              src={exampleImageUrl}
                              alt={t(entry.illustrationCaptionKey)}
                              className="max-h-52 max-w-full w-auto h-auto object-contain rounded-md"
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{t(entry.illustrationCaptionKey)}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-5xl mb-2">{entry.illustrationEmoji}</div>
                          <p className="text-sm text-gray-600">{t(entry.illustrationCaptionKey)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-4 space-y-2.5">
                    {entry.tipsKeys.map((tipKey) => (
                      <div key={tipKey} className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{t(tipKey)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {reviewTipsKeys && reviewTipsKeys.length > 0 && (
                    <div className="mx-5 mt-4 rounded-2xl bg-white/20 border border-white/30 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Camera size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-800 mb-2 truncate">
                            {contextLabel
                              ? t(`${reviewKeyPrefix}.categoryTips`, { label: contextLabel })
                              : t(entry.titleKey)}
                          </h4>
                          <ul className="space-y-1.5 text-[11px] sm:text-xs text-gray-700 leading-relaxed">
                            {reviewTipsKeys.map((tipKey) => (
                              <li key={tipKey} className="flex items-start gap-1.5">
                                <span className="text-green-500 flex-shrink-0">✓</span>
                                <span>{t(tipKey)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {pendingFiles.length > 0 ? (
                    <>
                      {reviewChildren && (
                        <div className="px-5 pt-4 pb-2">{reviewChildren}</div>
                      )}
                      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {pendingFiles.map((file, idx) => (
                          <div
                            key={`${file.url}-${idx}`}
                            className="relative aspect-square rounded-xl overflow-hidden bg-white/10 border border-white/30"
                            title={file.name}
                          >
                            {file.type === 'application/pdf' ? (
                              <div className="flex h-full w-full flex-col items-center justify-center bg-red-50/80">
                                <FileText size={28} className="text-red-500" />
                                <span className="mt-1 text-[10px] font-bold text-red-600 px-1 truncate max-w-full">
                                  PDF
                                </span>
                              </div>
                            ) : (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => onRemovePending(idx)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                              aria-label={t('common.delete')}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-white/40 bg-white/5 mx-5 my-5">
                      <button
                        type="button"
                        onClick={() => runPickerAction(onAddMore)}
                        className="p-3 rounded-full bg-primary/15 text-primary hover:bg-primary hover:text-white transition-all"
                        aria-label={t(`${reviewKeyPrefix}.addMore`)}
                      >
                        {variant === 'camera' ? <Camera size={24} /> : <Upload size={24} />}
                      </button>
                      <p className="text-sm text-gray-600">{t(`${reviewKeyPrefix}.reviewEmpty`)}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="relative p-5 flex gap-3 border-t border-white/20">
              {!isReview ? (
                allowBothVariants ? (
                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-3 px-4 rounded-xl border border-white/40 bg-white/30 text-gray-700 hover:bg-white/50 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => runPickerAction(() => onContinueFromInstructions?.('upload'))}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 min-w-0"
                    >
                      <Upload size={16} className="flex-shrink-0" />
                      <span className="truncate">{t('upload.guide.upload.continue')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => runPickerAction(() => onContinueFromInstructions?.('camera'))}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 min-w-0"
                    >
                      <Camera size={16} className="flex-shrink-0" />
                      <span className="truncate">{t('upload.guide.camera.continue')}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl border border-white/40 bg-white/30 text-gray-700 font-bold text-sm hover:bg-white/50 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => runPickerAction(() => onContinueFromInstructions?.(variant))}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {variant === 'camera' ? <Camera size={16} /> : <Upload size={16} />}
                      <span>{t(entry.continueKey)}</span>
                    </button>
                  </>
                )
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-3 px-4 rounded-xl border border-white/40 bg-white/30 text-gray-700 hover:bg-white/50 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => runPickerAction(onAddMore)}
                    className="flex-1 py-3 rounded-xl border border-white/50 bg-white/40 text-sm font-semibold text-gray-700 transition-all hover:bg-white/60 active:scale-95"
                  >
                    {t(`${reviewKeyPrefix}.addMore`)}
                  </button>
                  <button
                    type="button"
                    onClick={onDone}
                    disabled={pendingFiles.length === 0}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:brightness-110 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={18} strokeWidth={3} />
                    <span>{t(`${reviewKeyPrefix}.done`)}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
