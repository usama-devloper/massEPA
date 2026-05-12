/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight,
  ArrowLeft,
  Edit as Edit3, 
  CheckCircle,
  Shield,
  Building2,
  User,
  Upload,
  HelpCircle,
  Camera,
  Info,
  Check,
  CloudUpload,
  X,
  FolderOpen,
  Plus,
  Layers,
  Leaf,
  Frame,
  Menu,
  ArrowUp,
  LogOut
} from 'lucide-react';
import { UserRole, Step, FormData } from './types';
import { ASSETS, ROLE_CONFIG } from './constants';

// ============ TOAST COMPONENT ============
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={`fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-white min-w-[200px] text-sm font-bold`}
    >
      {message}
    </motion.div>
  );
};

// ============ BACK TO TOP BUTTON ============
const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-40 hover:bg-primary/80 transition-all"
    >
      <ArrowUp size={20} />
    </button>
  );
};

// ============ CONFIRMATION MODAL ============
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="font-display font-black text-xl mb-2">{title}</h3>
        <p className="text-on-surface-variant mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-bold text-sm text-on-surface-variant hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-bold text-sm bg-primary text-white hover:bg-primary/80"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============ DEVNAV - ONLY FOR APP PAGES ============
const DevNav = ({ currentStep, setCurrentStep }: any) => {
  // Only show on main app pages
  const appPages = [Step.DASHBOARD, Step.UPLOAD, Step.INSULATION_DETAILS, Step.INSTALLATIE, Step.KOZIJN_GLAS, Step.COMPLETE];
  if (!appPages.includes(currentStep)) return null;

  return (
    <div className="fixed bottom-2 left-2 right-2 z-[9999] bg-primary/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-2xl border border-white/10">
      <div className="flex flex-wrap gap-1 justify-center mb-1">
        {appPages.map((step) => (
          <button
            key={step}
            onClick={() => setCurrentStep(step)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
              currentStep === step 
                ? 'bg-white text-primary shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {step === Step.DASHBOARD && 'Info'}
            {step === Step.UPLOAD && 'Upload'}
            {step === Step.INSULATION_DETAILS && 'Ins'}
            {step === Step.INSTALLATIE && 'Inst'}
            {step === Step.KOZIJN_GLAS && 'Koz'}
            {step === Step.COMPLETE && 'Done'}
          </button>
        ))}
      </div>
      <div className="text-center text-white/40 text-[8px] font-bold uppercase tracking-wider border-t border-white/10 pt-1 mt-1">
        © 2026 BuildingID
      </div>
    </div>
  );
};

// ============ SIDEBAR - ONLY FOR APP PAGES ============
const AppSidebar = ({ currentStep, handleStepChange, onLogout, userName }: any) => {
  const appPages = [Step.DASHBOARD, Step.UPLOAD, Step.INSULATION_DETAILS, Step.INSTALLATIE, Step.KOZIJN_GLAS, Step.COMPLETE];
  if (!appPages.includes(currentStep)) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 hidden md:flex flex-col bg-[#f3f4ee] p-5 z-40 border-r border-outline-variant/10">
      {/* User Name at Top */}
      <div className="mb-6 p-3 bg-primary/10 rounded-xl">
        <p className="text-[10px] font-black uppercase tracking-wider text-primary/60">Logged in as</p>
        <p className="font-display font-black text-lg text-primary">{userName || 'Guest User'}</p>
      </div>

      <div className="flex-grow">
        <h2 className="font-display font-black text-xl text-primary-container mb-4">Menu</h2>
        <nav className="space-y-1">
          {appPages.map((step) => (
            <button
              key={step}
              onClick={() => handleStepChange(step)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                currentStep === step ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-gray-200'
              }`}
            >
              {step === Step.INSULATION_DETAILS ? 'Insulation Details' :
               step === Step.KOZIJN_GLAS ? 'Kozijn & Glas' :
               step === Step.INSTALLATIE ? 'Installatie' :
               step}
            </button>
          ))}
        </nav>
      </div>

      {/* Logout Button at Bottom */}
      <button
        onClick={onLogout}
        className="mt-auto flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
};

// ============ MOBILE SIDEBAR ============
const MobileSidebar = ({ isOpen, onClose, currentStep, handleStepChange, onLogout, userName }: any) => {
  const appPages = [Step.DASHBOARD, Step.UPLOAD, Step.INSULATION_DETAILS, Step.INSTALLATIE, Step.KOZIJN_GLAS, Step.COMPLETE];
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[150]" onClick={onClose} />
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        className="fixed left-0 top-0 h-full w-64 bg-[#f3f4ee] p-5 z-[160] shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-black text-xl text-primary-container">Menu</h2>
          <button onClick={onClose} className="p-1"><X size={20} /></button>
        </div>

        {/* User Name */}
        <div className="mb-6 p-3 bg-primary/10 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary/60">Logged in as</p>
          <p className="font-display font-black text-lg text-primary">{userName || 'Guest User'}</p>
        </div>

        <nav className="space-y-1 flex-grow">
          {appPages.map((step) => (
            <button
              key={step}
              onClick={() => { handleStepChange(step); onClose(); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                currentStep === step ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-gray-200'
              }`}
            >
              {step === Step.INSULATION_DETAILS ? 'Insulation Details' :
               step === Step.KOZIJN_GLAS ? 'Kozijn & Glas' :
               step === Step.INSTALLATIE ? 'Installatie' :
               step}
            </button>
          ))}
        </nav>

        <button
          onClick={() => { onLogout(); onClose(); }}
          className="mt-6 flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </motion.aside>
    </>
  );
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.LOGIN);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Password show/hide states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // User session
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');

  // Form Data State
  const [formData, setFormData] = useState<FormData & { advisorName?: string, companyName?: string, certificaathouder?: string }>({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
    advisorName: '',
    companyName: '',
    certificaathouder: '',
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('buildingID_formData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (e) { console.error('Failed to load saved data'); }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('buildingID_formData', JSON.stringify(formData));
  }, [formData]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser('');
    setCurrentStep(Step.LOGIN);
    showToast('Logged out successfully', 'success');
  };

  // Validation functions
  const validateRegistration = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.email?.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const [otp, setOtp] = useState(['', '', '', '']);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [renovationStatus, setRenovationStatus] = useState('Nee');
  const [renovationYear, setRenovationYear] = useState('');
  const [bouwjaar, setBouwjaar] = useState('');
  const [vloerenType, setVloerenType] = useState('Licht');
  const [wandenType, setWandenType] = useState('Licht');
  const [gboT, setGboT] = useState('');
  const [leidingdoorvoeren, setLeidingdoorvoeren] = useState('');
  const [avr, setAvr] = useState('');
  const [buurt, setBuurt] = useState('');
  const [wijk, setWijk] = useState('');
  const [gemeente, setGemeente] = useState('');
  const [gebouwhoogte, setGebouwhoogte] = useState('');
  const [floorArea, setFloorArea] = useState('');
  const [hasFloorPlans, setHasFloorPlans] = useState<boolean | null>(null);
  const [isolatieStatus, setIsolatieStatus] = useState<boolean | null>(null);
  const [expandedInsulation, setExpandedInsulation] = useState<string[]>(['Gevel isolatie']);
  const [ventilationCo2, setVentilationCo2] = useState<boolean | null>(null);
  const [ventilatieSensors, setVentilatieSensors] = useState<string[]>([]);
  const [otherVentilatieText, setOtherVentilatieText] = useState('');
  const [heatingLocation, setHeatingLocation] = useState('');
  const [otherHeatingLocation, setOtherHeatingLocation] = useState('');
  const [heatingSameAsWater, setHeatingSameAsWater] = useState<boolean | null>(null);
  const [solarPanels, setSolarPanels] = useState<boolean | null>(null);
  const [activeCooling, setActiveCooling] = useState<boolean | null>(null);
  const [coolingRooms, setCoolingRooms] = useState<string[]>([]);
  const [otherCoolingRoom, setOtherCoolingRoom] = useState('');
  
  const [allKozijnenSame, setAllKozijnenSame] = useState<boolean>(true);
  const [kozijnType, setKozijnType] = useState('Hout');
  const [kozijnLocatie, setKozijnLocatie] = useState('Voor');
  const [kozijnVerdieping, setKozijnVerdieping] = useState('Ground');
  const [allGlasSame, setAllGlasSame] = useState<boolean>(true);
  const [glasType, setGlasType] = useState('HR++ Glas');
  const [glasMerkType, setGlasMerkType] = useState('');
  const [glasLocatie, setGlasLocatie] = useState('Gehele woning');
  const [glasVerdieping, setGlasVerdieping] = useState('Alle verdiepingen');

  const [drawingImages, setDrawingImages] = useState<{ [key: string]: string[] }>({
    floorplans: []
  });
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeRowId) {
      const url = URL.createObjectURL(file);
      setDrawingImages(prev => ({ 
        ...prev, 
        [activeRowId]: [...(prev[activeRowId] || []), url] 
      }));
      e.target.value = '';
      showToast('File uploaded successfully', 'success');
    }
  };

  const removeImage = (id: string, index: number) => {
    setDrawingImages(prev => ({
      ...prev,
      [id]: prev[id].filter((_, i) => i !== index)
    }));
  };

  const triggerUpload = (id: string, isCapture: boolean) => {
    setActiveRowId(id);
    if (isCapture) {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const [selectedRooms, setSelectedRooms] = useState<{ [key: string]: string[] }>({
    BG: ['Hal', 'Woonkamer', 'Keuken'],
    '1E': ['Slaapkamer', 'Badkamer', 'WC'],
    '2E': ['zolder', 'Dakkapel']
  });

  const toggleRoom = (floor: string, room: string) => {
    setSelectedRooms(prev => {
      const current = prev[floor] || [];
      if (current.includes(room)) {
        return { ...prev, [floor]: current.filter(r => r !== room) };
      } else {
        return { ...prev, [floor]: [...current, room] };
      }
    });
  };

  const handleNextStep = async () => {
    if (currentStep === Step.INFORMATION) {
      if (!validateRegistration()) {
        showToast('Please fix the errors above', 'error');
        return;
      }
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
      setCurrentStep(Step.OTP);
      showToast('Registration successful! Check your phone for OTP', 'success');
    } 
    else if (currentStep === Step.OTP) {
      if (otp.every(d => d !== '')) {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
        setCurrentStep(Step.SET_PASSWORD);
        showToast('OTP verified!', 'success');
      } else {
        showToast('Please enter the 4-digit code', 'error');
      }
    }
    else if (currentStep === Step.SET_PASSWORD) {
      if (newPassword && confirmPassword && newPassword === confirmPassword) {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);
        setCurrentStep(Step.LOGIN);
        showToast('Account created! Please login', 'success');
        // Clear password fields
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('Passwords do not match', 'error');
      }
    }
  };

  const handleFinalSubmit = () => {
    setShowConfirmModal(true);
  };

  const confirmFinalSubmit = () => {
    setShowConfirmModal(false);
    showToast('Application submitted successfully!', 'success');
  };

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
  };

  // OTP Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const pastedDigits = pastedData.split('');
      const newOtp = [...otp];
      for (let i = 0; i < pastedDigits.length && i < 4; i++) {
        newOtp[i] = pastedDigits[i];
      }
      setOtp(newOtp);
      const lastFilledIndex = Math.min(pastedDigits.length, 3);
      otpInputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  // ============ LOGIN PAGE ============
  if (currentStep === Step.LOGIN) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface px-6 py-4 flex justify-between items-center">
          <span className="font-display font-semibold text-2xl text-primary">BuildingID</span>
          <button 
            onClick={() => setCurrentStep(Step.INFORMATION)}
            className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/80 transition-all"
          >
            Registration
          </button>
        </header>

        <main className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-black">Welcome Back</h1>
            <p className="text-on-surface-variant mt-2">Sign in to continue</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2">Email Address</label>
              <input 
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors text-xl"
                >
                  {showLoginPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button 
                onClick={() => {
                  setResetSent(false);
                  setResetEmail('');
                  setCurrentStep(Step.FORGOT_PASSWORD);
                }}
                className="text-primary text-sm font-bold hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              onClick={() => {
                if (loginEmail && loginPassword) {
                  setIsLoggedIn(true);
                  setLoggedInUser(loginEmail.split('@')[0]);
                  setCurrentStep(Step.DASHBOARD);
                  showToast('Login successful!', 'success');
                } else {
                  showToast('Please enter email and password', 'error');
                }
              }}
              disabled={!loginEmail || !loginPassword}
              className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 transition-all hover:brightness-110"
            >
              Sign In
            </button>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ REGISTRATION PAGE ============
  if (currentStep === Step.INFORMATION) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface px-6 py-4 flex justify-between items-center">
          <span className="font-display font-semibold text-2xl text-primary">BuildingID</span>
          <button 
            onClick={() => setCurrentStep(Step.LOGIN)}
            className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/80 transition-all"
          >
            Login
          </button>
        </header>

        <main className="max-w-md mx-auto px-4 py-8 pb-32">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-black">Create Account</h1>
            <p className="text-on-surface-variant mt-2">Please fill in your information</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <input 
                placeholder="Full Name *" 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className={`w-full bg-gray-100 p-3 rounded-xl ${errors.fullName ? 'border-2 border-red-500' : ''}`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <input 
                placeholder="Phone Number *" 
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className={`w-full bg-gray-100 p-3 rounded-xl ${errors.phoneNumber ? 'border-2 border-red-500' : ''}`}
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>
            <div>
              <input 
                placeholder="Email *" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full bg-gray-100 p-3 rounded-xl ${errors.email ? 'border-2 border-red-500' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <input 
                placeholder="Address *" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className={`w-full bg-gray-100 p-3 rounded-xl ${errors.address ? 'border-2 border-red-500' : ''}`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <button 
              onClick={handleNextStep}
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? 'Processing...' : 'Register'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ OTP PAGE ============
  if (currentStep === Step.OTP) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface px-6 py-4">
          <span className="font-display font-semibold text-2xl text-primary">BuildingID</span>
        </header>
        <main className="max-w-md mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="font-display text-3xl font-black">Verify OTP</h1>
            <p className="text-on-surface-variant">
              Enter the 4-digit code sent to {formData.phoneNumber || 'your phone'}
            </p>
            
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                  className="w-14 h-14 text-center text-2xl font-bold bg-gray-100 rounded-xl border-2 focus:border-primary focus:outline-none transition-all"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button 
              onClick={() => {
                setOtp(['', '', '', '']);
                showToast('New code sent!', 'success');
                setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
              }}
              className="text-primary font-bold text-sm hover:underline"
            >
              Didn't receive code? Resend
            </button>

            <AnimatePresence>
              {isOtpComplete && (
                <motion.button 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  onClick={handleNextStep}
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                  {!isLoading && <ArrowRight size={18} />}
                </motion.button>
              )}
            </AnimatePresence>

            <p className="text-xs text-on-surface-variant/50 mt-4">
              The code expires in 5 minutes
            </p>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ SET PASSWORD PAGE ============
  if (currentStep === Step.SET_PASSWORD) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface px-6 py-4">
          <span className="font-display font-semibold text-2xl text-primary">BuildingID</span>
        </header>
        
        <main className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-black">Set Password</h1>
            <p className="text-on-surface-variant mt-2">Create a secure password for your account</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors text-xl"
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors text-xl"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && (
              <div className="text-sm">
                {newPassword === confirmPassword ? (
                  <p className="text-green-600">✓ Passwords match</p>
                ) : (
                  <p className="text-red-500">✗ Passwords do not match</p>
                )}
              </div>
            )}

            <button 
              onClick={handleNextStep}
              disabled={!newPassword || newPassword !== confirmPassword}
              className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 transition-all hover:brightness-110"
            >
              Complete Setup
            </button>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ FORGOT PASSWORD PAGE (MOCK) ============
  if (currentStep === Step.FORGOT_PASSWORD) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-surface px-6 py-4 flex justify-between items-center">
          <span className="font-display font-semibold text-2xl text-primary">BuildingID</span>
          <button 
            onClick={() => setCurrentStep(Step.LOGIN)}
            className="text-primary font-bold text-sm hover:underline"
          >
            Back to Login
          </button>
        </header>

        <main className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            {!resetSent ? (
              <>
                <div className="text-center mb-4">
                  <h1 className="font-display text-2xl font-black">Reset Password</h1>
                  <p className="text-on-surface-variant text-sm mt-2">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Email Address</label>
                  <input 
                    type="email"
                    placeholder="name@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-gray-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (resetEmail) {
                      setResetSent(true);
                      showToast('Reset link sent to your email!', 'success');
                    } else {
                      showToast('Please enter your email address', 'error');
                    }
                  }}
                  disabled={!resetEmail}
                  className="w-full bg-primary text-white py-3 rounded-xl font-black uppercase tracking-wider disabled:opacity-50 transition-all hover:brightness-110"
                >
                  Send Reset Link
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="font-display text-xl font-black mb-2">Check Your Email</h2>
                <p className="text-on-surface-variant text-sm mb-6">
                  We've sent a password reset link to <strong>{resetEmail}</strong>
                </p>
                <button 
                  onClick={() => {
                    setResetSent(false);
                    setResetEmail('');
                    setCurrentStep(Step.LOGIN);
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ DASHBOARD PAGE (with Sidebar & DevNav) ============
if (currentStep === Step.DASHBOARD) {
  return (
    <div className="bg-[#f8faf8] min-h-screen">
      <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2">
            <Menu size={24} />
          </button>
          <h1 className="font-display font-black text-xl text-primary">BuildingID</h1>
        </div>
        <button onClick={() => showToast('Help', 'success')} className="text-on-surface-variant hover:text-primary">
          <HelpCircle size={24} />
        </button>
      </header>

      <AppSidebar 
        currentStep={currentStep} 
        handleStepChange={handleStepChange} 
        onLogout={handleLogout}
        userName={loggedInUser || formData.fullName || 'User'}
      />
      
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        currentStep={currentStep} 
        handleStepChange={handleStepChange}
        onLogout={handleLogout}
        userName={loggedInUser || formData.fullName || 'User'}
      />

      <main className="md:ml-64 px-4 sm:px-6 py-6 pb-32">
        <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
        <BackToTop />
        
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <header className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">Algemeen</h1>
            <p className="text-on-surface-variant text-sm mt-1">Building information and technical details for energy certification</p>
          </header>

          <div className="space-y-6">
            {/* Address Information Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <h2 className="font-display font-black text-lg mb-4 text-primary">Location Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Address</label>
                  <input 
                    type="text"
                    placeholder="Street name and number"
                    defaultValue={formData.address}
                    className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">City / Plaats</label>
                  <input 
                    type="text"
                    placeholder="City name"
                    className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Postal Code</label>
                  <input 
                    type="text"
                    placeholder="1234 AB"
                    className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Country</label>
                  <select className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Netherlands</option>
                    <option>Belgium</option>
                    <option>Germany</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Building Characteristics Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <h2 className="font-display font-black text-lg mb-4 text-primary">Building Characteristics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Building Type</label>
                  <select className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Eengezinswoning (Detached house)</option>
                    <option>Woning in appartementencomplex</option>
                    <option>Appartementencomplex met zelfstandige wooneenheden</option>
                    <option>Appartementencomplex met niet zelfstandige wooneenheden</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Position / Ligging</label>
                  <select className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Vrijstaand (Freestanding)</option>
                    <option>Kop-eind-of hoekligging (Corner)</option>
                    <option>Tussenligging (Terraced)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Verdieping (Floor Level)</label>
                  <select className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Onderste verdieping (Ground floor)</option>
                    <option>Tussenverdieping (Middle floor)</option>
                    <option>Bovenste verdieping (Top floor)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Number of Floors</label>
                  <input 
                    type="number"
                    min="1"
                    placeholder="1"
                    className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Construction Year (Bouwjaar)</label>
                  <input 
                    type="text"
                    placeholder="e.g., 1970"
                    value={bouwjaar}
                    onChange={(e) => setBouwjaar(e.target.value)}
                    className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Floor Area (m²)</label>
                  <input 
                    type="text"
                    placeholder="0.00 m²"
                    value={floorArea}
                    onChange={(e) => setFloorArea(e.target.value)}
                    className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Renovation Status Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <h2 className="font-display font-black text-lg mb-4 text-primary">Renovation Status</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="renovation" 
                      value="Ja"
                      checked={renovationStatus === 'Ja'}
                      onChange={(e) => setRenovationStatus(e.target.value)}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <span className="text-sm font-medium">Ja (Yes)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="renovation" 
                      value="Nee"
                      checked={renovationStatus === 'Nee'}
                      onChange={(e) => setRenovationStatus(e.target.value)}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <span className="text-sm font-medium">Nee (No)</span>
                  </label>
                </div>
                
                <AnimatePresence>
                  {renovationStatus === 'Ja' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Renovation Year</label>
                      <input 
                        type="text"
                        placeholder="e.g., 2020"
                        value={renovationYear}
                        onChange={(e) => setRenovationYear(e.target.value)}
                        className="w-full md:w-1/2 bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Technical Assessment Section (Back Office & Inspector only) */}
            {(selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR) && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
                <h2 className="font-display font-black text-lg mb-4 text-primary">Technical Assessment Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Type bouwwijze vloeren</label>
                    <select 
                      value={vloerenType}
                      onChange={(e) => setVloerenType(e.target.value)}
                      className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option>Licht</option>
                      <option>Zwaar</option>
                      <option>Zeer zwaar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Type bouwwijze wanden</label>
                    <select 
                      value={wandenType}
                      onChange={(e) => setWandenType(e.target.value)}
                      className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option>Licht</option>
                      <option>Zwaar</option>
                      <option>Zeer zwaar</option>
                    </select>
                  </div>
                  
                  {selectedRole === UserRole.BACK_OFFICE && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">GBO-T (m²)</label>
                        <input 
                          type="text"
                          placeholder="0.00"
                          value={gboT}
                          onChange={(e) => setGboT(e.target.value)}
                          className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Leidingdoorvoeren</label>
                        <input 
                          type="text"
                          placeholder="Invoer..."
                          value={leidingdoorvoeren}
                          onChange={(e) => setLeidingdoorvoeren(e.target.value)}
                          className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">AVR</label>
                        <input 
                          type="text"
                          placeholder="Invoer..."
                          value={avr}
                          onChange={(e) => setAvr(e.target.value)}
                          className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Buurt</label>
                        <input 
                          type="text"
                          placeholder="Buurt..."
                          value={buurt}
                          onChange={(e) => setBuurt(e.target.value)}
                          className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Wijk</label>
                        <input 
                          type="text"
                          placeholder="Wijk..."
                          value={wijk}
                          onChange={(e) => setWijk(e.target.value)}
                          className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Gemeente</label>
                        <input 
                          type="text"
                          placeholder="Gemeente..."
                          value={gemeente}
                          onChange={(e) => setGemeente(e.target.value)}
                          className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1">Gebouwhoogte (m)</label>
                        <input 
                          type="text"
                          placeholder="0.0 m"
                          value={gebouwhoogte}
                          onChange={(e) => setGebouwhoogte(e.target.value)}
                          className="w-full bg-gray-50 border border-outline-variant/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Floor Plans Question Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
              <h2 className="font-display font-black text-lg mb-4 text-primary">Documentation</h2>
              <div className="space-y-4">
                <p className="text-sm font-bold text-on-surface-variant/80">Do you have floor plans available?</p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => { setHasFloorPlans(true); setCurrentStep(Step.UPLOAD); }}
                    className="px-8 py-2.5 rounded-xl font-bold text-sm bg-primary text-white shadow-md hover:brightness-110 transition-all"
                  >
                    Yes, I have floor plans
                  </button>
                  <button 
                    onClick={() => { setHasFloorPlans(false); setCurrentStep(Step.UPLOAD); }}
                    className="px-8 py-2.5 rounded-xl font-bold text-sm bg-gray-200 text-on-surface hover:bg-gray-300 transition-all"
                  >
                    No, continue without
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Button */}
            <div className="flex justify-end pt-6">
              <button 
                onClick={() => setCurrentStep(Step.UPLOAD)}
                className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest bg-primary text-white shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
              >
                Continue to Upload
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmFinalSubmit} title="Submit Application" message="Are you sure all information is correct?" />
    </div>
  );
}

  // ============ UPLOAD PAGE ============
  if (currentStep === Step.UPLOAD) {
    return (
      <div className="bg-[#f8faf8] min-h-screen">
        <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2">
              <Menu size={24} />
            </button>
            <h1 className="font-display font-black text-xl">BuildingID</h1>
          </div>
          <button onClick={() => showToast('Coming soon!', 'success')}><HelpCircle size={24} /></button>
        </header>

        <AppSidebar currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />
        
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />

        <main className="md:ml-64 px-4 py-6 pb-24">
          <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
          <BackToTop />
          
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-3xl font-black mb-6">Upload Documents</h1>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-300">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Drag & drop files here or click to upload</p>
              <button className="mt-4 px-6 py-2 bg-primary text-white rounded-xl">Select Files</button>
            </div>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ INSULATION DETAILS PAGE ============
  if (currentStep === Step.INSULATION_DETAILS) {
    return (
      <div className="bg-[#f8faf8] min-h-screen">
        <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2">
              <Menu size={24} />
            </button>
            <h1 className="font-display font-black text-xl">BuildingID</h1>
          </div>
          <button onClick={() => showToast('Coming soon!', 'success')}><HelpCircle size={24} /></button>
        </header>

        <AppSidebar currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />
        
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />

        <main className="md:ml-64 px-4 py-6 pb-24">
          <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
          <BackToTop />
          
          <h1 className="font-display text-3xl font-black mb-6">Insulation Details</h1>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-gray-500">Insulation form coming soon...</p>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ INSTALLATIE PAGE ============
  if (currentStep === Step.INSTALLATIE) {
    return (
      <div className="bg-[#f8faf8] min-h-screen">
        <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2">
              <Menu size={24} />
            </button>
            <h1 className="font-display font-black text-xl">BuildingID</h1>
          </div>
          <button onClick={() => showToast('Coming soon!', 'success')}><HelpCircle size={24} /></button>
        </header>

        <AppSidebar currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />
        
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />

        <main className="md:ml-64 px-4 py-6 pb-24">
          <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
          <BackToTop />
          
          <h1 className="font-display text-3xl font-black mb-6">Installatie</h1>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-gray-500">Installation form coming soon...</p>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ KOZIJN & GLAS PAGE ============
  if (currentStep === Step.KOZIJN_GLAS) {
    return (
      <div className="bg-[#f8faf8] min-h-screen">
        <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2">
              <Menu size={24} />
            </button>
            <h1 className="font-display font-black text-xl">BuildingID</h1>
          </div>
          <button onClick={() => showToast('Coming soon!', 'success')}><HelpCircle size={24} /></button>
        </header>

        <AppSidebar currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />
        
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />

        <main className="md:ml-64 px-4 py-6 pb-24">
          <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
          <BackToTop />
          
          <h1 className="font-display text-3xl font-black mb-6">Kozijn & Glas</h1>
          <div className="bg-white rounded-2xl p-6">
            <p className="text-gray-500">Window frames form coming soon...</p>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
      </div>
    );
  }

  // ============ COMPLETE PAGE ============
  if (currentStep === Step.COMPLETE) {
    return (
      <div className="bg-[#f8faf8] min-h-screen">
        <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2">
              <Menu size={24} />
            </button>
            <h1 className="font-display font-black text-xl">BuildingID</h1>
          </div>
          <button onClick={() => showToast('Coming soon!', 'success')}><HelpCircle size={24} /></button>
        </header>

        <AppSidebar currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />
        
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentStep={currentStep} handleStepChange={handleStepChange} onLogout={handleLogout} userName={loggedInUser || formData.fullName || 'User'} />

        <main className="md:ml-64 flex items-center justify-center min-h-[80vh]">
          <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
          <BackToTop />
          
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
              <CheckCircle size={48} />
            </div>
            <h1 className="font-display text-4xl font-black mb-4">Opname Voltooid!</h1>
            <p className="text-on-surface-variant max-w-md mx-auto mb-8">
              Alle gegevens voor de energieopname zijn succesvol verwerkt.
            </p>
            <button 
              onClick={handleFinalSubmit}
              className="px-8 py-3 rounded-xl font-bold bg-primary text-white shadow-xl hover:brightness-110 transition-all"
            >
              Submit Final
            </button>
          </div>
        </main>
        <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
        <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmFinalSubmit} title="Final Submission" message="Are you ready to submit your application?" />
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}