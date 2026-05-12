import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import type { PhotoViewerSlide } from '../../utils/photoViewer';
import { clampPhotoViewerIndex } from '../../utils/photoViewer';

type PhotoViewerModalProps = {
  open: boolean;
  onClose: () => void;
  slides: PhotoViewerSlide[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  alt?: string;
  pdfDownloadLabel?: string;
  onImageError?: () => void;
  zIndexClassName?: string;
};

export const PhotoViewerModal = ({
  open,
  onClose,
  slides,
  index,
  onPrev,
  onNext,
  alt = 'Full size view',
  pdfDownloadLabel = 'Download PDF',
  onImageError,
  zIndexClassName = 'z-[5000]',
}: PhotoViewerModalProps) => {
  const safeIndex = clampPhotoViewerIndex(index, slides.length);
  const current = slides[safeIndex];

  return (
    <AnimatePresence>
      {open && slides.length > 0 && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-black/90 ${zIndexClassName} flex items-center justify-center`}
          onClick={onClose}
        >
          <div className="relative max-w-5xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={28} />
            </button>

            {current.isPdf ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <FileText size={64} className="text-red-500 mx-auto mb-4" />
                <p className="text-gray-800 mb-2 font-medium">{current.fileName}</p>
                {current.downloadHref && (
                  <a
                    href={current.downloadHref}
                    download={current.fileName}
                    className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
                  >
                    {pdfDownloadLabel}
                  </a>
                )}
              </div>
            ) : (
              <img
                src={current.src}
                alt={current.alt ?? alt}
                className="w-full max-h-[80vh] object-contain rounded-lg"
                onError={onImageError}
              />
            )}

            {slides.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center pointer-events-none">
                <button
                  type="button"
                  onClick={onPrev}
                  className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors -ml-4"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors -mr-4"
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            )}

            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {safeIndex + 1} / {slides.length}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
