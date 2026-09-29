import React, { useState, useRef, useEffect } from 'react';
import { FACADE_GEOMETRY_DATA, FacadeGeometry, KozijnDetail } from '../../data/facadeGeometryData';
import { CadElevationSvg } from '../drawing/CadElevationSvg';
import { 
  Maximize2, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  CheckCircle2, 
  Compass, 
  Ruler, 
  Info, 
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Building,
  Table,
  Camera,
  FileCheck,
  Plus,
  Tag,
  Trash2,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { EnvelopeElement } from '../../types';
import { MediaViewerModal } from '../../../../../components/common/MediaViewerModal';
import { AppSelect } from '../../../../../components/common/AppSelect';
import { fileToPersistedUrl } from '../../../../../utils/persistedFileUrl';
import { useLanguage } from '../../../../../context/LanguageContext';

export const STANDARD_KOZIJN_CATEGORIES = [
  'Raam (draai-kiep)',
  'Buitendeur',
  'Schuifpui',
  'Vast raam',
  'Dakraam',
  'Borstwering / Paneel',
  'Ventilatierooster',
  'Glasstrook / Vast glas'
];

interface ExteriorGeometrySectionProps {
  envelope?: EnvelopeElement[];
  facadesData?: FacadeGeometry[];
  onUpdateFacadesData?: (data: FacadeGeometry[]) => void;
  onOpenBcrgForElement?: (elementId: string) => void;
  onNavigateToChapter?: (chapter: any) => void;
  onSwitchToNtaTable?: () => void;
  onAddEnvelopeElement?: (element: any) => void;
  onDeleteEnvelopeElement?: (id: string) => void;
  projectAddress?: string;
  projectNumber?: string;
}

export const ExteriorGeometrySection: React.FC<ExteriorGeometrySectionProps> = ({
  envelope,
  facadesData: propFacadesData,
  onUpdateFacadesData,
  onOpenBcrgForElement,
  onNavigateToChapter,
  onSwitchToNtaTable,
  onAddEnvelopeElement,
  onDeleteEnvelopeElement,
  projectAddress,
  projectNumber
}) => {
  const { t } = useLanguage();
  const [selectedFacadeId, setSelectedFacadeId] = useState<string>('all');
  const [localFacadesData, setLocalFacadesData] = useState<FacadeGeometry[]>(FACADE_GEOMETRY_DATA);
  const facadesData = propFacadesData && propFacadesData.length > 0 ? propFacadesData : localFacadesData;

  const handleUploadClick = (onPhotosSelected: (urls: string[]) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length > 0) {
        const urls = await Promise.all(
          files.map(async (file) => await fileToPersistedUrl(file))
        );
        onPhotosSelected(urls);
      }
    };
    input.click();
  };

  const handleUpdateFacadesData = (updater: (prev: FacadeGeometry[]) => FacadeGeometry[]) => {
    const newData = updater(facadesData);
    setLocalFacadesData(newData);
    if (onUpdateFacadesData) {
      onUpdateFacadesData(newData);
    }
  };

  const [activeModalImage, setActiveModalImage] = useState<{
    title: string;
    type: 'photo' | 'cad';
    url?: string;
    urls?: string[];
    currentIndex?: number;
    cadType?: 'voorgevel' | 'linkergevel' | 'rechtergevel' | 'achtergevel';
  } | null>(null);
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [hoveredKozijn, setHoveredKozijn] = useState<string | undefined>(undefined);
  const [showNtaTable, setShowNtaTable] = useState<boolean>(false);

  // Add Kozijn & Category Modal state
  const [isAddKozijnModalOpen, setIsAddKozijnModalOpen] = useState<boolean>(false);
  const [editingKozijnId, setEditingKozijnId] = useState<string | null>(null);
  const [targetFacadeIdForAdd, setTargetFacadeIdForAdd] = useState<string>('facade-voor');
  const [newKozCode, setNewKozCode] = useState<string>('');
  const [newKozName, setNewKozName] = useState<string>('');
  const [newKozCategory, setNewKozCategory] = useState<string>('');
  const [newKozWidth, setNewKozWidth] = useState<number | ''>('');
  const [newKozHeight, setNewKozHeight] = useState<number | ''>('');
  const [newKozArea, setNewKozArea] = useState<number | ''>('');
  const [newKozConstruction, setNewKozConstruction] = useState<string>('');
  const [newKozInputMethod, setNewKozInputMethod] = useState<string>('');
  const [newKozInsulationPresent, setNewKozInsulationPresent] = useState<string>('');
  const [newKozInsulationThickness, setNewKozInsulationThickness] = useState<number | ''>('');
  const [newKozUValue, setNewKozUValue] = useState<number | ''>('');
  const [newKozOverstek, setNewKozOverstek] = useState<string>('');
  const [newKozZonwering, setNewKozZonwering] = useState<string>('');
  const [newKozPhotoUrl, setNewKozPhotoUrl] = useState<string>('');

  // Custom Delete Confirmations
  type DeleteAction = { type: 'FACADE', id: string } | { type: 'KOZIJN', facadeId: string, kozijnId: string } | null;
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteAction>(null);

  // Inline Category Addition on existing kozijn
  const [activeCategoryKozijnId, setActiveCategoryKozijnId] = useState<string | null>(null);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [facadesData.length]);

  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedFacadeId]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const displayedFacades = selectedFacadeId === 'all'
    ? facadesData
    : facadesData.filter((f) => f.id === selectedFacadeId);

  const allGlobalKozijnNames = Array.from(new Set([
    ...(envelope?.filter(e => e.type.toLowerCase() === 'raam' || e.type.toLowerCase() === 'deur').map(e => e.code || e.name) || []),
    ...facadesData.flatMap(f => f.kozijnen.map(k => k.code || k.name))
  ])).filter(Boolean);

  const handleUpdateKozijnDimensions = (facadeId: string, kozijnId: string, width: number, height: number) => {
    const calculatedArea = Math.round(width * height * 100) / 100;
    handleUpdateFacadesData((prev) => {
      let targetCode = '';
      prev.forEach(f => {
        if (f.id === facadeId) {
          const k = f.kozijnen.find(k => k.id === kozijnId);
          if (k) targetCode = k.code;
        }
      });
      if (!targetCode) return prev;
      
      return prev.map((facade) => ({
        ...facade,
        kozijnen: facade.kozijnen.map((koz) => {
          if (koz.code !== targetCode) return koz;
          return {
            ...koz,
            width,
            height,
            area: calculatedArea
          };
        })
      }));
    });
  };

  const handleUpdateKozijnArea = (facadeId: string, kozijnId: string, area: number) => {
    handleUpdateFacadesData((prev) => {
      let targetCode = '';
      prev.forEach(f => {
        if (f.id === facadeId) {
          const k = f.kozijnen.find(k => k.id === kozijnId);
          if (k) targetCode = k.code;
        }
      });
      if (!targetCode) return prev;
      
      return prev.map((facade) => ({
        ...facade,
        kozijnen: facade.kozijnen.map((koz) => {
          if (koz.code !== targetCode) return koz;
          return {
            ...koz,
            area,
            width: 0,
            height: 0
          };
        })
      }));
    });
  };

  const handleUpdateKozijnField = (facadeId: string, kozijnId: string, field: string, value: any) => {
    handleUpdateFacadesData((prev) => {
      let targetCode = '';
      prev.forEach(f => {
        if (f.id === facadeId) {
          const k = f.kozijnen.find(k => k.id === kozijnId);
          if (k) targetCode = k.code;
        }
      });
      if (!targetCode) return prev;
      
      return prev.map((facade) => ({
        ...facade,
        kozijnen: facade.kozijnen.map((koz) => {
          if (koz.code !== targetCode) return koz;
          return {
            ...koz,
            [field]: value
          };
        })
      }));
    });
  };

  const handleAddCategoryToKozijn = (facadeId: string, kozijnId: string, categoryName: string) => {
    const cleanCat = categoryName.trim();
    if (!cleanCat) return;
    handleUpdateFacadesData((prev) => {
      let targetCode = '';
      prev.forEach(f => {
        if (f.id === facadeId) {
          const k = f.kozijnen.find(k => k.id === kozijnId);
          if (k) targetCode = k.code;
        }
      });
      if (!targetCode) return prev;

      return prev.map((facade) => ({
        ...facade,
        kozijnen: facade.kozijnen.map((koz) => {
          if (koz.code !== targetCode) return koz;
          const existingCategories = koz.categories && koz.categories.length > 0 
            ? koz.categories 
            : (koz.category ? [koz.category] : []);
          if (existingCategories.includes(cleanCat)) {
            return { ...koz, category: cleanCat };
          }
          return {
            ...koz,
            category: cleanCat,
            categories: [...existingCategories, cleanCat]
          };
        })
      }));
    });
    setCustomCategoryInput('');
    setActiveCategoryKozijnId(null);
  };

  const handleAddFacade = () => {
    const newId = `facade-${Date.now()}`;
    const newFacade: import('../../data/facadeGeometryData').FacadeGeometry = {
      id: newId,
      title: t('invoersheetV2.exteriorGeometry.newFacade') || 'Nieuwe Gevel',
      code: `GEV-${Math.floor(Math.random() * 1000)}`,
      construction: '',
      orientation: 'N',
      level: 'BG',
      boundary: 'Buitenlucht',
      formula: '',
      areaTotal: 0,
      kozijnListString: '',
      photoUrl: '',
      cadDrawingType: 'voorgevel',
      kozijnen: []
    };
    handleUpdateFacadesData(prev => [...prev, newFacade]);
    setSelectedFacadeId(newId);
  };

  const handleDeleteFacade = (facadeId: string) => {
    setDeleteConfirmation({ type: 'FACADE', id: facadeId });
  };

  const handleDeleteKozijn = (facadeId: string, kozijnId: string) => {
    setDeleteConfirmation({ type: 'KOZIJN', facadeId, kozijnId });
  };

  const executeDelete = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'FACADE') {
      const facadeId = deleteConfirmation.id;
      handleUpdateFacadesData(prev => {
        const newFacades = prev.filter(f => f.id !== facadeId);
        if (selectedFacadeId === facadeId) {
          setSelectedFacadeId(newFacades.length > 0 ? newFacades[0].id : 'all');
        }
        return newFacades;
      });
    } else if (deleteConfirmation.type === 'KOZIJN') {
      const { facadeId, kozijnId } = deleteConfirmation;
      handleUpdateFacadesData(prev => prev.map(f => {
        const kozijnToDelete = prev.flatMap(p => p.kozijnen).find(k => k.id === kozijnId);
        if (!kozijnToDelete) return f;

        const newKozijnen = f.kozijnen.filter(k => k.code !== kozijnToDelete.code);
        const newKozijnList = newKozijnen.map(k => k.code).join(', ');
        return { ...f, kozijnen: newKozijnen, kozijnListString: newKozijnList };
      }));
      
      if (onDeleteEnvelopeElement) {
        onDeleteEnvelopeElement(kozijnId);
      }
    }

    setDeleteConfirmation(null);
  };

  const handleRemoveCategoryFromKozijn = (facadeId: string, kozijnId: string, categoryToRemove: string) => {
    handleUpdateFacadesData((prev) => {
      let targetCode = '';
      prev.forEach(f => {
        if (f.id === facadeId) {
          const k = f.kozijnen.find(k => k.id === kozijnId);
          if (k) targetCode = k.code;
        }
      });
      if (!targetCode) return prev;

      return prev.map((facade) => ({
        ...facade,
        kozijnen: facade.kozijnen.map((koz) => {
          if (koz.code !== targetCode) return koz;
          const existing = koz.categories || (koz.category ? [koz.category] : []);
          const updated = existing.filter((c) => c !== categoryToRemove);
          return {
            ...koz,
            category: updated[0] || 'Kozijn',
            categories: updated
          };
        })
      }));
    });
  };

  const handleOpenAddKozijnCategory = (facadeId: string) => {
    setEditingKozijnId(null);
    setTargetFacadeIdForAdd(facadeId);
    setNewKozCode('');
    setNewKozName('');
    setNewKozCategory('');
    setNewKozWidth('');
    setNewKozHeight('');
    setNewKozArea('');
    setNewKozConstruction('');
    setNewKozInputMethod('');
    setNewKozInsulationPresent('');
    setNewKozInsulationThickness('');
    setNewKozUValue('');
    setNewKozOverstek('');
    setNewKozZonwering('');
    setNewKozPhotoUrl('');
    setIsAddKozijnModalOpen(true);
  };

  const handleOpenEditKozijn = (facadeId: string, kozijn: KozijnDetail) => {
    setEditingKozijnId(kozijn.id);
    setTargetFacadeIdForAdd(facadeId);
    setNewKozCode(kozijn.code);
    setNewKozName(kozijn.name);
    setNewKozCategory(kozijn.category || '');
    setNewKozWidth(kozijn.width || '');
    setNewKozHeight(kozijn.height || '');
    setNewKozArea(kozijn.area || '');
    setNewKozConstruction(kozijn.brandAndType || '');
    setNewKozInputMethod(kozijn.inputMethod || '');
    setNewKozInsulationPresent(kozijn.insulationPresent || '');
    setNewKozInsulationThickness(kozijn.insulationThickness || '');
    setNewKozUValue(kozijn.uValue || '');
    setNewKozOverstek(kozijn.overstekBelemmering || '');
    setNewKozZonwering(kozijn.zonwering || '');
    setNewKozPhotoUrl(kozijn.photoUrl || '');
    setIsAddKozijnModalOpen(true);
  };

  const handleSaveNewKozijnWithCategory = () => {
    const w = Number(newKozWidth) || 0;
    const h = Number(newKozHeight) || 0;
    const area = newKozArea !== '' ? Number(newKozArea) : Math.round(w * h * 100) / 100;
    const finalCode = newKozCode.trim() || `K${Date.now().toString().slice(-3)}`;
    const finalCategory = newKozCategory.trim() || 'Raam (draai-kiep)';
    const newKoz: KozijnDetail = {
      id: editingKozijnId || `koz-${Date.now()}`,
      code: finalCode,
      name: newKozName.trim() || `${finalCategory} ${finalCode}`,
      width: w,
      height: h,
      area: area,
      brandAndType: newKozConstruction.trim() || 'Onbekend',
      inputMethod: newKozInputMethod || 'Onbekend',
      insulationPresent: newKozInsulationPresent === 'yes' ? 'yes' : 'no',
      insulationThickness: newKozInsulationPresent === 'yes' ? Number(newKozInsulationThickness) || 0 : undefined,
      uValue: Number(newKozUValue) || 1.4,
      overstekBelemmering: newKozOverstek.trim() || 'Geen',
      zonwering: newKozZonwering.trim() || 'Geen',
      photoUrl: newKozPhotoUrl || '',
      photoDescription: `${finalCategory} ${finalCode} - ${newKozConstruction} (${w}m × ${h}m = ${area}m²)`
    };

    if (editingKozijnId) {
      handleUpdateFacadesData((prev) =>
        prev.map((f) => {
          const hasKozijn = f.kozijnen.some((k) => k.id === editingKozijnId);
          if (hasKozijn) {
            const updatedKozijnen = f.kozijnen.map((k) => k.id === editingKozijnId ? newKoz : k);
            const updatedListString = updatedKozijnen.map((k) => k.code).join(', ');
            return {
              ...f,
              kozijnen: updatedKozijnen,
              kozijnListString: updatedListString
            };
          }
          return f;
        })
      );
    } else {
      handleUpdateFacadesData((prev) =>
        prev.map((f) => {
          if (f.id !== targetFacadeIdForAdd) return f;
          const updatedKozijnen = [...f.kozijnen, newKoz];
          const updatedListString = updatedKozijnen.map((k) => k.code).join(', ');
          return {
            ...f,
            kozijnen: updatedKozijnen,
            kozijnListString: updatedListString
          };
        })
      );
    }

    if (onAddEnvelopeElement) {
      const targetFacade = facadesData.find(f => f.id === targetFacadeIdForAdd);
      onAddEnvelopeElement({
        id: newKoz.id,
        code: finalCode,
        name: newKoz.name,
        type: 'raam',
        orientation: targetFacade?.orientation || 'Z',
        area: area,
        rc: undefined,
        uValue: newKoz.uValue || 1.1,
        insulationType: newKoz.brandAndType || 'Onbekend',
        insulationThicknessMm: newKoz.insulationThickness || 0,
        qualityStatement: false,
        verified: true
      });
    }

    setEditingKozijnId(null);
    setNewKozZonwering('');

    setIsAddKozijnModalOpen(false);
  };

  const openImageModal = (title: string, url: string, urls?: string[], currentIndex?: number) => {
    setActiveModalImage({ title, type: 'photo', url, urls, currentIndex });
    setModalZoom(1);
  };

  const openCadModal = (title: string, cadType: 'voorgevel' | 'linkergevel' | 'rechtergevel' | 'achtergevel') => {
    setActiveModalImage({ title, type: 'cad', cadType });
    setModalZoom(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Chapter Top Header Bar (Format matching Visuals / rest of application) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.exteriorGeometry.title') || '3. Exterior (Gevelmatrix & Kozijnstaten)'}</span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onSwitchToNtaTable && (
            <button
              onClick={onSwitchToNtaTable}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              <Table className="w-3.5 h-3.5 text-primary" />
              <span>{t('invoersheetV2.exteriorGeometry.tableAndDeclarations') || 'Tabel & Verklaringen'}</span>
            </button>
          )}


        </div>
      </div>

      {/* Gevel Selection Tabs */}
      <div className="relative flex items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs w-full overflow-hidden">
        {showLeftArrow && (
          <button 
            onClick={() => scrollByAmount(-200)}
            className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-white via-white to-transparent text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-l-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-4 text-xs"
        >
          <button
            ref={selectedFacadeId === 'all' ? activeTabRef : null}
            onClick={() => setSelectedFacadeId('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-medium transition ${
              selectedFacadeId === 'all'
                ? 'bg-primary text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('invoersheetV2.exteriorGeometry.allFacades') || 'Alle Gevels (Compleet Rapport)'}
          </button>
          {facadesData.map((facade) => (
            <button
              key={facade.id}
              ref={selectedFacadeId === facade.id ? activeTabRef : null}
              onClick={() => setSelectedFacadeId(facade.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                selectedFacadeId === facade.id
                  ? 'bg-primary text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {facade.title} {facade.kozijnListString ? `(${facade.kozijnListString})` : ''}
            </button>
          ))}
          <button
            onClick={handleAddFacade}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('invoersheetV2.exteriorGeometry.newFacade') || 'Nieuwe Gevel'}</span>
          </button>
        </div>

        {showRightArrow && (
          <button 
            onClick={() => scrollByAmount(200)}
            className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-white via-white to-transparent text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-r-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Document Cards - Matching Visuals Card Format */}
      <div className="space-y-6">
        {displayedFacades.map((facade) => (
          <div 
            key={facade.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition"
          >
            {/* Card Header matching Visuals (EYE) / (EXT) navy bar */}
            <div className="bg-primary text-white px-4 md:px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">

                <h3 className="font-display font-semibold text-sm tracking-wide">
                  {facade.title} ({facade.subTitle || t('invoersheetV2.exteriorGeometry.facadeConstruction') || 'Gevelconstructie'})
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded">
                  {facade.code} • {facade.orientation}
                </span>

                <button
                  onClick={() => openCadModal(`CAD: ${facade.title}`, facade.cadDrawingType)}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
                  title="CAD Aanzicht Vergroten"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-header Audit Bar */}
            <div className="bg-slate-100/75 px-4 md:px-5 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center space-x-2 font-mono text-[11px]">
                <span className="font-bold text-primary">MassEPA Audit</span>
                <span>•</span>
                <span>PROJECT {projectNumber || '202605'}</span>
                <span>•</span>
                <span>{projectAddress || 'Fintstraat 1, Almere'}</span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[11px]">
                <span className="text-slate-700 font-semibold">{facade.level}</span>
                <span>•</span>
                <span>{t('invoersheetV2.exteriorGeometry.adjacentTo') || 'Grenst aan:'} {facade.boundary}</span>
              </div>
            </div>

            {/* Card Body - 3 Columns (Specs, Photo, CAD Drawing) */}
            <div className="p-5 md:p-6 bg-slate-50/50 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Col 1: Gevel Specifications Panel */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <input
                        type="text"
                        value={facade.title}
                        onChange={(e) => handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, title: e.target.value } : f))}
                        className="font-bold text-sm text-slate-900 font-display bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary outline-none py-0.5 transition w-full mr-2"
                        placeholder={t('invoersheetV2.exteriorGeometry.facadeNamePlaceholder') || 'Naam van Gevel...'}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {facade.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFacade(facade.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                          title={t('invoersheetV2.exteriorGeometry.deleteFacade') || 'Verwijder Gevel'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                        <span className="text-slate-500 block text-[11px] mb-0.5">{t('invoersheetV2.exteriorGeometry.construction') || 'Constructie:'}</span>
                        <input
                          type="text"
                          value={facade.construction || ''}
                          onChange={(e) => handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, construction: e.target.value } : f))}
                          className="w-full text-xs font-semibold text-slate-900 leading-snug bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary outline-none py-0.5 transition"
                          placeholder="Bv. H2FOAM LITE (80 mm, Rc=1.50)"
                        />

                        <span className="text-slate-500 block text-[11px] mb-0.5 mt-2">{t('invoersheetV2.exteriorGeometry.facadeType') || 'Gevel type:'}</span>
                        <AppSelect
                          value={facade.gevelType || ''}
                          onChange={(val) => handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, gevelType: val } : f))}
                          className="w-full max-w-[220px]"
                          variant="compact"
                          searchable={false}
                          options={[
                            { value: "", label: t('invoersheetV2.exteriorGeometry.selectType') || "Selecteer type..." },
                            { value: "Voorgevel", label: t('invoersheetV2.exteriorGeometry.frontFacade') || "Voorgevel" },
                            { value: "Achtergevel", label: t('invoersheetV2.exteriorGeometry.rearFacade') || "Achtergevel" },
                            { value: "Linkergevel", label: t('invoersheetV2.exteriorGeometry.leftFacade') || "Linkergevel" },
                            { value: "Rechtergevel", label: t('invoersheetV2.exteriorGeometry.rightFacade') || "Rechtergevel" },
                            { value: "Aangepaste Gevel", label: t('invoersheetV2.exteriorGeometry.customFacade') || "Aangepaste Gevel" }
                          ]}
                        />

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-slate-500 block text-[11px] mb-0.5">{t('invoersheetV2.exteriorGeometry.orientation') || 'Oriëntatie:'}</span>
                          <AppSelect
                            value={facade.orientation || ''}
                            onChange={(val) => handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, orientation: val } : f))}
                            className="w-full max-w-[100px]"
                            variant="compact"
                            searchable={false}
                            options={[
                              { value: "N", label: "N" },
                              { value: "NO", label: "NO" },
                              { value: "O", label: "O" },
                              { value: "ZO", label: "ZO" },
                              { value: "Z", label: "Z" },
                              { value: "ZW", label: "ZW" },
                              { value: "W", label: "W" },
                              { value: "NW", label: "NW" },
                              { value: "Horizontaal", label: t('invoersheetV2.exteriorGeometry.horizontal') || "Horizontaal" }
                            ]}
                          />
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] mb-0.5">{t('invoersheetV2.exteriorGeometry.buildingLevel') || 'Bouwniveau:'}</span>
                          <AppSelect
                            value={facade.level || ''}
                            onChange={(val) => handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, level: val } : f))}
                            className="w-full max-w-[100px]"
                            variant="compact"
                            searchable={false}
                            options={[
                              { value: "BG", label: t('invoersheetV2.exteriorGeometry.groundFloor') || "BG" },
                              { value: "1e Verdieping", label: t('invoersheetV2.exteriorGeometry.firstFloor') || "1e Verdieping" },
                              { value: "2e Verdieping", label: t('invoersheetV2.exteriorGeometry.secondFloor') || "2e Verdieping" },
                              { value: "Dak", label: t('invoersheetV2.exteriorGeometry.roof') || "Dak" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-500 block text-[11px] mb-0.5">{t('invoersheetV2.exteriorGeometry.adjacentTo') || 'Grenst aan:'}</span>
                        <AppSelect
                          value={facade.boundary || ''}
                          onChange={(val) => handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, boundary: val } : f))}
                          className="w-full max-w-[220px]"
                          variant="compact"
                          searchable={false}
                          options={[
                            { value: "Buitenlucht", label: t('invoersheetV2.exteriorGeometry.outdoorAir') || "Buitenlucht" },
                            { value: "Grond", label: t('invoersheetV2.exteriorGeometry.ground') || "Grond" },
                            { value: "Aangrenzend pand", label: t('invoersheetV2.exteriorGeometry.adjacentBuilding') || "Aangrenzend pand" },
                            { value: "Kruipruimte", label: t('invoersheetV2.exteriorGeometry.crawlSpace') || "Kruipruimte" }
                          ]}
                        />
                      </div>

                      <div className="pt-1">
                        <span className="text-slate-500 block text-[11px] mb-0.5">{t('invoersheetV2.exteriorGeometry.surfaceArea') || 'Oppervlakte (Area):'}</span>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            value={facade.length || ''}
                            onChange={(e) => handleUpdateFacadesData(prev => prev.map(f => {
                              if (f.id !== facade.id) return f;
                              const l = parseFloat(e.target.value) || 0;
                              const w = parseFloat(f.width || '0') || 0;
                              const a = (l * w).toFixed(2);
                              return { ...f, length: e.target.value, areaTotal: parseFloat(a), formula: `${e.target.value} * ${f.width || ''} = ${a} m2` };
                            }))}
                            placeholder={t('invoersheetV2.exteriorGeometry.length') || 'Lengte'}
                            className="w-16 text-xs font-mono font-semibold text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 outline-none focus:border-primary"
                          />
                          <span className="text-slate-400 font-mono text-xs">×</span>
                          <input
                            type="number"
                            value={facade.width || ''}
                            onChange={(e) => handleUpdateFacadesData(prev => prev.map(f => {
                              if (f.id !== facade.id) return f;
                              const w = parseFloat(e.target.value) || 0;
                              const l = parseFloat(f.length || '0') || 0;
                              const a = (l * w).toFixed(2);
                              return { ...f, width: e.target.value, areaTotal: parseFloat(a), formula: `${f.length || ''} * ${e.target.value} = ${a} m2` };
                            }))}
                            placeholder={t('invoersheetV2.exteriorGeometry.width') || 'Breedte'}
                            className="w-16 text-xs font-mono font-semibold text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200 outline-none focus:border-primary"
                          />
                          <span className="text-slate-400 font-mono text-xs">=</span>
                          <input
                            type="number"
                            value={facade.areaTotal || ''}
                            onChange={(e) => handleUpdateFacadesData(prev => prev.map(f => {
                              if (f.id !== facade.id) return f;
                              return { ...f, areaTotal: parseFloat(e.target.value) || 0, length: '', width: '', formula: `${e.target.value} m2` };
                            }))}
                            placeholder="Area"
                            className="w-16 text-xs font-mono font-bold text-slate-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 outline-none focus:border-emerald-500"
                          />
                          <span className="text-slate-500 text-[10px]">m²</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-slate-500 block text-[11px] mb-1.5">{t('invoersheetV2.exteriorGeometry.linkedFrames') || 'Gekoppelde Kozijnen:'}</span>
                        <div className="flex flex-wrap gap-2">
                          {allGlobalKozijnNames.length > 0 ? allGlobalKozijnNames.map(kozName => {
                            const currentList = facade.kozijnListString ? facade.kozijnListString.split(',').map(s => s.trim()).filter(Boolean) : [];
                            const isSelected = currentList.includes(kozName);
                            return (
                              <label key={kozName} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    handleUpdateFacadesData(prev => {
                                      let existingKozijn = prev.flatMap(p => p.kozijnen).find(k => k.code === kozName || k.name === kozName);
                                      if (!existingKozijn && envelope) {
                                        const envKoz = envelope.find(e => e.code === kozName || e.name === kozName);
                                        if (envKoz) {
                                          existingKozijn = {
                                            id: envKoz.id,
                                            code: envKoz.code,
                                            name: envKoz.name,
                                            category: envKoz.type,
                                            categories: [envKoz.type],
                                            width: 0,
                                            height: 0,
                                            area: envKoz.area || 0,
                                            brandAndType: envKoz.insulationType || 'Onbekend',
                                            inputMethod: 'Onbekend',
                                            insulationPresent: 'no',
                                            uValue: envKoz.uValue || 1.4,
                                            overstekBelemmering: 'Geen',
                                            zonwering: 'Geen',
                                            photoUrl: '',
                                            photoDescription: ''
                                          };
                                        }
                                      }
                                      
                                      return prev.map(f => {
                                        if (f.id !== facade.id) return f;
                                        const currentList = f.kozijnListString ? f.kozijnListString.split(',').map(s => s.trim()).filter(Boolean) : [];
                                        let newList;
                                        let newKozijnen = [...f.kozijnen];
                                        if (e.target.checked) {
                                          newList = [...currentList, kozName];
                                          if (existingKozijn && !newKozijnen.some(k => k.code === kozName || k.name === kozName)) {
                                            newKozijnen.push({ ...existingKozijn, id: existingKozijn.id });
                                          }
                                        } else {
                                          newList = currentList.filter(name => name !== kozName);
                                          newKozijnen = newKozijnen.filter(k => k.code !== kozName && k.name !== kozName);
                                        }
                                        return { ...f, kozijnListString: newList.join(', '), kozijnen: newKozijnen };
                                      });
                                    });
                                  }}
                                  className="w-3 h-3 text-primary rounded border-slate-300 focus:ring-primary"
                                />
                                <span className="text-[10px] font-mono font-medium text-slate-700">{kozName}</span>
                                {!isSelected && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const envKoz = envelope?.find(env => env.code === kozName || env.name === kozName) 
                                        || facadesData.flatMap(f => f.kozijnen).find(k => k.code === kozName || k.name === kozName);
                                      if (envKoz) {
                                        setDeleteConfirmation({ type: 'KOZIJN', facadeId: facade.id, kozijnId: envKoz.id });
                                      }
                                    }}
                                    className="ml-1 text-slate-300 hover:text-red-500 transition-colors"
                                    title="Definitief verwijderen"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </label>
                            );
                          }) : (
                            <span className="text-[10px] text-slate-400 italic">{t('invoersheetV2.exteriorGeometry.noFramesFound') || 'Geen kozijnen gevonden.'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


                </div>

                {/* Col 2: Facade Inspection Photo */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col justify-between">
                  {(() => {
                    const facadePhotos = facade.photoUrls !== undefined 
                      ? facade.photoUrls 
                      : (facade.photoUrl ? [facade.photoUrl] : []);
                      
                    return facadePhotos.length === 0 ? (
                      <div 
                        onClick={() => {
                          handleUploadClick((urls) => {
                            handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, photoUrls: urls } : f));
                          });
                        }}
                        className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition group"
                      >
                         <Camera className="w-8 h-8 text-slate-400 mb-2 group-hover:text-primary transition" />
                         <span className="text-xs font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.exteriorGeometry.addPhoto') || 'Foto toevoegen'}</span>
                         <span className="text-[10px] text-slate-400 mt-1">{t('invoersheetV2.exteriorGeometry.clickToUpload') || 'Klik om te uploaden'}</span>
                      </div>
                    ) : (
                      <div className="w-full columns-2 gap-2 space-y-2">
                        {facadePhotos.map((url, idx) => (
                          <div key={idx} className="w-full break-inside-avoid rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer inline-block shadow-sm">
                            <div onClick={() => openImageModal(`Inspectie: ${facade.title}`, url, facadePhotos, idx)} className="w-full h-full">
                              <img
                                src={url}
                                alt={`Inspectiefoto ${facade.title} ${idx + 1}`}
                                className="w-full h-auto object-cover group-hover:scale-103 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                                  <Maximize2 className="w-3.5 h-3.5 text-primary" />
                                  <span>{t('invoersheetV2.exteriorGeometry.enlarge') || 'Vergroten'}</span>
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, photoUrls: facadePhotos.filter((_, i) => i !== idx) } : f));
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition"
                              title={t('invoersheetV2.exteriorGeometry.deletePhoto') || 'Verwijder foto'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        {facadePhotos.length < 6 && (
                          <div 
                            onClick={() => {
                              handleUploadClick((urls) => {
                                handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, photoUrls: [...facadePhotos, ...urls] } : f));
                              });
                            }}
                            className="w-full break-inside-avoid rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition group p-4 min-h-[100px] inline-flex"
                          >
                             <Plus className="w-6 h-6 text-slate-400 mb-1 group-hover:text-primary transition" />
                             <span className="text-[10px] font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.exteriorGeometry.addPhoto') || 'Foto toevoegen'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}


                </div>

                {/* Col 3: CAD Elevation Technical Drawing */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col justify-between">
                  {(() => {
                    if (!facade.cadFileUrl) {
                      return (
                        <div 
                          onClick={() => {
                            handleUploadClick((urls) => {
                              handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, cadFileUrl: urls[0] } : f));
                            });
                          }}
                          className="w-full h-full min-h-[160px] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition group"
                        >
                           <FileCheck className="w-8 h-8 text-slate-400 mb-2 group-hover:text-primary transition" />
                           <span className="text-xs font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.exteriorGeometry.addCadDrawing') || 'CAD Tekening toevoegen'}</span>
                           <span className="text-[10px] text-slate-400 mt-1">{t('invoersheetV2.exteriorGeometry.pdfOrImage') || 'PDF of Afbeelding'}</span>
                        </div>
                      );
                    }

                    const isPdf = facade.cadFileUrl.toLowerCase().endsWith('.pdf') || facade.cadFileUrl.startsWith('data:application/pdf');

                    return (
                      <div className="w-full flex-1 min-h-[250px] rounded-lg overflow-hidden border border-slate-200 bg-white relative group flex items-center justify-center">
                        {isPdf ? (
                          <iframe 
                            src={`${facade.cadFileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="absolute inset-0 w-full h-full border-0"
                            title="CAD Tekening PDF"
                          />
                        ) : (
                          <div onClick={() => openImageModal(`CAD Tekening: ${facade.title}`, facade.cadFileUrl!)} className="absolute inset-0 w-full h-full cursor-pointer">
                            <img 
                              src={facade.cadFileUrl} 
                              alt="CAD Tekening" 
                              className="w-full h-full object-contain group-hover:scale-103 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                              <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                                <Maximize2 className="w-3.5 h-3.5 text-primary" />
                                <span>Vergroten</span>
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateFacadesData(prev => prev.map(f => f.id === facade.id ? { ...f, cadFileUrl: undefined } : f));
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition z-10"
                          title={t('invoersheetV2.exteriorGeometry.deleteCadDrawing') || 'Verwijder CAD Tekening'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })()}

                </div>
              </div>

              {/* Kozijnen Section inside the card (Matching Visuals Card Matrix) */}
              {(() => {
                const selectedKozijnen = facade.kozijnen.filter(koz => 
                  facade.kozijnListString?.includes(koz.code) || facade.kozijnListString?.includes(koz.name)
                );
                
                // Add any global envelope elements that were selected but aren't in facade.kozijnen
                const envelopeKozijnen = envelope?.filter(e => 
                  (e.type.toLowerCase() === 'raam' || e.type.toLowerCase() === 'deur') &&
                  facade.kozijnListString?.includes(e.name) &&
                  !selectedKozijnen.some(k => k.name === e.name)
                ) || [];
                
                const mappedEnvelopeKozijnen: KozijnDetail[] = envelopeKozijnen.map(e => ({
                  id: e.id,
                  code: e.name,
                  name: e.name,
                  category: e.type,
                  categories: [e.type],
                  width: 0,
                  height: 0,
                  area: e.area || 0,
                  construction: e.insulationType || 'Onbekend',
                  overstekBelemmering: 'Geen',
                  zonwering: 'Geen',
                  photoUrl: '',
                  photoDescription: 'Envelope Kozijn'
                }));

                const finalKozijnen = [...selectedKozijnen, ...mappedEnvelopeKozijnen];

                return (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {t('invoersheetV2.exteriorGeometry.frameStatesDetails') || 'Kozijnstaten & Detailopnamen'} ({facade.title})
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-[11px] text-slate-500">
                        {finalKozijnen.length} {t('invoersheetV2.exteriorGeometry.framesRegistered') || 'kozijnsparingen geregistreerd'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenAddKozijnCategory(facade.id)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-primary border border-emerald-300 transition shadow-2xs"
                        title={t('invoersheetV2.exteriorGeometry.addFrameCategoryTitle') || 'Voeg kozijn of categorie toe'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('invoersheetV2.exteriorGeometry.addFrameCategory') || '+ Kozijn / Categorie'}</span>
                      </button>
                    </div>
                  </div>

                  {finalKozijnen.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {finalKozijnen.map((kozijn) => (
                      <div 
                        key={kozijn.id}
                        onMouseEnter={() => setHoveredKozijn(kozijn.code)}
                        onMouseLeave={() => setHoveredKozijn(undefined)}
                        className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs overflow-hidden flex flex-col transition"
                      >
                        {/* Kozijn Navy Header Bar */}
                        <div className="bg-primary text-white px-3.5 py-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-500">
                              {kozijn.code}
                            </span>
                            <span className="font-display font-semibold text-xs tracking-wide">
                              {kozijn.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditKozijn(facade.id, kozijn)}
                              className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-600/80 rounded transition"
                              title={t('invoersheetV2.exteriorGeometry.editFrame') || 'Bewerk Kozijn'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKozijn(facade.id, kozijn.id)}
                              className="p-1 text-emerald-300 hover:text-white hover:bg-red-500/80 rounded transition ml-1"
                              title={t('invoersheetV2.exteriorGeometry.deleteFrame') || 'Verwijder Kozijn'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Kozijn Content Grid */}
                        <div className="p-3.5 bg-slate-50/50 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          {/* Specs in clean white card */}
                          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-lg border border-slate-200 p-3.5 space-y-2.5 text-xs shadow-2xs">
                            <div className="flex flex-wrap justify-between items-center gap-y-2 gap-x-1">
                              <span className="text-slate-500 text-[11px] whitespace-nowrap w-full 2xl:w-auto">{t('invoersheetV2.exteriorGeometry.surfaceArea') || 'Oppervlakte:'}</span>
                              <div className="flex items-center space-x-1 flex-1 2xl:flex-none justify-start 2xl:justify-end">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={kozijn.width || ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleUpdateKozijnDimensions(facade.id, kozijn.id, val, kozijn.height);
                                  }}
                                  placeholder="B"
                                  className="w-20 text-xs font-mono font-semibold text-slate-900 bg-slate-50 px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-primary text-center"
                                />
                                <span className="text-slate-400 font-mono text-[11px]">×</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={kozijn.height || ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleUpdateKozijnDimensions(facade.id, kozijn.id, kozijn.width, val);
                                  }}
                                  placeholder="H"
                                  className="w-20 text-xs font-mono font-semibold text-slate-900 bg-slate-50 px-2 py-1.5 rounded border border-slate-200 outline-none focus:border-primary text-center"
                                />
                                <span className="text-slate-400 font-mono text-[11px]">=</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={kozijn.area || ''}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleUpdateKozijnArea(facade.id, kozijn.id, val);
                                  }}
                                  className="w-24 text-sm font-mono font-bold text-slate-900 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-200 outline-none focus:border-emerald-500 text-center"
                                />
                                <span className="text-slate-500 text-[11px] pl-1">m²</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                              <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.brandAndType') || 'Brand & Type:'}</span>
                              <input
                                type="text"
                                value={kozijn.brandAndType || ''}
                                onChange={(e) => handleUpdateKozijnField(facade.id, kozijn.id, 'brandAndType', e.target.value)}
                                placeholder="Bv. HR++ Kunststof"
                                className="border border-slate-200 rounded px-1.5 py-0.5 text-[10.5px] w-32 bg-white font-medium text-slate-700 focus:border-primary outline-none"
                              />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.inputMethod') || 'Invoermethode:'}</span>
                              <AppSelect 
                                value={kozijn.inputMethod || 'Decision Tree'}
                                onChange={(val) => handleUpdateKozijnField(facade.id, kozijn.id, 'inputMethod', val)}
                                className="max-w-[140px]"
                                variant="compact"
                                searchable={false}
                                options={[
                                  { value: "Decision Tree", label: "Decision Tree" },
                                  { value: "Quality Declaration", label: "Quality Declaration" }
                                ]}
                              />
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.insulationPresent') || 'Isolatie aanwezig:'}</span>
                              <AppSelect 
                                value={kozijn.insulationPresent || 'no'}
                                onChange={(val) => handleUpdateKozijnField(facade.id, kozijn.id, 'insulationPresent', val)}
                                className="max-w-[140px]"
                                variant="compact"
                                searchable={false}
                                options={[
                                  { value: "no", label: t('invoersheetV2.exteriorGeometry.no') || "Nee" },
                                  { value: "yes", label: t('invoersheetV2.exteriorGeometry.yes') || "Ja" }
                                ]}
                              />
                            </div>

                            {kozijn.insulationPresent === 'yes' && (
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.thicknessMm') || 'Dikte (mm):'}</span>
                                <input
                                  type="number"
                                  value={kozijn.insulationThickness || ''}
                                  onChange={(e) => handleUpdateKozijnField(facade.id, kozijn.id, 'insulationThickness', parseFloat(e.target.value))}
                                  className="border border-slate-200 rounded px-1.5 py-0.5 text-[10.5px] w-16 bg-white font-medium text-slate-700 focus:border-primary outline-none text-right"
                                />
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.uValue') || 'U-waarde:'}</span>
                              <input
                                type="number"
                                step="0.1"
                                value={kozijn.uValue || ''}
                                onChange={(e) => handleUpdateKozijnField(facade.id, kozijn.id, 'uValue', parseFloat(e.target.value))}
                                className="border border-slate-200 rounded px-1.5 py-0.5 text-[10.5px] w-16 bg-white font-medium text-slate-700 focus:border-primary outline-none text-right"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.gValue') || 'g [-] (g-waarde):'}</span>
                              <input
                                type="number"
                                step="0.01"
                                value={kozijn.gValue || ''}
                                onChange={(e) => handleUpdateKozijnField(facade.id, kozijn.id, 'gValue', parseFloat(e.target.value))}
                                className="border border-slate-200 rounded px-1.5 py-0.5 text-[10.5px] w-16 bg-white font-medium text-slate-700 focus:border-primary outline-none text-right"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.overhangObstruction') || 'Overstek & Belemmering:'}</span>
                              <AppSelect
                                value={kozijn.overstekBelemmering}
                                onChange={(val) => handleUpdateKozijnField(facade.id, kozijn.id, 'overstekBelemmering', val)}
                                className="max-w-[140px]"
                                variant="compact"
                                searchable={false}
                                options={[
                                  { value: "Automatic", label: t('invoersheetV2.exteriorGeometry.obstruction.automatic') || "Automatic" },
                                  { value: "Minimal obstruction", label: t('invoersheetV2.exteriorGeometry.obstruction.minimal') || "Minimal obstruction" },
                                  { value: "Overhang", label: t('invoersheetV2.exteriorGeometry.obstruction.overhang') || "Overhang" },
                                  { value: "Other obstacle", label: t('invoersheetV2.exteriorGeometry.obstruction.other') || "Other obstacle" },
                                  { value: "Complete obstruction", label: t('invoersheetV2.exteriorGeometry.obstruction.complete') || "Complete obstruction" },
                                  { value: "Constant hindrance", label: t('invoersheetV2.exteriorGeometry.obstruction.constant') || "Constant hindrance" },
                                  { value: "Side obstruction", label: t('invoersheetV2.exteriorGeometry.obstruction.side') || "Side obstruction" },
                                  { value: "Overhang + (side) obstruction", label: t('invoersheetV2.exteriorGeometry.obstruction.overhangSide') || "Overhang + (side) obstruction" }
                                ]}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[11px]">{t('invoersheetV2.exteriorGeometry.sunShading') || 'Zonwering:'}</span>
                              <AppSelect
                                value={kozijn.zonwering}
                                onChange={(val) => handleUpdateKozijnField(facade.id, kozijn.id, 'zonwering', val)}
                                className="max-w-[140px]"
                                variant="compact"
                                searchable={false}
                                options={[
                                  { value: "Geen zonwering", label: t('invoersheetV2.exteriorGeometry.sunshading.none') || "Geen zonwering" },
                                  { value: "Vaste zonwering", label: t('invoersheetV2.exteriorGeometry.sunshading.fixed') || "Vaste zonwering" },
                                  { value: "Buitenscherm", label: t('invoersheetV2.exteriorGeometry.sunshading.exterior') || "Buitenscherm" },
                                  { value: "Knikarmscherm", label: t('invoersheetV2.exteriorGeometry.sunshading.foldingArm') || "Knikarmscherm" },
                                  { value: "Schermen (buiten)", label: t('invoersheetV2.exteriorGeometry.sunshading.screens') || "Schermen (buiten)" },
                                  { value: "Jaloezieën (buiten)", label: t('invoersheetV2.exteriorGeometry.sunshading.blinds') || "Jaloezieën (buiten)" },
                                  { value: "Gemetalliseerde oppervlakken (binnen)", label: t('invoersheetV2.exteriorGeometry.sunshading.metalized') || "Gemetalliseerde oppervlakken (binnen)" },
                                  { value: "Rolluiken (buiten)", label: t('invoersheetV2.exteriorGeometry.sunshading.shutters') || "Rolluiken (buiten)" },
                                  { value: "Automatisch", label: t('invoersheetV2.exteriorGeometry.sunshading.automatic') || "Automatisch" }
                                ]}
                              />
                            </div>
                          </div>

                          {/* Photo Frame Masonry */}
                          <div className="lg:col-span-5 xl:col-span-4 w-full columns-2 gap-2 space-y-2">
                            {(() => {
                              const kozijnPhotos = kozijn.photoUrls !== undefined 
                                ? kozijn.photoUrls 
                                : (kozijn.photoUrl ? [kozijn.photoUrl] : []);
                                
                              return (
                                <>
                                  {kozijnPhotos.map((url, idx) => (
                                    <div key={idx} className="w-full break-inside-avoid rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer shadow-2xs inline-block">
                                      <div onClick={() => openImageModal(`${kozijn.code} - ${kozijn.name}`, url, kozijnPhotos, idx)} className="w-full h-full">
                                        <img
                                          src={url}
                                          alt={`Kozijn ${kozijn.code} ${idx + 1}`}
                                          className="w-full h-auto object-cover group-hover:scale-105 transition duration-300"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                          <span className="bg-white/95 text-slate-900 text-[10px] font-semibold px-2 py-1 rounded shadow-xs flex items-center space-x-1">
                                            <Maximize2 className="w-3 h-3 text-primary" />
                                            <span>{t('invoersheetV2.exteriorGeometry.enlarge') || 'Vergroten'}</span>
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateKozijnField(facade.id, kozijn.id, 'photoUrls', kozijnPhotos.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-1.5 right-1.5 p-1 bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 rounded shadow-xs opacity-0 group-hover:opacity-100 transition"
                                        title={t('invoersheetV2.exteriorGeometry.deletePhoto') || 'Verwijder foto'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/80 text-white rounded text-[9px] font-mono pointer-events-none">
                                        {kozijn.code}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {kozijnPhotos.length < 6 && (
                                    <div 
                                      onClick={() => {
                                        handleUploadClick((urls) => {
                                          handleUpdateKozijnField(facade.id, kozijn.id, 'photoUrls', [...kozijnPhotos, ...urls]);
                                        });
                                      }}
                                      className={`w-full break-inside-avoid rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-primary transition group shadow-2xs inline-flex ${kozijnPhotos.length === 0 ? 'aspect-[4/3]' : 'p-3 min-h-[80px]'}`}
                                    >
                                       {kozijnPhotos.length === 0 ? (
                                         <Camera className="w-6 h-6 text-slate-300 mb-1 group-hover:text-primary transition" />
                                       ) : (
                                         <Plus className="w-5 h-5 text-slate-300 mb-1 group-hover:text-primary transition" />
                                       )}
                                       <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary transition">{t('invoersheetV2.exteriorGeometry.add') || 'Toevoegen'}</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>


                      </div>
                    ))}
                  </div>
                  ) : (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2 mt-2">
                      <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{t('invoersheetV2.exteriorGeometry.noFramesMessage') || 'Geen kozijnen of gevelopeningen aanwezig in deze scheidingsconstructie (blinde bouwmuur) of geen kozijnen geselecteerd.'}</span>
                    </div>
                  )}
                </div>
              );
              })()}
            </div>

            {/* Facade Card Footer matching Visuals */}
            <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-slate-500">MassEPA Audit • {projectNumber || 'Project Onbekend'}</span>
                {projectAddress && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium">{projectAddress}</span>
                  </>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Add Kozijn & Category Modal */}
      {isAddKozijnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Plus className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-display font-semibold text-base tracking-wide">
                    {editingKozijnId ? (t('invoersheetV2.exteriorGeometry.editFrameTitle') || 'Kozijn Bewerken') : (t('invoersheetV2.exteriorGeometry.addFrameTitle') || 'Kozijn & Categorie Toevoegen')}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {facadesData.find((f) => f.id === targetFacadeIdForAdd)?.title || 'Gevel'} • NTA 8800 Spil-invoer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddKozijnModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Gevel Target selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('invoersheetV2.exteriorGeometry.targetFacade') || 'Doelgevel:'}
                </label>
                <AppSelect
                  value={targetFacadeIdForAdd}
                  onChange={(val) => setTargetFacadeIdForAdd(val)}
                  options={facadesData.map((f) => ({ value: f.id, label: `${f.title} (${f.code} • ${f.orientation})` }))}
                  variant="muted"
                  searchable={false}
                />
              </div>

              {/* Code & Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('invoersheetV2.exteriorGeometry.frameCode') || 'Kozijncode:'}
                  </label>
                  <input
                    type="text"
                    value={newKozCode}
                    onChange={(e) => setNewKozCode(e.target.value)}
                    placeholder="bijv. W5 of D2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono font-bold focus:ring-1 focus:ring-[#006a63]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('invoersheetV2.exteriorGeometry.description') || 'Benaming / Omschrijving:'}
                  </label>
                  <input
                    type="text"
                    value={newKozName}
                    onChange={(e) => setNewKozName(e.target.value)}
                    placeholder="bijv. Raamkozijn slaapkamer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-[#006a63]"
                  />
                </div>
              </div>

              {/* Dimensions with live formula */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-semibold text-slate-800">
                  {t('invoersheetV2.exteriorGeometry.dimensionsArea') || 'Afmetingen & Berekende Oppervlakte (Breedte × Hoogte):'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Breedte (m):</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={newKozWidth}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setNewKozWidth(val);
                        if (val !== '' && newKozHeight !== '') {
                          setNewKozArea(Math.round(val * Number(newKozHeight) * 100) / 100);
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">{t('invoersheetV2.exteriorGeometry.heightM') || 'Hoogte (m):'}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={newKozHeight}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                        setNewKozHeight(val);
                        if (val !== '' && newKozWidth !== '') {
                          setNewKozArea(Math.round(Number(newKozWidth) * val * 100) / 100);
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 block mb-1">{t('invoersheetV2.exteriorGeometry.totalArea') || 'Totale Oppervlakte:'}</span>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newKozArea}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                          setNewKozArea(val);
                          setNewKozWidth('');
                          setNewKozHeight('');
                        }}
                        className="w-full pl-3 pr-8 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg font-mono font-bold text-primary text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-600">m²</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-mono text-right mt-1">
                  {t('invoersheetV2.exteriorGeometry.formula') || 'Formule:'} {newKozWidth !== '' || newKozHeight !== '' ? `${(Number(newKozWidth) || 0).toFixed(2)} m × ${(Number(newKozHeight) || 0).toFixed(2)} m = ${((Number(newKozWidth) || 0) * (Number(newKozHeight) || 0)).toFixed(2)} m²` : `${t('invoersheetV2.exteriorGeometry.manualInput') || 'Handmatige invoer:'} ${Number(newKozArea) || 0} m²`}
                </p>
              </div>

              {/* Construction & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('invoersheetV2.exteriorGeometry.brandAndType') || 'Brand & Type:'}
                  </label>
                  <input
                    type="text"
                    value={newKozConstruction}
                    onChange={(e) => setNewKozConstruction(e.target.value)}
                    placeholder="Bv. HR++ Kunststof"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('invoersheetV2.exteriorGeometry.inputMethod') || 'Invoermethode:'}
                  </label>
                  <AppSelect
                    value={newKozInputMethod}
                    onChange={(val) => setNewKozInputMethod(val)}
                    options={[
                      { value: "", label: "Selecteer..." },
                      { value: "Decision Tree", label: "Decision Tree" },
                      { value: "Quality Declaration", label: "Quality Declaration" }
                    ]}
                    variant="white"
                    searchable={false}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('invoersheetV2.exteriorGeometry.insulationPresent') || 'Isolatie:'}
                    </label>
                    <AppSelect
                      value={newKozInsulationPresent}
                      onChange={(val) => setNewKozInsulationPresent(val)}
                      options={[
                        { value: "", label: t('invoersheetV2.exteriorGeometry.selectType') || "Selecteer..." },
                        { value: "no", label: t('invoersheetV2.exteriorGeometry.no') || "Nee" },
                        { value: "yes", label: t('invoersheetV2.exteriorGeometry.yes') || "Ja" }
                      ]}
                      variant="white"
                      searchable={false}
                    />
                  </div>
                  {newKozInsulationPresent === 'yes' && (
                    <div className="flex-1">
                      <label className="block font-semibold text-slate-700 mb-1">
                        {t('invoersheetV2.exteriorGeometry.thicknessMm') || 'Dikte (mm):'}
                      </label>
                      <input
                        type="number"
                        value={newKozInsulationThickness}
                        onChange={(e) => setNewKozInsulationThickness(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('invoersheetV2.exteriorGeometry.uValue') || 'U-waarde:'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newKozUValue}
                    onChange={(e) => setNewKozUValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('invoersheetV2.exteriorGeometry.overhangObstruction') || 'Overstek & Belemmering:'}
                  </label>
                  <AppSelect
                    value={newKozOverstek}
                    onChange={(val) => setNewKozOverstek(val)}
                    options={[
                      { value: "", label: "Selecteer..." },
                      { value: "Automatic", label: "Automatic" },
                      { value: "Minimal obstruction", label: "Minimal obstruction" },
                      { value: "Overhang", label: "Overhang" },
                      { value: "Other obstacle", label: "Other obstacle" },
                      { value: "Complete obstruction", label: "Complete obstruction" },
                      { value: "Constant hindrance", label: "Constant hindrance" },
                      { value: "Side obstruction", label: "Side obstruction" },
                      { value: "Overhang + (side) obstruction", label: "Overhang + (side) obstruction" }
                    ]}
                    variant="white"
                    searchable={false}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Zonwering:
                  </label>
                  <AppSelect
                    value={newKozZonwering}
                    onChange={(val) => setNewKozZonwering(val)}
                    options={[
                      { value: "", label: "Selecteer..." },
                      { value: "Geen zonwering", label: "Geen zonwering" },
                      { value: "Vaste zonwering", label: "Vaste zonwering" },
                      { value: "Buitenscherm", label: "Buitenscherm" },
                      { value: "Knikarmscherm", label: "Knikarmscherm" },
                      { value: "Schermen (buiten)", label: "Schermen (buiten)" },
                      { value: "Jaloezieën (buiten)", label: "Jaloezieën (buiten)" },
                      { value: "Gemetalliseerde oppervlakken (binnen)", label: "Gemetalliseerde oppervlakken (binnen)" },
                      { value: "Rolluiken (buiten)", label: "Rolluiken (buiten)" },
                      { value: "Automatisch", label: "Automatisch" }
                    ]}
                    variant="white"
                    searchable={false}
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="mt-4 border-t border-slate-200 pt-4">
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('invoersheetV2.exteriorGeometry.framePhotoOptional') || 'Kozijn Foto (Optioneel):'}
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64Url = await fileToPersistedUrl(file);
                          setNewKozPhotoUrl(base64Url);
                        }
                      }}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100 transition cursor-pointer
                      "
                    />
                  </div>
                  {newKozPhotoUrl && (
                    <div className="w-12 h-12 rounded overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <img src={newKozPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsAddKozijnModalOpen(false);
                  setEditingKozijnId(null);
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
              >
                {t('invoersheetV2.exteriorGeometry.cancel') || 'Annuleren'}
              </button>
              <button
                type="button"
                onClick={handleSaveNewKozijnWithCategory}
                className="px-4 py-2 bg-primary hover:bg-[#00524c] text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{editingKozijnId ? (t('invoersheetV2.exteriorGeometry.saveFrame') || 'Kozijn Opslaan') : (t('invoersheetV2.exteriorGeometry.saveFrameCategory') || 'Kozijn & Categorie Opslaan')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {activeModalImage && activeModalImage.type === 'photo' && (
        <MediaViewerModal
          files={(activeModalImage.urls || (activeModalImage.url ? [activeModalImage.url] : [])).map(url => ({
            url,
            isPdf: url.toLowerCase().endsWith('.pdf') || url.startsWith('data:application/pdf')
          }))}
          initialIndex={activeModalImage.currentIndex || 0}
          onClose={() => setActiveModalImage(null)}
          titlePrefix={activeModalImage.title}
          footerText={t('invoersheetV2.exteriorGeometry.visualizationFooter') || 'MassEPA • NTA 8800 Geometrie Audit Visualisatie'}
        />
      )}

      {/* CAD SVG Viewer Modal */}
      {activeModalImage && activeModalImage.type === 'cad' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Layers className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-base tracking-wide">
                  {activeModalImage.title}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setModalZoom((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                  title={t('invoersheetV2.exteriorGeometry.zoomIn') || 'Inzoomen'}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setModalZoom((z) => Math.max(0.75, z - 0.25))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                  title={t('invoersheetV2.exteriorGeometry.zoomOut') || 'Uitzoomen'}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveModalImage(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden bg-slate-900 relative flex items-center justify-center group/modal">
              <div className="flex-1 h-full p-6 overflow-auto flex items-center justify-center w-full">
                <div 
                  className="transition-transform duration-150 origin-center max-w-full"
                  style={{ transform: `scale(${modalZoom})` }}
                >
                  {activeModalImage.cadType && (
                    <div className="w-[680px] aspect-[4/3] bg-white rounded-lg p-4 shadow-2xl">
                      <CadElevationSvg 
                        type={activeModalImage.cadType} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono">{t('invoersheetV2.exteriorGeometry.visualizationFooter') || 'MassEPA • NTA 8800 Geometrie Audit Visualisatie'}</span>
              <span className="font-mono text-slate-500">Zoom: {Math.round(modalZoom * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {deleteConfirmation.type === 'FACADE' 
                  ? (t('invoersheetV2.exteriorGeometry.deleteFacadeTitle') || 'Gevel Verwijderen')
                  : (t('invoersheetV2.exteriorGeometry.deleteFrameEverywhereTitle') || 'Kozijn Verwijderen overal')}
              </h3>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                {deleteConfirmation.type === 'FACADE'
                  ? (t('invoersheetV2.exteriorGeometry.deleteFacadeConfirm') || 'Weet je zeker dat je deze gevel definitief wilt verwijderen?')
                  : (t('invoersheetV2.exteriorGeometry.deleteFrameEverywhereConfirm') || 'Weet je zeker dat je dit kozijn uit ALLE gevels wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')}
              </p>
              {deleteConfirmation.type === 'KOZIJN' && (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {t('invoersheetV2.exteriorGeometry.deleteFrameTip') || 'Tip: Om het alleen uit deze gevel te verwijderen, vink je het simpelweg uit bij \'Gekoppelde Kozijnen\' bovenin.'}
                </p>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
              >
                {t('invoersheetV2.exteriorGeometry.cancel') || 'Annuleren'}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('invoersheetV2.exteriorGeometry.deleteAction') || 'Verwijderen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

