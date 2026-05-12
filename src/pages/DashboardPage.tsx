// src/pages/DashboardPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, HelpCircle, ArrowRight } from 'lucide-react';
import { AppSidebar } from '../components/common/AppSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { DevNav } from '../components/common/DevNav';
import { BackToTop } from '../components/common/BackToTop';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Toast } from '../components/common/Toast';
import { Step, UserRole } from '../types';
import { useToast } from '../hooks/useToast';

interface DashboardPageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  userName: string;
  formData: any;
  selectedRole: UserRole;
  // State setters
  setHasFloorPlans: (value: boolean) => void;
  setCurrentStepHandler: (step: Step) => void;
  renovationStatus: string;
  setRenovationStatus: (value: string) => void;
  renovationYear: string;
  setRenovationYear: (value: string) => void;
  bouwjaar: string;
  setBouwjaar: (value: string) => void;
  floorArea: string;
  setFloorArea: (value: string) => void;
  vloerenType: string;
  setVloerenType: (value: string) => void;
  wandenType: string;
  setWandenType: (value: string) => void;
  gboT: string;
  setGboT: (value: string) => void;
  leidingdoorvoeren: string;
  setLeidingdoorvoeren: (value: string) => void;
  avr: string;
  setAvr: (value: string) => void;
  buurt: string;
  setBuurt: (value: string) => void;
  wijk: string;
  setWijk: (value: string) => void;
  gemeente: string;
  setGemeente: (value: string) => void;
  gebouwhoogte: string;
  setGebouwhoogte: (value: string) => void;
  hasFloorPlans: boolean | null;
}

