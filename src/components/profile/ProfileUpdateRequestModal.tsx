import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  DEFAULT_BEOWNER_PROFILE,
  formatProfileAddress,
  parseProfileAddress,
  type ProfileAddressParts,
} from '../../utils/profileAddress';

export type ProfileUpdateFormData = {
  fullName: string;
  phoneNumber: string;
  email: string;
} & ProfileAddressParts;

type ProfileUpdateRequestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileUpdateFormData) => void;
  userData: {
    fullName: string;
    phoneNumber: string;
    email: string;
    address: string;
  };
};

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20';

function buildInitialForm(userData: ProfileUpdateRequestModalProps['userData']): ProfileUpdateFormData {
  const addressParts = parseProfileAddress(userData.address);
  return {
    fullName: userData.fullName.trim() || DEFAULT_BEOWNER_PROFILE.fullName,
    phoneNumber: userData.phoneNumber.trim() || DEFAULT_BEOWNER_PROFILE.phoneNumber,
    email: userData.email,
    ...addressParts,
  };
}

export function ProfileUpdateRequestModal({
  open,
  onClose,
  onSubmit,
  userData,
}: ProfileUpdateRequestModalProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ProfileUpdateFormData>(() => buildInitialForm(userData));

  useEffect(() => {
    if (open) setForm(buildInitialForm(userData));
  }, [open, userData]);

  const setField = <K extends keyof ProfileUpdateFormData>(key: K, value: ProfileUpdateFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[3700] flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[var(--app-topbar-height)] sm:pt-4 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="w-full sm:max-w-lg max-h-[min(90vh,calc(100dvh-var(--app-topbar-height)-1rem))] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-outline-variant/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 rounded-t-2xl sm:rounded-t-2xl">
              <h2 className="font-display text-lg font-black text-on-surface tracking-tight">
                {t('profile.requestUpdateTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label={t('profile.requestUpdateCancel')}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  {t('profile.fullName')}
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  {t('profile.phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-3">
                  {t('profile.address')}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      {t('profile.straatnaam')}
                    </label>
                    <input
                      type="text"
                      value={form.straatnaam}
                      onChange={(e) => setField('straatnaam', e.target.value)}
                      className={inputClassName}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        {t('profile.houseNumber')}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.houseNumber}
                        onChange={(e) => setField('houseNumber', e.target.value)}
                        className={inputClassName}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        {t('profile.toev')}
                      </label>
                      <input
                        type="text"
                        value={form.toev}
                        onChange={(e) => setField('toev', e.target.value)}
                        className={inputClassName}
                        placeholder="—"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        {t('profile.postcode')}
                      </label>
                      <input
                        type="text"
                        value={form.postcode}
                        onChange={(e) => setField('postcode', e.target.value)}
                        className={inputClassName}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        {t('profile.woonplaats')}
                      </label>
                      <input
                        type="text"
                        value={form.woonplaats}
                        onChange={(e) => setField('woonplaats', e.target.value)}
                        className={inputClassName}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant">
                {formatProfileAddress(form)}
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:brightness-110"
                >
                  <Check size={16} />
                  {t('profile.requestUpdateSubmit')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  <X size={16} />
                  {t('profile.requestUpdateCancel')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
