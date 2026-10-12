import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface PdfThumbnailProps {
  url: string;
  className?: string;
  altTitle?: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

let scriptLoadingPromise: Promise<any> | null = null;

const loadPdfJs = (): Promise<any> => {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  url,
  className = '',
  altTitle = 'PDF Document'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;

    if (!url) {
      setStatus('error');
      return;
    }

    const renderPdf = async () => {
      try {
        setStatus('loading');
        const pdfjs = await loadPdfJs();
        if (!isMounted) return;

        // Convert base64 / data URL or file URL to document
        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        const page = await pdf.getPage(1);
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.2 });
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        if (isMounted) {
          setStatus('success');
        }
      } catch (err) {
        console.warn('PdfThumbnail render fallback:', err);
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    renderPdf();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className={`w-full h-full relative overflow-hidden bg-slate-100 flex items-center justify-center ${className}`}>
      {/* Canvas for PDF Page 1 Visual Preview */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain ${status === 'success' ? 'block' : 'hidden'}`}
      />

      {/* Loading State */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-3 text-center z-1 border border-slate-200">
          <Loader2 className="w-6 h-6 text-primary animate-spin mb-1.5" />
          <span className="text-[10px] font-medium text-slate-500">PDF laden...</span>
        </div>
      )}

      {/* Clean White Paper Fallback / Error State */}
      {status === 'error' && (
        <div className="w-full h-full bg-white border border-slate-200 p-3 flex flex-col items-center justify-between text-center relative shadow-inner">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="px-1.5 py-0.5 bg-red-500 text-white font-mono font-bold text-[9px] rounded">PDF</span>
              <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[110px]">{altTitle}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Page 1</span>
          </div>

          <div className="my-auto py-2 flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mb-1 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 tracking-tight truncate max-w-[140px]">{altTitle}</span>
          </div>

          <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-center">
            <span className="text-[9px] text-slate-400 font-medium">Document Preview</span>
          </div>
        </div>
      )}
    </div>
  );
};
