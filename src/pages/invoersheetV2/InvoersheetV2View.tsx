import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ArrowUp, ArrowRight, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { initialProjectDossier, BCRG_DATABASE } from './data/mockDossier';
import { ProjectDossier, EnvelopeElement, InstallationSystem, BagIdentification, InspectionPin } from './types';
import { calculateNta8800 } from './utils/nta8800Calculator';
import { Header } from './components/Header';
import { ChapterNav, ChapterId } from './components/ChapterNav';
import { VisualsHouseInfo } from './components/chapters/VisualsHouseInfo';
import { DossierOverview } from './components/chapters/DossierOverview';
import { ThermalEnvelope } from './components/chapters/ThermalEnvelope';
import { Installations } from './components/chapters/Installations';
import { InteractiveDrawingViewer } from './components/drawing/InteractiveDrawingViewer';
import { BcrgLookupModal } from './components/modals/BcrgLookupModal';
import { OfficialLabelModal } from './components/modals/OfficialLabelModal';

import { InspectionData, User } from '../backoffice/backofficeTypes';
import { createInitialDossier, hydrateDossier } from './utils/dossierHydrator';
import { loadAllUnifiedFlags, loadAllUnifiedRoles, saveUnifiedFlag } from './utils/flagsSync';

interface InvoersheetV2ViewProps {
  inspectionData?: InspectionData;
  userProfile?: User | null;
  onGlobalDataChange?: (pathOrUpdates: string | Record<string, string>, value?: string) => void;
}

