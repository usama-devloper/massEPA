import React, { useState } from 'react';
import { Bell, User as UserIcon, Save, LogOut, X, Check, Loader2, Camera, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { User, ViewType } from './backofficeTypes';

interface EditProfileFormProps {
  initialUser: User | null;
  onClose: () => void;
  onSaved: (user: User) => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ initialUser, onClose, onSaved }) => {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(initialUser?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(initialUser?.phone_number || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string>(initialUser?.profile_picture || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError(t('profile.avatarSizeError') || 'Avatar must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is verplicht');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      // Simulate profile update locally
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedUser: User = {
        id: initialUser?.id || 'u1',
        email,
        full_name: fullName,
        phone_number: phoneNumber,
        role: initialUser?.role || 'BACK_OFFICE',
        profile_picture: avatar,
      };
      
      // Save to localStorage
      localStorage.setItem('user_name', fullName);
      localStorage.setItem('user_email', email);
      if (avatar) {
        localStorage.setItem('user_avatar', avatar);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSaved(updatedUser);
      }, 1000);
    } catch (err: any) {
      setError('Kon profiel niet bijwerken');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold rounded-xl flex items-center gap-2">
          <Check size={14} className="text-emerald-600" />
          <span>Profiel succesvol bijgewerkt!</span>
        </div>
      )}

      {/* Avatar Upload */}
      <div className="flex flex-col items-center justify-center pb-2">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
          Profielfoto
        </label>
        <div className="relative group w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden cursor-pointer shadow-sm hover:border-primary transition-all">
          {avatar ? (
            <img src={avatar} alt="Profile Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-50 text-slate-400 flex items-center justify-center text-2xl font-bold">
              {fullName ? fullName.substring(0, 1).toUpperCase() : 'U'}
            </div>
          )}
          
          <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera size={16} className="mb-0.5" />
            <span className="font-bold text-[8px] uppercase tracking-wide">Wijzigen</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              className="hidden" 
            />
          </label>
        </div>
        {avatar && (
          <button 
            type="button" 
            onClick={() => setAvatar('')}
            className="text-[10px] font-bold text-red-500 hover:text-red-700 mt-1.5 transition-colors cursor-pointer"
          >
            Verwijderen
          </button>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
          Volledige naam
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Naam"
          className="w-full px-3 py-2.5 text-xs border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl bg-gray-50/50 focus:bg-white transition-all outline-none font-bold text-slate-800"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
          Telefoonnummer
        </label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Telefoonnummer"
          className="w-full px-3 py-2.5 text-xs border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl bg-gray-50/50 focus:bg-white transition-all outline-none font-bold text-slate-800"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
          E-mailadres
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="w-full px-3 py-2.5 text-xs border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl bg-gray-50/50 focus:bg-white transition-all outline-none font-bold text-slate-800"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">
          Wachtwoord
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nieuw wachtwoord (optioneel)"
          className="w-full px-3 py-2.5 text-xs border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl bg-gray-50/50 focus:bg-white transition-all outline-none font-bold text-slate-800"
        />
      </div>

      <div className="pt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all cursor-pointer"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <span>Opslaan</span>
          )}
        </button>
      </div>
    </form>
  );
};

interface BackOfficeTopbarProps {
  currentView: ViewType;
  projectAddress: string;
  projectCity: string;
  userProfile: User | null;
  setUserProfile: (user: User | null) => void;
  onLogout: () => void;
  onSave?: () => Promise<void>;
  rightContent?: React.ReactNode;
  onOpenSettings?: () => void;
}

