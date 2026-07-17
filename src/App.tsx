// src/App.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { Step, UserRole, type FormData } from './types';
import { loadAppSnapshot, saveAppSnapshot, createDefaultSnapshot, type AppSnapshotV1 } from './storage/appSnapshot';
import { resetFilledUserData } from './storage/resetUserData';
import { loadBuildingAnswersDoc, mergeBuildingAnswersDoc, normalizeAddressKey } from './storage/buildingAnswers';
import { mergeAlgemeenInStorage } from './storage/algemeenData';
import { getDevTestUserByEmail } from './data/devTestUsers';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { OtpPage } from './pages/OtpPage';
import { SetPasswordPage } from './pages/SetPasswordPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UserProfilePage } from './pages/UserProfilePage';  // ← ADD THIS IMPORT
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import Algemeen from './pages/AlgemeenPage';
import { HouseDesignPage } from './pages/HouseDesignPage';
import { InsulationDetailsPage } from './pages/InsulationDetailsPage';
import { InstallatiePage } from './pages/InstallatiePage';
import { KozijnGlasPage } from './pages/KozijnGlasPage';
import { PhotoCapturePage } from './pages/PhotoCapturePage';
import { FinalReviewPage } from './pages/FinalReviewPage';
import { CompletePage } from './pages/CompletePage';
import { SettingsPage } from './pages/SettingsPage';
import { ClientsPage } from './pages/ClientsPage';
import BackOfficePortal from './pages/backoffice/BackOfficePortal';


