// src/pages/App.tsx
import { useState, useEffect } from 'react';
import { Step, UserRole } from '../types';
import { LoginPage } from './LoginPage';
import { RegistrationPage } from './RegistrationPage';
import { OtpPage } from './OtpPage';
import { SetPasswordPage } from './SetPasswordPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import Algemeen from './AlgemeenPage';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.LOGIN);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  
  // Form Data State
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
  });

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('buildingID_formData');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {}
    }
  }, []);

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
  const [hasFloorPlans, setHasFloorPlans] = useState<boolean | null>(null);

  const handleLogin = (_email?: string) => {
    setIsLoggedIn(true);
    setLoggedInUser(formData.fullName || 'User');
    setCurrentStep(Step.DASHBOARD);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser('');
    setCurrentStep(Step.LOGIN);
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

  // Render appropriate page based on currentStep
  switch (currentStep) {
    case Step.LOGIN:
      return (
        <LoginPage
          onLogin={handleLogin}
          onRegisterClick={() => setCurrentStep(Step.INFORMATION)}
          onForgotPasswordClick={() => setCurrentStep(Step.FORGOT_PASSWORD)}
        />
      );
    
    case Step.INFORMATION:
      return (
        <RegistrationPage
          formData={formData}
          onFormDataChange={setFormData}
          onRegister={handleRegister}
          onLoginClick={() => setCurrentStep(Step.LOGIN)}
        />
      );
    
    case Step.OTP:
      return (
        <OtpPage 
          onVerify={handleOtpVerify}
          phoneNumber={formData.phoneNumber}
        />
      );
    
    case Step.SET_PASSWORD:
      return (
        <SetPasswordPage onComplete={handlePasswordComplete} />
      );
    
    case Step.FORGOT_PASSWORD:
      return (
        <ForgotPasswordPage onBackToLogin={() => setCurrentStep(Step.LOGIN)} />
      );
    
    case Step.DASHBOARD:
      return (
        <Algemeen 
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          onLogout={handleLogout}
          userName={loggedInUser || formData.fullName || 'User'}
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
          buurt={buurt}
          setBuurt={setBuurt}
          wijk={wijk}
          setWijk={setWijk}
          gemeente={gemeente}
          setGemeente={setGemeente}
          gebouwhoogte={gebouwhoogte}
          setGebouwhoogte={setGebouwhoogte}
          hasFloorPlans={hasFloorPlans} onManageProfile={function (): void {
            throw new Error('Function not implemented.');
          } }        />
      );
    
    default:
      // For other pages (UPLOAD, INSULATION_DETAILS, INSTALLATIE, KOZIJN_GLAS, COMPLETE)
      // You'll need to create these pages similarly
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{currentStep}</h1>
            <p className="text-gray-500 mt-2">Coming soon...</p>
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