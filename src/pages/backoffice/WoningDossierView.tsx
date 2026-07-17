import React, { useState, useEffect } from 'react';
import { InspectionData } from './backofficeTypes';
import { 
  FileText, Image, PenTool, Database, FileDigit, HardDrive, 
  Upload, Trash2, X, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AppSelectWithOptions } from '../../components/common/AppSelect';

const ModalSelect: React.FC<any> = ({ className, ...props }) => {
  return (
    <AppSelectWithOptions
      {...props}
      placeholder={undefined}
      className={`w-full text-xs font-semibold cursor-pointer ${className || ''}`}
    />
  );
};

interface WoningDossierViewProps {
  data: InspectionData;
  onChange: (path: string, value: string) => void;
  onConstructieChange?: (constructies: any[]) => void;
}

const documentCategories = [
  { id: 'tekeningen', label: '1) Tekeningen', icon: PenTool, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'installatie', label: '2) Installatie', icon: HardDrive, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'constructie', label: '3) Constructie', icon: Database, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'invoersheet', label: '4) Invoersheet', icon: FileDigit, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'fotos', label: "5) Foto's", icon: Image, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'opnameformulier', label: '6) Opnameformulier', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'energielabel', label: '7) Energielabel', icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'vabi-files', label: '8) Vabi files', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

const classifyFile = (fileName: string): string | null => {
  const name = fileName.toLowerCase();
  
  // 1) Tekeningen
  if (name.includes('epa') && (name.includes('gevel') || name.includes('facade') || name.includes('teken') || name.includes('draw'))) return 'epa';
  if (name.includes('thermisch') || name.includes('thermal') || name.includes('isolatie') || name.includes('schil')) return 'thermisch';
  if (name.includes('epa')) return 'epa';
  if (name.includes('tekening') || name.includes('drawing') || name.includes('plattegrond') || name.includes('floorplan')) return 'epa';
  
  // 2) Installatie
  if (name.includes('verwarming') || name.includes('heating') || name.includes('ketel') || name.includes('boiler') || name.includes('warmtepomp')) return 'verwarming';
  if (name.includes('koeling') || name.includes('cooling') || name.includes('airco') || name.includes('ac')) return 'koeling';
  if (name.includes('ventilatie') || name.includes('ventilation') || name.includes('wtw') || name.includes('mv') || name.includes('lucht')) return 'ventilatie';
  if (name.includes('zonne') || name.includes('pv') || name.includes('solar') || name.includes('zonnepaneel')) return 'zonne';
  
  // 3) Constructie
  if (name.includes('deur') || name.includes('door')) return 'deur';
  if (name.includes('glas') || name.includes('glass') || name.includes('paneel') || name.includes('spandrel') || name.includes('kozijn') || name.includes('frame')) return 'glas-paneel';
  if (name.includes('gevel') || name.includes('facade')) return 'gevel';
  if (name.includes('vloer') || name.includes('floor') || name.includes('kruipruimte')) return 'vloer';
  if (name.includes('dak') || name.includes('roof')) return 'dak';

  return null;
};

const WoningDossierView: React.FC<WoningDossierViewProps> = ({ data, onChange, onConstructieChange }) => {
  const { t } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof documentCategories[0] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string>('');

  const currentAddress = data.algemeen?.woning?.adres || 'default';

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: string }>>(() => {
    try {
      const stored = localStorage.getItem(`woningdossier_files_${currentAddress}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [photoFlags, setPhotoFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    try {
      const saved = localStorage.getItem(`fotos_flags_${data?.clientId || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`woningdossier_files_${currentAddress}`);
      setUploadedFiles(stored ? JSON.parse(stored) : {});
    } catch {
      setUploadedFiles({});
    }
  }, [currentAddress]);

  useEffect(() => {
    try {
      localStorage.setItem(`woningdossier_files_${currentAddress}`, JSON.stringify(uploadedFiles));
    } catch (e) {
      console.error(e);
    }
  }, [uploadedFiles, currentAddress]);

  useEffect(() => {
    try {
      localStorage.setItem(`fotos_flags_${data?.clientId || 'default'}`, JSON.stringify(photoFlags));
    } catch (e) {
      console.error(e);
    }
  }, [photoFlags, data?.clientId]);

  const togglePhotoFlag = (fieldKey: string, status: 'red' | 'yellow' | 'green') => {
    setPhotoFlags(prev => {
      const current = prev[fieldKey];
      return {
        ...prev,
        [fieldKey]: current === status ? null : status
      };
    });
  };

  const handleFileUpload = (itemId: string, file: File) => {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    setUploadedFiles(prev => ({
      ...prev,
      [itemId]: { name: file.name, size: sizeInMB }
    }));
  };

  const handleFileDelete = (itemId: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[itemId];
      return newFiles;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    processBatchFiles(files);
  };

  const processBatchFiles = (files: FileList) => {
    const newFiles = { ...uploadedFiles };
    let sortedCount = 0;
    let fallbackCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const slotId = classifyFile(file.name);
      
      if (slotId) {
        newFiles[slotId] = { name: file.name, size: sizeInMB };
        sortedCount++;
      } else {
        newFiles['epa'] = { name: file.name, size: sizeInMB };
        fallbackCount++;
      }
    }
    
    setUploadedFiles(newFiles);
    
    if (fallbackCount > 0) {
      alert(t('woningdossier.batchUploadSuccessMixed', {
        sorted: sortedCount,
        fallback: fallbackCount
      }));
    } else {
      alert(t('woningdossier.batchUploadSuccessAll', {
        count: sortedCount
      }));
    }
  };

  const eligibleConstructies = (data.constructies || []).filter(r => 
    ['Deur', 'Raam', 'Paneel', 'Gevel', 'Vloer', 'Dak'].includes(r.type)
  );

  const getCategoryFileCount = (catId: string) => {
    if (catId === 'fotos') {
      return eligibleConstructies.filter(r => r.photoUrl).length;
    }
    
    const categoryItemIds: Record<string, string[]> = {
      tekeningen: ['epa', 'thermisch'],
      installatie: ['verwarming', 'koeling', 'ventilatie', 'zonne'],
      constructie: ['deur', 'glas-paneel', 'gevel', 'vloer', 'dak'],
    };
    
    const ids = categoryItemIds[catId] || [];
    return ids.filter(id => !!uploadedFiles[id]).length;
  };

  const handleManageCategory = (category: typeof documentCategories[0]) => {
    setSelectedCategory(category);
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-on-background tracking-tight">{t('woningdossier.title')}</h1>
          <p className="text-xs text-on-surface-variant/60 mt-1">{t('woningdossier.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden w-full">
        <div className="divide-y divide-outline-variant/5">
          {documentCategories.map((doc) => (
            <div 
              key={doc.id} 
              className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer group"
              onClick={() => handleManageCategory(doc)}
            >
              <div className="flex items-center gap-4">
                <div className={`${doc.bg} ${doc.color} p-2.5 rounded-xl`}>
                  <doc.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-on-background tracking-tight">{t(`woningdossier.categories.${doc.id}`)}</h3>
                  {doc.id === 'fotos' ? (
                    eligibleConstructies.filter(r => r.photoUrl).length > 0 ? (
                      <p className="text-[11px] text-green-700 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={12} /> {t('woningdossier.photoUploadedTagged', { count: eligibleConstructies.filter(r => r.photoUrl).length })}
                      </p>
                    ) : (
                      <p className="text-[11px] text-on-surface-variant/40 mt-0.5 font-bold">{t('woningdossier.noPhotosUploaded')}</p>
                    )
                  ) : (
                    getCategoryFileCount(doc.id) > 0 ? (
                      <p className="text-[11px] text-green-700 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={12} /> {t(getCategoryFileCount(doc.id) === 1 ? 'woningdossier.fileUploaded' : 'woningdossier.filesUploaded', { count: getCategoryFileCount(doc.id) })}
                      </p>
                    ) : (
                      <p className="text-[11px] text-on-surface-variant/40 mt-0.5 font-bold">{t('woningdossier.noFilesUploaded')}</p>
                    )
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleManageCategory(doc);
                }}
                className="px-4 py-2 bg-white border border-outline-variant/15 text-[10px] font-black text-on-surface-variant/80 hover:bg-gray-50 hover:border-primary/50 hover:text-primary transition-all rounded-xl shadow-xs uppercase tracking-wider cursor-pointer"
              >
                {t('woningdossier.manage')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 border ${
          isDragging 
            ? 'bg-primary/5 border-primary border-dashed scale-[1.01] shadow-md' 
            : 'bg-primary/5 border-primary/10'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="bg-white p-2.5 rounded-xl text-primary shadow-sm shrink-0 border border-primary/10">
            <FileText size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-on-background">{t('woningdossier.batchUpload')}</h4>
            <p className="text-xs text-on-surface-variant/60 mt-1 leading-relaxed">
              {t('woningdossier.batchUploadDesc')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 w-full md:w-auto">
          <label className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-outline-variant/15 text-xs font-black text-on-surface-variant/80 hover:bg-gray-50 hover:border-primary/50 hover:text-primary transition-all rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider">
            <input 
              type="file" 
              className="hidden" 
              multiple 
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  processBatchFiles(files);
                }
                e.target.value = '';
              }}
            />
            <Upload size={14} />
            {t('woningdossier.files')}
          </label>
          <button 
            type="button"
            onClick={() => handleManageCategory(documentCategories.find(c => c.id === 'fotos')!)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-black transition-all rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-[0.98]"
          >
            <Image size={14} />
            {t('woningdossier.uploadPhotos')}
          </button>
        </div>
      </div>

      {/* Side Drawer Modal Overlay */}
      {isDrawerOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />
          <div 
            className="relative w-full md:w-[500px] h-full bg-white shadow-2xl border-l border-outline-variant/10 flex flex-col z-10 animate-in slide-in-from-right duration-350"
          >
            <div className="p-5 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`${selectedCategory.bg} ${selectedCategory.color} p-2 rounded-xl`}>
                  <selectedCategory.icon size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-on-background tracking-tight">{t(`woningdossier.categories.${selectedCategory.id}`)}</h2>
                  <p className="text-[10px] text-on-surface-variant/40 font-bold mt-0.5">{t('woningdossier.manageDocs')}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-gray-250 rounded-full transition-colors text-on-surface-variant/50 hover:text-on-background cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 space-y-4">
              {selectedCategory.id === 'fotos' ? (
                <div className="space-y-6">
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="text-primary shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className="text-xs font-black text-primary uppercase tracking-wider">{t('woningdossier.constructionPhotos')}</h4>
                      <p className="text-[11px] text-on-surface-variant/70 mt-1 leading-relaxed">
                        {t('woningdossier.constructionPhotosDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-outline-variant/10 p-4 rounded-2xl shadow-xs">
                    <h3 className="text-xs font-black text-on-background uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <Upload size={13} className="text-primary" /> {t('woningdossier.uploadAndTag')}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-on-surface-variant/50 mb-1">
                          {t('woningdossier.selectDestination')}
                        </label>
                        <ModalSelect
                          className="input-field cursor-pointer"
                          value={selectedElementId}
                          onChange={(e: any) => setSelectedElementId(e.target.value)}
                        >
                          <option value="">{t('woningdossier.chooseElement')}</option>
                          {eligibleConstructies.map((c) => (
                            <option key={c.id} value={c.id}>
                              [{c.type}] {c.naam}
                            </option>
                          ))}
                        </ModalSelect>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-on-surface-variant/50 mb-1">
                          {t('woningdossier.uploadPhotoFile')}
                        </label>
                        <input 
                          type="file"
                          id="drawer-bulk-img-uploader"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const targetId = selectedElementId;
                            if (!targetId) {
                              alert(t('woningdossier.selectElementFirstAlert'));
                              e.target.value = '';
                              return;
                            }
                            const file = e.target.files?.[0];
                            if (file && onConstructieChange) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                const dataUrl = re.target?.result as string;
                                const updated = (data.constructies || []).map(r => {
                                  if (r.id === targetId) {
                                    return {
                                      ...r,
                                      photoUrl: dataUrl,
                                      photoTag: `[${r.type}] ${r.naam}`
                                    };
                                  }
                                  return r;
                                });
                                onConstructieChange(updated);
                                setSelectedElementId('');
                                e.target.value = '';
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                         <button 
                           type="button"
                           onClick={() => {
                             const targetId = selectedElementId;
                             if (!targetId) {
                               alert(t('woningdossier.selectElementFirstAlert'));
                               return;
                             }
                             document.getElementById('drawer-bulk-img-uploader')?.click();
                           }}
                           className="w-full py-3 bg-gray-50 hover:bg-primary/5 hover:border-primary/50 text-on-surface-variant/70 hover:text-primary font-bold border border-outline-variant/20 border-dashed rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                         >
                           <Image size={15} /> {t('woningdossier.selectAndUpload')}
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-on-surface-variant/75 uppercase tracking-wider">
                      {t('woningdossier.photosPerElement', { count: eligibleConstructies.length })}
                    </h3>
                    <div className="space-y-3">
                      {eligibleConstructies.map((item) => (
                        <div key={item.id} className="bg-white border border-outline-variant/10 rounded-2xl p-4 hover:shadow-xs transition-all flex items-start gap-4">
                          <div className="w-20 h-20 bg-gray-50 border border-outline-variant/10 flex-shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center group/img">
                            {item.photoUrl ? (
                              <>
                                <img src={item.photoUrl} alt={item.naam} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-100 lg:opacity-0 lg:group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (onConstructieChange) {
                                        onConstructieChange((data.constructies || []).map(r => r.id === item.id ? { ...r, photoUrl: undefined, photoTag: undefined } : r));
                                      }
                                    }}
                                    className="p-1.5 bg-white hover:bg-red-50 text-red-500 rounded-full shadow-md cursor-pointer"
                                    title={t('woningdossier.removePhoto')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="text-center p-2 text-on-surface-variant/40">
                                <Image size={24} className="mx-auto mb-1 opacity-50" />
                                <span className="text-[9px] block font-bold">{t('structural.noPhoto')}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                                  item.type === 'Deur' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                  item.type === 'Raam' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                  item.type === 'Paneel' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                  item.type === 'Gevel' ? 'bg-green-50 border-green-200 text-green-700' :
                                  item.type === 'Vloer' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' :
                                  'bg-pink-50 border-pink-200 text-pink-700'
                                }`}>
                                  {item.type}
                                </span>
                                {item.photoUrl && (
                                  <span className="bg-green-50 text-green-700 text-[8px] font-black border border-green-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                    {t('woningdossier.tagged')}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-black text-on-background mt-1 leading-tight">{item.naam}</h4>
                              {item.photoTag && (
                                <div className="mt-1.5 bg-gray-50 border border-outline-variant/10 px-2 py-0.5 text-[9px] text-on-surface-variant/70 font-semibold italic rounded-md w-fit">
                                  Tag: {item.photoTag}
                                </div>
                              )}
                            </div>

                            <div className="mt-2 text-left">
                              <input 
                                type="file" 
                                id={`file-indirect-${item.id}`} 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && onConstructieChange) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                      const dataUrl = re.target?.result as string;
                                      const updated = (data.constructies || []).map(r => {
                                        if (r.id === item.id) {
                                          return {
                                            ...r,
                                            photoUrl: dataUrl,
                                            photoTag: `[${r.type}] ${r.naam}`
                                          };
                                        }
                                        return r;
                                      });
                                      onConstructieChange(updated);
                                      e.target.value = '';
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <div className="flex items-center justify-between w-full">
                                <button 
                                  type="button"
                                  onClick={() => document.getElementById(`file-indirect-${item.id}`)?.click()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-[9px] font-black rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                  <Upload size={10} /> {item.photoUrl ? t('woningdossier.changePhoto') : t('woningdossier.linkPhoto')}
                                </button>
                                
                                {item.photoUrl && (
                                  <div className="flex items-center gap-0.5 w-16 h-2.5 rounded-full overflow-hidden bg-gray-150 border border-outline-variant/10 shadow-xs">
                                    <button
                                      type="button"
                                      onClick={() => togglePhotoFlag(item.id, 'red')}
                                      className={`flex-1 h-full cursor-pointer transition-all duration-150 ${photoFlags[item.id] === 'red' ? 'bg-red-600' : 'bg-red-200/30 hover:bg-red-200/60'}`}
                                      title="Rood - Foto kan onjuist zijn / Hoge prioriteit"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => togglePhotoFlag(item.id, 'yellow')}
                                      className={`flex-1 h-full cursor-pointer transition-all duration-150 ${photoFlags[item.id] === 'yellow' ? 'bg-amber-50' : 'bg-amber-200/30 hover:bg-amber-250/60'}`}
                                      title="Geel - Twijfel over deze foto"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => togglePhotoFlag(item.id, 'green')}
                                      className={`flex-1 h-full cursor-pointer transition-all duration-150 ${photoFlags[item.id] === 'green' ? 'bg-green-600' : 'bg-green-200/30 hover:bg-green-250/60'}`}
                                      title="Groen - Foto is akkoord"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : ['tekeningen', 'installatie', 'constructie'].includes(selectedCategory.id) ? (
                <div className="space-y-4">
                  {(selectedCategory.id === 'tekeningen' ? [
                    { id: 'epa', title: t('woningdossier.epaGevels'), description: t('woningdossier.epaGevelsDesc') },
                    { id: 'thermisch', title: t('woningdossier.thermischDoc'), description: t('woningdossier.thermischDocDesc') }
                  ] : selectedCategory.id === 'installatie' ? [
                    { id: 'verwarming', title: t('woningdossier.verwarmingTapwater'), description: t('woningdossier.verwarmingTapwaterDesc') },
                    { id: 'koeling', title: t('woningdossier.koeling'), description: t('woningdossier.koelingDesc') },
                    { id: 'ventilatie', title: t('woningdossier.ventilatie'), description: t('woningdossier.ventilatieDesc') },
                    { id: 'zonne', title: t('woningdossier.zonnePanelen'), description: t('woningdossier.zonnePanelenDesc') }
                  ] : [
                    { id: 'deur', title: t('woningdossier.deur'), description: t('woningdossier.deurDesc') },
                    { id: 'glas-paneel', title: t('woningdossier.glasPaneel'), description: t('woningdossier.glasPaneelDesc') },
                    { id: 'gevel', title: t('woningdossier.gevel'), description: t('woningdossier.gevelDesc') },
                    { id: 'vloer', title: t('woningdossier.vloer'), description: t('woningdossier.vloerDesc') },
                    { id: 'dak', title: t('woningdossier.dak'), description: t('woningdossier.dakDesc') }
                  ]).map((item) => {
                    const isFileUploaded = !!uploadedFiles[item.id];
                    const fileInfo = uploadedFiles[item.id];
                    return (
                      <div key={item.id} className="bg-white border border-outline-variant/10 rounded-2xl p-4 shadow-xs hover:border-primary/30 transition-all group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="mt-1 bg-gray-50 border border-outline-variant/10 p-2 rounded-xl text-on-surface-variant/40">
                              <FileText size={24} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-on-background group-hover:text-primary transition-colors leading-tight">{item.title}</h4>
                              <p className="text-[10px] text-on-surface-variant/50 font-semibold mt-1 leading-relaxed">{item.description}</p>
                              {isFileUploaded ? (
                                <div className="mt-3.5 flex items-center gap-2 text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-md w-fit border border-green-150">
                                  <CheckCircle2 size={12} />
                                  <span className="truncate max-w-[140px]" title={fileInfo.name}>{fileInfo.name}</span>
                                  <span className="text-on-surface-variant/40 font-normal">({fileInfo.size})</span>
                                </div>
                              ) : (
                                <div className="mt-3.5 flex items-center gap-2 text-[10px] text-orange-700 font-bold bg-orange-50 px-2 py-0.5 rounded-md w-fit border border-orange-150">
                                  <AlertCircle size={12} /> {t('woningdossier.noFile')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <input
                              type="file"
                              id={`file-upload-${item.id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(item.id, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-upload-${item.id}`)?.click()}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                            >
                              <Upload size={12} /> {t('woningdossier.upload')}
                            </button>
                            {isFileUploaded && (
                              <button
                                type="button"
                                onClick={() => handleFileDelete(item.id)}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant/15 text-red-500 text-[10px] font-black rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                              >
                                <Trash2 size={12} /> {t('woningdossier.delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                  <selectedCategory.icon size={48} className="text-on-surface-variant/30 mb-4" />
                  <h3 className="text-sm font-black text-on-background uppercase tracking-wider">{t('woningdossier.noConfiguration')}</h3>
                  <p className="text-[11px] text-on-surface-variant/50 font-bold mt-1 max-w-[200px] leading-relaxed">{t('woningdossier.noConfigurationDesc')}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-outline-variant/10 bg-white">
              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              >
                {t('woningdossier.done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WoningDossierView;
export { WoningDossierView };