export const InvoersheetV2View: React.FC<InvoersheetV2ViewProps> = ({ inspectionData, userProfile, onGlobalDataChange }) => {
  const [dossier, setDossier] = useState<ProjectDossier>(() => {
    return createInitialDossier(inspectionData, userProfile);
  });

  useEffect(() => {
    if (inspectionData) {
      setDossier(createInitialDossier(inspectionData, userProfile));
      const newClientId = inspectionData.clientId || inspectionData.id || 'default';
      setFlags(loadAllUnifiedFlags(newClientId, inspectionData));
      setFieldRoles(loadAllUnifiedRoles(newClientId, inspectionData));
    }
  }, [inspectionData, userProfile]);
  const [activeChapter, setActiveChapter] = useState<ChapterId>('visuals');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [activeDrawingId, setActiveDrawingId] = useState<string>(initialProjectDossier.drawings[0]?.id || 'dwg-1');
  const [selectedElementId, setSelectedElementId] = useState<string>(initialProjectDossier.envelope[0]?.id || 'env-1');
  const [isBcrgOpen, setIsBcrgOpen] = useState<boolean>(false);
  const [bcrgTargetElementId, setBcrgTargetElementId] = useState<string | undefined>(undefined);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [spacesCount, setSpacesCount] = useState(8);

  const clientId = inspectionData?.clientId || inspectionData?.id || 'default';
  const [flags, setFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    return loadAllUnifiedFlags(clientId, inspectionData);
  });

  const [fieldRoles, setFieldRoles] = useState<Record<string, string>>(() => {
    return loadAllUnifiedRoles(clientId, inspectionData);
  });

  const handleUpdateFlag = useCallback((fieldKey: string, flag: 'red' | 'yellow' | 'green' | null) => {
    setFlags(prev => {
      return saveUnifiedFlag(clientId, fieldKey, flag, prev, onGlobalDataChange);
    });
    setHasUnsavedChanges(true);
  }, [clientId, onGlobalDataChange]);

  const handleUpdateFieldRole = useCallback((fieldKey: string, role: string) => {
    setFieldRoles(prev => {
      const updated: Record<string, string> = { ...prev, [fieldKey]: role };
      try {
        localStorage.setItem(`invoersheet_v2_field_roles_${clientId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [clientId]);

  const handleAutoInspectField = useCallback((fieldKey: string) => {
    setFieldRoles(prev => {
      const updated: Record<string, string> = { ...prev, [fieldKey]: 'INS' };
      try {
        localStorage.setItem(`invoersheet_v2_field_roles_${clientId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setFlags(prev => {
      return saveUnifiedFlag(clientId, fieldKey, 'green', prev, onGlobalDataChange);
    });
    setHasUnsavedChanges(true);
  }, [clientId, onGlobalDataChange]);

    useEffect(() => {
    const handleStorageChange = () => {
      setFlags(loadAllUnifiedFlags(clientId, inspectionData));
      setFieldRoles(loadAllUnifiedRoles(clientId, inspectionData));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [clientId, inspectionData]);

  const CHAPTER_ORDER: ChapterId[] = ['visuals', 'identification', 'envelope', 'installations'];
  
  const getNextChapter = (): ChapterId | null => {
    const currentIndex = CHAPTER_ORDER.indexOf(activeChapter === 'dossier' ? 'identification' : activeChapter);
    if (currentIndex >= 0 && currentIndex < CHAPTER_ORDER.length - 1) {
      return CHAPTER_ORDER[currentIndex + 1];
    }
    return null;
  };

  const nextChapter = getNextChapter();
  
  const getNextChapterLabel = (chapter: ChapterId): string => {
    switch (chapter) {
      case 'identification': return 'CONTINUE TO IDENTIFICATION';
      case 'envelope': return 'CONTINUE TO EXTERIOR';
      case 'installations': return 'CONTINUE TO INTERIOR';
      default: return 'CONTINUE';
    }
  };

  const [calcOverrides, setCalcOverrides] = useState<Partial<ReturnType<typeof calculateNta8800>>>(() => {
    return inspectionData?.calcOverrides || {};
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Full hydration from all active sources (IndexedDB, storage, inspection data)
  useEffect(() => {
    let isMounted = true;
    hydrateDossier(inspectionData, userProfile, undefined).then((hydrated) => {
      if (isMounted) {
        setDossier(hydrated);
        if (hydrated.interiorSpacesData && hydrated.interiorSpacesData.length > 0) {
          setSpacesCount(hydrated.interiorSpacesData.length);
        }
      }
    });
    if (inspectionData?.calcOverrides) {
      setCalcOverrides(inspectionData.calcOverrides);
    }
    return () => { isMounted = false; };
  }, [inspectionData, userProfile]);

  // Persist local edits to storage for current client
  useEffect(() => {
    if (hasUnsavedChanges) {
      try {
        localStorage.setItem(`invoersheet_v2_dossier_${clientId}`, JSON.stringify(dossier));
      } catch (e) {}
    }
  }, [dossier, hasUnsavedChanges, clientId]);

  // Live real-time NTA 8800 calculation
  const baseCalcResult = useMemo(() => {
    return calculateNta8800(dossier.bag, dossier.envelope, dossier.installations);
  }, [dossier.bag, dossier.envelope, dossier.installations]);

  const calcResult = useMemo(() => {
    return { ...baseCalcResult, ...calcOverrides };
  }, [baseCalcResult, calcOverrides]);

  // Helper to persist current dossier to localStorage immediately
  const persistDossierLocal = useCallback((d: ProjectDossier) => {
    try {
      const cid = inspectionData?.clientId || inspectionData?.id || 'default';
      localStorage.setItem(`invoersheet_v2_dossier_${cid}`, JSON.stringify(d));
      if (cid !== 'default') {
        localStorage.setItem('invoersheet_v2_dossier_default', JSON.stringify(d));
      }
    } catch (e) {}
  }, [inspectionData]);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Direct backend save handler
  const handleSaveAudit = useCallback(async () => {
    setIsSaving(true);
    try {
      persistDossierLocal(dossier);

      const auditId = inspectionData?.id;
      if (auditId && !auditId.startsWith('cli_') && auditId !== 'default') {
        const { apiRequest } = await import('../../services/api');
        const gboTsList = [
          dossier.technicalDetails?.gbo1?.a || '',
          dossier.technicalDetails?.gbo2?.a || '',
          dossier.technicalDetails?.gbo3?.a || ''
        ].filter(Boolean);

        await apiRequest(`/api/audits/${auditId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            building_details: {
              adres: dossier.bag?.address,
              postcode: dossier.bag?.postalCode,
              plaats: dossier.bag?.city,
              gemeent: dossier.bag?.municipality,
              pand_id: dossier.bag?.pandId,
              vbo_id: dossier.bag?.vboId,
              bouwfase: dossier.generalDetails?.bouwfase,
              opname: dossier.generalDetails?.opnametype,
              gebouwtype: dossier.generalDetails?.gebouwtype,
              subtype: dossier.generalDetails?.subtype,
              daktype: dossier.generalDetails?.daktype || dossier.generalDetails?.daktypeLigging,
              ligging: dossier.generalDetails?.ligging,
              gebouwhoogte: dossier.generalDetails?.gebouwhoogte,
              wijk: (dossier.generalDetails as any)?.wijk,
              svb_status: (dossier.generalDetails as any)?.svbStatus,
              bron: (dossier.generalDetails as any)?.bron,
              technisch_complex: (dossier.generalDetails as any)?.complex,
              financieel_complex: (dossier.generalDetails as any)?.financieelComplex,
              vloeren_type: dossier.technicalDetails?.vloerConstructie,
              wanden_type: dossier.technicalDetails?.wandConstructie,
              leitungdoorvoeren: dossier.technicalDetails?.leidingdoorvoeren,
              aantal: (dossier.technicalDetails?.aantal !== '' && !isNaN(Number(dossier.technicalDetails?.aantal))) ? Number(dossier.technicalDetails?.aantal) : null,
              aantal_avr: (dossier.technicalDetails?.avr !== '' && !isNaN(Number(dossier.technicalDetails?.avr))) ? Number(dossier.technicalDetails?.avr) : null,
              gbo_ts: JSON.stringify(gboTsList)
            },
            client: {
              full_name: dossier.bewoner?.name,
              email: dossier.bewoner?.email,
              phone: dossier.bewoner?.contact,
              address: dossier.bewoner?.address,
              postcode: dossier.bewoner?.postcode,
              woonplaats: dossier.bewoner?.plaats
            },
            inspector: {
              full_name: dossier.inspector?.name,
              company_address: dossier.inspector?.address,
              company_postcode: dossier.inspector?.postcode,
              company_city: dossier.inspector?.plaats,
              phone_number: dossier.inspector?.contact,
              email: dossier.inspector?.email
            }
          })
        });
      }

      setHasUnsavedChanges(false);
    } catch (e) {
      console.error('Failed to save audit:', e);
    } finally {
      setIsSaving(false);
    }
  }, [dossier, inspectionData, persistDossierLocal]);

  // Debounced auto-save
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      handleSaveAudit();
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, handleSaveAudit]);

  // Update handlers with full field mappings & local persistence
  const handleUpdateBag = (updated: Partial<BagIdentification>) => {
    setDossier((prev) => {
      const newD = {
        ...prev,
        bag: { ...prev.bag, ...updated }
      };
      persistDossierLocal(newD);
      return newD;
    });
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      if (updated.municipality !== undefined) onGlobalDataChange('algemeen.woning.gemeent', updated.municipality);
      if (updated.address !== undefined) onGlobalDataChange('algemeen.woning.adres', updated.address);
      if (updated.postalCode !== undefined) onGlobalDataChange('algemeen.woning.postcode', updated.postalCode);
      if (updated.city !== undefined) onGlobalDataChange('algemeen.woning.plaats', updated.city);
      if (updated.pandId !== undefined) onGlobalDataChange('algemeen.woning.pandId', updated.pandId);
      if (updated.vboId !== undefined) onGlobalDataChange('algemeen.woning.vboId', updated.vboId);
      if (updated.constructionYear !== undefined) onGlobalDataChange('algemeen.woning.bouwjaar', String(updated.constructionYear));
    }
  };

  const handleUpdateBewoner = (field: keyof NonNullable<ProjectDossier['bewoner']>, value: string) => {
    setDossier((prev) => {
      const newD = {
        ...prev,
        bewoner: prev.bewoner ? { ...prev.bewoner, [field]: value } : {
          name: '', contact: '', email: '', address: '', postcode: '', plaats: '', [field]: value
        }
      };
      persistDossierLocal(newD);
      return newD;
    });
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      const fieldMap: Record<string, string> = {
        name: 'algemeen.bewoner.persoon',
        contact: 'algemeen.bewoner.telefoon',
        email: 'algemeen.bewoner.email',
        address: 'algemeen.bewoner.adres',
        postcode: 'algemeen.bewoner.postcode',
        plaats: 'algemeen.bewoner.plaats',
      };
      if (fieldMap[field]) {
        onGlobalDataChange(fieldMap[field], value);
      }
    }
  };

  const handleUpdateInspector = (field: keyof NonNullable<ProjectDossier['inspector']>, value: string) => {
    setDossier((prev) => {
      const newD = {
        ...prev,
        inspector: prev.inspector ? { ...prev.inspector, [field]: value } : {
          name: '', contact: '', email: '', address: '', postcode: '', plaats: '', [field]: value
        }
      };
      persistDossierLocal(newD);
      return newD;
    });
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      const fieldMap: Record<string, string> = {
        name: 'algemeen.inspector.adviseur',
        contact: 'algemeen.inspector.telefoon',
        email: 'algemeen.inspector.email',
        address: 'algemeen.inspector.adres',
        postcode: 'algemeen.inspector.postcode',
        plaats: 'algemeen.inspector.plaats',
      };
      if (fieldMap[field]) {
        onGlobalDataChange(fieldMap[field], value);
      }
    }
  };

  const handleUpdateDossierField = (field: keyof ProjectDossier, value: string) => {
    setDossier(prev => {
      const newD = { ...prev, [field]: value };
      persistDossierLocal(newD);
      return newD;
    });
    setHasUnsavedChanges(true);
    
    if (onGlobalDataChange) {
      if (field === 'inspectionDate') {
        onGlobalDataChange('algemeen.inspector.opnamedatum', value);
      }
      if (field === 'invoerdatum') {
        onGlobalDataChange('algemeen.inspector.invoerdatum', value);
      }
      if (field === 'streetviewUrl') {
        onGlobalDataChange('building_details.streetview_url', value);
      }
    }
  };

  const handleUpdateGeneralDetails = (field: keyof NonNullable<ProjectDossier['generalDetails']>, value: string) => {
    setDossier((prev) => {
      const newD = {
        ...prev,
        generalDetails: prev.generalDetails ? { ...prev.generalDetails, [field]: value } : {
          bouwfase: '', opnametype: '', gebouwtype: '', subtype: '', daktype: '', ligging: '', gebouwhoogte: '', [field]: value
        }
      };
      persistDossierLocal(newD);
      return newD;
    });
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      const fieldMap: Record<string, string> = {
        complex: 'algemeen.woning.technischComplex',
        financieelComplex: 'algemeen.woning.financieelComplex',
        bouwfase: 'algemeen.woning.bouwfase',
        opnametype: 'algemeen.woning.opname',
        gebouwtype: 'algemeen.woning.gebouwtype',
        subtype: 'algemeen.woning.subtype',
        daktypeLigging: 'algemeen.woning.daktype',
        daktype: 'algemeen.woning.daktype',
        ligging: 'algemeen.woning.ligging',
        gebouwhoogte: 'algemeen.woning.gebouwhoogte',
        wijk: 'algemeen.woning.wijk',
        svbStatus: 'algemeen.woning.svbStatus',
        bron: 'algemeen.woning.bron',
      };
      if (fieldMap[field]) {
        onGlobalDataChange(fieldMap[field], value);
      }
    }
  };

  const handleUpdateTechnicalDetails = (field: keyof NonNullable<ProjectDossier['technicalDetails']>, value: any) => {
    setDossier((prev) => {
      const newD = {
        ...prev,
        technicalDetails: prev.technicalDetails ? { ...prev.technicalDetails, [field]: value } : { [field]: value }
      };
      persistDossierLocal(newD);
      return newD;
    });
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      if (field === 'gbo1' || field === 'gbo2' || field === 'gbo3') {
         const idx = field === 'gbo1' ? 0 : field === 'gbo2' ? 1 : 2;
         const valObj = value || { l: '', w: '', a: '' };
         onGlobalDataChange(`algemeen.technical.gboTs.${idx}`, valObj.a || '');
         onGlobalDataChange(`algemeen.technical.gboTsLength.${idx}`, valObj.l || '');
         onGlobalDataChange(`algemeen.technical.gboTsWidth.${idx}`, valObj.w || '');
      } else {
        const fieldMap: Record<string, string> = {
          vloerConstructie: 'algemeen.woning.floorConstructieType',
          wandConstructie: 'algemeen.woning.wallConstructieType',
          leidingdoorvoeren: 'algemeen.technical.leidingdoorvoeren',
          aantal: 'algemeen.technical.aantal',
          avr: 'algemeen.technical.avr',
        };
        
        if (fieldMap[field as string]) {
          onGlobalDataChange(fieldMap[field as string], value);
        }
      }
    }
  };

  const handleUpdateEnvelope = (newEnvelope: EnvelopeElement[]) => {
    setDossier((prev) => ({
      ...prev,
      envelope: newEnvelope
    }));
    setHasUnsavedChanges(true);
    
    if (onGlobalDataChange) {
      onGlobalDataChange('envelope', newEnvelope as any);
    }
  };

  const handleUpdateFacadesData = (newFacadesData: any[]) => {
    setDossier((prev) => ({
      ...prev,
      facadesData: newFacadesData
    }));
    setHasUnsavedChanges(true);
    
    if (onGlobalDataChange) {
      onGlobalDataChange('facadesData', newFacadesData as any);
    }
  };

  const handleUpdateInstallations = (updated: Partial<InstallationSystem>) => {
    setDossier((prev) => ({
      ...prev,
      installations: { ...prev.installations, ...updated }
    }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateInteriorSpacesData = useCallback((data: any[]) => {
    setDossier((prev) => ({
      ...prev,
      interiorSpacesData: data
    }));
    setHasUnsavedChanges(true);
    
    if (onGlobalDataChange) {
      onGlobalDataChange('interiorSpacesData', data as any);
    }
  }, [onGlobalDataChange]);

  const handleToggleResolveRule = (ruleId: string) => {
    setDossier((prev) => ({
      ...prev,
      validationRules: prev.validationRules.map((r) =>
        r.id === ruleId ? { ...r, isResolved: !r.isResolved } : r
      )
    }));
    setHasUnsavedChanges(true);
  };

  const handleSignOffAudit = () => {
    setDossier((prev) => ({
      ...prev,
      status: 'Afgemeld EP-Online'
    }));
    setIsCertificateModalOpen(true);
    setHasUnsavedChanges(false);
  };

  const handleAddDrawingPin = (drawingId: string, pin: InspectionPin) => {
    setDossier((prev) => ({
      ...prev,
      drawings: prev.drawings.map((d) =>
        d.id === drawingId ? { ...d, pins: [...d.pins, pin] } : d
      )
    }));
    setHasUnsavedChanges(true);
  };

  // BCRG Database linking
  const handleOpenBcrgForElement = (elementId?: string) => {
    setBcrgTargetElementId(elementId);
    setIsBcrgOpen(true);
  };

  const handleApplyBcrgProduct = (product: typeof BCRG_DATABASE[0], targetId?: string) => {
    const idToApply = targetId || bcrgTargetElementId || selectedElementId;
    if (!idToApply) return;

    if ('certifiedCOP' in product) {
      setDossier((prev) => ({
        ...prev,
        installations: {
          ...prev.installations,
          heatingEfficiencyCOP: product.certifiedCOP || 0
        }
      }));
    } else if ('efficiencyPct' in product) {
      setDossier((prev) => ({
        ...prev,
        installations: {
          ...prev.installations,
          wtwEfficiencyPct: product.efficiencyPct ? Math.round(product.efficiencyPct) : 0
        }
      }));
    } else {
      setDossier((prev) => ({
        ...prev,
        envelope: prev.envelope.map((el) => {
          if (el.id === idToApply) {
            return {
              ...el,
              qualityStatement: true,
              bcrgCode: product.code,
              rc: 'certifiedRc' in product ? product.certifiedRc : el.rc,
              uValue: 'certifiedU' in product ? product.certifiedU : el.uValue,
              insulationType: product.productName
            };
          }
          return el;
        })
      }));
    }
    setHasUnsavedChanges(true);
  };

  // Optimization simulator actions from Overview
  const handleApplyOptimization = (type: string) => {
    if (type === 'pv') {
      setDossier((prev) => ({
        ...prev,
        installations: {
          ...prev.installations,
          solarPvPanelsCount: prev.installations.solarPvPanelsCount + 4
        }
      }));
    } else if (type === 'glass') {
      setDossier((prev) => ({
        ...prev,
        envelope: prev.envelope.map((el) =>
          el.type === 'raam'
            ? { ...el, uValue: 0.7, glazingType: 'HR+++ Triple', qualityStatement: true }
            : el
        )
      }));
    } else if (type === 'scop') {
      setDossier((prev) => ({
        ...prev,
        installations: {
          ...prev.installations,
          heatingEfficiencyCOP: 4.8
        }
      }));
    }
    setHasUnsavedChanges(true);
  };

  const unresolvedValidationCount = dossier.validationRules.filter(
    (r) => !r.isResolved && (r.severity === 'error' || r.severity === 'warning')
  ).length;

  return (
    <div className="invoersheet-v2 h-full bg-surface text-on-surface flex flex-col">



      <div className="pt-4 px-4 md:px-6 pb-2 border-b border-outline-variant/10 flex flex-wrap items-center justify-between gap-3">
        {/* NTA 8800 Chapter Navigation Bar */}
        <ChapterNav
          activeChapter={activeChapter}
          onSelectChapter={setActiveChapter}
          facadeCount={dossier.facadesData?.length || 4}
          spacesCount={8}
          unresolvedValidationCount={unresolvedValidationCount}
        />

        {/* Global Save Button with instant visual state */}
        <div className="flex items-center space-x-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={handleSaveAudit}
            disabled={isSaving}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Sla alle wijzigingen op in de database"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Opslaan...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Wijzigingen opslaan</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Opgeslagen ✓</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Active Chapter View */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`flex-1 p-4 md:p-6 pt-4 pb-28 overflow-y-auto ${isSplitView ? 'lg:max-w-[55%]' : 'w-full'}`}
        >
          <div className="mt-2">
          {activeChapter === 'visuals' && (
            <VisualsHouseInfo
              dossier={dossier}
              onNavigateToChapter={setActiveChapter}
              onSaveStreetviewUrl={(url) => {
                handleUpdateDossierField('streetviewUrl', url);
                setDossier(prev => ({
                  ...prev,
                  streetviewUrl: url,
                  bag: {
                    ...prev.bag,
                    streetviewUrl: url
                  }
                }));
                const auditKey = inspectionData?.id || inspectionData?.clientId || dossier.bag?.address || 'default';
    try {
      localStorage.setItem(`streetview_url_${auditKey}`, url);
      if (dossier.bag?.address) {
        localStorage.setItem(`streetview_url_${dossier.bag.address.toLowerCase().trim()}`, url);
      }
    } catch (e) {}
              }}
            />
          )}

          {(activeChapter === 'dossier' || activeChapter === 'identification') && (
            <DossierOverview
              dossier={dossier}
              calcResult={calcResult}
              onNavigateToChapter={setActiveChapter}
              onApplyOptimization={handleApplyOptimization}
              onUpdateBag={handleUpdateBag}
              onUpdateBewoner={handleUpdateBewoner}
              onUpdateInspector={handleUpdateInspector}
              onUpdateDossierField={handleUpdateDossierField}
              onUpdateGeneralDetails={handleUpdateGeneralDetails}
              onUpdateTechnicalDetails={handleUpdateTechnicalDetails}
              onUpdateCalcOverride={(field, value) => {
                setCalcOverrides(prev => {
                  const updated = { ...prev, [field]: value };
                  if (onGlobalDataChange) {
                    onGlobalDataChange(`calcOverrides.${field}`, value);
                  }
                  return updated;
                });
                setHasUnsavedChanges(true);
              }}
              flags={flags}
              onUpdateFlag={handleUpdateFlag}
              fieldRoles={fieldRoles}
              onUpdateFieldRole={handleUpdateFieldRole}
              onAutoInspectField={handleAutoInspectField}
            />
          )}

          {activeChapter === 'envelope' && (
            <ThermalEnvelope
              envelope={dossier.envelope}
              facadesData={dossier.facadesData}
              onUpdateEnvelope={handleUpdateEnvelope}
              onUpdateFacadesData={handleUpdateFacadesData}
              onOpenBcrgForElement={handleOpenBcrgForElement}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onNavigateToChapter={setActiveChapter}
              projectAddress={`${dossier.bag.address || ''}, ${dossier.bag.city || ''}`.trim().replace(/^,|,$/g, '')}
              projectNumber={dossier.dossierNumber}
              flags={flags}
              onUpdateFlag={handleUpdateFlag}
              fieldRoles={fieldRoles}
              onUpdateFieldRole={handleUpdateFieldRole}
              onAutoInspectField={handleAutoInspectField}
            />
          )}

          {activeChapter === 'installations' && (
            <Installations
              installations={dossier.installations}
              facadesData={dossier.facadesData}
              interiorSpacesData={dossier.interiorSpacesData}
              onUpdateInstallations={handleUpdateInstallations}
              onUpdateInteriorSpacesData={handleUpdateInteriorSpacesData}
              usableAreaAg={dossier.bag.usableAreaAg}
              onNavigateToChapter={setActiveChapter}
              onUpdateSpacesCount={setSpacesCount}
              flags={flags}
              onUpdateFlag={handleUpdateFlag}
              fieldRoles={fieldRoles}
              onUpdateFieldRole={handleUpdateFieldRole}
              onAutoInspectField={handleAutoInspectField}
            />
          )}


          </div>
        </div>

        {/* Global Next Chapter Button - Hidden on Desktop */}
        {nextChapter && (
          <div className="fixed bottom-6 md:bottom-8 right-6 md:right-8 z-40 pointer-events-auto lg:hidden">
            <button
              onClick={() => {
                setActiveChapter(nextChapter);
                scrollToTop();
              }}
              className="bg-[#162920] text-white px-5 md:px-8 py-2.5 md:py-3.5 rounded-full uppercase font-bold text-[10px] md:text-xs tracking-widest flex items-center space-x-2 shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:bg-[#1a3126] hover:shadow-[0_15px_35px_rgba(0,0,0,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
            >
              <span>{getNextChapterLabel(nextChapter)}</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1.5 md:ml-2" />
            </button>
          </div>
        )}

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-20 right-6 md:bottom-24 md:right-8 lg:bottom-8 z-50 bg-[#162920] hover:bg-[#1a3126] text-white p-3.5 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#162920] focus:ring-offset-2"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* Persistent Split-Screen CAD & Inspection Photos Viewer (when split view is toggled) */}
        {isSplitView && (
          <aside className="hidden lg:block lg:w-[45%] h-[calc(100vh-140px)] sticky top-[140px] shadow-lg">
            <InteractiveDrawingViewer
              drawings={dossier.drawings}
              activeDrawingId={activeDrawingId}
              onSelectDrawing={setActiveDrawingId}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onAddPin={handleAddDrawingPin}
            />
          </aside>
        )}
      </main>

      {/* BCRG Modal */}
      <BcrgLookupModal
        isOpen={isBcrgOpen}
        onClose={() => setIsBcrgOpen(false)}
        targetElementId={bcrgTargetElementId}
        onApplyBcrgProduct={handleApplyBcrgProduct}
      />

      {/* Official RVO Energielabel Certificate Modal */}
      <OfficialLabelModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        dossier={dossier}
        calcResult={calcResult}
      />
    </div>
  );
}

