import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, FileText, ExternalLink } from 'lucide-react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { PdfThumbnail } from './PdfThumbnail';

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
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

  if (!files || files.length === 0) return null;

  const currentFile = files[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev > 0 ? prev - 1 : files.length - 1);
    transformComponentRef.current?.resetTransform();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => prev < files.length - 1 ? prev + 1 : 0);
    transformComponentRef.current?.resetTransform();
  };

  const handleOpenPdf = (url: string, name?: string) => {
    try {
      if (url.startsWith('data:')) {
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 500);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error('Error opening PDF', e);
      window.open(url, '_blank');
    }
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
              onClick={() => transformComponentRef.current?.zoomIn(0.5)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition"
              title="Inzoomen"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => transformComponentRef.current?.zoomOut(0.5)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition"
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
        <div className="flex-1 overflow-hidden bg-primary-dark relative group flex items-center justify-center">
          {currentFile.isPdf ? (
            <>
              {/* Desktop PDF view (iframe) */}
              <div className="w-full h-full p-6 flex-col items-center justify-center hidden sm:flex">
                <iframe 
                  src={`${currentFile.url}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-[70vh] border-0 rounded-md shadow-xl bg-white"
                  title={`PDF ${currentIndex}`}
                />
              </div>

              {/* Mobile PDF view (FullScreen Canvas) */}
              <div className="sm:hidden w-full h-[75vh] flex flex-col items-center justify-center relative">
                <TransformWrapper
                  key={currentFile.url}
                  ref={transformComponentRef}
                  initialScale={1}
                  minScale={0.5}
                  maxScale={5}
                  centerOnInit
                  wheel={{ step: 0.03 }}
                  pinch={{ step: 5 }}
                >
                  <TransformComponent 
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <div className="bg-white rounded-md shadow-xl overflow-hidden max-w-full max-h-full">
                        <PdfThumbnail url={currentFile.url} altTitle={currentFile.name || `Document ${currentIndex + 1}`} />
                      </div>
                    </div>
                  </TransformComponent>
                </TransformWrapper>
                
                {/* Floating Download Button on Mobile */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                  <button
                    onClick={() => handleOpenPdf(currentFile.url, currentFile.name)}
                    className="px-6 py-3 bg-emerald-600/95 backdrop-blur-sm hover:bg-emerald-500 text-white text-sm font-bold rounded-full shadow-2xl border border-emerald-400 flex items-center space-x-2 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <TransformWrapper
              key={currentFile.url}
              ref={transformComponentRef}
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              centerOnInit
              wheel={{ step: 0.03 }}
              pinch={{ step: 5 }}
            >
              <TransformComponent 
                wrapperStyle={{ width: "100%", height: "100%", minHeight: "60vh" }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <img src={currentFile.url} alt="Vergrote Media" className="max-w-full max-h-[75vh] object-contain shadow-xl rounded-md pointer-events-auto select-none" />
              </TransformComponent>
            </TransformWrapper>
          )}

          {files.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-md shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-slate-800 rounded-md shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-mono">
            {footerText || ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded font-medium transition ml-auto"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
