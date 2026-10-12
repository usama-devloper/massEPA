import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ArrowUp, ArrowRight } from 'lucide-react';
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

import { InspectionData, User } from '../../backoffice/backofficeTypes';

interface InvoersheetV2ViewProps {
  inspectionData?: InspectionData;
  userProfile?: User | null;
  onGlobalDataChange?: (pathOrUpdates: string | Record<string, string>, value?: string) => void;
}

export const InvoersheetV2View: React.FC<InvoersheetV2ViewProps> = ({ inspectionData, userProfile, onGlobalDataChange }) => {
  const [dossier, setDossier] = useState<ProjectDossier>(() => {
    const d = { ...initialProjectDossier };
    if (inspectionData) {
      const adresParts = (inspectionData.algemeen?.woning?.adres || '').trim().split(/\s+/);
      const houseNum = adresParts.length > 1 ? adresParts[adresParts.length - 1] : '';
      const street = adresParts.length > 1 ? adresParts.slice(0, -1).join(' ') : (inspectionData.algemeen?.woning?.adres || d.bag.address);
      
      d.bag = {
        ...d.bag,
        address: street || d.bag.address,
        houseNumber: houseNum || d.bag.houseNumber,
        city: inspectionData.algemeen?.woning?.plaats || d.bag.city,
        pandId: inspectionData.algemeen?.woning?.pandId || d.bag.pandId,
        vboId: inspectionData.algemeen?.woning?.vboId || d.bag.vboId,
      };
      d.bewoner = {
        name: inspectionData.algemeen?.bewoner?.persoon || '',
        contact: inspectionData.algemeen?.bewoner?.telefoon || '',
        postcode: inspectionData.algemeen?.bewoner?.postcode || '',
        email: inspectionData.algemeen?.bewoner?.email || '',
        address: inspectionData.algemeen?.bewoner?.adres || ''
      };
      d.inspector = {
        name: userProfile?.full_name || inspectionData.algemeen?.inspector?.adviseur || '',
        contact: inspectionData.algemeen?.inspector?.telefoon || '',
        email: userProfile?.email || '',
        address: inspectionData.algemeen?.inspector?.adres || ''
      };
    }
    return d;
  });
  const [activeChapter, setActiveChapter] = useState<ChapterId>('visuals');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [activeDrawingId, setActiveDrawingId] = useState<string>(initialProjectDossier.drawings[0]?.id || 'dwg-1');
  const [selectedElementId, setSelectedElementId] = useState<string>(initialProjectDossier.envelope[0]?.id || 'env-1');
  const [isBcrgOpen, setIsBcrgOpen] = useState<boolean>(false);
  const [bcrgTargetElementId, setBcrgTargetElementId] = useState<string | undefined>(undefined);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [spacesCount, setSpacesCount] = useState(8);

  const clientId = inspectionData?.clientId || 'default';
  const [flags, setFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    try {
      const saved = localStorage.getItem(`invoersheet_v2_flags_${clientId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [fieldRoles, setFieldRoles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`invoersheet_v2_field_roles_${clientId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleUpdateFlag = useCallback((fieldKey: string, flag: 'red' | 'yellow' | 'green' | null) => {
    setFlags(prev => {
      const updated: Record<string, 'red' | 'yellow' | 'green' | null> = { ...prev, [fieldKey]: flag };
      try {
        localStorage.setItem(`invoersheet_v2_flags_${clientId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [clientId]);

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
      const updated: Record<string, 'red' | 'yellow' | 'green' | null> = { ...prev, [fieldKey]: 'green' };
      try {
        localStorage.setItem(`invoersheet_v2_flags_${clientId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setHasUnsavedChanges(true);
  }, [clientId]);

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

  // Sync props to state if they change (e.g. user selected different client)
  useEffect(() => {
    if (inspectionData) {
      setDossier(prev => {
        const adresParts = (inspectionData.algemeen?.woning?.adres || '').trim().split(/\s+/);
        const houseNum = adresParts.length > 1 ? adresParts[adresParts.length - 1] : '';
        const street = adresParts.length > 1 ? adresParts.slice(0, -1).join(' ') : (inspectionData.algemeen?.woning?.adres || prev.bag.address);
        
        return {
          ...prev,
          bag: {
            ...prev.bag,
            address: street || prev.bag.address,
            houseNumber: houseNum || prev.bag.houseNumber,
            city: inspectionData.algemeen?.woning?.plaats || prev.bag.city,
            pandId: inspectionData.algemeen?.woning?.pandId || prev.bag.pandId,
            vboId: inspectionData.algemeen?.woning?.vboId || prev.bag.vboId,
          },
          bewoner: {
            name: inspectionData.algemeen?.bewoner?.persoon || '',
            contact: inspectionData.algemeen?.bewoner?.telefoon || '',
            postcode: inspectionData.algemeen?.bewoner?.postcode || '',
            email: inspectionData.algemeen?.bewoner?.email || '',
            address: inspectionData.algemeen?.bewoner?.adres || '',
            plaats: inspectionData.algemeen?.bewoner?.plaats || ''
          },
          inspector: {
            name: userProfile?.full_name || inspectionData.algemeen?.inspector?.adviseur || '',
            contact: inspectionData.algemeen?.inspector?.telefoon || '',
            email: userProfile?.email || '',
            address: inspectionData.algemeen?.inspector?.adres || '',
            postcode: inspectionData.algemeen?.inspector?.postcode || '',
            plaats: inspectionData.algemeen?.inspector?.plaats || ''
          },
          inspectionDate: inspectionData.algemeen?.inspector?.opnamedatum || prev.inspectionDate,
          invoerdatum: inspectionData.algemeen?.inspector?.invoerdatum || prev.invoerdatum,
          generalDetails: {
            bouwfase: inspectionData.algemeen?.woning?.bouwfase || 'Bestaande bouw',
            opnametype: inspectionData.algemeen?.woning?.opname || 'Basisopname',
            gebouwtype: inspectionData.algemeen?.woning?.gebouwtype || 'Eengezinswoning',
            subtype: inspectionData.algemeen?.woning?.subtype || 'Kop-eind-of hoekligging',
            daktypeLigging: inspectionData.algemeen?.woning?.daktype || 'Plat dak',
            gebouwhoogte: inspectionData.algemeen?.woning?.gebouwhoogte || '5.75',
          },
          technicalDetails: {
            vloerConstructie: inspectionData.algemeen?.woning?.floorConstructieType || 'Heavy',
            wandConstructie: inspectionData.algemeen?.woning?.wallConstructieType || 'Heavy',
            leidingdoorvoeren: inspectionData.algemeen?.technical?.leidingdoorvoeren || 'Aanwezig',
            aantal: inspectionData.algemeen?.technical?.aantal || '1',
            avr: inspectionData.algemeen?.technical?.avr || '1',
            gbo1: {
              l: inspectionData.algemeen?.technical?.gboTsLength?.[0] ?? '',
              w: inspectionData.algemeen?.technical?.gboTsWidth?.[0] ?? '',
              a: inspectionData.algemeen?.technical?.gboTs?.[0] ?? '42.10',
            },
            gbo2: {
              l: inspectionData.algemeen?.technical?.gboTsLength?.[1] ?? '',
              w: inspectionData.algemeen?.technical?.gboTsWidth?.[1] ?? '',
              a: inspectionData.algemeen?.technical?.gboTs?.[1] ?? '',
            },
            gbo3: {
              l: inspectionData.algemeen?.technical?.gboTsLength?.[2] ?? '',
              w: inspectionData.algemeen?.technical?.gboTsWidth?.[2] ?? '',
              a: inspectionData.algemeen?.technical?.gboTs?.[2] ?? '',
            }
          },
          envelope: inspectionData.envelope || prev.envelope,
          facadesData: inspectionData.facadesData || prev.facadesData,
          interiorSpacesData: inspectionData.interiorSpacesData || prev.interiorSpacesData
        };
      });
      setCalcOverrides(inspectionData.calcOverrides || {});
    }
  }, [inspectionData, userProfile]);

  // Live real-time NTA 8800 calculation
  const baseCalcResult = useMemo(() => {
    return calculateNta8800(dossier.bag, dossier.envelope, dossier.installations);
  }, [dossier.bag, dossier.envelope, dossier.installations]);

  const calcResult = useMemo(() => {
    return { ...baseCalcResult, ...calcOverrides };
  }, [baseCalcResult, calcOverrides]);

  // Update handlers
  const handleUpdateBag = (updated: Partial<BagIdentification>) => {
    setDossier((prev) => ({
      ...prev,
      bag: { ...prev.bag, ...updated }
    }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateBewoner = (field: keyof NonNullable<ProjectDossier['bewoner']>, value: string) => {
    setDossier((prev) => ({
      ...prev,
      bewoner: prev.bewoner ? { ...prev.bewoner, [field]: value } : undefined
    }));
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      // Map back to global InspectionData format
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
    setDossier((prev) => ({
      ...prev,
      inspector: prev.inspector ? { ...prev.inspector, [field]: value } : undefined
    }));
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      // Map back to global InspectionData format
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
    setDossier(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // In real app, map inspectionDate to appropriate global state if it exists
    if (onGlobalDataChange) {
      if (field === 'inspectionDate') {
        onGlobalDataChange('algemeen.inspector.opnamedatum', value);
      }
      if (field === 'invoerdatum') {
        onGlobalDataChange('algemeen.inspector.invoerdatum', value);
      }
    }
  };

  const handleUpdateGeneralDetails = (field: keyof NonNullable<ProjectDossier['generalDetails']>, value: string) => {
    setDossier((prev) => ({
      ...prev,
      generalDetails: prev.generalDetails ? { ...prev.generalDetails, [field]: value } : undefined
    }));
    setHasUnsavedChanges(true);

    if (onGlobalDataChange) {
      const fieldMap: Record<string, string> = {
        bouwfase: 'algemeen.woning.bouwfase',
        opnametype: 'algemeen.woning.opname',
        gebouwtype: 'algemeen.woning.gebouwtype',
        subtype: 'algemeen.woning.subtype',
        daktypeLigging: 'algemeen.woning.daktype',
        gebouwhoogte: 'algemeen.woning.gebouwhoogte',
      };
      if (fieldMap[field]) {
        onGlobalDataChange(fieldMap[field], value);
      }
    }
  };

  const handleUpdateTechnicalDetails = (field: keyof NonNullable<ProjectDossier['technicalDetails']>, value: any) => {
    setDossier((prev) => ({
      ...prev,
      technicalDetails: prev.technicalDetails ? { ...prev.technicalDetails, [field]: value } : undefined
    }));
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



      <div className="pt-4 px-4 md:px-6 pb-2 border-b border-outline-variant/10">
        {/* NTA 8800 Chapter Navigation Bar */}
        <ChapterNav
          activeChapter={activeChapter}
          onSelectChapter={setActiveChapter}
          facadeCount={dossier.facadesData?.length || 4}
          spacesCount={8} // Since spacesData isn't in dossier right now, defaulting to 8 for the mock, can adjust later
          unresolvedValidationCount={unresolvedValidationCount}
        />
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

