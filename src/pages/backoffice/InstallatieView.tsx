/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CollapsibleSection, FieldGroup } from '../../components/ui/BackOfficeUI';
import { InspectionData } from './backofficeTypes';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Copy, Trash2, Edit3, ArrowLeft, ChevronDown, ChevronRight, Check, X, Camera, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AppSelect, AppSelectWithOptions } from '../../components/common/AppSelect';
import { GlobalPhotoSelectorModal } from '../../components/common/GlobalPhotoSelectorModal';
import { PhotoViewerModal } from '../../components/common/PhotoViewerModal';
import { slidesFromUrls } from '../../utils/photoViewer';
import { AppFlaggedLabel } from '../../components/common/AppFlaggedLabel';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface LocalSelectProps {
  label?: string;
  validationStatus?: 'red' | 'yellow' | 'green' | null;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  children: React.ReactNode;
}

const LocalSelect: React.FC<LocalSelectProps> = (props) => {
  return <AppSelectWithOptions {...props} />;
};

interface InstallatieViewProps {
  data: InspectionData;
  onChange: (path: string, value: any) => void;
  isModal?: boolean;
  onFieldEdit?: (path: string) => void;
}

const InstallatieView: React.FC<InstallatieViewProps> = ({ data, onChange: propsOnChange, isModal, onFieldEdit }) => {
  const { t, locale } = useLanguage();
  const [view, setView] = useState<'overview' | 'detail' | 'table'>(() => {
    const saved = localStorage.getItem('installatie_view_state');
    if (saved === 'detail' || saved === 'overview' || saved === 'table') {
      localStorage.removeItem('installatie_view_state');
      return saved;
    }
    return 'overview';
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const openLightbox = (photos: string[], index: number, _title: string) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setSelectedPhoto(photos[index]);
  };
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [activeInstallatieId, setActiveInstallatieId] = useState<string | null>(() => {
    return localStorage.getItem('installatie_active_id_current') || localStorage.getItem('installatie_active_id') || null;
  });

  useEffect(() => {
    if (activeInstallatieId) {
      localStorage.setItem('installatie_active_id_current', activeInstallatieId);
    } else {
      localStorage.removeItem('installatie_active_id_current');
    }
  }, [activeInstallatieId]);

  const [flags, setFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    try {
      const saved = localStorage.getItem(`installatie_flags_${data.clientId || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`installatie_flags_${data.clientId || 'default'}`, JSON.stringify(flags));
    } catch (e) {
      console.error(e);
    }
  }, [flags, data.clientId]);

  // Helper helper to sanitize file property paths (e.g., removes dashes from Zonne-panelen)
  const getSanitizedFileKey = (category: string) => {
    return `files_${category.replace(/[^a-zA-Z0-9_]/g, '')}`;
  };

  useEffect(() => {
    if (Array.isArray(data.allInstallations) && data.allInstallations.length > 0) {
      if (JSON.stringify(data.allInstallations) !== JSON.stringify(installations)) {
        setInstallations(data.allInstallations);
      }
    }
  }, [data.allInstallations]);

  // Safe localStorage helper to save installations configurations to localStorage
  const safeSaveInstallations = (list: any[]) => {
    try {
      const clientIdKey = data.clientId || 'default';
      localStorage.setItem(`mepa_installations_list_${clientIdKey}`, JSON.stringify(list));
      setInstallations(list);
      originalOnChange('allInstallations', list);
    } catch (e) {
      console.error("Failed to save configurations to localStorage:", e);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentFilesKey = getSanitizedFileKey(selectedCategory);
    const existingFiles: any[] = Array.isArray(getActiveInstDetails()[currentFilesKey]) ? getActiveInstDetails()[currentFilesKey] : [];

    const compressImage = (base64Str: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve(base64Str);
          }
        };
        img.onerror = () => resolve(base64Str);
        img.src = base64Str;
      });
    };

    const filePromises = Array.from(files).map(file => {
      return new Promise<any>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          let dataUrl = e.target?.result as string;

          if (file.type.startsWith('image/')) {
            try {
              dataUrl = await compressImage(dataUrl);
            } catch (err) {
              console.error('Image compression failed:', err);
            }
          }

          let sizeStr = '0 B';
          const approxSize = Math.round((dataUrl.length * 3) / 4);
          if (approxSize >= 1024 * 1024) sizeStr = (approxSize / (1024 * 1024)).toFixed(1) + ' MB';
          else if (approxSize >= 1024) sizeStr = (approxSize / 1024).toFixed(0) + ' KB';
          else sizeStr = approxSize + ' B';

          resolve({
            name: file.name || 'unnamed_file',
            type: file.type || 'application/octet-stream',
            size: sizeStr,
            dataUrl
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then(newFiles => {
        const updated = [...existingFiles, ...newFiles];
        handleFieldChange(`installations.${currentFilesKey}`, updated);
      })
      .catch(err => {
        console.error("File parsing layout crashed:", err);
      });
  };

  const handleFileDelete = (indexToDelete: number) => {
    const currentFilesKey = getSanitizedFileKey(selectedCategory);
    const existingFiles: any[] = Array.isArray(getActiveInstDetails()[currentFilesKey]) ? getActiveInstDetails()[currentFilesKey] : [];
    const updated = existingFiles.filter((_: any, idx: number) => idx !== indexToDelete);
    handleFieldChange(`installations.${currentFilesKey}`, updated);
  };

  const toggleFlag = (fieldKey: string, status: 'red' | 'yellow' | 'green' | null) => {
    const prefixedKey = activeInstallatieId ? `${activeInstallatieId}_${fieldKey}` : fieldKey;
    setFlags(prev => {
      const current = prev[prefixedKey];
      return {
        ...prev,
        [prefixedKey]: current === status ? null : status
      };
    });
  };

  const getFieldBorder = (fieldKey: string) => {
    const prefixedKey = activeInstallatieId ? `${activeInstallatieId}_${fieldKey}` : fieldKey;
    const status = flags[prefixedKey] !== undefined ? flags[prefixedKey] : flags[fieldKey];
    if (status === 'red') return '!border-red-500 ring-2 ring-red-100 bg-red-50/20';
    if (status === 'yellow') return '!border-amber-500 ring-2 ring-amber-100 bg-amber-50/20';
    if (status === 'green') return '!border-green-500 ring-2 ring-green-100 bg-green-50/20';
    return '';
  };

  const getSelectValidationStatus = (fieldKey: string) => {
    const prefixedKey = activeInstallatieId ? `${activeInstallatieId}_${fieldKey}` : fieldKey;
    return flags[prefixedKey] !== undefined ? flags[prefixedKey] : (flags[fieldKey] || null);
  };

  const renderLabelWithFlags = (fieldKey: string, label: string) => {
    const prefixedKey = activeInstallatieId ? `${activeInstallatieId}_${fieldKey}` : fieldKey;
    // Fallback to legacy fieldKey if prefixedKey doesn't exist, to support old flags
    const flagValue = flags[prefixedKey] !== undefined ? flags[prefixedKey] : flags[fieldKey];
    
    return (
      <AppFlaggedLabel
        label={label}
        value={flagValue}
        onChange={(v) => {
          // Auto-migrate legacy flags on click
          if (flags[fieldKey] !== undefined && activeInstallatieId) {
            setFlags(prev => {
              const next = { ...prev };
              delete next[fieldKey];
              if (next[prefixedKey] === v) {
                delete next[prefixedKey];
              } else {
                next[prefixedKey] = v;
              }
              return next;
            });
          } else {
            toggleFlag(fieldKey, v);
          }
        }}
        dataFieldKey={fieldKey}
      />
    );
  };
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem('installatie_selected_category') || 'Verwarming';
  });

  const [globalPhotoModalOpen, setGlobalPhotoModalOpen] = useState(false);
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalUploadAction = (capture: boolean) => {
    if (globalFileInputRef.current) {
      if (capture) {
        globalFileInputRef.current.setAttribute('capture', 'environment');
      } else {
        globalFileInputRef.current.removeAttribute('capture');
      }
      globalFileInputRef.current.click();
    }
  };

  useEffect(() => {
    localStorage.setItem('installatie_selected_category', selectedCategory);
  }, [selectedCategory]);
  const [installations, setInstallations] = useState<any[]>(() => {
    if (Array.isArray(data.allInstallations) && data.allInstallations.length > 0) {
      const clientIdKey = data.clientId || 'default';
      try {
        localStorage.setItem(`mepa_installations_list_${clientIdKey}`, JSON.stringify(data.allInstallations));
      } catch { }
      return data.allInstallations;
    }
    const clientIdKey = data.clientId || 'default';
    let saved = localStorage.getItem(`mepa_installations_list_${clientIdKey}`);

    // Auto-migrate default installations list to the client-specific key if the client-specific list is empty
    if (!saved && data.clientId && data.clientId !== 'default') {
      const defaultSaved = localStorage.getItem('mepa_installations_list_default');
      if (defaultSaved) {
        localStorage.setItem(`mepa_installations_list_${data.clientId}`, defaultSaved);
        saved = defaultSaved;
      }
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch { }
    }
    return [
      {
        id: '1',
        ventilatieName: data.installations?.ventMerkType || 'Itho Daalderop CVE-S',
        verwarmingName: data.installations?.verwarmMerkType || 'Nefit Trendline HRC30',
        tapwaterName: data.installations?.tapMerkType || 'Nefit Trendline (Interne)',
        koelingName: data.installations?.koelMerkType || 'Niet aanwezig',
        zonneName: data.installations?.zonMerkType || 'JA Solar Mono',
        details: { ...data.installations }
      }
    ];
  });

  useEffect(() => {
    const savedActiveId = localStorage.getItem('installatie_active_id');
    if (savedActiveId && installations.length > 0) {
      let targetInst = installations.find(i => i.id === savedActiveId);
      if (!targetInst && installations.length > 0) {
        targetInst = installations[0];
      }
      
      if (targetInst) {
        setActiveInstallatieId(targetInst.id);
        originalOnChange('installations', targetInst.details || {});
        setView('detail');
      }
      localStorage.removeItem('installatie_active_id');
    } else if (activeInstallatieId && installations.length > 0) {
      const exists = installations.some(i => i.id === activeInstallatieId);
      if (!exists) {
        setActiveInstallatieId(installations[0].id);
      }
    }
  }, [installations, activeInstallatieId]);

  const [ventilatorSelection, setVentilatorSelection] = useState<string>('Nominaal vermogen');
  const getVentSysteemType = (val?: string) => {
    if (!val) return 'C';
    const cleaned = val.replace(/Type\s+/i, '').trim();
    return ['A', 'B', 'C', 'D', 'E'].includes(cleaned) ? cleaned : 'C';
  };

  const [ventSysteemType, setVentSysteemType] = useState<string>(
    getVentSysteemType(data.installations?.ventVentilatiesysteem)
  );
  const [tapwaterSource, setTapwaterSource] = useState<string>(
    data.installations?.tapSysteem || 'Gecombineerd met CV'
  );
  const [pvType, setPvType] = useState<string>('PV-panelen');
  const [heatingSystemType, setHeatingSystemType] = useState<string>(
    data.installations?.verwarmTypeToestel || 'Individueel'
  );
  const [distributieMedium, setDistributieMedium] = useState<string>(
    data.installations?.verwarmDistributiemedium || 'Water'
  );
  const [expandedInstIds, setExpandedInstIds] = useState<Record<string, boolean>>({ '1': true });

  React.useEffect(() => {
    if (data.installations) {
      setVentSysteemType(getVentSysteemType(data.installations.ventVentilatiesysteem));
      setTapwaterSource(data.installations.tapSysteem || 'Gecombineerd met CV');
      setPvType(data.installations.zonSysteem || 'PV-panelen');
      setHeatingSystemType(data.installations.verwarmTypeToestel || 'Individueel');
      setDistributieMedium(data.installations.verwarmDistributiemedium || 'Water');
      setVentilatorSelection(data.installations.ventVentilatoren || 'Nominaal vermogen');
    }
  }, [data.installations]);

  useEffect(() => {
    if (!data.installations) return;
    const activeId = activeInstallatieId || '1';
    const lastClientId = localStorage.getItem('installations_last_client_id');
    const currentClientId = data.clientId || 'default';

    if (lastClientId !== currentClientId) {
      // User switched clients - sync parent data installations with the correct details of this client
      const activeInst = installations.find(i => i.id === activeId) || installations[0];
      if (activeInst) {
        originalOnChange('installations', activeInst.details || {});
      }
      localStorage.setItem('installations_last_client_id', currentClientId);
      return;
    }

    const activeInst = installations.find(i => i.id === activeId);
    if (activeInst && JSON.stringify(activeInst.details) === JSON.stringify(data.installations)) {
      return;
    }

    const next = installations.map(inst => {
      if (inst.id === activeId) {
        return {
          ...inst,
          ventilatieName: data.installations?.ventMerkType || inst.ventilatieName,
          verwarmingName: data.installations?.verwarmMerkType || inst.verwarmingName,
          tapwaterName: data.installations?.tapMerkType || inst.tapwaterName,
          koelingName: data.installations?.koelMerkType || inst.koelingName,
          zonneName: data.installations?.zonMerkType || inst.zonneName,
          details: { ...data.installations }
        };
      }
      return inst;
    });

    setInstallations(next);
    safeSaveInstallations(next);
  }, [data.installations, activeInstallatieId, data.clientId, installations]);

  const categories = [
    { id: 'Ventilatie', label: t('installations.ventilatie') },
    { id: 'Verwarming', label: t('installations.verwarming') },
    { id: 'Tapwater', label: t('installations.tapwater.title') },
    { id: 'Koeling', label: t('installations.koeling') },
    { id: 'Zonne-panelen', label: t('installations.zonneEnergie') },
  ];

  const toggleExpand = (id: string) => {
    setExpandedInstIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddInstallatie = () => {
    const newId = Date.now().toString();
    const newInst = {
      id: newId,
      activeCategories: ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen'],
      ventilatieName: '',
      verwarmingName: '',
      tapwaterName: '',
      koelingName: '',
      zonneName: '',
      details: {
        ventSysteem: '',
        ventMerkType: '',
        ventSpecsBcrg: '',
        ventVentilatiesysteem: '',
        ventSubsysteem: '',
        ventLuchtdichtheid: '',
        ventVentilatoren: '',
        ventTypeVentilator: '',
        ventCode: '',

        verwarmSysteem: '',
        verwarmMerkType: '',
        verwarmSpecsBcrg: '',
        verwarmTypeopwekker: '',
        verwarmTypeToestel: '',
        verwarmDistributiemedium: '',
        verwarmWatertemprater: '',
        verwarmAfgiftesysteem: '',
        verwarmCode: '',
        verwarmRegeling: '',

        tapSysteem: '',
        tapMerkType: '',
        tapSpecsBcrg: '',
        tapTypeInstallatie: '',
        tapTypeOpwekker: '',
        tapTypeToestel: '',
        tapCode: '',
        tapAfgifteKeuken: '',
        tapAfgifteBadkamer: '',
        tapCirculatieleiding: '',
        tapDwtw: '',

        koelSysteem: '',
        koelMerkType: '',
        koelSpecsBcrg: '',
        koelTypeInstallatie: '',
        koelExpansie: '',
        koelCode: '',
        koelDistributiemedium: '',
        koelWatertemprater: '',
        koelAfgiftesysteem: '',
        koelRegeling: '',

        zonSysteem: '',
        zonMerkType: '',
        zonSpecsBcrg: '',
        zonAantal: '',
        zonHellingshook: '',
        zonCode: '',
        zonOppPerPanelen: '',
        zonWattpiekvermogen: '',
        zonBouwintegratie: '',
        zonTypeToestel: 'Individueel',
        ventIdentiekeSystemen: '1',
        tapIdentiekeSystemen: '1',
        koelIdentiekeSystemen: '1',
        verwarmIdentiekeSystemen: '1',
        zonIdentiekeSystemen: '1',
        selectedPhotoIndex_vent: '-1', selectedPhotoIndex_vent_extra: '-1', selectedPhotoIndex_vent_3: '-1', selectedPhotoIndex_vent_4: '-1',
        selectedPhotoIndex_ketel: '-1', selectedPhotoIndex_ketel_extra: '-1', selectedPhotoIndex_ketel_3: '-1', selectedPhotoIndex_ketel_4: '-1',
        selectedPhotoIndex_tapwater: '-1', selectedPhotoIndex_tapwater_extra: '-1', selectedPhotoIndex_tapwater_3: '-1', selectedPhotoIndex_tapwater_4: '-1',
        selectedPhotoIndex_koeling: '-1', selectedPhotoIndex_koeling_extra: '-1', selectedPhotoIndex_koeling_3: '-1', selectedPhotoIndex_koeling_4: '-1',
        selectedPhotoIndex_solar: '-1', selectedPhotoIndex_solar_extra: '-1', selectedPhotoIndex_solar_3: '-1', selectedPhotoIndex_solar_4: '-1'
      }
    };
    const next = [...installations, newInst]; setInstallations(next); safeSaveInstallations(next);
  };

  const getUniqueCopyName = (originalName: string, existingNames: string[]) => {
    if (!originalName) return '';
    const isEn = locale === 'en';
    const suffixBase = isEn ? ' - Copy' : ' - Kopie';
    const regex = new RegExp(`(.*)(?:\\s*-\\s*(?:Kopie|Copy))\\s*(?:\\((\\d+)\\))?$`, 'i');

    let baseName = originalName;
    const match = originalName.match(regex);
    if (match) {
      baseName = match[1].trim();
    }

    let index = 1;
    let nextName = `${baseName}${suffixBase}`;
    while (existingNames.includes(nextName)) {
      index++;
      nextName = `${baseName}${suffixBase} (${index})`;
    }
    return nextName;
  };

  const handleCopyInstallatie = (id: string) => {
    const instToCopy = installations.find(inst => inst.id === id);
    if (instToCopy) {
      const newId = Date.now().toString();

      const getUniqueName = (val: string, field: string) => {
        if (!val) return '';
        const existingValues = installations.map(inst => inst[field] || '');
        return getUniqueCopyName(val, existingValues);
      };

      const getUniqueDetailName = (val: string, detailKey: string) => {
        if (!val) return '';
        const existingValues = installations.map(inst => inst.details?.[detailKey] || '');
        return getUniqueCopyName(val, existingValues);
      };

      const newDetails = {
        ...(instToCopy.details || {}),
        ventMerkType: getUniqueDetailName(instToCopy.details?.ventMerkType, 'ventMerkType'),
        verwarmMerkType: getUniqueDetailName(instToCopy.details?.verwarmMerkType, 'verwarmMerkType'),
        tapwaterName: getUniqueDetailName(instToCopy.details?.tapMerkType, 'tapMerkType'),
        koelMerkType: getUniqueDetailName(instToCopy.details?.koelMerkType, 'koelMerkType'),
        zonMerkType: getUniqueDetailName(instToCopy.details?.zonMerkType, 'zonMerkType'),
      };

      const newInst = {
        ...instToCopy,
        id: newId,
        ventilatieName: getUniqueName(instToCopy.ventilatieName, 'ventilatieName'),
        verwarmingName: getUniqueName(instToCopy.verwarmingName, 'verwarmingName'),
        tapwaterName: getUniqueName(instToCopy.tapwaterName, 'tapwaterName'),
        koelingName: getUniqueName(instToCopy.koelingName, 'koelingName'),
        zonneName: getUniqueName(instToCopy.zonneName, 'zonneName'),
        details: newDetails
      };

      const next = [...installations, newInst];
      setInstallations(next);
      safeSaveInstallations(next);
    }
  };

  const handleDeleteInstallatie = (id: string) => {
    let next = installations.filter(inst => inst.id !== id);
    if (next.length === 0) {
      next = [{
        id: Date.now().toString(),
        activeCategories: [],
        ventilatieName: '',
        verwarmingName: '',
        tapwaterName: '',
        koelingName: '',
        zonneName: '',
        details: {}
      }];
    }
    setInstallations(next);
    safeSaveInstallations(next);

    if (activeInstallatieId === id) {
        const fallbackId = next[0].id;
        setActiveInstallatieId(fallbackId);
        originalOnChange('installations', next[0].details || {});
      }

      setFlags(prev => {
        const nextFlags = { ...prev };
        Object.keys(nextFlags).forEach(key => {
          if (key.startsWith(`${id}_`)) {
            delete nextFlags[key];
          }
        });
        return nextFlags;
      });
  };

  const getFullName = (inst: any) => {
    const cats = inst.activeCategories || ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen'];
    const parts = [];
    if (cats.includes('Ventilatie')) parts.push(inst.ventilatieName || t('installations.ventilatie'));
    if (cats.includes('Verwarming')) parts.push(inst.verwarmingName || t('installations.verwarming'));
    if (cats.includes('Tapwater')) parts.push(inst.tapwaterName || t('installations.tapwaterLabel'));
    if (cats.includes('Koeling')) parts.push(inst.koelingName || t('installations.koeling'));
    if (cats.includes('Zonne-panelen')) parts.push(inst.zonneName || t('installations.zonneEnergie'));
    
    if (parts.length === 0) return 'Lege Installatie';
    return parts.join('_');
  };

  const handleFieldChange = (path: string, val: any) => {
    originalOnChange(path, val);
    if (!activeInstallatieId) return;
    const key = path.replace('installations.', '');

    if (onFieldEdit) {
      onFieldEdit(`inst_${activeInstallatieId}_${key}`);
    }

    const next = installations.map(inst => {
      if (inst.id === activeInstallatieId) {
        const updatedDetails = {
          ...(inst.details || {}),
          [key]: val
        };

        let extra = {};
        if (key === 'ventMerkType') extra = { ventilatieName: val };
        else if (key === 'verwarmMerkType') extra = { verwarmingName: val };
        else if (key === 'tapMerkType') extra = { tapwaterName: val };
        else if (key === 'koelMerkType') extra = { koelingName: val };
        else if (key === 'zonMerkType') extra = { zonneName: val };

        return {
          ...inst,
          ...extra,
          details: updatedDetails
        };
      }
      return inst;
    });
    setInstallations(next);
    safeSaveInstallations(next);
  };

  const updateComponentName = (id: string, field: string, value: string) => {
    const next = installations.map(inst => inst.id === id ? { ...inst, [field]: value } : inst);
    setInstallations(next);
    safeSaveInstallations(next);

    const fieldToPathMap: Record<string, string> = {
      ventilatieName: 'installations.ventMerkType',
      verwarmingName: 'installations.verwarmMerkType',
      tapwaterName: 'installations.tapMerkType',
      koelingName: 'installations.koelMerkType',
      zonneName: 'installations.zonMerkType',
    };
    if (fieldToPathMap[field]) {
      originalOnChange(fieldToPathMap[field], value);
    }
  };

  // Shadow the prop onChange to intercept edits locally
  const shadowedOnChange = (path: string, val: any) => {
    handleFieldChange(path, val);
  };
  let originalOnChange = propsOnChange;
  let onChange = shadowedOnChange;

  const getActiveInstallatieName = () => {
    const inst = installations.find(i => i.id === activeInstallatieId);
    return inst ? getFullName(inst) : 'Ventilatie_Verwarming_Tapwater_Koeling_Zonne-panelen';
  };

  if (view === 'overview') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl space-y-6">
        {/* Title Header */}
        <div className="pb-2">
          <h1 className="text-3xl font-black text-on-background tracking-tight">
            {t('installations.title')}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddInstallatie}
            className="flex-1 py-3 px-5 bg-primary hover:bg-primary-dark text-xs font-black text-white transition-all rounded-xl shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider active:scale-[0.98]"
          >
            <Plus size={14} /> {t('installations.addNew')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {installations.map((inst) => (
            <div key={inst.id} className="w-full flex flex-col gap-2">
              {/* Installation Summary Card */}
              <div className="bg-white border border-outline-variant/15 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-4">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(inst.id)}
                        className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-colors cursor-pointer"
                      >
                        {expandedInstIds[inst.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <span
                        className="text-xs font-black text-on-background truncate cursor-pointer hover:text-primary transition-colors"
                        title={getFullName(inst)}
                        onClick={() => toggleExpand(inst.id)}
                      >
                        {getFullName(inst)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveInstallatieId(inst.id);
                          originalOnChange('installations', inst.details || {});
                          setView('detail');
                        }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                        title={t('installations.edit')}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyInstallatie(inst.id)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                        title={t('installations.copy')}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInstallatie(inst.id)}
                        className="p-2 text-red-500 hover:bg-red-55 rounded-xl transition-colors cursor-pointer"
                        title={t('installations.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {expandedInstIds[inst.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mt-1">
                          {(() => {
                            const overviewCats = inst.activeCategories || ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen'];
                            return (
                              <>
                                {/* Ventilation */}
                                {overviewCats.includes('Ventilatie') && (
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-on-surface-variant font-black uppercase tracking-wider">{t('installations.ventilatie')}</span>
                              <span className="text-[10px] text-on-surface-variant/50 font-bold bg-white px-2 py-0.5 rounded-md border border-outline-variant/10">
                                {inst.details?.ventSysteem || 'Mechanische afvoer'}
                              </span>
                            </div>
                            <div className="pl-1 text-[11px] text-on-surface-variant/70 font-semibold">
                              <div>{t('installations.brand')}: <span className="text-on-background font-bold ml-1">{inst.details?.ventMerkType || t('general.options.onbekend')}</span></div>
                            </div>
                          </div>
                          )}

                          {/* Heating */}
                          {overviewCats.includes('Verwarming') && (
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-on-surface-variant font-black uppercase tracking-wider">{t('installations.verwarming')}</span>
                              <span className="text-[10px] text-on-surface-variant/50 font-bold bg-white px-2 py-0.5 rounded-md border border-outline-variant/10">
                                {inst.details?.verwarmSysteem || 'HR-Combiketel'}
                              </span>
                            </div>
                            <div className="pl-1 text-[11px] text-on-surface-variant/70 font-semibold">
                              <div>{t('installations.heating.generator1')}: <span className="text-on-background font-bold ml-1">{inst.details?.verwarmMerkType || t('general.options.onbekend')}</span></div>
                            </div>
                          </div>
                          )}

                          {/* Tapwater */}
                          {overviewCats.includes('Tapwater') && (
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-on-surface-variant font-black uppercase tracking-wider">{t('installations.tapwater.title')}</span>
                              <span className="text-[10px] text-on-surface-variant/50 font-bold bg-white px-2 py-0.5 rounded-md border border-outline-variant/10">
                                {inst.details?.tapSysteem || 'Gecombineerd met CV'}
                              </span>
                            </div>
                            <div className="pl-1 text-[11px] text-on-surface-variant/70 font-semibold">
                              <div>{t('installations.tapwater.generatorType')}: <span className="text-on-background font-bold ml-1">{inst.details?.tapMerkType || t('general.options.onbekend')}</span></div>
                            </div>
                          </div>
                          )}

                          {/* Cooling */}
                          {overviewCats.includes('Koeling') && (
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-on-surface-variant font-black uppercase tracking-wider">{t('installations.koeling')}</span>
                              <span className="text-[10px] text-on-surface-variant/50 font-bold bg-white px-2 py-0.5 rounded-md border border-outline-variant/10">
                                {inst.details?.koelSysteem || 'Niet aanwezig'}
                              </span>
                            </div>
                            <div className="pl-1 text-[11px] text-on-surface-variant/70 font-semibold">
                              <div>{t('structural.brandAndType')}: <span className="text-on-background font-bold ml-1">{inst.details?.koelMerkType || '-'}</span></div>
                            </div>
                          </div>
                          )}

                          {/* Solar Panels */}
                          {overviewCats.includes('Zonne-panelen') && (
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-on-surface-variant font-black uppercase tracking-wider">{t('installations.zonneEnergie')}</span>
                              <span className="text-[10px] text-on-surface-variant/50 font-bold bg-white px-2 py-0.5 rounded-md border border-outline-variant/10">
                                {inst.details?.zonSysteem || 'PV-panelen'}
                              </span>
                            </div>
                            <div className="pl-1 text-[11px] text-on-surface-variant/70 font-semibold">
                              <div>{t('structural.brandAndType')}: <span className="text-on-background font-bold ml-1">{inst.details?.zonMerkType || '-'}</span></div>
                            </div>
                          </div>
                          )}
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'table') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={() => setView('overview')}
            className="text-primary hover:underline text-xs font-black flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} /> {t('installations.backToOverview')}
          </button>
          <h2 className="text-sm font-black text-on-background uppercase tracking-tight">{t('installations.editAllInstallations')}</h2>
        </div>

        <div className="bg-white border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full block md:table border-collapse">
            <thead className="hidden md:table-header-group">
              <tr className="bg-gray-50 border-b border-outline-variant/10">
                <th className="px-4 py-3 text-left text-[11px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('installations.name')}</th>
                <th className="px-4 py-3 text-left text-[11px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('installations.system')}</th>
                <th className="px-4 py-3 text-left text-[11px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('installations.deviceCount')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('installations.actions')}</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y divide-outline-variant/5">
              {installations.map((inst) => (
                <tr key={inst.id} className="block md:table-row border-b md:border-none border-gray-100 hover:bg-gray-50/50 transition-colors p-4 md:p-0">
                  <td className="block md:table-cell px-2 py-2 md:px-4 md:py-3">
                    <span className="md:hidden text-[9px] font-black text-on-surface-variant/40 uppercase tracking-wider block mb-1">{t('installations.name')}</span>
                    <div className="text-xs font-bold text-on-background">
                      {getFullName(inst)}
                    </div>
                  </td>
                  <td className="block md:table-cell px-2 py-2 md:px-4 md:py-3">
                    <span className="md:hidden text-[9px] font-black text-on-surface-variant/40 uppercase tracking-wider block mb-1">{t('installations.system')}</span>
                    <LocalSelect className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-outline-variant/15 rounded-lg focus:ring-2 focus:ring-primary outline-none font-semibold cursor-pointer">
                      <option value="Individueel">{t('installations.systemTypes.individual')}</option>
                      <option value="Collectief">{t('installations.systemTypes.collective')}</option>
                      <option value="Stadsverwarming">{t('installations.generatorTypes.thirdPartyHeat')}</option>
                    </LocalSelect>
                  </td>
                  <td className="block md:table-cell px-2 py-2 md:px-4 md:py-3">
                    <span className="md:hidden text-[9px] font-black text-on-surface-variant/40 uppercase tracking-wider block mb-1">{t('installations.deviceCount')}</span>
                    <input
                      type="number"
                      className="w-full md:w-24 px-3 py-1.5 text-xs bg-gray-50 border border-outline-variant/15 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold"
                      defaultValue="1"
                    />
                  </td>
                  <td className="block md:table-cell px-2 py-2 md:px-4 md:py-3 border-t border-gray-100 mt-2 md:mt-0 md:border-none">
                    <div className="flex items-center justify-start md:justify-center gap-1.5 pt-2 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleCopyInstallatie(inst.id)}
                        className="p-1.5 text-on-surface-variant/50 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                        title={t('installations.copy')}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInstallatie(inst.id)}
                        className="p-1.5 text-on-surface-variant/50 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                        title={t('installations.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t border-outline-variant/10 flex justify-end">
            <button
              type="button"
              onClick={handleAddInstallatie}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-[11px] font-black rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider active:scale-[0.98]"
            >
              <Plus size={14} /> {t('installations.addAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  const activeInst = installations.find(i => i.id === activeInstallatieId);
  const getActiveInstDetails = () => activeInst?.details || {};
  const activeCats = activeInst?.activeCategories ?? categories.map(c => c.id);
  const activeCategoriesList = categories.filter(c => activeCats.includes(c.id));
  const availableCategoriesList = categories.filter(c => !activeCats.includes(c.id));
  
  const handleAddCategory = (catId: string) => {
    if (!activeInst) return;
    const currentCats = activeInst.activeCategories ?? categories.map(c => c.id);
    if (!currentCats.includes(catId)) {
      const defaultCatDetails: any = {
        'Ventilatie': { ventSysteem: 'Mechanische afvoer', ventMerkType: '', ventSpecsBcrg: '', ventVentilatiesysteem: '', ventSubsysteem: '', ventLuchtdichtheid: '', ventVentilatoren: '', ventTypeVentilator: '', ventCode: '', ventIdentiekeSystemen: '1', selectedPhotoIndex_vent: '-1', selectedPhotoIndex_vent_extra: '-1', selectedPhotoIndex_vent_3: '-1', selectedPhotoIndex_vent_4: '-1' },
        'Verwarming': { verwarmSysteem: 'HR-Combiketel', verwarmMerkType: '', verwarmSpecsBcrg: '', verwarmTypeopwekker: '', verwarmTypeToestel: '', verwarmDistributiemedium: '', verwarmWatertemprater: '', verwarmAfgiftesysteem: '', verwarmCode: '', verwarmRegeling: '', verwarmIdentiekeSystemen: '1', selectedPhotoIndex_ketel: '-1', selectedPhotoIndex_ketel_extra: '-1', selectedPhotoIndex_ketel_3: '-1', selectedPhotoIndex_ketel_4: '-1' },
        'Tapwater': { tapSysteem: 'Gecombineerd met CV', tapMerkType: '', tapSpecsBcrg: '', tapTypeInstallatie: '', tapTypeOpwekker: '', tapTypeToestel: '', tapCode: '', tapAfgifteKeuken: '', tapAfgifteBadkamer: '', tapCirculatieleiding: '', tapDwtw: '', tapIdentiekeSystemen: '1', selectedPhotoIndex_tapwater: '-1', selectedPhotoIndex_tapwater_extra: '-1', selectedPhotoIndex_tapwater_3: '-1', selectedPhotoIndex_tapwater_4: '-1' },
        'Koeling': { koelSysteem: 'Niet aanwezig', koelMerkType: '', koelSpecsBcrg: '', koelTypeInstallatie: '', koelExpansie: '', koelCode: '', koelDistributiemedium: '', koelWatertemprater: '', koelAfgiftesysteem: '', koelRegeling: '', koelIdentiekeSystemen: '1', selectedPhotoIndex_koeling: '-1', selectedPhotoIndex_koeling_extra: '-1', selectedPhotoIndex_koeling_3: '-1', selectedPhotoIndex_koeling_4: '-1' },
        'Zonne-panelen': { zonSysteem: 'PV-panelen', zonMerkType: '', zonSpecsBcrg: '', zonAantal: '', zonHellingshook: '', zonCode: '', zonOppPerPanelen: '', zonWattpiekvermogen: '', zonBouwintegratie: '', zonTypeToestel: 'Individueel', zonIdentiekeSystemen: '1', selectedPhotoIndex_solar: '-1', selectedPhotoIndex_solar_extra: '-1', selectedPhotoIndex_solar_3: '-1', selectedPhotoIndex_solar_4: '-1' }
      };

      const next = installations.map(i => {
        if (i.id === activeInstallatieId) {
          return {
            ...i,
            activeCategories: [...currentCats, catId],
            details: { ...(i.details || {}), ...defaultCatDetails[catId] }
          };
        }
        return i;
      });
      setInstallations(next);
      safeSaveInstallations(next);

      Object.keys(defaultCatDetails[catId]).forEach(k => {
        onChange(`installations.${k}`, defaultCatDetails[catId][k]);
      });
    }
    setSelectedCategory(catId);
  };
  
  const handleRemoveCategory = (catId: string) => {
    if (!activeInst) return;
    const currentCats = activeInst.activeCategories ?? categories.map(c => c.id);
    const newList = installations.map(i => i.id === activeInstallatieId ? { ...i, activeCategories: currentCats.filter((c: string) => c !== catId) } : i);
    safeSaveInstallations(newList);
    if (selectedCategory === catId) {
      setSelectedCategory('');
    }
  };

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl space-y-6">
        <div className="space-y-3 mb-2">
          <button
            type="button"
            onClick={() => setView('overview')}
            className="flex items-center gap-1.5 text-xs font-black text-on-surface-variant/70 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-xl transition-all cursor-pointer border border-outline-variant/10 bg-white shadow-sm w-fit"
          >
            <ArrowLeft size={14} /> {t('installations.backToOverview')}
          </button>
          <h2 className="text-xs font-black text-on-surface-variant/70 uppercase tracking-widest leading-none block pt-1">
            {getActiveInstallatieName()} &gt; {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}
          </h2>
        </div>

        {/* Category Tabs Switcher (Horizontal scrollable navbar) */}
        <div className="flex items-center flex-wrap gap-2 w-full">
          <div className="relative w-full sm:w-auto flex-1 min-w-0">
            <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto flex-nowrap scrollbar-none border border-outline-variant/5 pr-8 w-full">
              {activeCategoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={(e) => {
                    setSelectedCategory(prev => prev === cat.id ? '' : cat.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 whitespace-nowrap ${selectedCategory === cat.id
                      ? 'bg-white text-primary font-black shadow-xs'
                      : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/50'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {/* Gradient fade indicator for scrollability */}
            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none rounded-r-2xl border-r border-y border-transparent" />
          </div>

          {availableCategoriesList.length > 0 && (
            <div className="relative group/addmenu">
              <button
                type="button"
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={14} className="stroke-[3]" /> Add System
              </button>
              <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden opacity-0 invisible group-hover/addmenu:opacity-100 group-hover/addmenu:visible group-focus-within/addmenu:opacity-100 group-focus-within/addmenu:visible transition-all z-[100]">
                {availableCategoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleAddCategory(cat.id)}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-outline-variant/5 last:border-0"
                  >
                    + {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {selectedCategory && activeCats.includes(selectedCategory) && (
          <div className="w-full space-y-4">
            <div className="bg-white p-5 border border-outline-variant/10 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10 mb-4">
                <h3 className="text-sm font-black text-on-surface-variant uppercase tracking-wider">
                  {categories.find(c => c.id === selectedCategory)?.label}
                </h3>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(selectedCategory)}
                  className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-2 transition cursor-pointer flex items-center justify-center"
                  title="Verwijderen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <FieldGroup label={renderLabelWithFlags('system_' + selectedCategory, t('installations.system'))}>
              <LocalSelect
                label={t('installations.system')}
                validationStatus={getSelectValidationStatus('system_' + selectedCategory)}
                value={
                  selectedCategory === 'Ventilatie' ? (data.installations?.ventTypeToestel || 'Individueel') :
                    selectedCategory === 'Tapwater' ? (data.installations?.tapTypeInstallatie || 'Individueel') :
                      selectedCategory === 'Koeling' ? (data.installations?.koelTypeToestel || 'Individueel') :
                        selectedCategory === 'Zonne-panelen' ? (data.installations?.zonTypeToestel || 'Individueel') :
                          heatingSystemType
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (selectedCategory === 'Ventilatie') {
                    onChange('installations.ventTypeToestel', val);
                  } else if (selectedCategory === 'Tapwater') {
                    onChange('installations.tapTypeInstallatie', val);

                    // Auto-reset dependent tapwater generator type
                    const isExternal = val.includes('derden') || val.includes('afleverset');
                    if (isExternal) {
                      onChange('installations.tapTypeOpwekker', 'Externe warmtelevering via een afleverset');
                    } else {
                      if (data.installations?.tapTypeOpwekker === 'Externe warmtelevering via een afleverset') {
                        onChange('installations.tapTypeOpwekker', 'Compleet toestel');
                      }
                    }
                  } else if (selectedCategory === 'Koeling') {
                    onChange('installations.koelTypeToestel', val);
                  } else if (selectedCategory === 'Zonne-panelen') {
                    onChange('installations.zonTypeToestel', val);
                  } else {
                    setHeatingSystemType(val);
                    onChange('installations.verwarmTypeToestel', val);

                    // Auto-reset dependent generator values to a valid option of the new system type
                    const isExternal = val.includes('derden') || val.includes('afleverset');
                    if (isExternal) {
                      onChange('installations.verwarmTypeopwekker', 'Warmtelevering derden');
                      onChange('installations.tapTypeOpwekker', 'Externe warmtelevering via een afleverset');
                    } else {
                      if (data.installations?.verwarmTypeopwekker === 'Warmtelevering derden') {
                        onChange('installations.verwarmTypeopwekker', 'Gasgestookte ketel');
                      }
                      if (data.installations?.tapTypeOpwekker === 'Externe warmtelevering via een afleverset') {
                        onChange('installations.tapTypeOpwekker', 'Compleet toestel');
                      }
                    }
                  }
                }}
              >
                {selectedCategory === 'Ventilatie' ? (
                  <>
                    <option value="Individueel">{t('installations.systemTypes.individual')}</option>
                    <option value="Gemeenschappelijk/collectief">{t('installations.systemTypes.collective')}</option>
                  </>
                ) : selectedCategory === 'Tapwater' ? (
                  <>
                    <option value="Individueel">{t('installations.systemTypes.individual')}</option>
                    <option value="Gemeenschappelijk/collectief">{t('installations.systemTypes.collective')}</option>
                    <option value="Externe warmtelevering via een afleverset individueel">{t('installations.systemTypes.externalIndividual')}</option>
                    <option value="Externe warmtelevering via een afleverset gemeenschappelijk (centraal)">{t('installations.systemTypes.externalCollective')}</option>
                  </>
                ) : selectedCategory === 'Koeling' ? (
                  <>
                    <option value="Individueel">{t('installations.systemTypes.individual')}</option>
                    <option value="Ge/collectief">{t('installations.systemTypes.coolingCollective')}</option>
                    <option value="Koudelevering derden">{t('installations.systemTypes.coolingThirdParty')}</option>
                    <option value="Koudelevering derden ge">{t('installations.systemTypes.coolingThirdPartyCollective')}</option>
                  </>
                ) : selectedCategory === 'Zonne-panelen' ? (
                  <>
                    <option value="Individueel">{t('installations.systemTypes.individual')}</option>
                    <option value="Gemeenschappelijk/collectief">{t('installations.systemTypes.collective')}</option>
                  </>
                ) : (
                  <>
                    <option value="Individueel">{t('installations.systemTypes.individual')}</option>
                    <option value="Gemeenschappelijk/collectief">{t('installations.systemTypes.collective')}</option>
                    <option value="Warmtelevering derden individueel">{t('installations.systemTypes.heatingThirdPartyIndividual')}</option>
                    <option value="Warmtelevering derden gemeenschappelijk">{t('installations.systemTypes.heatingThirdPartyCollective')}</option>
                  </>
                )}
              </LocalSelect>
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('count_' + selectedCategory, t('installations.identicalSystemsCount'))}>
              <input
                type="number"
                className={`input-field font-bold ${getFieldBorder('count_' + selectedCategory)}`}
                value={
                  selectedCategory === 'Ventilatie' ? (data.installations?.ventIdentiekeSystemen || '1') :
                    selectedCategory === 'Tapwater' ? (data.installations?.tapIdentiekeSystemen || '1') :
                      selectedCategory === 'Koeling' ? (data.installations?.koelIdentiekeSystemen || '1') :
                        selectedCategory === 'Zonne-panelen' ? (data.installations?.zonIdentiekeSystemen || '1') :
                          (data.installations?.verwarmIdentiekeSystemen || '1')
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const keyMap: Record<string, string> = {
                    'Ventilatie': 'installations.ventIdentiekeSystemen',
                    'Tapwater': 'installations.tapIdentiekeSystemen',
                    'Koeling': 'installations.koelIdentiekeSystemen',
                    'Zonne-panelen': 'installations.zonIdentiekeSystemen',
                    'Verwarming': 'installations.verwarmIdentiekeSystemen'
                  };
                  onChange(keyMap[selectedCategory], val);
                }}
                placeholder={t('installations.devicePlaceholder')}
              />
            </FieldGroup>
            <FieldGroup label={renderLabelWithFlags('brand_' + selectedCategory, t('structural.brandAndType'))}>
              <input
                className={`input-field ${getFieldBorder('brand_' + selectedCategory)}`}
                placeholder={
                  selectedCategory === 'Ventilatie' ? t('installations.placeholderZehnder') :
                    selectedCategory === 'Verwarming' ? t('installations.placeholderNefit') :
                      selectedCategory === 'Tapwater' ? t('installations.placeholderItho') :
                        selectedCategory === 'Koeling' ? t('installations.placeholderDaikin') :
                          selectedCategory === 'Zonne-panelen' ? t('installations.placeholderJinko') :
                            t('structural.brandAndType')
                }
                value={
                  activeInstallatieId ? (
                    selectedCategory === 'Ventilatie' ? (installations.find(i => i.id === activeInstallatieId)?.ventilatieName || '') :
                      selectedCategory === 'Verwarming' ? (installations.find(i => i.id === activeInstallatieId)?.verwarmingName || '') :
                        selectedCategory === 'Tapwater' ? (installations.find(i => i.id === activeInstallatieId)?.tapwaterName || '') :
                          selectedCategory === 'Koeling' ? (installations.find(i => i.id === activeInstallatieId)?.koelingName || '') :
                            selectedCategory === 'Zonne-panelen' ? (installations.find(i => i.id === activeInstallatieId)?.zonneName || '') :
                              ''
                  ) : ''
                }
                onChange={(e) => {
                  if (!activeInstallatieId) return;
                  const fieldMap: Record<string, string> = {
                    'Ventilatie': 'ventilatieName',
                    'Verwarming': 'verwarmingName',
                    'Tapwater': 'tapwaterName',
                    'Koeling': 'koelingName',
                    'Zonne-panelen': 'zonneName'
                  };
                  updateComponentName(activeInstallatieId, fieldMap[selectedCategory], e.target.value);
                }}
              />
            </FieldGroup>
          </div>

          {selectedCategory === 'Verwarming' && (
            <CollapsibleSection title={t('installations.verwarming')} showHeader={false}>
              <div className="space-y-6">
                {/* Opwekkers Section */}
                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.heating.generatorDetails')}</h3>
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black uppercase tracking-wide">{t('installations.heating.generator1')}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('verwarmSpecsBcrg', t('installations.heating.installationYear'))}>
                        <input
                          type="number"
                          className={`input-field font-bold ${getFieldBorder('verwarmSpecsBcrg')}`}
                          placeholder="2018"
                          value={data.installations?.verwarmSpecsBcrg || ''}
                          onChange={(e) => onChange('installations.verwarmSpecsBcrg', e.target.value)}
                        />
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('verwarmTypeopwekker', t('installations.heating.generatorType'))}>
                        <LocalSelect
                          label={t('installations.heating.generatorType')}
                          validationStatus={getSelectValidationStatus('verwarmTypeopwekker')}
                          value={data.installations?.verwarmTypeopwekker || 'Gasgestookte ketel'}
                          onChange={(e) => onChange('installations.verwarmTypeopwekker', e.target.value)}
                        >
                          {(heatingSystemType === 'Individueel' || heatingSystemType === 'Gemeenschappelijk/collectief') ? (
                            <>
                              <option value="Lokale gaskachel">{t('installations.generatorTypes.localGasStove')}</option>
                              <option value="Lokale oliekachel">{t('installations.generatorTypes.localOilStove')}</option>
                              <option value="Elektrische verwarming">{t('installations.generatorTypes.electricHeating')}</option>
                              <option value="Moederhaard">{t('installations.generatorTypes.motherFireplace')}</option>
                              <option value="Gasgestookte ketel">{t('installations.generatorTypes.gasBoiler')}</option>
                              <option value="Oliegestookte ketel">{t('installations.generatorTypes.oilBoiler')}</option>
                              <option value="WKK">{t('installations.generatorTypes.chp')}</option>
                              <option value="Warmtepomp gasinjectie">{t('installations.generatorTypes.gasInjectionHP')}</option>
                              <option value="Warmtepomp gasmotor">{t('installations.generatorTypes.gasmotorHP') || t('installations.generatorTypes.gasEngineHP')}</option>
                              <option value="Warmtepomp elektrisch">{t('installations.generatorTypes.electricHP')}</option>
                              <option value="Biomassakachel">{t('installations.generatorTypes.biomassStove')}</option>
                              <option value="Biomassaketel handmatig gestookt">{t('installations.generatorTypes.biomassBoilerManual')}</option>
                              <option value="Biomassaketel automatisch gestookt">{t('installations.generatorTypes.biomassBoilerAuto')}</option>
                            </>
                          ) : (
                            <>
                              <option value="Warmtelevering derden">{t('installations.generatorTypes.thirdPartyHeat')}</option>
                            </>
                          )}
                        </LocalSelect>
                      </FieldGroup>
                    </div>
                    {(heatingSystemType === 'Warmtelevering derden individueel' || heatingSystemType === 'Warmtelevering derden gemeenschappelijk') && (
                      <>
                        <FieldGroup label={renderLabelWithFlags('verwarmDistributiemedium', t('installations.heating.distributionMedium'))}>
                          <LocalSelect
                            label={t('installations.heating.distributionMedium')}
                            validationStatus={getSelectValidationStatus('verwarmDistributiemedium')}
                            value={distributieMedium}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDistributieMedium(val);
                              onChange('installations.verwarmDistributiemedium', val);
                            }}
                          >
                            <option value="Water">{t('installations.heating.mediumWater')}</option>
                            <option value="Local">{t('installations.heating.mediumLocal')}</option>
                          </LocalSelect>
                        </FieldGroup>
                        {distributieMedium === 'Water' && (
                          <>
                            <FieldGroup label={renderLabelWithFlags('verwarmWatertemprater', t('installations.heating.waterFlowTemp'))}>
                              <LocalSelect
                                label={t('installations.heating.waterFlowTemp')}
                                validationStatus={getSelectValidationStatus('verwarmWatertemprater')}
                                value={data.installations?.verwarmWatertemprater || ''}
                                onChange={(e) => onChange('installations.verwarmWatertemprater', e.target.value)}
                              >
                                <option>30/27 °C</option>
                                <option>35/30 °C</option>
                                <option>40/35 °C</option>
                                <option>45/40 °C</option>
                                <option>50/42 °C</option>
                                <option>55/47 °C</option>
                                <option>60/50 °C</option>
                                <option>65/55 °C</option>
                                <option>70/60 °C</option>
                                <option>75/65 °C</option>
                                <option>80/60 °C</option>
                                <option>90/70 °C</option>
                              </LocalSelect>
                            </FieldGroup>
                            <FieldGroup label={renderLabelWithFlags('verwarmDistributietype', t('installations.heating.distributionType'))}>
                              <LocalSelect
                                label={t('installations.heating.distributionType')}
                                validationStatus={getSelectValidationStatus('verwarmDistributietype')}
                                value={data.installations?.verwarmDistributietype || 'Tweepijpsysteem'}
                                onChange={(e) => onChange('installations.verwarmDistributietype', e.target.value)}
                              >
                                <option value="Tweepijpsysteem">{t('installations.heating.twoPipe')}</option>
                                <option value="Eenpijpsysteem">{t('installations.heating.onePipe')}</option>
                              </LocalSelect>
                            </FieldGroup>
                          </>
                        )}
                      </>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('verwarmHrKlasse', t('installations.heating.hrClass'))}>
                        <LocalSelect
                          label={t('installations.heating.hrClass')}
                          validationStatus={getSelectValidationStatus('verwarmHrKlasse')}
                          value={data.installations?.verwarmHrKlasse || 'Onbekend'}
                          onChange={(e) => onChange('installations.verwarmHrKlasse', e.target.value)}
                        >
                          <option value="Onbekend">{t('general.options.onbekend')}</option>
                          <option value="HR-107">HR-107</option>
                          <option value="HR-104">HR-104</option>
                          <option value="VR-ketel">{t('installations.heating.vrBoiler')}</option>
                          <option value="Verbeterd rendement">{t('installations.heating.improvedEfficiency')}</option>
                          <option value="Niet-condenserend">{t('installations.heating.nonCondensing')}</option>
                        </LocalSelect>
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('verwarmPower', t('installations.heating.nominalPower'))}>
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="number"
                            className={`input-field font-bold ${getFieldBorder('verwarmPower')}`}
                            placeholder="24"
                            value={data.installations?.verwarmPower || ''}
                            onChange={(e) => onChange('installations.verwarmPower', e.target.value)}
                          />
                          <span className="text-xs text-on-surface-variant/60 font-bold">kW</span>
                        </div>
                      </FieldGroup>
                    </div>
                    <FieldGroup label={renderLabelWithFlags('verwarmCode', t('installations.heating.installationLocation'))}>
                      <input
                        className={`input-field ${getFieldBorder('verwarmCode')}`}
                        placeholder={t('installations.heating.locationPlaceholder')}
                        value={data.installations?.verwarmCode || ''}
                        onChange={(e) => onChange('installations.verwarmCode', e.target.value)}
                      />
                    </FieldGroup>
                  </div>
                </div>

                {/* Afgifte & Regeling Section */}
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex flex-col mb-1">
                    <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.heating.deliveryControl')}</h3>
                  </div>
                  <div className="space-y-4">
                    <FieldGroup label={renderLabelWithFlags('verwarmAfgiftesysteem', t('installations.heating.deliverySystem'))}>
                      <LocalSelect
                        label={t('installations.heating.deliverySystem')}
                        validationStatus={getSelectValidationStatus('verwarmAfgiftesysteem')}
                        value={data.installations?.verwarmAfgiftesysteem || 'Radiatoren / convectoren'}
                        onChange={(e) => onChange('installations.verwarmAfgiftesysteem', e.target.value)}
                      >
                        <option value="Radiatoren / convectoren">{t('installations.heating.radiatorsConvectors')}</option>
                        <option value="Ventilatorgestuurde radiatoren en/of convectoren">{t('installations.heating.fanRadiatorsConvectors')}</option>
                        <option value="Vloerverwarming">{t('installations.heating.underfloorHeating')}</option>
                        <option value="Luchtverwarming">{t('installations.heating.warmAirHeating')}</option>
                        <option value="Overig van">{t('installations.heating.other')}</option>
                      </LocalSelect>
                    </FieldGroup>
                    <FieldGroup label={renderLabelWithFlags('verwarmRegeling', t('installations.heating.control'))}>
                      <LocalSelect
                        label={t('installations.heating.control')}
                        validationStatus={getSelectValidationStatus('verwarmRegeling')}
                        value={data.installations?.verwarmRegeling || 'Regeling in hoofdvertrek (kamerthermostaat)'}
                        onChange={(e) => onChange('installations.verwarmRegeling', e.target.value)}
                      >
                        <option value="Regeling in hoofdvertrek (kamerthermostaat)">{t('installations.heating.controlRoomThermostat')}</option>
                        <option value="Centrale regeling met individuele regeling per ruimte">{t('installations.heating.controlCentralIndividual')}</option>
                        <option value="Individuele regeling per ruimte">{t('installations.heating.controlIndividual')}</option>
                        <option value="Overig of onbekend">{t('installations.heating.controlOtherUnknown')}</option>
                      </LocalSelect>
                    </FieldGroup>
                    <FieldGroup label={renderLabelWithFlags('verwarmWaterzijdigIngeeregeld', t('installations.heating.hydronicallyBalanced'))}>
                      <LocalSelect
                        label={t('installations.heating.hydronicallyBalanced')}
                        validationStatus={getSelectValidationStatus('verwarmWaterzijdigIngeeregeld')}
                        value={data.installations?.verwarmWaterzijdigIngeeregeld || 'Nee / Onbekend'}
                        onChange={(e) => onChange('installations.verwarmWaterzijdigIngeeregeld', e.target.value)}
                      >
                        <option value="Nee / Onbekend">{t('installations.heating.balanceNoUnknown')}</option>
                        <option value="Ja, aangetoond (Label A)">{t('installations.heating.balanceYesLabelA')}</option>
                        <option value="Ja, waarschijnlijk">{t('installations.heating.balanceYesLikely')}</option>
                      </LocalSelect>
                    </FieldGroup>
                  </div>
                </div>

                {/* Foto's & Documenten - Verwarming */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-on-surface-variant/70 uppercase tracking-widest flex items-center gap-2">
                      <Camera size={14} className="text-on-surface-variant/50" />
                      {t('installations.photosAndDocuments')} ({t('installations.verwarming')})
                    </h3>
                    <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm">
                      <Plus size={12} />
                      {t('installations.uploadSelect')}
                    </button>
                  </div>
                  {(() => {
                    const files: any[] = getActiveInstDetails()[getSanitizedFileKey('Verwarming')] || [];
                    if (files.length === 0) {
                      return (
                        <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="w-full cursor-pointer flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-outline-variant/20 rounded-xl text-on-surface-variant/40 hover:border-outline-variant/40 hover:bg-gray-100/50 transition-all">
                          <Camera size={24} />
                          <span className="text-xs font-semibold">{t('installations.clickToAddPhotos')}</span>
                        </button>
                      );
                    }
                    const photos = files.filter(f => f.type?.startsWith('image/'));
                    const docs = files.filter(f => !f.type?.startsWith('image/'));
                    return (
                      <div className="space-y-3">
                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {photos.map((f, i) => (
                              <div key={i} className="relative group/photo rounded-xl overflow-hidden border border-outline-variant/10 aspect-square bg-gray-100">
                                <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover cursor-pointer" onClick={() => openLightbox(photos.map((p: any) => p.dataUrl), photos.indexOf(f), f.name)} />
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100 transition-all cursor-pointer"><Trash2 size={10} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {docs.length > 0 && (
                          <div className="space-y-1.5">
                            {docs.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all group/doc">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText size={14} className="text-on-surface-variant/70" />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(f.dataUrl, '_blank')}>
                                  <p className="text-xs font-bold text-on-surface truncate">{f.name}</p>
                                  <p className="text-[10px] text-on-surface-variant/50">{f.size}</p>
                                </div>
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="opacity-100 lg:opacity-0 lg:group-hover/doc:opacity-100 p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {selectedCategory === 'Tapwater' && (
            <CollapsibleSection title={t('installations.tapwater.title')} showHeader={false}>
              <div className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.tapwater.systemGenerator')}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('tapTypeOpwekker', t('installations.tapwater.generatorType'))}>
                        <LocalSelect
                          label={t('installations.tapwater.generatorType')}
                          validationStatus={getSelectValidationStatus('tapTypeOpwekker')}
                          value={data.installations?.tapTypeOpwekker || 'Compleet toestel'}
                          onChange={(e) => onChange('installations.tapTypeOpwekker', e.target.value)}
                        >
                          {(heatingSystemType === 'Individueel' || heatingSystemType === 'Gemeenschappelijk/collectief') ? (
                            <>
                              <option value="Compleet toestel">{t('installations.tapwater.completeDevice')}</option>
                              <option value="Direct verwarmd vat">{t('installations.tapwater.directlyHeatedVessel')}</option>
                              <option value="Indirect verwarmd vat">{t('installations.tapwater.indirectlyHeatedVessel')}</option>
                            </>
                          ) : (
                            <>
                              <option value="Externe warmtelevering via een afleverset">{t('installations.tapwater.externalDelivery')}</option>
                            </>
                          )}
                        </LocalSelect>
                      </FieldGroup>
                      {heatingSystemType === 'Individueel' && (
                        <FieldGroup label={renderLabelWithFlags('tapTypeToestel', t('installations.tapwater.deviceType'))}>
                          <LocalSelect
                            label={t('installations.tapwater.deviceType')}
                            validationStatus={getSelectValidationStatus('tapTypeToestel')}
                            value={data.installations?.tapTypeToestel || 'Keukengeiser'}
                            onChange={(e) => onChange('installations.tapTypeToestel', e.target.value)}
                          >
                            <option value="Keukengeiser">{t('installations.tapwater.kitchenGeyser')}</option>
                            <option value="Gasgestookt warmwatertoestel (Badgeiser)">{t('installations.tapwater.bathGeyser')}</option>
                            <option value="Gasgestookt combitoestel">{t('installations.tapwater.gasCombi')}</option>
                            <option value="(micro) WKK">{t('installations.tapwater.microChp')}</option>
                            <option value="Elektrisch">{t('installations.tapwater.electric')}</option>
                            <option value="Boosterwarmtepomp">{t('installations.tapwater.boosterHP')}</option>
                            <option value="Elektrische doorstroomverwarmer">{t('installations.tapwater.electricInstantaneous')}</option>
                            <option value="Vast biobrandstoftoestel">{t('installations.tapwater.solidBiofuel')}</option>
                            <option value="Elektrische boiler">{t('installations.tapwater.electricBoiler')}</option>
                            <option value="Warmwaterboiler">{t('installations.tapwater.hotWaterBoiler')}</option>
                          </LocalSelect>
                        </FieldGroup>
                      )}
                      <FieldGroup label={renderLabelWithFlags('tapSpecsBcrg', t('installations.heating.installationYear'))}>
                        <input
                          type="number"
                          className={`input-field font-bold ${getFieldBorder('tapSpecsBcrg')}`}
                          placeholder="2015"
                          value={data.installations?.tapSpecsBcrg || ''}
                          onChange={(e) => onChange('installations.tapSpecsBcrg', e.target.value)}
                        />
                      </FieldGroup>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.tapwater.distribution')}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('tapAfgifteKeuken', t('installations.tapwater.kitchenDelivery'))}>
                        <LocalSelect
                          label={t('installations.tapwater.kitchenDelivery')}
                          validationStatus={getSelectValidationStatus('tapAfgifteKeuken')}
                          value={data.installations?.tapAfgifteKeuken || '< 2 m'}
                          onChange={(e) => onChange('installations.tapAfgifteKeuken', e.target.value)}
                        >
                          <option>&lt; 2 m</option>
                          <option>2 m &lt;= l &lt; 4 m</option>
                          <option>4 m &lt;= l &lt; 6 m</option>
                          <option>6 m &lt;= l &lt; 8 m</option>
                          <option>8 m &lt;= l &lt; 10 m</option>
                          <option>10 m &lt;= l &lt; 12 m</option>
                          <option>12 m &lt;= l &lt; 14 m</option>
                          <option>&gt;= 14 m</option>
                        </LocalSelect>
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('tapAfgifteBadkamer', t('installations.tapwater.bathroomDelivery'))}>
                        <LocalSelect
                          label={t('installations.tapwater.bathroomDelivery')}
                          validationStatus={getSelectValidationStatus('tapAfgifteBadkamer')}
                          value={data.installations?.tapAfgifteBadkamer || '< 2 m'}
                          onChange={(e) => onChange('installations.tapAfgifteBadkamer', e.target.value)}
                        >
                          <option>&lt; 2 m</option>
                          <option>2 m &lt;= l &lt; 4 m</option>
                          <option>4 m &lt;= l &lt; 6 m</option>
                          <option>6 m &lt;= l &lt; 8 m</option>
                          <option>8 m &lt;= l &lt; 10 m</option>
                          <option>10 m &lt;= l &lt; 12 m</option>
                          <option>12 m &lt;= l &lt; 14 m</option>
                          <option>&gt;= 14 m</option>
                        </LocalSelect>
                      </FieldGroup>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('tapCirculatieleiding', t('installations.tapwater.circulationPipe'))}>
                        <LocalSelect
                          label={t('installations.tapwater.circulationPipe')}
                          validationStatus={getSelectValidationStatus('tapCirculatieleiding')}
                          value={data.installations?.tapCirculatieleiding || 'Nee'}
                          onChange={(e) => onChange('installations.tapCirculatieleiding', e.target.value)}
                        >
                          <option value="Nee">{t('common.no')}</option>
                          <option value="Ja, geïsoleerd">{t('installations.tapwater.yesInsulated')}</option>
                          <option value="Ja, ongeïsoleerd">{t('installations.tapwater.yesUninsulated')}</option>
                        </LocalSelect>
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('tapDwtw', t('installations.tapwater.showerHeatRecovery'))}>
                        <LocalSelect
                          label={t('installations.tapwater.showerHeatRecovery')}
                          validationStatus={getSelectValidationStatus('tapDwtw')}
                          value={data.installations?.tapDwtw || 'Nee'}
                          onChange={(e) => onChange('installations.tapDwtw', e.target.value)}
                        >
                          <option value="Nee">{t('common.no')}</option>
                          <option value="Ja, douchepijp-WTW">{t('installations.tapwater.yesShowerPipe')}</option>
                          <option value="Ja, douchebak-WTW">{t('installations.tapwater.yesShowerTray')}</option>
                        </LocalSelect>
                      </FieldGroup>
                    </div>
                  </div>
                </div>

                {/* Foto's & Documenten - Tapwater */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-on-surface-variant/70 uppercase tracking-widest flex items-center gap-2">
                      <Camera size={14} className="text-on-surface-variant/50" />
                      {t('installations.photosAndDocuments')} ({t('installations.tapwaterLabel')})
                    </h3>
                    <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm">
                      <Plus size={12} />
                      {t('installations.uploadSelect')}
                    </button>
                  </div>
                  {(() => {
                    const files: any[] = getActiveInstDetails()[getSanitizedFileKey('Tapwater')] || [];
                    if (files.length === 0) {
                      return (
                        <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="w-full cursor-pointer flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-outline-variant/20 rounded-xl text-on-surface-variant/40 hover:border-outline-variant/40 hover:bg-gray-100/50 transition-all">
                          <Camera size={24} />
                          <span className="text-xs font-semibold">{t('installations.clickToAddPhotos')}</span>
                        </button>
                      );
                    }
                    const photos = files.filter(f => f.type?.startsWith('image/'));
                    const docs = files.filter(f => !f.type?.startsWith('image/'));
                    return (
                      <div className="space-y-3">
                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {photos.map((f, i) => (
                              <div key={i} className="relative group/photo rounded-xl overflow-hidden border border-outline-variant/10 aspect-square bg-gray-100">
                                <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover cursor-pointer" onClick={() => openLightbox(photos.map((p: any) => p.dataUrl), photos.indexOf(f), f.name)} />
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100 transition-all cursor-pointer"><Trash2 size={10} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {docs.length > 0 && (
                          <div className="space-y-1.5">
                            {docs.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all group/doc">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText size={14} className="text-on-surface-variant/70" />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(f.dataUrl, '_blank')}>
                                  <p className="text-xs font-bold text-on-surface truncate">{f.name}</p>
                                  <p className="text-[10px] text-on-surface-variant/50">{f.size}</p>
                                </div>
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="opacity-100 lg:opacity-0 lg:group-hover/doc:opacity-100 p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {selectedCategory === 'Ventilatie' && (
            <CollapsibleSection title={t('installations.ventilatie')} showHeader={false}>
              <div className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.ventilation.basicSystem')}</h3>
                  <div className="space-y-4">
                    <FieldGroup label={renderLabelWithFlags('ventSysteemType', t('installations.ventilation.system'))}>
                      <LocalSelect
                        label={t('installations.ventilation.system')}
                        validationStatus={getSelectValidationStatus('ventSysteemType')}
                        value={ventSysteemType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVentSysteemType(val);
                          onChange('installations.ventVentilatiesysteem', `Type ${val}`);
                          onChange('installations.ventSysteem', val === 'A' ? 'Natuurlijke ventilatie' : 'Mechanische afvoer');

                          let defaultControl = '';
                          if (val === 'A') defaultControl = 'A1 Standaard (toevoer niet luchtdruk gestuurd)';
                          else if (val === 'B') defaultControl = 'B1 Standaard';
                          else if (val === 'C') defaultControl = 'C1 Standaard';
                          else if (val === 'D') defaultControl = 'D1 Standaard';
                          else if (val === 'E') defaultControl = 'E1 Systeemdeel D: decentrale WTW (Systeem D.5b)';

                          if (defaultControl) {
                            onChange('installations.ventDemandControl', defaultControl);
                          }
                        }}
                      >
                        <option value="A">{t('installations.ventilation.sysA')}</option>
                        <option value="B">{t('installations.ventilation.sysB')}</option>
                        <option value="C">{t('installations.ventilation.sysC')}</option>
                        <option value="D">{t('installations.ventilation.sysD')}</option>
                        <option value="E">{t('installations.ventilation.sysE')}</option>
                      </LocalSelect>
                    </FieldGroup>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('ventSpecsBcrg', t('installations.heating.installationYear'))}>
                        <input
                          type="number"
                          className={`input-field font-bold ${getFieldBorder('ventSpecsBcrg')}`}
                          placeholder="2020"
                          value={data.installations?.ventSpecsBcrg || ''}
                          onChange={(e) => onChange('installations.ventSpecsBcrg', e.target.value)}
                        />
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('ventLuchtdichtheid', t('installations.ventilation.airTightness'))}>
                        <LocalSelect
                          label={t('installations.ventilation.airTightness')}
                          validationStatus={getSelectValidationStatus('ventLuchtdichtheid')}
                          value={data.installations?.ventLuchtdichtheid || 'LUKA A,B of C'}
                          onChange={(e) => onChange('installations.ventLuchtdichtheid', e.target.value)}
                        >
                          <option value="LUKA A,B of C">LUKA A, B of C</option>
                          <option value="LUKA D">LUKA D</option>
                          <option value="Geen kanaal">{t('installations.ventilation.noDuct')}</option>
                          <option value="Onbekend">{t('general.options.onbekend')}</option>
                        </LocalSelect>
                      </FieldGroup>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        id="lintverwarmde"
                        checked={data.installations?.ventSubsysteem === 'Ja'}
                        onChange={(e) => onChange('installations.ventSubsysteem', e.target.checked ? 'Ja' : 'Nee')}
                      />
                      <label htmlFor="lintverwarmde" className="text-xs font-bold text-on-surface-variant/60 cursor-pointer">{t('installations.ventilation.ribbonHeatingPresent')}</label>
                    </div>
                  </div>
                </div>

                {(ventSysteemType === 'A' || ventSysteemType === 'B' || ventSysteemType === 'C' || ventSysteemType === 'D' || ventSysteemType === 'E') && (
                  <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                    <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest mb-3">{t('installations.ventilation.demandControlDetails')}</h3>
                    <div className="space-y-4">
                      <FieldGroup label={renderLabelWithFlags('ventDemandControl', t('installations.ventilation.demandControlSystem'))}>
                        <LocalSelect
                          label={t('installations.ventilation.demandControlSystem')}
                          validationStatus={getSelectValidationStatus('ventDemandControl')}
                          value={data.installations?.ventDemandControl || ''}
                          onChange={(e) => onChange('installations.ventDemandControl', e.target.value)}
                        >
                          {ventSysteemType === 'A' && (
                            <>
                              <option>A1 Standaard (toevoer niet luchtdruk gestuurd)</option>
                              <option>A2a Luchtdrukgestuurde toevoer delta p &lt;= 1 Pa</option>
                              <option>A2b Luchtdrukgestuurde toevoer 1 Pa &lt; delta p &lt;= 5 Pa</option>
                              <option>A2c Luchtdrukgestuurde toevoer 5 Pa &lt; delta p &lt;= 10</option>
                              <option>Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone</option>
                              <option>Type onbekend, zelfregelende klep aanwezig, geplaatst &gt; 2003</option>
                            </>
                          )}
                          {ventSysteemType === 'B' && (
                            <>
                              <option>B1 Standaard</option>
                              <option>B2 Tijdssturing op installaties, zonder zonering</option>
                              <option>B3 CO2-meting per verblijfsruimte, CO2-sturing op installaties, met zonering</option>
                            </>
                          )}
                          {ventSysteemType === 'C' && (
                            <>
                              <option>C1 Standaard</option>
                              <option>C2a Luchtdrukgestuurde toevoer delta p &lt;= 1 Pa</option>
                              <option>C2b Luchtdrukgestuurde toevoer 1 Pa &lt; delta p &lt;= 5 Pa</option>
                              <option>C2c Luchtdrukgestuurde toevoer 5 Pa &lt; delta p &lt;= 10 Pa</option>
                              <option>Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone</option>
                              <option>Type onbekend, zelfregelende klep aanwezig, geplaatst &gt; 2003</option>
                              <option>C3a Tijdsturing afvoer, zonder zonering</option>
                              <option>C3b Luchtdrukgestuurde toevoer delta p &lt;= 1 PA, tijdsturing afvoer, zonder zor</option>
                              <option>C3c Tijdsturing toevoer, afvoer zonder zonering</option>
                              <option>C4a Luchtdrukgestuurde toevoer delta p &lt;= 1 Pa, sturing op afvoer door CO2-m</option>
                              <option>C4b CO2-sturing op the toevoer in ten minste de woonk. and de hoofdslaapk., zo</option>
                              <option>C4c Luchtdrukgestuurde toevoer delta p &lt;= 1 Pa, sturing op afvoer door CO2-m</option>
                              <option>C5a Luchtdrukgestuurde toevoer delta p &lt;= 1 Pa, sturing op afvoer door CO2-m</option>
                              <option>C5b Luchtdrukgestuurde toevoer delta p &lt;= 1 Pa, sturing op afvoer door CO2-m</option>
                            </>
                          )}
                          {ventSysteemType === 'D' && (
                            <>
                              <option>D1 Standaard</option>
                              <option>D2 Centrale WTW-installatie zonder zoneringen and zonder sturing</option>
                              <option>D3 Centrale WTW, sturing van afvoer CO2-meting in the WTW, geen zonering</option>
                              <option>D4a Tijdsturing zonder zonering</option>
                              <option>D4b Tijdsturing met zonering</option>
                              <option>D5a Centrale WTW. CO2-metingen in ten minste de woonkamer and de hoofdslaapkamer</option>
                              <option>D5b Decentrale WTW. CO2-metingen in ten minste de woonkamer and de hoofdslaapkamer</option>
                              <option>D5c Centrale WTW. CO2-metingen in ten minste de woon- and hoofdslaapkamer</option>
                            </>
                          )}
                          {ventSysteemType === 'E' && (
                            <>
                              <option>E1 Systeemdeel D: decentrale WTW (Systeem D.5b)</option>
                            </>
                          )}
                        </LocalSelect>
                      </FieldGroup>

                      {ventSysteemType === 'D' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <FieldGroup label={renderLabelWithFlags('ventBypass', t('installations.ventilation.bypassPresent'))}>
                            <LocalSelect
                              label={t('installations.ventilation.bypassPresent')}
                              validationStatus={getSelectValidationStatus('ventBypass')}
                              value={data.installations?.ventBypass || 'Nee'}
                              onChange={(e) => onChange('installations.ventBypass', e.target.value)}
                            >
                              <option value="Ja, 100% bypass">{t('installations.ventilation.bypass100')}</option>
                              <option value="Ja, gedeeltelijk">{t('installations.ventilation.bypassPartial')}</option>
                              <option value="Nee">{t('common.no')}</option>
                            </LocalSelect>
                          </FieldGroup>
                          <FieldGroup label={renderLabelWithFlags('ventHrEfficiency', t('installations.ventilation.hrEfficiency'))}>
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="number"
                                className={`input-field font-bold ${getFieldBorder('ventHrEfficiency')}`}
                                value={data.installations?.ventHrEfficiency || '90'}
                                onChange={(e) => onChange('installations.ventHrEfficiency', e.target.value)}
                              />
                              <span className="text-xs text-on-surface-variant/60 font-bold">%</span>
                            </div>
                          </FieldGroup>
                        </div>
                      )}

                      <FieldGroup label={renderLabelWithFlags('ventVentilatoren', t('installations.ventilation.fans'))}>
                        <LocalSelect
                          label={t('installations.ventilation.fans')}
                          validationStatus={getSelectValidationStatus('ventVentilatoren')}
                          value={data.installations?.ventVentilatoren || 'Nominaal vermogen'}
                          onChange={(e) => {
                            setVentilatorSelection(e.target.value);
                            onChange('installations.ventVentilatoren', e.target.value);
                          }}
                        >
                          <option value="Nominaal vermogen">{t('installations.ventilation.fansNominal')}</option>
                          <option value="Nominaal vermogen onbekend">{t('installations.ventilation.fansNominalUnknown')}</option>
                          <option value="Kwaliteitsverklaring">{t('installations.ventilation.fansQuality')}</option>
                          <option value="Onbekend">{t('general.options.onbekend')}</option>
                        </LocalSelect>
                      </FieldGroup>

                      {ventilatorSelection === 'Nominaal vermogen' && (
                        <FieldGroup label={renderLabelWithFlags('ventNomPower', t('installations.ventilation.power'))}>
                          <input
                            type="number"
                            className={`input-field font-bold ${getFieldBorder('ventNomPower')}`}
                            placeholder="35"
                            value={data.installations?.ventNomPower || ''}
                            onChange={(e) => onChange('installations.ventNomPower', e.target.value)}
                          />
                        </FieldGroup>
                      )}

                      {ventilatorSelection === 'Kwaliteitsverklaring' && (
                        <div className="space-y-4 pt-2 border-t border-outline-variant/10">
                          <FieldGroup label={renderLabelWithFlags('ventNomPower', t('installations.ventilation.flowRateKnown'))}>
                            <input
                              type="number"
                              className={`input-field font-bold ${getFieldBorder('ventNomPower')}`}
                              placeholder="Integer"
                              value={data.installations?.ventNomPower || ''}
                              onChange={(e) => onChange('installations.ventNomPower', e.target.value)}
                            />
                          </FieldGroup>
                        </div>
                      )}

                      {ventilatorSelection === 'Onbekend' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <FieldGroup label={renderLabelWithFlags('ventMotorType', t('installations.ventilation.motorType'))}>
                            <LocalSelect
                              label={t('installations.ventilation.motorType')}
                              validationStatus={getSelectValidationStatus('ventMotorType')}
                              value={data.installations?.ventMotorType || 'Gelijkstroom'}
                              onChange={(e) => onChange('installations.ventMotorType', e.target.value)}
                            >
                              <option value="Gelijkstroom">{t('installations.ventilation.motorDC')}</option>
                              <option value="Wisselstroom">{t('installations.ventilation.motorAC')}</option>
                              <option value="Draaistroom">{t('installations.ventilation.motorThreePhase')}</option>
                            </LocalSelect>
                          </FieldGroup>
                          <FieldGroup label={renderLabelWithFlags('ventFabrication', t('installations.ventilation.fabrication'))}>
                            <LocalSelect
                              label={t('installations.ventilation.fabrication')}
                              validationStatus={getSelectValidationStatus('ventFabrication')}
                              value={data.installations?.ventFabrication || ''}
                              onChange={(e) => onChange('installations.ventFabrication', e.target.value)}
                            >
                              <option value="tot 1980">{t('installations.ventilation.fabTo1980')}</option>
                              <option>1980 - 1990</option>
                              <option>1990 - 2000</option>
                              <option>&gt;2006</option>
                            </LocalSelect>
                          </FieldGroup>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Foto's & Documenten - Ventilatie */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-on-surface-variant/70 uppercase tracking-widest flex items-center gap-2">
                      <Camera size={14} className="text-on-surface-variant/50" />
                      {t('installations.photosAndDocuments')} ({t('installations.ventilatie')})
                    </h3>
                    <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm">
                      <Plus size={12} />
                      {t('installations.uploadSelect')}
                    </button>
                  </div>
                  {(() => {
                    const files: any[] = getActiveInstDetails()[getSanitizedFileKey('Ventilatie')] || [];
                    if (files.length === 0) {
                      return (
                        <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="w-full cursor-pointer flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-outline-variant/20 rounded-xl text-on-surface-variant/40 hover:border-outline-variant/40 hover:bg-gray-100/50 transition-all">
                          <Camera size={24} />
                          <span className="text-xs font-semibold">{t('installations.clickToAddPhotos')}</span>
                        </button>
                      );
                    }
                    const photos = files.filter(f => f.type?.startsWith('image/'));
                    const docs = files.filter(f => !f.type?.startsWith('image/'));
                    return (
                      <div className="space-y-3">
                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {photos.map((f, i) => (
                              <div key={i} className="relative group/photo rounded-xl overflow-hidden border border-outline-variant/10 aspect-square bg-gray-100">
                                <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover cursor-pointer" onClick={() => openLightbox(photos.map((p: any) => p.dataUrl), photos.indexOf(f), f.name)} />
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100 transition-all cursor-pointer"><Trash2 size={10} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {docs.length > 0 && (
                          <div className="space-y-1.5">
                            {docs.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all group/doc">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText size={14} className="text-on-surface-variant/70" />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(f.dataUrl, '_blank')}>
                                  <p className="text-xs font-bold text-on-surface truncate">{f.name}</p>
                                  <p className="text-[10px] text-on-surface-variant/50">{f.size}</p>
                                </div>
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="opacity-100 lg:opacity-0 lg:group-hover/doc:opacity-100 p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {selectedCategory === 'Koeling' && (
            <CollapsibleSection title={t('installations.koeling')} showHeader={false}>
              <div className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.cooling.generatorSystem')}</h3>
                  <div className="space-y-4">
                    <FieldGroup label={renderLabelWithFlags('koelTypeInstallatie', t('installations.cooling.generatorType'))}>
                      <LocalSelect
                        label={t('installations.cooling.generatorType')}
                        validationStatus={getSelectValidationStatus('koelTypeInstallatie')}
                        value={data.installations?.koelTypeInstallatie || 'Compressiekoeling'}
                        onChange={(e) => onChange('installations.koelTypeInstallatie', e.target.value)}
                      >
                        <option value="Compressiekoeling">{t('installations.cooling.comp')}</option>
                        <option value="Absorptiekoeling">{t('installations.cooling.abs')}</option>
                        <option value="Passieve vrije koeling">{t('installations.cooling.passive')}</option>
                      </LocalSelect>
                    </FieldGroup>
                    <FieldGroup label={renderLabelWithFlags('koelExpansie', t('installations.cooling.expansion'))}>
                      <LocalSelect
                        label={t('installations.cooling.expansion')}
                        validationStatus={getSelectValidationStatus('koelExpansie')}
                        value={data.installations?.koelExpansie || 'Directe koeling in de ruimte (airconditioning)'}
                        onChange={(e) => onChange('installations.koelExpansie', e.target.value)}
                      >
                        <option value="Directe koeling in de ruimte (airconditioning)">{t('installations.cooling.expDirect')}</option>
                        <option value="Directe koeling in het LBK (DX-systeem)">{t('installations.cooling.expLbk')}</option>
                        <option value="Met indirecte verdamping">{t('installations.cooling.expIndirect')}</option>
                      </LocalSelect>
                    </FieldGroup>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('koelDistributiemedium', t('installations.cooling.medium'))}>
                        <LocalSelect
                          label={t('installations.cooling.medium')}
                          validationStatus={getSelectValidationStatus('koelDistributiemedium')}
                          value={data.installations?.koelDistributiemedium || 'Water'}
                          onChange={(e) => onChange('installations.koelDistributiemedium', e.target.value)}
                        >
                          <option value="Water">{t('installations.cooling.medWater')}</option>
                          <option value="Lucht">{t('installations.cooling.medAir')}</option>
                          <option value="Koudemiddel">{t('installations.cooling.medRefrig')}</option>
                        </LocalSelect>
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('koelGeneratorsCount', t('installations.cooling.generatorsCount'))}>
                        <input
                          type="number"
                          className={`input-field font-bold ${getFieldBorder('koelGeneratorsCount')}`}
                          value={data.installations?.koelGeneratorsCount || '1'}
                          onChange={(e) => onChange('installations.koelGeneratorsCount', e.target.value)}
                        />
                      </FieldGroup>
                    </div>
                    <FieldGroup label={renderLabelWithFlags('koelWatertemprater', t('installations.cooling.waterFlowTemp'))}>
                      <LocalSelect
                        label={t('installations.cooling.waterFlowTemp')}
                        validationStatus={getSelectValidationStatus('koelWatertemprater')}
                        value={data.installations?.koelWatertemprater || '6/12 °C'}
                        onChange={(e) => onChange('installations.koelWatertemprater', e.target.value)}
                      >
                        <option>6/12 °C</option>
                        <option>12/16 °C</option>
                        <option>12/18 °C</option>
                        <option>17/21 °C</option>
                        <option value="Onbekend">{t('general.options.onbekend')}</option>
                      </LocalSelect>
                    </FieldGroup>
                    <FieldGroup label={renderLabelWithFlags('koelMainCirculationPump', t('installations.cooling.mainCirculationPump'))}>
                      <LocalSelect
                        label={t('installations.cooling.mainCirculationPump')}
                        validationStatus={getSelectValidationStatus('koelMainCirculationPump')}
                        value={data.installations?.koelMainCirculationPump || 'Werkelijk vermogen en EI'}
                        onChange={(e) => onChange('installations.koelMainCirculationPump', e.target.value)}
                      >
                        <option value="Werkelijk vermogen en EI">{t('installations.cooling.pumpActualEi')}</option>
                        <option value="Werkelijk vermogen">{t('installations.cooling.pumpActual')}</option>
                        <option value="Onbekend">{t('general.options.onbekend')}</option>
                      </LocalSelect>
                    </FieldGroup>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.cooling.delivery')}</h3>
                  <div className="space-y-4">
                    <FieldGroup label={renderLabelWithFlags('koelAfgiftesysteem', t('installations.cooling.deliverySystem'))}>
                      <LocalSelect
                        label={t('installations.cooling.deliverySystem')}
                        validationStatus={getSelectValidationStatus('koelAfgiftesysteem')}
                        value={data.installations?.koelAfgiftesysteem || 'Vloerkoeling'}
                        onChange={(e) => onChange('installations.koelAfgiftesysteem', e.target.value)}
                      >
                        <option value="Vloerkoeling">{t('installations.cooling.delFloor')}</option>
                        <option value="Wandkoeling">{t('installations.cooling.delWall')}</option>
                        <option value="Plafondkoeling">{t('installations.cooling.delCeiling')}</option>
                        <option value="Ventilatorconvectoren (aan plafond)">{t('installations.cooling.delFanCeiling')}</option>
                        <option value="Ventilatorconvectoren (aan buitenmuur)">{t('installations.cooling.delFanWall')}</option>
                        <option value="Overig of onbekend">{t('installations.cooling.delOther')}</option>
                      </LocalSelect>
                    </FieldGroup>
                    <FieldGroup label={renderLabelWithFlags('koelRegeling', t('installations.cooling.control'))}>
                      <LocalSelect
                        label={t('installations.cooling.control')}
                        validationStatus={getSelectValidationStatus('koelRegeling')}
                        value={data.installations?.koelRegeling || 'Standalone regeling'}
                        onChange={(e) => onChange('koelRegeling', e.target.value)}
                      >
                        <option value="Standalone regeling">{t('installations.cooling.ctrlStandalone')}</option>
                        <option value="Centrale regeling">{t('installations.cooling.ctrlCentral')}</option>
                        <option value="Overig of onbekend">{t('installations.cooling.ctrlOther')}</option>
                      </LocalSelect>
                    </FieldGroup>
                  </div>
                </div>

                {/* Foto's & Documenten - Koeling */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-on-surface-variant/70 uppercase tracking-widest flex items-center gap-2">
                      <Camera size={14} className="text-on-surface-variant/50" />
                      {t('installations.photosAndDocuments')} ({t('installations.koeling')})
                    </h3>
                    <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm">
                      <Plus size={12} />
                      {t('installations.uploadSelect')}
                    </button>
                  </div>
                  {(() => {
                    const files: any[] = getActiveInstDetails()[getSanitizedFileKey('Koeling')] || [];
                    if (files.length === 0) {
                      return (
                        <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="w-full cursor-pointer flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-outline-variant/20 rounded-xl text-on-surface-variant/40 hover:border-outline-variant/40 hover:bg-gray-100/50 transition-all">
                          <Camera size={24} />
                          <span className="text-xs font-semibold">{t('installations.clickToAddPhotos')}</span>
                        </button>
                      );
                    }
                    const photos = files.filter(f => f.type?.startsWith('image/'));
                    const docs = files.filter(f => !f.type?.startsWith('image/'));
                    return (
                      <div className="space-y-3">
                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {photos.map((f, i) => (
                              <div key={i} className="relative group/photo rounded-xl overflow-hidden border border-outline-variant/10 aspect-square bg-gray-100">
                                <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover cursor-pointer" onClick={() => openLightbox(photos.map((p: any) => p.dataUrl), photos.indexOf(f), f.name)} />
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100 transition-all cursor-pointer"><Trash2 size={10} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {docs.length > 0 && (
                          <div className="space-y-1.5">
                            {docs.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all group/doc">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText size={14} className="text-on-surface-variant/70" />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(f.dataUrl, '_blank')}>
                                  <p className="text-xs font-bold text-on-surface truncate">{f.name}</p>
                                  <p className="text-[10px] text-on-surface-variant/50">{f.size}</p>
                                </div>
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="opacity-100 lg:opacity-0 lg:group-hover/doc:opacity-100 p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {selectedCategory === 'Zonne-panelen' && (
            <CollapsibleSection title={t('installations.zonneEnergie')} showHeader={false}>
              <div className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">{t('installations.solar.installationType')}</h3>
                  <div className="space-y-4">
                    <FieldGroup label={renderLabelWithFlags('zonSysteem', t('installations.solar.system'))}>
                      <LocalSelect
                        label={t('installations.solar.system')}
                        validationStatus={getSelectValidationStatus('zonSysteem')}
                        value={data.installations?.zonSysteem || 'PV-panelen'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPvType(val);
                          onChange('installations.zonSysteem', val);
                        }}
                      >
                        <option value="PV-panelen">{t('installations.solar.sysPv')}</option>
                        <option value="PVT-panelen">{t('installations.solar.sysPvt')}</option>
                        <option value="Zonneboiler">{t('installations.solar.sysBoiler')}</option>
                      </LocalSelect>
                    </FieldGroup>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest mb-3">{t('installations.solar.configuration')}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('zonWattpiekvermogen', pvType.includes('PV') ? t('installations.solar.power') : t('installations.solar.area'))}>
                        <input
                          type="number"
                          className={`input-field font-bold ${getFieldBorder('zonWattpiekvermogen')}`}
                          value={data.installations?.zonWattpiekvermogen || '400'}
                          onChange={(e) => onChange('installations.zonWattpiekvermogen', e.target.value)}
                        />
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('zonAantal', t('installations.solar.count'))}>
                        <input
                          type="number"
                          className={`input-field font-bold ${getFieldBorder('zonAantal')}`}
                          value={data.installations?.zonAantal || '10'}
                          onChange={(e) => onChange('installations.zonAantal', e.target.value)}
                        />
                      </FieldGroup>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FieldGroup label={renderLabelWithFlags('zonOrientatie', t('installations.solar.orientation'))}>
                        <LocalSelect
                          label={t('installations.solar.orientation')}
                          validationStatus={getSelectValidationStatus('zonOrientatie')}
                          value={data.installations?.zonOrientatie || 'Zuid'}
                          onChange={(e) => onChange('installations.zonOrientatie', e.target.value)}
                        >
                          <option value="Zuid">{t('installations.solar.orientSouth')}</option>
                          <option value="Zuid-West">{t('installations.solar.orientSouthWest')}</option>
                          <option value="West">{t('installations.solar.orientWest')}</option>
                          <option value="Oost">{t('installations.solar.orientEast')}</option>
                          <option value="Noord">{t('installations.solar.orientNorth')}</option>
                        </LocalSelect>
                      </FieldGroup>
                      <FieldGroup label={renderLabelWithFlags('zonHellingshook', t('installations.solar.tiltAngle'))}>
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="number"
                            className={`input-field font-bold ${getFieldBorder('zonHellingshook')}`}
                            value={data.installations?.zonHellingshook || '35'}
                            onChange={(e) => onChange('installations.zonHellingshook', e.target.value)}
                          />
                          <span className="text-xs text-on-surface-variant/60 font-bold">°</span>
                        </div>
                      </FieldGroup>
                    </div>
                    <FieldGroup label={renderLabelWithFlags('zonBouwintegratie', t('installations.solar.shading'))}>
                      <LocalSelect
                        label={t('installations.solar.shading')}
                        validationStatus={getSelectValidationStatus('zonBouwintegratie')}
                        value={data.installations?.zonBouwintegratie || 'Onbekend'}
                        onChange={(e) => onChange('installations.zonBouwintegratie', e.target.value)}
                      >
                        <option value="Niet geventileerd: zonder luchtspouw">{t('installations.solar.shadeUnventilated')}</option>
                        <option value="Matig geventileerd: met luchtspouw">{t('installations.solar.shadeModerate')}</option>
                        <option value="Sterk geventileerd: open draagconstructie">{t('installations.solar.shadeStrong')}</option>
                        <option value="Op dakbedekking">{t('installations.solar.shadeStrong')}</option>
                        <option value="Onbekend">{t('general.options.onbekend')}</option>
                      </LocalSelect>
                    </FieldGroup>
                  </div>
                </div>

                {/* Foto's & Documenten - Zonne-panelen */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-on-surface-variant/70 uppercase tracking-widest flex items-center gap-2">
                      <Camera size={14} className="text-on-surface-variant/50" />
                      {t('installations.photosAndDocuments')} ({t('installations.zonneEnergie')})
                    </h3>
                    <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all shadow-sm">
                      <Plus size={12} />
                      {t('installations.uploadSelect')}
                    </button>
                  </div>
                  {(() => {
                    const files: any[] = getActiveInstDetails()[getSanitizedFileKey('Zonne-panelen')] || [];
                    if (files.length === 0) {
                      return (
                        <button type="button" onClick={() => setGlobalPhotoModalOpen(true)} className="w-full cursor-pointer flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-outline-variant/20 rounded-xl text-on-surface-variant/40 hover:border-outline-variant/40 hover:bg-gray-100/50 transition-all">
                          <Camera size={24} />
                          <span className="text-xs font-semibold">{t('installations.clickToAddPhotos')}</span>
                        </button>
                      );
                    }
                    const photos = files.filter(f => f.type?.startsWith('image/'));
                    const docs = files.filter(f => !f.type?.startsWith('image/'));
                    return (
                      <div className="space-y-3">
                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {photos.map((f, i) => (
                              <div key={i} className="relative group/photo rounded-xl overflow-hidden border border-outline-variant/10 aspect-square bg-gray-100">
                                <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover cursor-pointer" onClick={() => openLightbox(photos.map((p: any) => p.dataUrl), photos.indexOf(f), f.name)} />
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100 transition-all cursor-pointer"><Trash2 size={10} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {docs.length > 0 && (
                          <div className="space-y-1.5">
                            {docs.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all group/doc">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileText size={14} className="text-on-surface-variant/70" />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(f.dataUrl, '_blank')}>
                                  <p className="text-xs font-bold text-on-surface truncate">{f.name}</p>
                                  <p className="text-[10px] text-on-surface-variant/50">{f.size}</p>
                                </div>
                                <button type="button" onClick={() => handleFileDelete(files.indexOf(f))} className="opacity-100 lg:opacity-0 lg:group-hover/doc:opacity-100 p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CollapsibleSection>
          )}

        </div>
        )}


      </div>

      {/* Lightbox */}
      <PhotoViewerModal
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        slides={slidesFromUrls(lightboxPhotos.length > 0 ? lightboxPhotos : (selectedPhoto ? [selectedPhoto] : []))}
        index={lightboxIndex}
        onPrev={() => setLightboxIndex(i => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
        onNext={() => setLightboxIndex(i => (i + 1) % lightboxPhotos.length)}
        zIndexClassName="z-[99999]"
      />

      {/* Global Photo Modal */}
      {selectedCategory && (
        <GlobalPhotoSelectorModal
          isOpen={globalPhotoModalOpen}
          categoryName={selectedCategory}
          onClose={() => setGlobalPhotoModalOpen(false)}
          data={data}
          initialPhotoUrls={(() => {
          const currentFilesKey = getSanitizedFileKey(selectedCategory);
          const existingFiles: any[] = Array.isArray(getActiveInstDetails()[currentFilesKey]) ? getActiveInstDetails()[currentFilesKey] : [];
          return existingFiles.filter(f => f.type?.startsWith('image/')).map(f => f.dataUrl);
        })()}
        onSelect={(dataUrls) => {
          if (!dataUrls || dataUrls.length === 0) {
            // User unselected all photos
            const currentFilesKey = getSanitizedFileKey(selectedCategory);
            const existingFiles: any[] = Array.isArray(getActiveInstDetails()[currentFilesKey]) ? getActiveInstDetails()[currentFilesKey] : [];
            handleFieldChange(`installations.${currentFilesKey}`, existingFiles.filter(f => !f.type?.startsWith('image/')));
            return;
          }
          const currentFilesKey = getSanitizedFileKey(selectedCategory);
          const existingFiles: any[] = Array.isArray(getActiveInstDetails()[currentFilesKey]) ? getActiveInstDetails()[currentFilesKey] : [];
          
          const existingFilesByUrl = new Map(existingFiles.filter(f => f.type?.startsWith('image/')).map(f => [f.dataUrl, f]));
          const nonImageFiles = existingFiles.filter(f => !f.type?.startsWith('image/'));

          const finalImageFiles = dataUrls.map((url, i) => {
             if (existingFilesByUrl.has(url)) return existingFilesByUrl.get(url);
             return {
                name: `library_photo_${Date.now()}_${i}.jpg`,
                type: 'image/jpeg',
                size: '0 B',
                dataUrl: url
             };
          });

          const catMap: Record<string, string[]> = {
            'Ventilatie': ['vent', 'vent_extra', 'vent_3', 'vent_4'],
            'Verwarming': ['ketel', 'ketel_extra', 'ketel_3', 'ketel_4'],
            'Tapwater': ['tapwater', 'tapwater_extra', 'tapwater_3', 'tapwater_4'],
            'Koeling': ['koeling', 'koeling_extra', 'koeling_3', 'koeling_4'],
            'Zonne-panelen': ['solar', 'solar_extra', 'solar_3', 'solar_4']
          };
          const slots = catMap[selectedCategory] || [];
          const batchUpdates: Record<string, any> = {};
          slots.forEach(slot => {
             if (getActiveInstDetails()[`selectedPhotoIndex_${slot}`] === '-1') {
                 batchUpdates[`installations.selectedPhotoIndex_${slot}`] = undefined;
             }
          });
          batchUpdates[`installations.${currentFilesKey}`] = [...nonImageFiles, ...finalImageFiles];
          Object.entries(batchUpdates).forEach(([k, v]) => handleFieldChange(k, v));
        }}
        onUpload={handleGlobalUploadAction}
      />
      )}
      <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" ref={globalFileInputRef} onChange={handleFileUpload} />

      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? All entered data for this system will be lost."
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            handleRemoveCategory(categoryToDelete);
            setCategoryToDelete(null);
          }
        }}
      />
    </>
  );
};

export default InstallatieView;
export { InstallatieView };