export const BackOfficeTopbar: React.FC<BackOfficeTopbarProps> = ({
  currentView,
  projectAddress,
  projectCity,
  userProfile,
  setUserProfile,
  onLogout,
  onSave,
  rightContent,
  onOpenSettings
}) => {
  const { locale, setLocale, t } = useLanguage();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || t('common.saveError') || 'Fout bij het opslaan van dossier');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 w-full">
        <div className="flex items-center gap-4">
          {currentView === 'settings' ? (
            <span className="text-sm font-black text-slate-800 tracking-tight">
              {t('settings.title') || 'Instellingen'}
            </span>
          ) : currentView !== 'inventory' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Project:</span>
              <span className="text-xs font-black text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                #INS-2024-001 | {projectAddress || 'Hoofdstraat 123'}, {projectCity || 'Amsterdam'}
              </span>
            </div>
          ) : (
            <span className="text-sm font-black text-slate-800 tracking-tight">
              {t('nav.inventory') || 'Dossieroverzicht'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {rightContent}

          {currentView !== 'inventory' && currentView !== 'dashboard' && (
            <button 
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-sm disabled:opacity-85 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Opslaan...</span>
                </>
              ) : showSuccess ? (
                <>
                  <Check size={13} className="text-white animate-in zoom-in duration-150" />
                  <span>Opgeslagen</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Opslaan</span>
                </>
              )}
            </button>
          )}
          
          <div className="h-6 w-px bg-gray-200" />
          
          <div className="flex items-center gap-4 text-gray-500">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:text-primary hover:bg-slate-50 transition-all rounded-xl text-[10px] font-black uppercase tracking-wider border border-gray-200 cursor-pointer"
                title="Taal wijzigen"
              >
                <Globe size={13} className="text-slate-400" />
                <span>{locale}</span>
              </button>
              
              {isLanguageDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLanguageDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setLocale('nl');
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        locale === 'nl' ? 'text-primary' : 'text-slate-700'
                      }`}
                    >
                      <span>Nederlands</span>
                      {locale === 'nl' && <Check size={12} className="text-primary" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocale('en');
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        locale === 'en' ? 'text-primary' : 'text-slate-700'
                      }`}
                    >
                      <span>English</span>
                      {locale === 'en' && <Check size={12} className="text-primary" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Notification Trigger & Dropdown */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="hover:text-primary transition-colors cursor-pointer relative flex items-center justify-center p-1.5 hover:bg-slate-100 rounded-xl"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              </button>
              
              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Bell size={14} className="text-primary" />
                        <span className="text-xs font-black text-slate-800">Meldingen</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                      >
                        Sluiten
                      </button>
                    </div>
                    
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      <div className="p-3 bg-emerald-50/40 border-l-3 border-emerald-600 rounded-r-xl space-y-0.5 text-left">
                        <p className="text-[11px] font-black text-slate-800">Nieuw dossier toegewezen</p>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">Project #INS-2024-001 is succesvol aangemaakt en klaar voor inspectie.</p>
                        <p className="text-[9px] text-slate-400 font-semibold">Zojuist</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden hover:border-primary transition-all cursor-pointer shadow-sm"
              >
                {userProfile?.profile_picture ? (
                  <img 
                    src={userProfile.profile_picture} 
                    alt="Avatar" 
                    className="w-full h-full object-cover animate-in fade-in duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-50 text-primary flex items-center justify-center font-black text-xs hover:bg-emerald-100/50">
                    {userProfile?.full_name 
                      ? userProfile.full_name.substring(0, 1).toUpperCase()
                      : 'U'}
                  </div>
                )}
              </button>
              
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden shrink-0">
                        {userProfile?.profile_picture ? (
                          <img 
                            src={userProfile.profile_picture} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-50 text-primary flex items-center justify-center font-black text-sm">
                            {userProfile?.full_name 
                              ? userProfile.full_name.substring(0, 1).toUpperCase()
                              : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden text-left">
                        <p className="text-xs font-black text-slate-800 truncate">
                          {userProfile?.full_name || 'Gebruiker'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                          {userProfile?.email || ''}
                        </p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-50 text-primary border border-emerald-100 rounded-md text-[8px] font-black uppercase tracking-wider">
                          {userProfile?.role || 'BACK_OFFICE'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <UserIcon size={14} className="text-slate-400" />
                      Profiel bewerken
                    </button>
                    
                    {onOpenSettings && (
                      <>
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onOpenSettings();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <span className="text-slate-400 text-sm">🎨</span>
                          <span>{t('settings.title') || 'Instellingen'}</span>
                        </button>
                      </>
                    )}
                    
                    <div className="h-px bg-gray-100 my-1" />
                    
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut size={14} className="text-red-500" />
                      Uitloggen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            onClick={() => setIsEditProfileOpen(false)}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Profiel bewerken</h3>
              <button 
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <EditProfileForm 
              initialUser={userProfile} 
              onClose={() => setIsEditProfileOpen(false)}
              onSaved={(updatedUser) => {
                setUserProfile(updatedUser);
                setIsEditProfileOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BackOfficeTopbar;