export const DashboardPage = ({ 
  currentStep, setCurrentStep, onLogout, userName, formData, selectedRole,
  setHasFloorPlans, setCurrentStepHandler, renovationStatus, setRenovationStatus,
  renovationYear, setRenovationYear, bouwjaar, setBouwjaar, floorArea, setFloorArea,
  vloerenType, setVloerenType, wandenType, setWandenType, gboT, setGboT,
  leidingdoorvoeren, setLeidingdoorvoeren, avr, setAvr, buurt, setBuurt,
  wijk, setWijk, gemeente, setGemeente, gebouwhoogte, setGebouwhoogte, hasFloorPlans
}: DashboardPageProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast, showToast } = useToast();

  const handleStepChange = (step: Step) => {
    setCurrentStep(step);
    setCurrentStepHandler(step);
  };

  return (
    <div className="bg-[#f8faf8] min-h-screen">
      <header className="bg-surface px-4 sm:px-6 py-4 flex justify-between items-center border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2">
            <Menu size={24} />
          </button>
          <img src="/logo.png" alt="BuildingID" className="h-8 w-auto" onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=B';
          }} />
        </div>
        <button onClick={() => showToast('Help', 'success')} className="text-on-surface-variant hover:text-primary">
          <HelpCircle size={24} />
        </button>
      </header>

      <AppSidebar 
        currentStep={currentStep} 
        handleStepChange={handleStepChange} 
        onLogout={onLogout}
        userName={userName}
      />
      
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        currentStep={currentStep} 
        handleStepChange={handleStepChange}
        onLogout={onLogout}
        userName={userName}
      />

      <main className="md:ml-64 px-4 sm:px-6 py-6 pb-32">
        <DevNav currentStep={currentStep} setCurrentStep={setCurrentStep} />
        <BackToTop />
        
        <div className="max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">Algemeen</h1>
            <p className="text-on-surface-variant text-sm mt-1">Building information and technical details for energy certification</p>
          </header>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Address</label>
                <input className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm focus:ring-0" placeholder="Zoek op straatnaam..." defaultValue={formData.address} />
              </div>

              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Plaats</label>
                <input className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm focus:ring-0" placeholder="Woonplaats..." />
              </div>

              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Gebouw type</label>
                <select className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm">
                  <option>Eengezinswoning</option>
                  <option>Woning in een appartementencomplex</option>
                  <option>Appartementencomplex met zelfstandige wooneenheden</option>
                  <option>Appartementencomplex met niet zelfstandige wooneenheden</option>
                </select>
              </div>

              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Position</label>
                <select className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm">
                  <option>Vrijstaand</option>
                  <option>Kop-eind-of hoekligging</option>
                  <option>Tussenligging</option>
                </select>
              </div>

              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Ligging</label>
                <select className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm">
                  <option>Onderste verdieping</option>
                  <option>Tussenverdieping</option>
                  <option>Bovenste verdieping</option>
                </select>
              </div>

              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Aantal verdiepingen</label>
                <input type="number" step="1" min="1" className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm" placeholder="1" />
              </div>

              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Bouwjaar</label>
                <input type="text" placeholder="Bijv. 1970" value={bouwjaar} onChange={(e) => setBouwjaar(e.target.value)} className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm" />
              </div>

              <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Vloeroppervlak (m²)</label>
                <input type="text" placeholder="0.0 m²" value={floorArea} onChange={(e) => setFloorArea(e.target.value)} className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm" />
              </div>

              <div className="bg-[#f3f4ee] border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-2">Renovatie status</label>
                <div className="flex h-9 bg-white/50 p-1 rounded-lg border border-outline-variant/10">
                  <button onClick={() => setRenovationStatus('Ja')} className={`flex-1 rounded-md font-bold transition-all text-[11px] uppercase tracking-wider ${renovationStatus === 'Ja' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant/60'}`}>Ja</button>
                  <button onClick={() => setRenovationStatus('Nee')} className={`flex-1 rounded-md font-bold transition-all text-[11px] uppercase tracking-wider ${renovationStatus === 'Nee' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant/60'}`}>Nee</button>
                </div>
              </div>

              <AnimatePresence>
                {renovationStatus === 'Ja' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="group bg-white border border-outline-variant/30 rounded-xl p-3 shadow-sm">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Renovatiejaar</label>
                      <input type="text" placeholder="Bijv. 2020" value={renovationYear} onChange={(e) => setRenovationYear(e.target.value)} className="w-full bg-transparent border-none p-0 mt-0.5 font-medium text-sm" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR) && (
              <div className="bg-[#f3f4ee] rounded-2xl p-4 shadow-sm border border-outline-variant/10 mt-4">
                <h3 className="font-display text-md font-black text-on-surface tracking-tighter mb-3">Technische Beoordeling</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Type bouwwijze vloeren</label>
                    <select value={vloerenType} onChange={(e) => setVloerenType(e.target.value)} className="w-full bg-transparent border-none p-0 mt-0.5 text-sm">
                      <option>Licht</option><option>Zwaar</option><option>Zeer zwaar</option>
                    </select>
                  </div>
                  <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Type bouwwijze wanden</label>
                    <select value={wandenType} onChange={(e) => setWandenType(e.target.value)} className="w-full bg-transparent border-none p-0 mt-0.5 text-sm">
                      <option>Licht</option><option>Zwaar</option><option>Zeer zwaar</option>
                    </select>
                  </div>
                  {selectedRole === UserRole.BACK_OFFICE && (
                    <>
                      <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">GBO-T (m²)</label>
                        <input type="text" value={gboT} onChange={(e) => setGboT(e.target.value)} className="w-full bg-transparent p-0 mt-0.5 text-sm" />
                      </div>
                      <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Leidingdoorvoeren</label>
                        <input type="text" value={leidingdoorvoeren} onChange={(e) => setLeidingdoorvoeren(e.target.value)} className="w-full bg-transparent p-0 mt-0.5 text-sm" />
                      </div>
                      <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">AVR</label>
                        <input type="text" value={avr} onChange={(e) => setAvr(e.target.value)} className="w-full bg-transparent p-0 mt-0.5 text-sm" />
                      </div>
                      <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Buurt</label>
                        <input type="text" value={buurt} onChange={(e) => setBuurt(e.target.value)} className="w-full bg-transparent p-0 mt-0.5 text-sm" />
                      </div>
                      <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Wijk</label>
                        <input type="text" value={wijk} onChange={(e) => setWijk(e.target.value)} className="w-full bg-transparent p-0 mt-0.5 text-sm" />
                      </div>
                      <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Gemeente</label>
                        <input type="text" value={gemeente} onChange={(e) => setGemeente(e.target.value)} className="w-full bg-transparent p-0 mt-0.5 text-sm" />
                      </div>
                      <div className="group bg-white border border-outline-variant/30 rounded-xl p-3">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">Gebouwhoogte (m)</label>
                        <input type="text" value={gebouwhoogte} onChange={(e) => setGebouwhoogte(e.target.value)} className="w-full bg-transparent p-0 mt-0.5 text-sm" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-outline-variant/20 flex flex-col items-center gap-4">
              <div className="w-full max-w-4xl bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="flex-1 text-sm font-bold text-on-surface-variant/80 text-center sm:text-left">Heeft u beschikking over bouwtekeningen?</p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => { setHasFloorPlans(true); setCurrentStepHandler(Step.UPLOAD); }} className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${hasFloorPlans === true ? 'bg-primary text-white shadow-lg' : 'bg-[#f4f6f0] text-on-surface shadow-sm'}`}>Ja</button>
                  <button onClick={() => { setHasFloorPlans(false); setCurrentStepHandler(Step.UPLOAD); }} className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${hasFloorPlans === false ? 'bg-primary text-white shadow-lg' : 'bg-[#f4f6f0] text-on-surface shadow-sm'}`}>Nee</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setCurrentStepHandler(Step.UPLOAD)} className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest bg-primary text-white shadow-lg hover:brightness-110 transition-all flex items-center gap-2">
                Continue to Upload <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => {}}} /></AnimatePresence>
      <ConfirmModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={() => {}} title="Submit Application" message="Are you sure all information is correct?" />
    </div>
  );
};