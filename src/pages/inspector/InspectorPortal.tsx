import React, { useState, useEffect } from 'react';
import { BackOfficeSidebar, SidebarItem } from '../backoffice/BackOfficeSidebar';
import { TopBar } from '../../components/common/TopBar';
import { InspectionData, ViewType, User } from '../backoffice/backofficeTypes';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Check, Languages, Palette, Camera, X, Loader2,
  FileDigit, ClipboardList
} from 'lucide-react';
import { LOCALES, type Locale } from '../../i18n/types';
import { THEME_ORDER, THEME_PRESETS, type ThemeId } from '../../theme/themePresets';
import { loadClientsRegistry } from '../../storage/clientsRegistry';
import { idbPut, idbGet } from '../../storage/idbKv';

// Import subviews
import InventoryView from '../backoffice/InventoryView';
import InvoersheetView from '../backoffice/InvoersheetView';

const INITIAL_DATA: InspectionData = {
  algemeen: {
    woning: {
      bouwfase: 'Bestaande bouw',
      opname: 'Basisopname',
      adres: 'Hoofdstraat 123',
      gebouwtype: 'Detached house',
      subtype: 'Eengezinswoning',
      ligging: 'Tussenwoning',
      daktype: 'Zadeldek',
      gebouwhoogte: '8.5',
      postcode: '1011 AB',
      pandId: '0363010012145564',
      vboId: '0363010012145564',
      plaats: 'Amsterdam',
      wijk: 'Centrum',
      gemeent: 'Amsterdam',
      technischComplex: '',
      financieelComplex: '',
      svbStatus: '',
      bron: 'BAG',
      floorConstructieType: '',
      wallConstructieType: ''
    },
    bewoner: {
      nummer: '1',
      persoon: 'J. de Vries',
      adres: 'Hoofdstraat 123',
      postcode: '1011 AB',
      plaats: 'Amsterdam',
      telefoon: '06-12345678',
      email: 'j.devries@email.com'
    },
    inspector: {
      adviseur: 'F. Inspector',
      adres: 'Keizersgracht 10',
      postcode: '1015 CJ',
      plaats: 'Amsterdam',
      telefoon: '020-9876543',
      email: 'f.inspector@ecoinspect.nl',
      certificaathouder: 'Sustainability Certs BV',
      gebruiker: 'admin_eco',
      opnamedatum: '2024-05-14',
      invoerdatum: '2024-05-14'
    },
    technical: {
      gboTs: [''],
      leidingdoorvoeren: '',
      aantal: '',
      avr: ''
    },
    bidIntern: {
      fullName: '',
      phoneNumber: '',
      email: '',
      contactAddress: ''
    }
  },
  constructies: [
    { id: 'c1', type: 'Gevel', naam: 'Gevel isolatiedikte onbekend (1992-2013, Rc = 2.50)', isolatie: 'Ja', dikte: 'Onbekend', bouwjaar: 'Van 1992 t/m 2013', rc: '2.5' },
    { id: 'c2', type: 'Vloer', naam: 'Vloer 250 mm isolatie (Rc = 5.71)', isolatie: 'Ja', dikte: '250', rc: '5.71' },
    { id: 'c3', type: 'Dak', naam: 'Dak hellend isolatiedikte onbekend (1992-2013, Rc = 2.50)', dakType: 'Hellend dak', isolatie: 'Ja', dikte: 'Onbekend', rc: '2.5' },
    { id: 'c4', type: 'Raam', naam: 'Raam HR++ glas (Hout, U = 1.80, g = 0.60)', kozijn: 'Hout', glas: 'HR++', area: '1.20', uGren: '1.8', g: '0.6' }
  ],
  kozijnen: [
    { id: 'k1', gevel: 'Achtergevel', naam: 'W1', width: '1.20', height: '1.50', area: '1.80', constructieId: 'c4' }
  ],
  overstekRows: [
    { id: 'or-1', folder: '1520 + 1920', revit: '1520-1', type: 'NLS', kozijnId: 'k1', constructieId: 'c4', kozijnArea: '0.00', gevel: 'Achtergevel', hbdiff: '2.172', hbdist: '6.026', hb: '0.360', bbaf: '5.408', bbbr: '2.660', bb: '2.033', hodiff: '', hodist: '', ho: '', conclusion: 'Overige belemmering', zonwering: 'Geen zonwering' }
  ],
  bouwkundigRows: [
    { kozijnIds: [] as string[], constructieId: 'c1', type: 'Gevel', kozijnArea: '0.00', gevel: 'Achtergevel', gevelIsolatie: '...', orientation: 'Z', grenstAan: 'Buitenlucht', breedte: '5.00', hoogte: '3.04', oppervlakte: '15.20', hellingshoek: '90', kozijn: '', naam: 'Achtergevel', invoer: 'Archiefonderzoek', rc: '2.5', perimeter: '' },
    { kozijnIds: [] as string[], constructieId: 'c2', type: 'Vloer', kozijnArea: '0.00', gevel: '', gevelIsolatie: 'Ja', orientation: '', grenstAan: 'Kruipruimte', breedte: '10.00', hoogte: '7.02', oppervlakte: '70.20', hellingshoek: '0', kozijn: '', naam: 'Begane Grondvloer', invoer: 'Archiefonderzoek', rc: '5.71', perimeter: '32.4' }
  ],
  kozijnenLibrary: [
    { id: 'k1', naam: 'D1', width: '1.33', height: '2.46', area: '1.98', constructie: '1520 + 1920_Deur ongeïsoleerd (U = 3.40)' }
  ],
  overstek: {
    overstekAanwezig: '',
    overstekDiepte: '',
    overstekBreedte: '',
    belemmeringAanwezig: '',
    belemmeringType: '',
    belemmeringHoogte: '',
    belemmeringAfstand: '',
    zonnehoekCorrectie: '',
    notities: ''
  },
  installations: {
    ventSysteem: 'Mechanische afvoer',
    ventMerkType: 'Itho Daalderop CVE-S',
    ventSpecsBcrg: '2020',
    ventVentilatiesysteem: 'Type C.4a',
    ventSubsysteem: 'Woonhuisventilator',
    ventLuchtdichtheid: 'LUKA A,B of C',
    ventVentilatoren: 'Nominaal vermogen',
    ventTypeVentilator: 'Centrifugaal',
    ventCode: 'V-01-IDCVE',
    ventBypass: 'Nee',

    verwarmSysteem: 'HR-Combiketel',
    verwarmMerkType: 'Nefit Trendline HRC30',
    verwarmSpecsBcrg: '2018',
    verwarmTypeopwekker: 'Gasgestookte ketel',
    verwarmTypeToestel: 'Individueel',
    verwarmDistributiemedium: 'Water',
    verwarmWatertemprater: '55/47 °C',
    verwarmAfgiftesysteem: 'Radiatoren / convectoren',
    verwarmCode: 'Attic',
    verwarmRegeling: 'Regeling in hoofdvertrek (kamerthermostaat)',
    verwarmWaterzijdigIngeeregeld: 'Nee / Onbekend',
    verwarmHrKlasse: 'Onbekend',
    verwarmDistributietype: 'Tweepijpsysteem',

    tapSysteem: 'Gecombineerd met CV',
    tapMerkType: 'Nefit Trendline (Interne)',
    tapSpecsBcrg: '2015',
    tapTypeInstallatie: 'Individueel',
    tapTypeOpwekker: 'Compleet toestel',
    tapTypeToestel: 'Gasgestookt combitoestel',
    tapCode: 'TW-01-COMBI',
    tapAfgifteKeuken: '2 m <= l < 4 m',
    tapAfgifteBadkamer: '< 2 m',
    tapCirculatieleiding: 'Nee',
    tapDwtw: 'Nee',

    koelSysteem: 'Compressiekoeling',
    koelMerkType: '-',
    koelSpecsBcrg: '2019',
    koelTypeInstallatie: 'Compressiekoeling',
    koelTypeToestel: 'Individueel',
    koelExpansie: 'Directe koeling in de ruimte (airconditioning)',
    koelCode: '-',
    koelDistributiemedium: 'Water',
    koelWatertemprater: '6/12 °C',
    koelAfgiftesysteem: 'Vloerkoeling',
    koelRegeling: 'Standalone regeling',

    zonSysteem: 'PV-panelen',
    zonMerkType: 'JA Solar Mono',
    zonSpecsBcrg: '-',
    zonAantal: '12',
    zonHellingshook: '35',
    zonCode: 'PV-01-JASOL',
    zonOppPerPanelen: '1.75',
    zonWattpiekvermogen: '410',
    zonBouwintegratie: 'Sterk geventileerd: open draagconstructie',
    zonOrientatie: 'Zuid-West'
  }
};

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
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedUser: User = {
        id: initialUser?.id || 'u2',
        email,
        full_name: fullName,
        phone_number: phoneNumber,
        role: initialUser?.role || 'INSPECTOR',
        profile_picture: avatar,
      };

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
              {fullName ? fullName.substring(0, 1).toUpperCase() : 'I'}
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

