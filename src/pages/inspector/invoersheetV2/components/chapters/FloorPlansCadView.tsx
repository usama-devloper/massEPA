import React, { useState, useEffect } from 'react';
import { fileToPersistedUrl } from '../../../../../utils/persistedFileUrl';
import { idbGet, idbPut } from '../../../../../storage/idbKv';
import { CheckCircle2, FileCheck, Maximize2, Trash2, Plus } from 'lucide-react';
import { MediaViewerModal } from '../../../../../components/common/MediaViewerModal';
import { useLanguage } from '../../../../../context/LanguageContext';

export const FloorPlansCadView: React.FC = () => {
  const { t } = useLanguage();
  const [cadFiles, setCadFiles] = useState<{url: string, isPdf: boolean}[]>([]);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    const loadCadPlans = async () => {
      try {
        const stored = await idbGet<{url: string, isPdf: boolean}[]>('massEPA_v2_cad_floorplans');
        if (isMounted && stored) {
          setCadFiles(stored);
        }
      } catch (e) {
        console.error('Failed to load CAD plans from IndexedDB', e);
      }
    };
    loadCadPlans();
    return () => { isMounted = false; };
  }, []);

  const persistCadPlans = async (files: {url: string, isPdf: boolean}[]) => {
    setCadFiles(files);
    try {
      await idbPut('massEPA_v2_cad_floorplans', files);
    } catch (e) {
      console.error('Error saving CAD plans to IndexedDB', e);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newFiles = await Promise.all(
          Array.from(files).map(async (file) => ({
            url: await fileToPersistedUrl(file),
            isPdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
          }))
        );
        persistCadPlans([...cadFiles, ...newFiles]);
      }
    };
    input.click();
  };

  const removeCadFile = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const updated = cadFiles.filter((_, idx) => idx !== indexToRemove);
    persistCadPlans(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full flex flex-col hover:border-slate-300 transition">
      <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">

          <span className="font-display font-semibold text-xs tracking-wide">
            {t('invoersheetV2.floorPlansCadView.title') || 'CAD Plattegronden (GBO_1 & GBO_2)'}
          </span>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50 w-full h-full">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-full min-h-[360px] max-h-[500px] overflow-y-auto">
          <div className={`grid gap-4 ${
            cadFiles.length === 0 ? 'grid-cols-1 h-[320px]' : 
            cadFiles.length === 1 ? 'grid-cols-2 h-[320px]' : 
            cadFiles.length === 2 ? 'grid-cols-3 h-[240px]' : 
            'grid-cols-2 lg:grid-cols-3 auto-rows-[200px]'
          }`}>
            {cadFiles.map((file, idx) => (
              <div key={idx} className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white relative group flex items-center justify-center shadow-xs">
                <div onClick={() => setActiveModalIndex(idx)} className="w-full h-full cursor-pointer relative">
                  {file.isPdf ? (
                    <iframe 
                      src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0 pointer-events-none"
                      title={`CAD PDF ${idx}`}
                    />
                  ) : (
                    <img 
                      src={file.url} 
                      alt={`CAD Plattegrond ${idx}`} 
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                    <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-primary" />
                      <span>{t('invoersheetV2.floorPlansCadView.enlarge') || 'Vergroten'}</span>
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => removeCadFile(e, idx)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition z-10"
                  title={t('invoersheetV2.floorPlansCadView.remove') || 'Verwijder'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div 
              onClick={handleUploadClick}
              className="w-full h-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition group"
            >
               {cadFiles.length === 0 ? (
                 <>
                   <FileCheck className="w-12 h-12 text-slate-400 mb-4 group-hover:text-primary transition" />
                   <span className="text-sm font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.floorPlansCadView.addPlan') || 'CAD Plattegrond toevoegen'}</span>
                   <span className="text-xs text-slate-400 mt-2">{t('invoersheetV2.floorPlansCadView.multiplePhotosPdf') || "Meerdere Foto's of PDF's"}</span>
                 </>
               ) : (
                 <>
                   <Plus className="w-8 h-8 text-slate-400 mb-2 group-hover:text-primary transition" />
                   <span className="text-xs font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.floorPlansCadView.addMore') || 'Meer toevoegen'}</span>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared MediaViewerModal for CAD Plans */}
      {activeModalIndex !== null && (
        <MediaViewerModal
          files={cadFiles}
          initialIndex={activeModalIndex}
          onClose={() => setActiveModalIndex(null)}
          titlePrefix={t('invoersheetV2.floorPlansCadView.uploadedPlan') || 'Geüploade Plattegrond'}
          footerText={t('invoersheetV2.floorPlansCadView.title') || `CAD Plattegronden (GBO_1 & GBO_2)`}
        />
      )}
    </div>
  );
};
