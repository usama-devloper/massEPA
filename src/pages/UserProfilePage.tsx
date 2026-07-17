// src/pages/UserProfilePage.tsx
import { useState, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Edit2, Check, X, LogOut, Send, Camera, Upload, Trash2 } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { PageBackLink } from '../components/common/PageBackLink';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import { ProfileUpdateRequestModal, type ProfileUpdateFormData } from '../components/profile/ProfileUpdateRequestModal';
import { formatProfileAddress } from '../utils/profileAddress';
import { AVATAR_ILLUSTRATIONS, isIllustrationId, getAvatarSvgMarkup } from '../utils/avatarIllustrations';

interface UserProfilePageProps {
  userData: {
    fullName: string;
    phoneNumber: string;
    email: string;
    address: string;
    profilePhoto?: string;
  };
  onUpdateUser: (data: any) => void;
  onContinue: () => void;
  onLogout: () => void;
  userName: string;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  readOnly?: boolean;
}

export function UserProfilePage({
  userData,
  onUpdateUser,
  onContinue,
  onLogout,
  userName,
  onOpenSettings,
  onLogoClick,
  readOnly = false,
}: UserProfilePageProps) {
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editedData, setEditedData] = useState(userData);
  const { toast, setToast, showToast } = useToast();
  const { t } = useLanguage();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string | undefined>(editedData.profilePhoto);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const renderAvatar = (photoValue: string | undefined, initials: string, sizeClasses = "w-24 h-24 text-3xl") => {
    if (!photoValue) {
      return <span className="text-white font-display font-black">{initials}</span>;
    }
    if (isIllustrationId(photoValue)) {
      const svgMarkup = getAvatarSvgMarkup(photoValue);
      if (svgMarkup) {
        return (
          <div className="w-full h-full p-2 flex items-center justify-center bg-white/80 animate-fade-in" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
        );
      }
    }
    return <img src={photoValue} alt="Profile" className="w-full h-full object-cover animate-fade-in" />;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = () => {
    const newData = { ...editedData, profilePhoto: tempPhoto };
    setEditedData(newData);
    onUpdateUser(newData);
    setIsPhotoModalOpen(false);
    showToast(t('profile.photoUpdated') || 'Profielfoto bijgewerkt', 'success');
  };

  const handleClearPhoto = () => {
    setTempPhoto(undefined);
  };

  const fieldLabel = (field: string) => {
    const map: Record<string, string> = {
      fullName: t('profile.fullName'),
      phoneNumber: t('profile.phoneNumber'),
      email: t('profile.email'),
      address: t('profile.address'),
    };
    return map[field] ?? field;
  };

  const handleSave = (field: string) => {
    const newData = { ...editedData };
    onUpdateUser(newData);
    setEditMode(null);
    showToast(t('profile.fieldUpdated', { field: fieldLabel(field) }), 'success');
  };

  const handleCancel = () => {
    setEditedData(userData);
    setEditMode(null);
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleRequestUpdate = () => {
    setIsRequestModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const handleRequestSubmit = (data: ProfileUpdateFormData) => {
    const address = formatProfileAddress(data);
    onUpdateUser({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address,
    });
    setEditedData({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address,
    });
    showToast(t('profile.requestUpdateSent'), 'success');
  };

  return (
    <div className="bg-background">
      <TopBar
        showMenu={false}
        showUserMenu={true}
        userName={userName}
        onManageProfile={() => { }}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={onLogoClick}
        profilePhoto={editedData.profilePhoto}
      />

      <main className="app-page-main pb-[max(3rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
        <div className="app-shell-content">
          <PageBackLink label={t('profile.backToDashboard')} onClick={onContinue} />

          <div className="text-center mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">
              {t('profile.title')}
            </h1>
            <p className="text-on-surface-variant mt-2">
              {readOnly ? t('profile.subtitleReadOnly') : t('profile.subtitle')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-full h-full bg-primary rounded-full flex items-center justify-center overflow-hidden shadow-lg border-2 border-white">
                  {renderAvatar(editedData.profilePhoto, getInitials(editedData.fullName || 'User'))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempPhoto(editedData.profilePhoto);
                    setIsPhotoModalOpen(true);
                  }}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  title="Profielfoto wijzigen"
                >
                  <Camera size={14} />
                </button>
              </div>
              <p className="text-sm text-on-surface-variant">
                {t('profile.memberSince', { year: new Date().getFullYear() })}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Full Name */}
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <User size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t('profile.fullName')}</span>
                    </div>
                    {editMode === 'fullName' ? (
                      <input
                        type="text"
                        value={editedData.fullName}
                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                        className="w-full bg-gray-50 border border-primary/30 rounded-xl p-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    ) : (
                      <p className="text-base font-semibold">{editedData.fullName || t('profile.notProvided')}</p>
                    )}
                  </div>
                  {!readOnly && (
                    editMode === 'fullName' ? (
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleSave('fullName')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={18} />
                        </button>
                        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditMode('fullName')} className="p-1 text-primary hover:bg-primary/10 rounded transition-all">
                        <Edit2 size={16} />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Phone size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t('profile.phoneNumber')}</span>
                    </div>
                    {editMode === 'phoneNumber' ? (
                      <input
                        type="tel"
                        value={editedData.phoneNumber}
                        onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                        className="w-full bg-gray-50 border border-primary/30 rounded-xl p-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    ) : (
                      <p className="text-base font-semibold">{editedData.phoneNumber || t('profile.notProvided')}</p>
                    )}
                  </div>
                  {!readOnly && (
                    editMode === 'phoneNumber' ? (
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleSave('phoneNumber')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={18} />
                        </button>
                        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditMode('phoneNumber')} className="p-1 text-primary hover:bg-primary/10 rounded transition-all">
                        <Edit2 size={16} />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Mail size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t('profile.email')}</span>
                    </div>
                    {editMode === 'email' ? (
                      <input
                        type="email"
                        value={editedData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className="w-full bg-gray-50 border border-primary/30 rounded-xl p-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    ) : (
                      <p className="text-base font-semibold">{editedData.email || t('profile.notProvided')}</p>
                    )}
                  </div>
                  {!readOnly && (
                    editMode === 'email' ? (
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleSave('email')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={18} />
                        </button>
                        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditMode('email')} className="p-1 text-primary hover:bg-primary/10 rounded transition-all">
                        <Edit2 size={16} />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <MapPin size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{t('profile.address')}</span>
                    </div>
                    {editMode === 'address' ? (
                      <textarea
                        value={editedData.address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        rows={2}
                        className="w-full bg-gray-50 border border-primary/30 rounded-xl p-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    ) : (
                      <p className="text-base font-semibold whitespace-pre-wrap">
                        {editedData.address || t('profile.notProvided')}
                      </p>
                    )}
                  </div>
                  {!readOnly && (
                    editMode === 'address' ? (
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleSave('address')} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={18} />
                        </button>
                        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditMode('address')} className="p-1 text-primary hover:bg-primary/10 rounded transition-all">
                        <Edit2 size={16} />
                      </button>
                    )
                  )}
                </div>
              </div>

              {readOnly && (
                <button
                  type="button"
                  onClick={handleRequestUpdate}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
                >
                  <Send size={18} />
                  {t('profile.requestUpdate')}
                </button>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut size={18} />
                {t('profile.logout')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <ProfileUpdateRequestModal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestSubmit}
        userData={userData}
      />


      {/* Profile Photo Modal Selector */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setIsPhotoModalOpen(false)} />
          
          <div className="bg-white/95 backdrop-blur-md border border-white/40 w-full max-w-md rounded-[32px] p-6 z-10 flex flex-col gap-4 max-h-[90%] shadow-2xl animate-fade-in">
            {/* Header (Sticky) */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 flex-shrink-0">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                {t('profile.avatarModalTitle') || 'Profielfoto wijzigen'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[260px]">
              {/* Preview Panel */}
              <div className="flex items-center gap-4 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center overflow-hidden shadow-inner border border-white flex-shrink-0">
                  {renderAvatar(tempPhoto, getInitials(editedData.fullName || 'User'), "w-16 h-16 text-xl")}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-800">Preview</h4>
                  <p className="text-[10px] text-gray-500">
                    {t('profile.avatarSelectIllustration') || 'Kies een illustratie of upload een foto'}
                  </p>
                </div>
                {tempPhoto && (
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    {t('profile.avatarDelete') || 'Wissen'}
                  </button>
                )}
              </div>

              {/* Predefined Illustrations Grid */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider block mb-2">
                  Illustraties
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_ILLUSTRATIONS.map((ill) => (
                    <button
                      key={ill.id}
                      type="button"
                      onClick={() => setTempPhoto(ill.id)}
                      className={`aspect-square rounded-xl border active:scale-95 transition-all flex items-center justify-center overflow-hidden cursor-pointer p-1.5 ${
                        tempPhoto === ill.id
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                      title={ill.nameNl}
                    >
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: ill.svgMarkup }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="pt-2 border-t border-gray-200/60 flex flex-col gap-3 flex-shrink-0">
              {/* Custom Photo Actions */}
              <div className="grid grid-cols-2 gap-3">
                {/* Upload from Device */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-2.5 border border-dashed border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all cursor-pointer"
                >
                  <Upload size={16} className="text-primary mb-0.5" />
                  <span className="text-[10px] font-bold text-primary">
                    {t('profile.avatarUploadDevice') || 'Apparaat'}
                  </span>
                </button>
                {/* Take a picture */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-2.5 border border-dashed border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all cursor-pointer"
                >
                  <Camera size={16} className="text-primary mb-0.5" />
                  <span className="text-[10px] font-bold text-primary">
                    {t('profile.avatarCamera') || 'Camera'}
                  </span>
                </button>
              </div>

              {/* Hidden Input Elements */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                capture="user"
              />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-primary/95 transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  {t('profile.avatarSave') || 'Opslaan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  {t('profile.avatarCancel') || 'Annuleren'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
}