interface InspectorPortalProps {
  onLogout: () => void;
  userName: string;
}

export const InspectorPortal: React.FC<InspectorPortalProps> = ({ onLogout, userName }) => {
  const { themeId, setThemeId } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const [currentView, setCurrentView] = useState<ViewType>('inventory');

  const inspectorNavItems: SidebarItem[] = [
    { id: 'inventory', labelKey: 'nav.inventory', labelDefault: 'Inventory', icon: ClipboardList },
    { id: 'invoersheet', labelKey: 'nav.invoersheet', labelDefault: 'Invoersheet', icon: FileDigit },
  ];

  const [data, setData] = useState<InspectionData>(INITIAL_DATA);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const idbData = await idbGet<InspectionData>('mepa_inspection_data');
        if (idbData && mounted) {
          setData(idbData);
        } else if (mounted) {
          const stored = localStorage.getItem('mepa_inspection_data');
          if (stored) {
            setData(JSON.parse(stored));
          }
        }
      } catch (e) {
        console.error('Failed to load inspection data from IDB', e);
        if (mounted) {
          const stored = localStorage.getItem('mepa_inspection_data');
          if (stored) {
            setData(JSON.parse(stored));
          }
        }
      } finally {
        if (mounted) {
          setIsDataLoaded(true);
        }
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load profile locally
  useEffect(() => {
    const savedName = localStorage.getItem('user_name') || userName;
    const savedEmail = localStorage.getItem('user_email') || 'inspector@ecoinspect.nl';
    const savedAvatar = localStorage.getItem('user_avatar') || '';
    setUserProfile({
      id: 'u2',
      email: savedEmail,
      full_name: savedName,
      role: 'INSPECTOR',
      profile_picture: savedAvatar
    });
  }, [userName]);

  useEffect(() => {
    if (!isDataLoaded) return;
    try {
      localStorage.setItem('mepa_inspection_data', JSON.stringify(data));
      if (data.clientId) {
        localStorage.setItem(`mepa_inspection_data_${data.clientId}`, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('localStorage full, relying on IndexedDB', e);
    }
    idbPut('mepa_inspection_data', data).catch(console.error);
    if (data.clientId) {
      idbPut(`mepa_inspection_data_${data.clientId}`, data).catch(console.error);
    }

    const syncRegistry = async () => {
      try {
        const registry = await loadClientsRegistry();
        const idx = registry.clients.findIndex(c =>
          (data.clientId && c.id === data.clientId) ||
          (data.algemeen.bewoner.email && c.email === data.algemeen.bewoner.email) ||
          (data.algemeen.bewoner.persoon && c.fullName === data.algemeen.bewoner.persoon) ||
          (data.algemeen.bewoner.adres && c.address.includes(data.algemeen.bewoner.adres))
        );

        if (idx !== -1) {
          const client = registry.clients[idx];

          let updatedAddress = client.address;
          if (data.algemeen.bewoner.adres) {
            const parts = data.algemeen.bewoner.adres.trim().split(/\s+/);
            if (data.algemeen.bewoner.plaats) {
              const lastWord = parts[parts.length - 1];
              if (lastWord.toLowerCase() !== data.algemeen.bewoner.plaats.toLowerCase()) {
                const oldCity = client.address.trim().split(/\s+/).pop() || '';
                if (lastWord.toLowerCase() === oldCity.toLowerCase()) {
                  parts[parts.length - 1] = data.algemeen.bewoner.plaats;
                } else {
                  parts.push(data.algemeen.bewoner.plaats);
                }
              }
            }
            updatedAddress = parts.join(' ');
          }

          const updated = {
            ...client,
            fullName: data.algemeen.bewoner.persoon || client.fullName,
            email: data.algemeen.bewoner.email || client.email,
            phoneNumber: data.algemeen.bewoner.telefoon || client.phoneNumber,
            address: updatedAddress,
            updatedAt: Date.now()
          };
          registry.clients[idx] = updated;
          await idbPut('clientsRegistry:v1', registry);
        }
      } catch (dbErr) {
        console.error('Failed to sync data to IndexedDB clientsRegistry:', dbErr);
      }
    };
    syncRegistry();
  }, [data, isDataLoaded]);

  const handleDataChange = React.useCallback((pathOrUpdates: string | Record<string, string>, value?: string) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));

      const applyUpdate = (path: string, val: string) => {
        const keys = path.split('.');
        let current: any = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = val;
      };

      if (typeof pathOrUpdates === 'string') {
        applyUpdate(pathOrUpdates, value || '');
        if (pathOrUpdates === 'algemeen.woning.adres') applyUpdate('algemeen.bewoner.adres', value || '');
        if (pathOrUpdates === 'algemeen.woning.postcode') applyUpdate('algemeen.bewoner.postcode', value || '');
        if (pathOrUpdates === 'algemeen.woning.plaats') applyUpdate('algemeen.bewoner.plaats', value || '');
        if (pathOrUpdates === 'algemeen.bewoner.adres') applyUpdate('algemeen.woning.adres', value || '');
        if (pathOrUpdates === 'algemeen.bewoner.postcode') applyUpdate('algemeen.woning.postcode', value || '');
        if (pathOrUpdates === 'algemeen.bewoner.plaats') applyUpdate('algemeen.woning.plaats', value || '');
      } else {
        Object.entries(pathOrUpdates).forEach(([path, val]) => {
          applyUpdate(path, val);
          if (path === 'algemeen.woning.adres') applyUpdate('algemeen.bewoner.adres', val);
          if (path === 'algemeen.woning.postcode') applyUpdate('algemeen.bewoner.postcode', val);
          if (path === 'algemeen.woning.plaats') applyUpdate('algemeen.bewoner.plaats', val);
          if (path === 'algemeen.bewoner.adres') applyUpdate('algemeen.woning.adres', val);
          if (path === 'algemeen.bewoner.postcode') applyUpdate('algemeen.woning.postcode', val);
          if (path === 'algemeen.bewoner.plaats') applyUpdate('algemeen.woning.plaats', val);
        });
      }

      return newData;
    });
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'inventory':
        return (
          <InventoryView
            userRole="INSPECTOR"
            userName={userProfile?.full_name || userName}
            onStartAudit={async (clientRecord) => {
              const addressParts = (clientRecord.address || '').trim().split(/\s+/);
              const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';
              const street = addressParts.length > 1 ? addressParts.slice(0, -1).join(' ') : clientRecord.address || '';

              let existingData: InspectionData | undefined | null = null;
              try {
                existingData = await idbGet<InspectionData>(`mepa_inspection_data_${clientRecord.id}`);
                if (!existingData) {
                  const stored = localStorage.getItem(`mepa_inspection_data_${clientRecord.id}`);
                  if (stored) existingData = JSON.parse(stored);
                }
              } catch (e) { }

              if (existingData) {
                setData(existingData);
              } else {
                setData(prev => ({
                  ...prev,
                  clientId: clientRecord.id,
                  algemeen: {
                    ...prev.algemeen,
                    woning: {
                      ...prev.algemeen.woning,
                      adres: street,
                      plaats: city,
                    },
                    bewoner: {
                      ...prev.algemeen.bewoner,
                      persoon: clientRecord.fullName || '',
                      adres: street,
                      plaats: city,
                      email: clientRecord.email || '',
                      telefoon: clientRecord.phoneNumber || '',
                    }
                  }
                }));
              }
              setCurrentView('invoersheet');
            }}
          />
        );
      case 'invoersheet':
        return (
          <InvoersheetView
            data={data}
            onChange={handleDataChange}
            onViewChange={setCurrentView}
          />
        );
      case 'settings':
        return (
          <div className="max-w-4xl mx-auto space-y-6 font-sans py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-6 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Palette size={22} />
              </div>
              <div className="text-left">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-on-background tracking-tighter">
                  {t('settings.title') || 'Instellingen'}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {t('settings.subtitle') || 'Pas uiterlijk en taal aan. Uw keuzes worden opgeslagen op dit apparaat.'}
                </p>
              </div>
            </header>

            {/* Language Selector */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 text-left">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <Languages size={14} />
                {t('settings.language.title') || 'Taal'}
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                {t('settings.language.description') || 'Kies de taal voor menu\'s, labels en berichten in de app.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LOCALES.map((id: Locale) => {
                  const selected = locale === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLocale(id)}
                      className={`text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md cursor-pointer ${selected
                          ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-black text-base text-on-background">
                          {t(`settings.language.${id}`)}
                        </span>
                        {selected && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Color Theme Selector */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 text-left">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4">
                {t('settings.colorScheme') || 'Kleurenschema'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {THEME_ORDER.map((id: ThemeId) => {
                  const preset = THEME_PRESETS[id];
                  const selected = themeId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setThemeId(id)}
                      className={`text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md cursor-pointer ${selected
                          ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-display font-black text-base text-on-background">
                          {t(`themes.${id}.label`)}
                        </span>
                        {selected && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">{t(`themes.${id}.description`)}</p>
                      <div className="flex gap-1.5 rounded-lg overflow-hidden h-3 ring-1 ring-black/5">
                        <span className="flex-1" style={{ background: preset.primary }} title="Primary" />
                        <span className="flex-1" style={{ background: preset.surface }} title="Surface" />
                        <span className="flex-1" style={{ background: preset.sidebar }} title="Sidebar" />
                        <span className="flex-1" style={{ background: preset.background }} title="Background" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        );
      default:
        return (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
            <h2 className="text-lg font-bold text-gray-400">View "{currentView}" is under construction.</h2>
          </div>
        );
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative font-sans text-on-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[3800] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-[3900] flex' : 'hidden md:flex'} h-full transition-transform duration-300`}>
        <BackOfficeSidebar
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setIsMobileMenuOpen(false);
          }}
          onLogout={onLogout}
          userName={userProfile?.full_name || userName}
          items={inspectorNavItems}
          subtitle="Inspector"
        />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar
          showMenu={true}
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          showUserMenu={true}
          userName={userProfile?.full_name || userName}
          profilePhoto={userProfile?.profile_picture}
          onManageProfile={() => setIsEditProfileOpen(true)}
          onLogout={onLogout}
          onOpenSettings={() => setCurrentView('settings')}
          leftContent={
            currentView === 'settings' ? (
              <span className="text-sm font-black text-slate-800 tracking-tight font-display">
                {t('settings.title') || 'Instellingen'}
              </span>
            ) : currentView !== 'inventory' ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="hidden sm:inline text-xs font-bold text-slate-400 uppercase tracking-widest font-display shrink-0">Project:</span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-800 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-xs truncate max-w-[140px] sm:max-w-xs">
                    #INS-2024-001 | {data.algemeen.woning.adres || 'Hoofdstraat 123'}, {data.algemeen.woning.plaats || 'Amsterdam'}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-sm font-black text-slate-800 tracking-tight font-display">
                {t('nav.inventory') || 'Dossieroverzicht'}
              </span>
            )
          }
        />

        <main
          style={{ paddingTop: 'var(--app-topbar-height)' }}
          className={`flex-1 ${currentView === 'invoersheet' ? 'p-0 md:p-0' : 'p-6'} bg-[#f4f7f5] h-full overflow-y-auto`}
        >
          <div className="w-full h-full max-w-screen-2xl mx-auto flex flex-col">
            {renderView()}
          </div>
        </main>
      </div>

      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
    </div>
  );
};

export default InspectorPortal;
