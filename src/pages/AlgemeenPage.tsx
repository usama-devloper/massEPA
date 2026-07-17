// src/pages/AlgemeenPage.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';

import { BackToTop } from '../components/common/BackToTop';
import { PageBackLink } from '../components/common/PageBackLink';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { StepContinueFooter } from '../components/common/StepContinueFooter';
import { Toast } from '../components/common/Toast';
import { Step, UserRole } from '../types';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import { translateAlgemeenOption } from '../i18n/translateOptions';
import { loadAlgemeenFromStorage, isApartmentBuildingType, saveAlgemeenToStorage } from '../storage/algemeenData';
import { AppSelect } from '../components/common/AppSelect';

const FLOOR_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => ({
  value: String(num),
  label: String(num),
}));

interface AlgemeenPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  formData: any;
  selectedRole: UserRole;
  setHasFloorPlans: (value: boolean | null) => void;
  setCurrentStepHandler: (step: Step) => void;
  renovationStatus: string;
  setRenovationStatus: (value: string) => void;
  renovationYear: string;
  setRenovationYear: (value: string) => void;
  bouwjaar: string;
  setBouwjaar: (value: string) => void;
  floorArea: string;
  setFloorArea: (value: string) => void;
  buurt: string;
  setBuurt: (value: string) => void;
  wijk: string;
  setWijk: (value: string) => void;
  gemeente: string;
  setGemeente: (value: string) => void;
  gebouwhoogte: string;
  setGebouwhoogte: (value: string) => void;
  hasFloorPlans: boolean | null;
  profilePhoto?: string;
}

// Position options based on Building Type
const positionOptions: { [key: string]: string[] } = {
  'Eengezinswoning': ['Vrijstaand', 'Kop-eind-of hoekligging', 'Tussenligging', 'Twee onder een kap'],
  'Woning in een appartementencomplex': ['Kop-eind-of hoekligging', 'Tussenligging'],
  'Eengezinswoning met niet zelfstandig wooneenheden met eigen adressen': ['Vrijstaand', 'Kop-eind-of hoekligging', 'Tussenligging', 'Twee onder een kap'],
  'Woning in een appartementencomplex met niet zelfstandige wooneenheden met eigen adressen': ['Kop-eind-of hoekligging', 'Tussenligging']
};

// Helper function to get location options based on building type and position
const getLocationOptions = (buildingType: string, position: string): string[] => {
  if (buildingType === 'Eengezinswoning' || 
      buildingType === 'Eengezinswoning met niet zelfstandig wooneenheden met eigen adressen') {
    return ['Hellend Dak', 'Deels plat dak', 'Plat dak / zonder kap'];
  }
  
  if (buildingType === 'Woning in een appartementencomplex' ||
      buildingType === 'Woning in een appartementencomplex met niet zelfstandige wooneenheden met eigen adressen') {
    return ['Onderste verdieping', 'Tussenverdieping', 'Bovenste verdieping', 'Onderste verdieping met dak'];
  }
  
  return [];
};

const BUILDING_TYPE_VALUES = [
  'Eengezinswoning',
  'Woning in een appartementencomplex',
  'Eengezinswoning met niet zelfstandig wooneenheden met eigen adressen',
  'Woning in een appartementencomplex met niet zelfstandige wooneenheden met eigen adressen',
] as const;

const WHICH_FLOOR_VALUES = [
  'Begane grond',
  '1e verdieping',
  '2e verdieping',
  '3e verdieping',
  '4e verdieping',
  '5e verdieping',
  '6e verdieping',
  '7e verdieping',
  '8e verdieping',
  '9e verdieping',
] as const;

// Check if building type is apartment (shows start floor question)
const isApartmentType = isApartmentBuildingType;

// Check if basement questions should be shown
const shouldShowBasementQuestions = (buildingType: string, whichFloor: string | null): boolean => {
  if (!isApartmentType(buildingType)) {
    return true;
  }
  return whichFloor === 'Begane grond';
};

/** Click the same Yes/No again to clear the answer (null = unselected). */
const toggleBooleanChoice = (current: boolean | null, value: boolean): boolean | null =>
  current === value ? null : value;