function App() {
  const [idbReady, setIdbReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(Step.LOGIN);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [lastLoginEmail, setLastLoginEmail] = useState('');

  // Global event listeners to prevent negative values in number inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
        if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === 'E') {
          e.preventDefault();
        }
      }
    };
    
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.tagName === 'INPUT' && target.type === 'number') {
        if (target.value && parseFloat(target.value) < 0) {
          target.value = '0';
        }
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && target.tagName === 'INPUT' && target.type === 'number') {
        const text = e.clipboardData?.getData('text') || '';
        if (text.includes('-') || text.includes('e') || text.includes('+') || text.includes('E')) {
          e.preventDefault();
          // Filter out disallowed characters and paste positive value
          const cleanedText = text.replace(/[^0-9.]/g, '');
          if (cleanedText) {
            target.value = cleanedText;
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('input', handleInput, true);
    window.addEventListener('paste', handlePaste, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('input', handleInput, true);
      window.removeEventListener('paste', handlePaste, true);
    };
  }, []);

  // Form Data State
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
  });

  // Dashboard specific states
  const [renovationStatus, setRenovationStatus] = useState('Nee');
  const [renovationYear, setRenovationYear] = useState('');
  const [bouwjaar, setBouwjaar] = useState('');
  const [floorArea, setFloorArea] = useState('');
  const [vloerenType, setVloerenType] = useState('Licht');
  const [wandenType, setWandenType] = useState('Licht');
  const [gboT, setGboT] = useState('');
  const [leidingdoorvoeren, setLeidingdoorvoeren] = useState('');
  const [avr, setAvr] = useState('');
  const [buurt, setBuurt] = useState('');
  const [wijk, setWijk] = useState('');
  const [gemeente, setGemeente] = useState('');
  const [gebouwhoogte, setGebouwhoogte] = useState('');
  const [hasFloorPlans, setHasFloorPlans] = useState<boolean | null>(true);

  const hydrateSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadAppSnapshot()
      .then((snap) => {
        if (cancelled) return;
        setFormData(snap.profile);
        setIsLoggedIn(snap.session.isLoggedIn);
        setLoggedInUser(snap.session.loggedInUser);
        setCurrentStep(snap.session.currentStep);
        setSelectedRole(snap.session.selectedRole);
        setLastLoginEmail(snap.lastLoginEmail);
        setRenovationStatus(snap.building.renovationStatus);
        setRenovationYear(snap.building.renovationYear);
        setBouwjaar(snap.building.bouwjaar);
        setFloorArea(snap.building.floorArea);
        setVloerenType(snap.building.vloerenType);
        setWandenType(snap.building.wandenType);
        setGboT(snap.building.gboT);
        setLeidingdoorvoeren(snap.building.leidingdoorvoeren);
        setAvr(snap.building.avr);
        setBuurt(snap.building.buurt);
        setWijk(snap.building.wijk);
        setGemeente(snap.building.gemeente);
        setGebouwhoogte(snap.building.gebouwhoogte);
        setHasFloorPlans(snap.building.hasFloorPlans);
      })
      .catch(() => {
        /* IndexedDB may be unavailable in private mode with quota errors */
      })
      .finally(() => {
        if (!cancelled) setIdbReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFormData = (newData: FormData) => {
    setFormData(newData);
  };

  const idbSnapshot = useMemo((): AppSnapshotV1 => {
    return {
      v: 1,
      updatedAt: Date.now(),
      session: {
        isLoggedIn,
        loggedInUser,
        currentStep,
        selectedRole,
      },
      lastLoginEmail,
      profile: formData,
      building: {
        renovationStatus,
        renovationYear,
        bouwjaar,
        floorArea,
        vloerenType,
        wandenType,
        gboT,
        leidingdoorvoeren,
        avr,
        buurt,
        wijk,
        gemeente,
        gebouwhoogte,
        hasFloorPlans,
      },
    };
  }, [
    isLoggedIn,
    loggedInUser,
    currentStep,
    selectedRole,
    lastLoginEmail,
    formData,
    renovationStatus,
    renovationYear,
    bouwjaar,
    floorArea,
    vloerenType,
    wandenType,
    gboT,
    leidingdoorvoeren,
    avr,
    buurt,
    wijk,
    gemeente,
    gebouwhoogte,
    hasFloorPlans,
  ]);

  useEffect(() => {
    if (!idbReady) return;
    const t = window.setTimeout(() => {
      void saveAppSnapshot(idbSnapshot);
    }, 450);
    return () => window.clearTimeout(t);
  }, [idbReady, idbSnapshot]);

  /** Load shared building fields for this address (other users / incomplete flows). */
  useEffect(() => {
    if (!idbReady || !isLoggedIn) return;
    const raw = formData.address?.trim();
    if (!raw || raw.length < 6) return;

    let cancelled = false;
    const seq = ++hydrateSeq.current;
    const t = window.setTimeout(() => {
      if (cancelled || seq !== hydrateSeq.current) return;
      void loadBuildingAnswersDoc(raw).then((doc) => {
        if (cancelled || seq !== hydrateSeq.current || !doc?.building) return;
        const b = doc.building;
        setRenovationStatus(b.renovationStatus);
        setRenovationYear(b.renovationYear);
        setBouwjaar(b.bouwjaar);
        setFloorArea(b.floorArea);
        setVloerenType(b.vloerenType);
        setWandenType(b.wandenType);
        setGboT(b.gboT);
        setLeidingdoorvoeren(b.leidingdoorvoeren);
        setAvr(b.avr);
        setBuurt(b.buurt);
        setWijk(b.wijk);
        setGemeente(b.gemeente);
        setGebouwhoogte(b.gebouwhoogte);
        setHasFloorPlans(b.hasFloorPlans);
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [idbReady, isLoggedIn, formData.address]);

  /** Persist building + profile hint per address for collaboration / resume. */
  useEffect(() => {
    if (!idbReady || !isLoggedIn) return;
    const raw = formData.address?.trim();
    if (!raw || !normalizeAddressKey(raw)) return;

    const t = window.setTimeout(() => {
      void mergeBuildingAnswersDoc(raw, {
        building: idbSnapshot.building,
        profileHint: {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        },
        lastEditedByEmail: formData.email || lastLoginEmail || 'unknown',
        lastEditedByName: loggedInUser || formData.fullName || 'User',
      });
    }, 900);
    return () => clearTimeout(t);
  }, [
    idbReady,
    isLoggedIn,
    formData.address,
    formData.fullName,
    formData.email,
    formData.phoneNumber,
    lastLoginEmail,
    loggedInUser,
    idbSnapshot.building,
  ]);

  // Login handler — mock auth; persists session + last email via snapshot (never passwords)
  const handleLogin = (email?: string) => {
    const trimmed = email?.trim();
    if (trimmed) setLastLoginEmail(trimmed);

    const dev = trimmed ? getDevTestUserByEmail(trimmed) : undefined;
    if (dev) {
      setSelectedRole(dev.role);
      setLoggedInUser(dev.displayName);
      setFormData((prev) => ({
        ...prev,
        email: dev.email,
        ...(dev.defaultFullName ? { fullName: dev.defaultFullName } : {}),
        ...(dev.defaultPhone ? { phoneNumber: dev.defaultPhone } : {}),
        ...(dev.defaultAddress ? { address: dev.defaultAddress } : {}),
      }));
    } else {
      setLoggedInUser(formData.fullName || 'User');
    }

    setIsLoggedIn(true);
    setCurrentStep(Step.HOME);
  };

  // User Profile handlers
  const handleUpdateUser = (newData: FormData) => {
    updateFormData(newData);
    setLoggedInUser(newData.fullName || 'User');
  };

  const handleProfileContinue = () => {
    setCurrentStep(Step.HOME);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser('');
    setSelectedRole(UserRole.CLIENT);
    setCurrentStep(Step.LOGIN);
  };

  const handleManageProfile = () => {
    setCurrentStep(Step.USER_PROFILE);
  };

  const handleResetUserData = async () => {
    await resetFilledUserData(formData.address);
    const defaults = createDefaultSnapshot().building;
    setRenovationStatus(defaults.renovationStatus);
    setRenovationYear(defaults.renovationYear);
    setBouwjaar(defaults.bouwjaar);
    setFloorArea(defaults.floorArea);
    setVloerenType(defaults.vloerenType);
    setWandenType(defaults.wandenType);
    setGboT(defaults.gboT);
    setLeidingdoorvoeren(defaults.leidingdoorvoeren);
    setAvr(defaults.avr);
    setBuurt(defaults.buurt);
    setWijk(defaults.wijk);
    setGemeente(defaults.gemeente);
    setGebouwhoogte(defaults.gebouwhoogte);
    setHasFloorPlans(defaults.hasFloorPlans);
    hydrateSeq.current += 1;
  };

  const handleOpenClientDossier = (profile: FormData, building: AppSnapshotV1['building']) => {
    // Switch context to the selected client (only building + address fields are loaded via App state).
    setFormData(profile);

    setRenovationStatus(building.renovationStatus);
    setRenovationYear(building.renovationYear);
    setBouwjaar(building.bouwjaar);
    setFloorArea(building.floorArea);
    setVloerenType(building.vloerenType);
    setWandenType(building.wandenType);
    setGboT(building.gboT);
    setLeidingdoorvoeren(building.leidingdoorvoeren);
    setAvr(building.avr);
    setBuurt(building.buurt);
    setWijk(building.wijk);
    setGemeente(building.gemeente);
    setGebouwhoogte(building.gebouwhoogte);
    setHasFloorPlans(building.hasFloorPlans);

    mergeAlgemeenInStorage({
      hasFloorPlans: building.hasFloorPlans,
      renovationStatus: building.renovationStatus,
      renovationYear: building.renovationYear,
      bouwjaar: building.bouwjaar,
      floorArea: building.floorArea,
      buurt: building.buurt,
      wijk: building.wijk,
      gemeente: building.gemeente,
      gebouwhoogte: building.gebouwhoogte,
    });

    setCurrentStep(Step.ALGEMEEN);
  };

  const handleRegister = () => {
    setCurrentStep(Step.OTP);
  };

  const handleOtpVerify = () => {
    setCurrentStep(Step.SET_PASSWORD);
  };

  const handlePasswordComplete = () => {
    setCurrentStep(Step.LOGIN);
  };

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
  };

  const handleLogoNavigation = () => {
    if (!isLoggedIn) {
      setCurrentStep(Step.LOGIN);
      return;
    }
    setCurrentStep(Step.HOME);
  };

  // Common props for app pages
  const appPageProps = {
    currentStep,
    setCurrentStep,
    onLogout: handleLogout,
    onManageProfile: handleManageProfile,
    onOpenSettings: () => setCurrentStep(Step.SETTINGS),
    userName: loggedInUser || formData.fullName || 'User',
    selectedRole,
    onLogoClick: handleLogoNavigation,
    profilePhoto: formData.profilePhoto,
  };

  if (!idbReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-background text-sm font-medium">
        Loading…
      </div>
    );
  }

  // Render appropriate page based on currentStep or user role
  if (isLoggedIn && selectedRole === UserRole.BACK_OFFICE) {
    return (
      <BackOfficePortal 
        onLogout={handleLogout}
        userName={loggedInUser}
      />
    );
  }

  switch (currentStep) {
    case Step.LOGIN:
      return (
        <LoginPage
          initialEmail={lastLoginEmail}
          onLogin={handleLogin}
          onRegisterClick={() => setCurrentStep(Step.INFORMATION)}
          onForgotPasswordClick={() => setCurrentStep(Step.FORGOT_PASSWORD)}
          onLogoClick={handleLogoNavigation}
        />
      );
    
    case Step.INFORMATION:
      return (
        <RegistrationPage
          formData={formData}
          onFormDataChange={updateFormData}
          onRegister={handleRegister}
          onLoginClick={() => setCurrentStep(Step.LOGIN)}
          onLogoClick={handleLogoNavigation}
        />
      );
    
    case Step.OTP:
      return (
        <OtpPage
          onVerify={handleOtpVerify}
          phoneNumber={formData.phoneNumber}
          onLogoClick={handleLogoNavigation}
        />
      );
    
    case Step.SET_PASSWORD:
      return (
        <SetPasswordPage onComplete={handlePasswordComplete} onLogoClick={handleLogoNavigation} />
      );
    
    case Step.FORGOT_PASSWORD:
      return (
        <ForgotPasswordPage
          onBackToLogin={() => setCurrentStep(Step.LOGIN)}
          onLogoClick={handleLogoNavigation}
        />
      );
    
    case Step.USER_PROFILE:
      return (
        <UserProfilePage
          userData={formData}
          onUpdateUser={handleUpdateUser}
          onContinue={handleProfileContinue}
          onLogout={handleLogout}
          userName={loggedInUser || formData.fullName || 'User'}
          readOnly={selectedRole === UserRole.CLIENT}
          onOpenSettings={() => setCurrentStep(Step.SETTINGS)}
          onLogoClick={handleLogoNavigation}
        />
      );
    
    case Step.HOME:
      return (
        <HomePage
          {...appPageProps}
          formData={formData}
        />
      );

    case Step.DASHBOARD:
      return <DashboardPage {...appPageProps} />;
    
    case Step.ALGEMEEN:
      return (
        <Algemeen 
          {...appPageProps}
          formData={formData}
          selectedRole={selectedRole}
          setHasFloorPlans={setHasFloorPlans}
          setCurrentStepHandler={handleStepChange}
          renovationStatus={renovationStatus}
          setRenovationStatus={setRenovationStatus}
          renovationYear={renovationYear}
          setRenovationYear={setRenovationYear}
          bouwjaar={bouwjaar}
          setBouwjaar={setBouwjaar}
          floorArea={floorArea}
          setFloorArea={setFloorArea}
          buurt={buurt}
          setBuurt={setBuurt}
          wijk={wijk}
          setWijk={setWijk}
          gemeente={gemeente}
          setGemeente={setGemeente}
          gebouwhoogte={gebouwhoogte}
          setGebouwhoogte={setGebouwhoogte}
          hasFloorPlans={hasFloorPlans}
        />
      );
    
    case Step.UPLOAD:
      return (
        <HouseDesignPage
          {...appPageProps}
          hasFloorPlans={hasFloorPlans}
          selectedRole={selectedRole}
          vloerenType={vloerenType}
          setVloerenType={setVloerenType}
          wandenType={wandenType}
          setWandenType={setWandenType}
          gboT={gboT}
          setGboT={setGboT}
          leidingdoorvoeren={leidingdoorvoeren}
          setLeidingdoorvoeren={setLeidingdoorvoeren}
          avr={avr}
          setAvr={setAvr}
        />
      );
    
    case Step.INSULATION_DETAILS:
      return <InsulationDetailsPage {...appPageProps} selectedRole={selectedRole} />;
    
    case Step.INSTALLATIE:
      return <InstallatiePage {...appPageProps} selectedRole={selectedRole} />;
    
    case Step.KOZIJN_GLAS:
      return <KozijnGlasPage {...appPageProps} />;

    case Step.PHOTO_CAPTURE:
      return <PhotoCapturePage {...appPageProps} />;



    case Step.FINAL_REVIEW:
      return (
        <FinalReviewPage
          {...appPageProps}
          selectedRole={selectedRole}
          bouwjaar={bouwjaar}
          buurt={buurt}
          wijk={wijk}
          gemeente={gemeente}
          hasFloorPlans={hasFloorPlans}
          vloerenType={vloerenType}
          wandenType={wandenType}
          gboT={gboT}
          leidingdoorvoeren={leidingdoorvoeren}
          avr={avr}
        />
      );

    case Step.COMPLETE:
      return <CompletePage {...appPageProps} />;

    case Step.SETTINGS:
      return <SettingsPage {...appPageProps} onResetUserData={handleResetUserData} />;

    case Step.CLIENTS:
      if (selectedRole === UserRole.CLIENT) {
        return <DashboardPage {...appPageProps} />;
      }
      return (
        <ClientsPage
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onLogout={handleLogout}
          onManageProfile={handleManageProfile}
          onOpenSettings={() => setCurrentStep(Step.SETTINGS)}
          onLogoClick={handleLogoNavigation}
          userName={loggedInUser || formData.fullName || 'User'}
          selectedRole={selectedRole}
          editorEmail={lastLoginEmail || formData.email || loggedInUser || 'editor'}
          onOpenClientDossier={handleOpenClientDossier}
          profilePhoto={formData.profilePhoto}
        />
      );
    
    default:
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{currentStep}</h1>
            <p className="text-gray-500 mt-2">Page under construction</p>
            <button 
              onClick={() => setCurrentStep(Step.DASHBOARD)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
  }
}

export default App;