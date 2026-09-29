import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';

export type MediaFile = {
  url: string;
  isPdf: boolean;
  name?: string;
};

export interface MediaViewerModalProps {
  files: MediaFile[];
  initialIndex?: number;
  onClose: () => void;
  titlePrefix?: string;
  footerText?: string;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  files,
  initialIndex = 0,
  onClose,
  titlePrefix = '(EYE) Geüploade Media',
  footerText
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  if (!files || files.length === 0) return null;

  const currentFile = files[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev > 0 ? prev - 1 : files.length - 1);
    setZoom(1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev < files.length - 1 ? prev + 1 : 0);
    setZoom(1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Eye className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-semibold text-base tracking-wide">
              {titlePrefix} {files.length > 1 && `(${currentIndex + 1} van ${files.length})`}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              title="Inzoomen"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
              title="Uitzoomen"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
              title="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Canvas Viewer */}
        <div className="flex-1 p-6 overflow-hidden bg-primary-dark flex items-center justify-center relative group">
          <div 
            className="transition-transform duration-150 origin-center w-full h-full flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            {currentFile.isPdf ? (
              <iframe 
                src={`${currentFile.url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-[70vh] border-0 rounded-md shadow-xl bg-white"
                title={`PDF ${currentIndex}`}
              />
            ) : (
              <img src={currentFile.url} alt="Vergrote Media" className="max-w-full max-h-[70vh] object-contain shadow-xl rounded-md" />
            )}
          </div>

          {files.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {footerText && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-mono">
              {footerText}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded font-medium transition"
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