export function Algemeen({
  currentStep, setCurrentStep, onLogout, onManageProfile, onOpenSettings, onLogoClick, userName, formData, selectedRole,
  setHasFloorPlans, setCurrentStepHandler, renovationStatus, setRenovationStatus,
  renovationYear, setRenovationYear, bouwjaar, setBouwjaar, floorArea, setFloorArea,
  buurt, setBuurt,
  wijk, setWijk, gemeente, setGemeente, gebouwhoogte, setGebouwhoogte, hasFloorPlans,
  profilePhoto,
}: AlgemeenPageProps) {
  const { t } = useLanguage();
  const savedOnMount = loadAlgemeenFromStorage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast, setToast, showToast } = useToast();
  const parentHydratedRef = useRef(false);

  // State for dependent dropdowns
  const [buildingType, setBuildingType] = useState(
    () => savedOnMount.buildingType ?? 'Eengezinswoning',
  );
  const [position, setPosition] = useState(() => savedOnMount.position ?? 'Vrijstaand');
  const [location, setLocation] = useState(() => savedOnMount.location ?? 'Hellend Dak');
  const [numberOfFloors, setNumberOfFloors] = useState<number | null>(
    () => savedOnMount.numberOfFloors ?? null,
  );

  const [confirmedFields, setConfirmedFields] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('algemeenConfirmedFields');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [prefilledFields] = useState<string[]>(() => {
    const fields: string[] = [];
    fields.push('buildingType');
    fields.push('position');
    fields.push('location');
    if (savedOnMount.numberOfFloors !== undefined && savedOnMount.numberOfFloors !== null) {
      fields.push('numberOfFloors');
    }
    if (savedOnMount.whichFloor) {
      fields.push('whichFloor');
    }
    return fields;
  });

  const handleConfirmField = (field: string) => {
    setConfirmedFields((prev) => {
      if (prev.includes(field)) return prev;
      const next = [...prev, field];
      localStorage.setItem('algemeenConfirmedFields', JSON.stringify(next));
      return next;
    });
  };

  const fieldNeedsConfirmation = (field: string) => {
    return prefilledFields.includes(field) && !confirmedFields.includes(field);
  };
  const [city, setCity] = useState(() => savedOnMount.city ?? '');

  const [hasKelder, setHasKelder] = useState<boolean | null>(() => savedOnMount.hasKelder ?? null);
  const [hasKruipruimte, setHasKruipruimte] = useState<boolean | null>(
    () => savedOnMount.hasKruipruimte ?? null,
  );
  const [whichFloor, setWhichFloor] = useState<string | null>(() => savedOnMount.whichFloor ?? null);

  // Get available positions based on selected building type
  const availablePositions = positionOptions[buildingType] || [];
  
  // Get available locations based on building type and position
  const availableLocations = getLocationOptions(buildingType, position);
  const locationLabel =
    buildingType === 'Eengezinswoning' ||
    buildingType === 'Eengezinswoning met niet zelfstandig wooneenheden met eigen adressen'
      ? t('algemeen.labels.roofType')
      : t('algemeen.labels.location');
  const showWhichFloor = isApartmentType(buildingType);
  
  // Determine if basement questions should be shown
  const showBasementQuestions = shouldShowBasementQuestions(buildingType, whichFloor);
  
  // Update position when building type changes
  const handleBuildingTypeChange = (value: string) => {
    setBuildingType(value);
    if (!isApartmentBuildingType(value)) {
      setWhichFloor(null);
    }
    const newAvailablePositions = positionOptions[value] || [];
    if (newAvailablePositions.length > 0) {
      setPosition(newAvailablePositions[0]);
      const newLocationOptions = getLocationOptions(value, newAvailablePositions[0]);
      if (newLocationOptions.length > 0) {
        setLocation(newLocationOptions[0]);
      }
    } else {
      setPosition('');
      setLocation('');
    }
  };
  
  // Update location when position changes
  const handlePositionChange = (value: string) => {
    setPosition(value);
    const newLocationOptions = getLocationOptions(buildingType, value);
    if (newLocationOptions.length > 0) {
      setLocation(newLocationOptions[0]);
    } else {
      setLocation('');
    }
  };

  // Restore App-level fields from saved snapshot
  useEffect(() => {
    if (parentHydratedRef.current) return;
    parentHydratedRef.current = true;

    const saved = loadAlgemeenFromStorage();
    if (saved.hasFloorPlans === true || saved.hasFloorPlans === false) {
      setHasFloorPlans(saved.hasFloorPlans);
    }
    if (typeof saved.renovationStatus === 'string') setRenovationStatus(saved.renovationStatus);
    if (typeof saved.renovationYear === 'string') setRenovationYear(saved.renovationYear);
    if (typeof saved.bouwjaar === 'string') setBouwjaar(saved.bouwjaar);
    if (typeof saved.floorArea === 'string') setFloorArea(saved.floorArea);
    if (typeof saved.buurt === 'string') setBuurt(saved.buurt);
    if (typeof saved.wijk === 'string') setWijk(saved.wijk);
    if (typeof saved.gemeente === 'string') setGemeente(saved.gemeente);
    if (typeof saved.gebouwhoogte === 'string') setGebouwhoogte(saved.gebouwhoogte);
  }, []);

  useEffect(() => {
    if (!isApartmentBuildingType(buildingType) && whichFloor !== null) {
      setWhichFloor(null);
    }
  }, [buildingType, whichFloor]);

  useEffect(() => {
    saveAlgemeenToStorage({
      numberOfFloors,
      buildingType,
      position,
      location,
      hasFloorPlans,
      city,
      hasKelder,
      hasKruipruimte,
      whichFloor,
      renovationStatus,
      renovationYear,
      bouwjaar,
      floorArea,
      buurt,
      wijk,
      gemeente,
      gebouwhoogte,
    });
  }, [
    numberOfFloors,
    buildingType,
    position,
    location,
    hasFloorPlans,
    city,
    hasKelder,
    hasKruipruimte,
    whichFloor,
    renovationStatus,
    renovationYear,
    bouwjaar,
    floorArea,
    buurt,
    wijk,
    gemeente,
    gebouwhoogte,
  ]);

  // Validation function - checks if all required fields are filled
  const isFormComplete = (): boolean => {
    // Always required fields
    if (!buildingType) return false;
    if (!position) return false;
    if (!location) return false;
    if (numberOfFloors === null || numberOfFloors <= 0) return false;
    
    // For apartment type, "which floor" is required
    if (showWhichFloor && !whichFloor) return false;
    
    // Basement questions (shown only for houses or apartments on Begane grond)
    if (showBasementQuestions) {
      if (hasKelder === null) return false;
      if (hasKruipruimte === null) return false;
    }
    
    // City field for non-CLIENT users
    if (selectedRole !== UserRole.CLIENT && !city.trim()) return false;
    
    // Back Office specific fields
    if (selectedRole === UserRole.BACK_OFFICE) {
      if (!bouwjaar.trim()) return false;
      if (!floorArea.trim()) return false;
      if (!buurt.trim()) return false;
      if (!wijk.trim()) return false;
      if (!gemeente.trim()) return false;
      if (!gebouwhoogte.trim()) return false;
    }
    
    // Renovation status for BACK_OFFICE and INSPECTOR
    if (selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR) {
      if (!renovationStatus) return false;
      // Renovation year required only if renovation status is Yes
      if ((renovationStatus === 'Ja' || renovationStatus === 'Yes') && !renovationYear.trim()) {
        return false;
      }
    }
    
    return true;
  };

  const isComplete = isFormComplete();

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
    setCurrentStepHandler(step);
  };

  const cleanAddress = (address: string) => {
    if (!address) return '';
    return address.replace(/1$/, '').trim();
  };

  const showCityField = selectedRole !== UserRole.CLIENT;
  const isBackOffice = selectedRole === UserRole.BACK_OFFICE;
  const isBackOfficeOrInspector = selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR;
  const renovationShowsYear = renovationStatus === 'Ja' || renovationStatus === 'Yes';
 
  return (
    <div className="bg-background min-h-screen">
      <TopBar 
        showMenu={true}
        showUserMenu={true}
        userName={userName}
        onMenuClick={() => setMobileMenuOpen(true)}
        onManageProfile={onManageProfile}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={onLogoClick}
        profilePhoto={profilePhoto}
      />

      <AppSidebar 
        currentStep={currentStep} 
        handleStepChange={handleStepChange} 
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />
      
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        currentStep={currentStep} 
        handleStepChange={handleStepChange}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      <main className="app-page-main md:ml-64 pb-28">
        <BackToTop />
        
        <div className="app-shell-content">
          <PageBackLink label={t('algemeen.backToDashboard')} onClick={() => setCurrentStep(Step.DASHBOARD)} />

          <header className="app-page-title text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">{t('algemeen.title')}</h1>
          </header>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10">
            {/* Address - Read only */}
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                {t('algemeen.labels.address')}
              </label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">
                  {cleanAddress(formData.address) || t('algemeen.notProvided')}
                </p>
              </div>
            </div>

            {/* City field */}
            {showCityField && (
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  {t('algemeen.labels.city')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('algemeen.placeholders.city')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Back Office specific fields */}
            {isBackOffice && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    {t('algemeen.labels.neighborhood')}
                  </label>
                  <input
                    type="text"
                    value={buurt}
                    onChange={(e) => setBuurt(e.target.value)}
                    placeholder={t('algemeen.placeholders.neighborhood')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    {t('algemeen.labels.district')}
                  </label>
                  <input
                    type="text"
                    value={wijk}
                    onChange={(e) => setWijk(e.target.value)}
                    placeholder={t('algemeen.placeholders.district')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    {t('algemeen.labels.municipality')}
                  </label>
                  <input
                    type="text"
                    value={gemeente}
                    onChange={(e) => setGemeente(e.target.value)}
                    placeholder={t('algemeen.placeholders.municipality')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    {t('algemeen.labels.buildingHeight')}
                  </label>
                  <input
                    type="text"
                    value={gebouwhoogte}
                    onChange={(e) => setGebouwhoogte(e.target.value)}
                    placeholder={t('algemeen.placeholders.height')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="sm:col-span-2 sm:max-w-md">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    {t('algemeen.labels.floorArea')}
                  </label>
                  <input
                    type="text"
                    value={floorArea}
                    onChange={(e) => setFloorArea(e.target.value)}
                    placeholder={t('algemeen.placeholders.floorArea')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {/* Building Type and Position row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <AppSelect
                label={t('algemeen.labels.buildingType')}
                value={buildingType}
                onChange={handleBuildingTypeChange}
                needsConfirmation={fieldNeedsConfirmation('buildingType')}
                onOpen={() => handleConfirmField('buildingType')}
                options={BUILDING_TYPE_VALUES.map((value) => ({
                  value,
                  label: translateAlgemeenOption(value, t),
                }))}
              />

              <AppSelect
                label={t('algemeen.labels.position')}
                value={position}
                onChange={handlePositionChange}
                needsConfirmation={fieldNeedsConfirmation('position')}
                onOpen={() => handleConfirmField('position')}
                options={availablePositions.map((pos) => ({
                  value: pos,
                  label: translateAlgemeenOption(pos, t),
                }))}
              />
            </div>

            {/* Location/Daktype and No.of floor / Which floor row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <AppSelect
                label={locationLabel}
                value={location}
                onChange={setLocation}
                needsConfirmation={fieldNeedsConfirmation('location')}
                onOpen={() => handleConfirmField('location')}
                options={availableLocations.map((loc) => ({
                  value: loc,
                  label: translateAlgemeenOption(loc, t),
                }))}
              />

              {/* For Apartments: Start floor + No. of floors */}
              {showWhichFloor ? (
                <>
                  <AppSelect
                    label={t('algemeen.labels.startFloor')}
                    value={whichFloor ?? ''}
                    onChange={(v) => setWhichFloor(v === '' ? null : v)}
                    needsConfirmation={fieldNeedsConfirmation('whichFloor')}
                    onOpen={() => handleConfirmField('whichFloor')}
                    placeholder={t('Select floor')}
                    searchable={false}
                    options={WHICH_FLOOR_VALUES.map((value) => ({
                      value,
                      label: translateAlgemeenOption(value, t),
                    }))}
                  />
                  <AppSelect
                    label={t('algemeen.labels.numberOfFloors')}
                    value={numberOfFloors === null ? '' : String(numberOfFloors)}
                    onChange={(v) => setNumberOfFloors(v === '' ? null : parseInt(v, 10))}
                    needsConfirmation={fieldNeedsConfirmation('numberOfFloors')}
                    onOpen={() => handleConfirmField('numberOfFloors')}
                    placeholder={t('Select number of floors')}
                    searchable={false}
                    options={FLOOR_COUNT_OPTIONS}
                  />
                </>
              ) : (
                <AppSelect
                  label={t('algemeen.labels.numberOfFloors')}
                  value={numberOfFloors === null ? '' : String(numberOfFloors)}
                  onChange={(v) => setNumberOfFloors(v === '' ? null : parseInt(v, 10))}
                  needsConfirmation={fieldNeedsConfirmation('numberOfFloors')}
                  onOpen={() => handleConfirmField('numberOfFloors')}
                  placeholder={t('Select number of floors')}
                  searchable={false}
                  options={FLOOR_COUNT_OPTIONS}
                />
              )}
            </div>

            {/* Kelder - Yes/No inline - Only shown for houses or apartments on Begane grond */}
            {showBasementQuestions && (
              <>
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-700">{t('algemeen.labels.hasBasement')}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHasKelder(toggleBooleanChoice(hasKelder, true))}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        hasKelder === true
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasKelder(toggleBooleanChoice(hasKelder, false))}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        hasKelder === false
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('common.no')}
                    </button>
                  </div>
                </div>

                {/* Kruipruimte - Yes/No inline */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-700">{t('algemeen.labels.hasCrawlSpace')}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHasKruipruimte(toggleBooleanChoice(hasKruipruimte, true))}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        hasKruipruimte === true
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasKruipruimte(toggleBooleanChoice(hasKruipruimte, false))}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        hasKruipruimte === false
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('common.no')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Year of construction - Back Office only */}
            {isBackOffice && (
              <div className="py-3 border-t border-gray-100">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  {t('algemeen.labels.yearBuilt')}
                </label>
                <input
                  type="text"
                  value={bouwjaar}
                  onChange={(e) => setBouwjaar(e.target.value)}
                  placeholder={t('algemeen.placeholders.yearBuilt')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Renovation status - Back Office & Inspector */}
            {isBackOfficeOrInspector && (
              <div className="py-3 border-t border-gray-100">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                  {t('algemeen.labels.renovationStatus')}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRenovationStatus(renovationStatus === 'Ja' ? '' : 'Ja')}
                    className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      renovationStatus === 'Ja' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t('common.yes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenovationStatus(renovationStatus === 'Nee' ? '' : 'Nee')}
                    className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                      renovationStatus === 'Nee' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t('common.no')}
                  </button>
                </div>
              </div>
            )}

            {/* Year of renovation - Conditional */}
            <AnimatePresence>
              {isBackOfficeOrInspector && renovationShowsYear && (
                <motion.div
                   initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pb-3"
                >
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    {t('algemeen.labels.yearRenovation')}
                  </label>
                  <input
                    type="text"
                    value={renovationYear}
                    onChange={(e) => setRenovationYear(e.target.value)}
                    placeholder={t('algemeen.placeholders.yearRenovation')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <StepContinueFooter
        visible={isComplete}
        onClick={() => setCurrentStepHandler(Step.UPLOAD)}
        label={t('algemeen.continueHouseDesign')}
      />

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)} 
        onConfirm={() => {}} 
        title={t('algemeen.confirm.title')} 
        message={t('algemeen.confirm.message')} 
      />
    </div>
  );
}

export default Algemeen;