import React, { useState, useEffect } from 'react';
import { ProjectDossier } from '../../types';
import { fileToPersistedUrl } from '../../../../../utils/persistedFileUrl';
import { idbGet, idbPut } from '../../../../../storage/idbKv';
import { 
  Eye, 
  Maximize2, 
  MapPin, 
  ExternalLink, 
  Compass, 
  Layers, 
  Navigation,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  X,
  Calendar,
  Building2,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Plus,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { MediaViewerModal } from '../../../../../components/common/MediaViewerModal';
import { useLanguage } from '../../../../../context/LanguageContext';
import { PdfThumbnail } from '../../../../../components/common/PdfThumbnail';

interface VisualsHouseInfoProps {
  dossier: ProjectDossier;
  onNavigateToChapter?: (chapter: any) => void;
}

type VisualModalType = 'gevelraster' | 'ahn' | 'streetview' | 'floorplan' | null;

export const VisualsHouseInfo: React.FC<VisualsHouseInfoProps> = ({
  dossier,
  onNavigateToChapter
}) => {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<VisualModalType>(null);
  const [modalZoom, setModalZoom] = useState(1);
  const [floorPlanFiles, setFloorPlanFiles] = useState<{url: string, isPdf: boolean}[]>([]);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  // Load stored floor plans on component mount
  useEffect(() => {
    let isMounted = true;
    const loadFloorPlans = async () => {
      try {
        const stored = await idbGet<{url: string, isPdf: boolean}[]>('massEPA_v2_floorplans');
        if (stored && Array.isArray(stored) && isMounted) {
          setFloorPlanFiles(stored);
        }
      } catch (e) {
        console.warn('Could not load floor plans from IndexedDB', e);
      }
    };
    loadFloorPlans();
    return () => { isMounted = false; };
  }, []);

  // Helper to persist floor plans
  const persistFloorPlans = async (files: {url: string, isPdf: boolean}[]) => {
    setFloorPlanFiles(files);
    try {
      await idbPut('massEPA_v2_floorplans', files);
    } catch (e) {
      console.error('Error saving floor plans to IndexedDB', e);
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
        // Convert files to persisted Data URLs (Base64) so they survive reload
        const newFiles = await Promise.all(
          Array.from(files).map(async (file) => ({
            url: await fileToPersistedUrl(file),
            isPdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
          }))
        );
        persistFloorPlans([...floorPlanFiles, ...newFiles]);
      }
    };
    input.click();
  };

  const removeFloorPlanFile = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const updated = floorPlanFiles.filter((_, idx) => idx !== indexToRemove);
    persistFloorPlans(updated);
  };

  const openModal = (type: VisualModalType) => {
    setActiveModal(type);
    setModalZoom(1);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveModalIndex(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Chapter Top Header Bar (Format matching rest of the application) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Eye className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.visuals.title') || '1. Visuals (House information)'}</span>
          </h1>
        </div>


      </div>

      {/* Primary Visuals Matrix: 3 Top Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. (EYE) Gevelraster Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide">
                {t('invoersheetV2.visualsHouseInfo.gevelraster') || 'Gevelraster'}
              </span>
            </div>
            <button
              onClick={() => openModal('gevelraster')}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
              title={t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div 
            onClick={() => openModal('gevelraster')}
            className="p-3 bg-slate-100/50 flex-1 flex items-center justify-center cursor-pointer relative group"
          >
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-[#e9ecef] shadow-2xs">
              <svg viewBox="0 0 320 240" className="w-full h-full object-cover">
                <rect width="320" height="240" fill="#e9ecef" />
                <path d="M-20,220 L160,-20 L220,-20 L40,240 Z" fill="#ffffff" stroke="#ced4da" strokeWidth="1.5" />
                <path d="M120,240 L340,10 L300,-10 L80,220 Z" fill="#ffffff" stroke="#ced4da" strokeWidth="1.5" />
                <path d="M180,240 Q220,160 320,130 L320,240 Z" fill="#d8f3dc" />
                <circle cx="210" cy="210" r="4.5" fill="#52b788" />
                <circle cx="240" cy="180" r="5" fill="#52b788" />
                <circle cx="280" cy="160" r="5" fill="#52b788" />
                <circle cx="270" cy="210" r="4" fill="#52b788" />

                <g stroke="#38bdf8" strokeWidth="1.2" fill="#22c55e">
                  <rect x="25" y="145" width="22" height="42" transform="rotate(-35 25 145)" rx="1" />
                  <rect x="42" y="132" width="22" height="42" transform="rotate(-35 42 132)" rx="1" />
                  <rect x="59" y="119" width="22" height="42" transform="rotate(-35 59 119)" rx="1" />
                  <rect x="76" y="106" width="22" height="42" transform="rotate(-35 76 106)" rx="1" />
                  <rect x="93" y="93" width="22" height="42" transform="rotate(-35 93 93)" rx="1" />
                  <rect x="110" y="80" width="22" height="42" transform="rotate(-35 110 80)" rx="1" />

                  <g transform="translate(30, 20)">
                    <rect x="62" y="115" width="24" height="46" transform="rotate(-35 62 115)" fill="#16a34a" stroke="#0284c7" strokeWidth="2.5" />
                  </g>
                </g>

                <g stroke="#38bdf8" strokeWidth="1.2" fill="#22c55e">
                  <rect x="165" y="45" width="22" height="38" transform="rotate(-35 165 45)" rx="1" />
                  <rect x="182" y="32" width="22" height="38" transform="rotate(-35 182 32)" rx="1" />
                  <rect x="199" y="19" width="22" height="38" transform="rotate(-35 199 19)" rx="1" />
                  <rect x="216" y="6" width="22" height="38" transform="rotate(-35 216 6)" rx="1" />
                </g>

                <text x="35" y="190" transform="rotate(-35 35 190)" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">Fintstraat</text>
                <text x="140" y="215" transform="rotate(-35 140 215)" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">Inktvisplein</text>
                
                <rect x="148" y="105" width="30" height="12" rx="2" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                <text x="151" y="113" fill="#0369a1" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">P-202605</text>
              </svg>

              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t('invoersheetV2.visualsHouseInfo.viewGevelraster') || 'Gevelraster Bekijken'}</span>
                </span>
              </div>
            </div>
          </div>


        </div>

        {/* 2. (EYE) AHN Model Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide">
                {t('invoersheetV2.visualsHouseInfo.ahnModel') || 'AHN Model'}
              </span>
            </div>
            <button
              onClick={() => openModal('ahn')}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
              title={t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div 
            onClick={() => openModal('ahn')}
            className="p-3 bg-slate-100/50 flex-1 flex items-center justify-center cursor-pointer relative group"
          >
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-[#f8fafc] shadow-2xs">
              <svg viewBox="0 0 320 240" className="w-full h-full object-cover">
                <rect width="320" height="240" fill="#f1f5f9" />
                <path d="M-30,210 L190,70 L340,150 L120,290 Z" fill="#e2e8f0" />
                <path d="M-10,250 L190,130 L170,115 L-30,235 Z" fill="#ffffff" />
                <path d="M190,130 L340,40 L350,55 L200,145 Z" fill="#ffffff" />

                <text x="80" y="200" transform="rotate(-28 80 200)" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                  Inktvisplein
                </text>

                <g transform="translate(70, 30)">
                  <polygon points="40,30 65,15 65,35 40,50" fill="#a855f7" />
                  <polygon points="15,45 40,30 40,50 15,65" fill="#7e22ce" />
                  <polygon points="15,45 40,30 65,15 40,30" fill="#c084fc" />
                  
                  <polygon points="65,15 90,0 90,20 65,35" fill="#f97316" />
                  <polygon points="40,30 65,15 65,35 40,50" fill="#ea580c" />
                  <polygon points="40,30 65,15 90,0 65,15" fill="#fb923c" />

                  <polygon points="90,0 115,-15 115,5 90,20" fill="#22c55e" />
                  <polygon points="65,15 90,0 90,20 65,35" fill="#16a34a" />
                </g>

                <g transform="translate(180, 50)">
                  <polygon points="30,20 50,8 50,28 30,40" fill="#eab308" />
                  <polygon points="10,32 30,20 30,40 10,52" fill="#ca8a04" />
                  <polygon points="50,8 70,-4 70,16 50,28" fill="#14b8a6" />
                </g>

                <g transform="translate(135, 110)">
                  <polygon points="50,20 90,-4 50,-28 10,-4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                  <polygon points="50,20 90,-4 90,36 50,60" fill="#1e40af" stroke="#172554" strokeWidth="1.5" />
                  <polygon points="10,-4 50,20 50,60 10,36" fill="#1d4ed8" stroke="#172554" strokeWidth="1.5" />
                  <polygon points="5,-1 25,-13 25,17 5,29" fill="#2563eb" stroke="#172554" strokeWidth="1" />
                </g>

                <polygon points="280,180 300,168 300,188 280,200" fill="#15803d" />
              </svg>

              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t('invoersheetV2.visualsHouseInfo.ahnVoxelModel') || '3D AHN Voxelmodel'}</span>
                </span>
              </div>
            </div>
          </div>


        </div>

        {/* 3. (EYE) Street view Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide">
                {t('invoersheetV2.visualsHouseInfo.streetView') || 'Street view'}
              </span>
            </div>
            <button
              onClick={() => openModal('streetview')}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
              title={t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div 
            onClick={() => openModal('streetview')}
            className="p-3 bg-slate-100/50 flex-1 flex items-center justify-center cursor-pointer relative group"
          >
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 relative shadow-2xs">
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
                alt="Street view Fintstraat Almere"
                className="w-full h-full object-cover"
              />

              {/* Street View UI Overlay */}
              <div className="absolute top-2 left-2 bg-slate-900/85 text-white p-1.5 rounded text-[9px] leading-tight max-w-[130px] shadow-sm backdrop-blur-xs">
                <div className="font-bold flex items-center space-x-1">
                  <MapPin className="w-2.5 h-2.5 text-red-400" />
                  <span>16 Inktvisplein</span>
                </div>
                <div className="text-slate-300 text-[8px]">Almere, Flevoland</div>
              </div>

              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900/80 border border-slate-600 flex items-center justify-center text-red-500 shadow-md">
                <Navigation className="w-3 h-3 transform -rotate-45" />
              </div>

              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t('invoersheetV2.visualsHouseInfo.streetView360') || '360° Gevelzicht'}</span>
                </span>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Featured Bottom Card: (EYE) Floor plan (Architecture & Dimensions) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display font-semibold text-sm tracking-wide">
              {t('invoersheetV2.visualsHouseInfo.floorPlanTitle') || 'Floor plans & Elevation'}
            </h3>
          </div>
        </div>

        <div className="p-5 flex-1 bg-white w-full overflow-y-auto min-h-[360px] max-h-[500px]">
          <div className={`grid gap-4 flex-1 ${
            floorPlanFiles.length === 0 ? 'grid-cols-1 h-[320px]' : 
            floorPlanFiles.length === 1 ? 'grid-cols-2 h-[320px]' : 
            floorPlanFiles.length === 2 ? 'grid-cols-3 h-[240px]' : 
            'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[200px]'
          }`}>
            {floorPlanFiles.map((file, idx) => (
              <div key={idx} className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white relative group flex items-center justify-center shadow-xs">
                <div onClick={() => { setActiveModalIndex(idx); setModalZoom(1); }} className="w-full h-full cursor-pointer relative">
                  {file.isPdf ? (
                    <PdfThumbnail url={file.url} altTitle={`Plattegrond ${idx + 1}`} />
                  ) : (
                    <img 
                      src={file.url} 
                      alt={`Floorplan ${idx}`} 
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                    <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-primary" />
                      <span>{t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}</span>
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => removeFloorPlanFile(e, idx)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md shadow-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition z-10"
                  title={t('invoersheetV2.visualsHouseInfo.delete') || 'Verwijder'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div 
              onClick={handleUploadClick}
              className="w-full h-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition group"
            >
               {floorPlanFiles.length === 0 ? (
                 <>
                   <FileCheck className="w-12 h-12 text-slate-400 mb-4 group-hover:text-primary transition" />
                   <span className="text-sm font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.visualsHouseInfo.addFloorPlan') || 'Floor plan toevoegen'}</span>
                   <span className="text-xs text-slate-400 mt-2">{t('invoersheetV2.visualsHouseInfo.multiplePhotosPdfs') || "Meerdere Foto's of PDF's"}</span>
                 </>
               ) : (
                 <>
                   <Plus className="w-8 h-8 text-slate-400 mb-2 group-hover:text-primary transition" />
                   <span className="text-xs font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.visualsHouseInfo.addMore') || 'Meer toevoegen'}</span>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared MediaViewerModal for Floorplans */}
      {activeModalIndex !== null && (
        <MediaViewerModal
          files={floorPlanFiles}
          initialIndex={activeModalIndex}
          onClose={() => setActiveModalIndex(null)}
          titlePrefix={t('invoersheetV2.visualsHouseInfo.uploadedFloorPlan') || 'Geüploade Floor plan'}
          footerText={`Dossier ${dossier.dossierNumber} • ${dossier.bag.address} ${dossier.bag.houseNumber}, ${dossier.bag.city}`}
        />
      )}

      {/* Fullscreen High-Resolution Inspection Modal (Inline for Gevelraster, AHN, Streetview) */}
      {activeModal && (
        <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Eye className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-base tracking-wide">
                  {activeModal === 'gevelraster' && (t('invoersheetV2.visualsHouseInfo.gevelrasterModalTitle') || 'Gevelraster & Kadastrale Kaart')}
                  {activeModal === 'ahn' && (t('invoersheetV2.visualsHouseInfo.ahnModalTitle') || 'AHN Model - 3D Gebouwhoogtedata (3DBAG NTA 8800)')}
                  {activeModal === 'streetview' && (t('invoersheetV2.visualsHouseInfo.streetViewModalTitle') || 'Street view - Gevelopname & Referentiebeeld')}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setModalZoom((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                  title={t('invoersheetV2.visualsHouseInfo.zoomIn') || 'Inzoomen'}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setModalZoom((z) => Math.max(0.75, z - 0.25))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                  title={t('invoersheetV2.visualsHouseInfo.zoomOut') || 'Uitzoomen'}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={closeModal}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Canvas Viewer */}
            <div className="flex-1 p-6 overflow-auto bg-primary-dark flex items-center justify-center">
              <div 
                className="transition-transform duration-150 origin-center max-w-full bg-white rounded-lg p-2 shadow-xl"
                style={{ transform: `scale(${modalZoom})` }}
              >
                {activeModal === 'gevelraster' && (
                  <div className="w-[640px] aspect-[4/3]">
                    <svg viewBox="0 0 320 240" className="w-full h-full object-contain">
                      <rect width="320" height="240" fill="#e9ecef" />
                      <path d="M-20,220 L160,-20 L220,-20 L40,240 Z" fill="#ffffff" stroke="#ced4da" strokeWidth="1.5" />
                      <path d="M120,240 L340,10 L300,-10 L80,220 Z" fill="#ffffff" stroke="#ced4da" strokeWidth="1.5" />
                      <path d="M180,240 Q220,160 320,130 L320,240 Z" fill="#d8f3dc" />
                      <circle cx="210" cy="210" r="4.5" fill="#52b788" />
                      <circle cx="240" cy="180" r="5" fill="#52b788" />
                      <circle cx="280" cy="160" r="5" fill="#52b788" />
                      <g stroke="#38bdf8" strokeWidth="1.2" fill="#22c55e">
                        <rect x="25" y="145" width="22" height="42" transform="rotate(-35 25 145)" rx="1" />
                        <rect x="42" y="132" width="22" height="42" transform="rotate(-35 42 132)" rx="1" />
                        <rect x="59" y="119" width="22" height="42" transform="rotate(-35 59 119)" rx="1" />
                        <rect x="76" y="106" width="22" height="42" transform="rotate(-35 76 106)" rx="1" />
                        <rect x="93" y="93" width="22" height="42" transform="rotate(-35 93 93)" rx="1" />
                        <rect x="110" y="80" width="22" height="42" transform="rotate(-35 110 80)" rx="1" />
                        <g transform="translate(30, 20)">
                          <rect x="62" y="115" width="24" height="46" transform="rotate(-35 62 115)" fill="#16a34a" stroke="#0284c7" strokeWidth="2.5" />
                        </g>
                      </g>
                      <text x="35" y="190" transform="rotate(-35 35 190)" fill="#475569" fontSize="7" fontWeight="bold">Fintstraat (Almere)</text>
                      <text x="140" y="215" transform="rotate(-35 140 215)" fill="#475569" fontSize="7" fontWeight="bold">Inktvisplein</text>
                      <rect x="148" y="105" width="40" height="15" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                      <text x="152" y="116" fill="#0369a1" fontSize="7" fontWeight="bold">P-202605 (Nr. 1)</text>
                    </svg>
                  </div>
                )}

                {activeModal === 'ahn' && (
                  <div className="w-[640px] aspect-[4/3]">
                    <svg viewBox="0 0 320 240" className="w-full h-full object-contain">
                      <rect width="320" height="240" fill="#f1f5f9" />
                      <path d="M-30,210 L190,70 L340,150 L120,290 Z" fill="#e2e8f0" />
                      <path d="M-10,250 L190,130 L170,115 L-30,235 Z" fill="#ffffff" />
                      <text x="80" y="200" transform="rotate(-28 80 200)" fill="#64748b" fontSize="9" fontWeight="bold">
                        Inktvisplein / Fintstraat
                      </text>
                      <g transform="translate(70, 30)">
                        <polygon points="40,30 65,15 65,35 40,50" fill="#a855f7" />
                        <polygon points="15,45 40,30 40,50 15,65" fill="#7e22ce" />
                        <polygon points="65,15 90,0 90,20 65,35" fill="#f97316" />
                      </g>
                      <g transform="translate(135, 110)">
                        <polygon points="50,20 90,-4 50,-28 10,-4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                        <polygon points="50,20 90,-4 90,36 50,60" fill="#1e40af" stroke="#172554" strokeWidth="2" />
                        <polygon points="10,-4 50,20 50,60 10,36" fill="#1d4ed8" stroke="#172554" strokeWidth="2" />
                      </g>
                    </svg>
                  </div>
                )}

                {activeModal === 'streetview' && (
                  <div className="w-[680px] max-h-[500px] overflow-hidden rounded">
                    <img
                      src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                      alt="Street view Fintstraat Almere"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-mono">
                Dossier {dossier.dossierNumber} • {dossier.bag.address} {dossier.bag.houseNumber}, {dossier.bag.city}
              </span>
              <button
                onClick={closeModal}
                className="px-4 py-1.5 bg-primary hover:bg-primary text-white rounded font-medium"
              >
                {t('invoersheetV2.visualsHouseInfo.close') || 'Sluiten'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

