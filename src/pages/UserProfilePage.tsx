// src/pages/UserProfilePage.tsx
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Edit2, Check, X, LogOut, Send } from 'lucide-react';
import { TopBar } from '../components/common/TopBar';
import { PageBackLink } from '../components/common/PageBackLink';
import { Toast } from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import { ProfileUpdateRequestModal, type ProfileUpdateFormData } from '../components/profile/ProfileUpdateRequestModal';
import { formatProfileAddress } from '../utils/profileAddress';

interface UserProfilePageProps {
  userData: {
    fullName: string;
    phoneNumber: string;
    email: string;
    address: string;
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
        onManageProfile={() => {}}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={onLogoClick}
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
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white font-display font-black text-3xl">
                {getInitials(editedData.fullName || 'User')}
              </span>
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
      
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
}