import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Calendar, Building, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { loadClientsRegistry, ClientRecord } from '../../storage/clientsRegistry';

interface AuditItem {
  id: string;
  address: string;
  city: string;
  projectID: string;
  owner: string;
  date: Date;
  rawRecord: ClientRecord;
}

interface InventoryViewProps {
  onStartAudit: (client: ClientRecord) => void;
  userName: string;
  onViewChange?: (view: string) => void;
}

const SAMPLE_INSPECTORS = [
  'Mevrouw S. van Wessum',
  'Jan de Vries',
  'Sanne Bakker',
  'Peter Peters',
  'Kees van Dijk'
];

export const InventoryView: React.FC<InventoryViewProps> = ({ onStartAudit, userName, onViewChange }) => {
  const { t } = useLanguage();
  const tr = (key: string, fallback: string) => {
    const val = t(key);
    return !val || val === key ? fallback : val;
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | '3months'>('all');
  const [selectedInspectorFilter, setSelectedInspectorFilter] = useState<string | null>(null);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedInspectors, setAssignedInspectors] = useState<Record<string, string>>({});

  // Dropdown states
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isInspectorDropdownOpen, setIsInspectorDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('inventory_assigned_inspectors');
      if (saved) {
        setAssignedInspectors(JSON.parse(saved));
      }
    } catch (e) { }
  }, []);

  const handleAssignInspector = (auditId: string, inspectorName: string) => {
    const updated = { ...assignedInspectors, [auditId]: inspectorName };
    setAssignedInspectors(updated);
    try {
      localStorage.setItem('inventory_assigned_inspectors', JSON.stringify(updated));
    } catch (e) { }
  };

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        setLoading(true);
        const doc = await loadClientsRegistry();
        
        const mapped: AuditItem[] = doc.clients.map((client) => {
          const parts = client.address.trim().split(/\s+/);
          const city = parts.length > 1 ? parts[parts.length - 1] : t('general.options.onbekend') || 'Onbekend';
          
          return {
            id: client.id,
            address: client.address || t('inventory.noAddress') || 'Geen adres',
            city: city,
            projectID: `PRJ-${client.id.substring(4, 9).toUpperCase()}`,
            owner: client.fullName || t('inventory.untitled') || 'Naamloos',
            date: new Date(client.updatedAt || client.createdAt || Date.now()),
            rawRecord: client
          };
        });
        setAudits(mapped);
      } catch (err) {
        console.error('Failed to load local clients registry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCity(null);
    setTimeFilter('all');
    setSelectedInspectorFilter(null);
    setIsCityDropdownOpen(false);
    setIsTimeDropdownOpen(false);
    setIsInspectorDropdownOpen(false);
  };

  const filteredAudits = audits.filter(audit => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      audit.address.toLowerCase().includes(term) ||
      audit.city.toLowerCase().includes(term) ||
      audit.projectID.toLowerCase().includes(term) ||
      audit.owner.toLowerCase().includes(term);
    
    const matchesCity = selectedCity ? audit.city === selectedCity : true;

    const assignedInsp = assignedInspectors[audit.id];
    let matchesInspector = true;
    if (selectedInspectorFilter === 'unassigned') {
      matchesInspector = !assignedInsp;
    } else if (selectedInspectorFilter) {
      matchesInspector = assignedInsp === selectedInspectorFilter;
    }

    const now = new Date();
    const auditTime = audit.date.getTime();
    
    let matchesTime = true;
    if (timeFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      matchesTime = auditTime >= oneWeekAgo.getTime();
    } else if (timeFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(now.getDate() - 30);
      matchesTime = auditTime >= oneMonthAgo.getTime();
    } else if (timeFilter === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(now.getDate() - 90);
      matchesTime = auditTime >= threeMonthsAgo.getTime();
    }
    
    return matchesSearch && matchesCity && matchesInspector && matchesTime;
  });

  const cities = Array.from(new Set(audits.map(a => a.city)));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(t('common.yes') === 'Ja' ? 'nl-NL' : 'en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-var(--app-topbar-height))] bg-background p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Title */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-2"
        >
          <h1 className="text-3xl font-black text-on-background tracking-tight">
            {t('inventory.welcomeBack', { name: userName })}
          </h1>
        </motion.div>

        {/* Search Bar section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <input
            type="text"
            className="w-full bg-white border border-outline-variant/15 rounded-2xl pl-12 pr-4 py-4 text-sm text-on-background placeholder-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all font-semibold"
            placeholder={t('inventory.searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
        </motion.div>

        {/* Filter Toolbar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* City Dropdown Selector */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => {
                  setIsCityDropdownOpen(!isCityDropdownOpen);
                  setIsTimeDropdownOpen(false);
                  setIsInspectorDropdownOpen(false);
                }}
                className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  selectedCity 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-outline-variant/15 bg-white text-on-surface-variant/60 hover:bg-gray-50'
                }`}
              >
                <span>{selectedCity || t('inventory.filterCity')}</span>
                <ChevronDown size={13} className={`text-on-surface-variant/40 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCityDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCityDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-outline-variant/10 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCity(null);
                        setIsCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedCity === null ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                      }`}
                    >
                      {t('inventory.allCities')}
                    </button>
                    {cities.map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setSelectedCity(city);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedCity === city ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="h-5 w-px bg-outline-variant/10 mx-1 hidden min-[480px]:block" />

            {/* Time Filter Dropdown Selector */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => {
                  setIsTimeDropdownOpen(!isTimeDropdownOpen);
                  setIsCityDropdownOpen(false);
                  setIsInspectorDropdownOpen(false);
                }}
                className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  timeFilter !== 'all' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-outline-variant/15 bg-white text-on-surface-variant/60 hover:bg-gray-50'
                }`}
              >
                <span>
                  {timeFilter === 'all' && t('inventory.timeFilterAll')}
                  {timeFilter === 'week' && t('inventory.timeFilterWeek')}
                  {timeFilter === 'month' && t('inventory.timeFilterMonth')}
                  {timeFilter === '3months' && t('inventory.timeFilter3Months')}
                </span>
                <ChevronDown size={13} className={`text-on-surface-variant/40 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isTimeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTimeDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-outline-variant/10 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setTimeFilter('all');
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                        timeFilter === 'all' ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                      }`}
                    >
                      {t('inventory.timeFilterAll')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeFilter('week');
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                        timeFilter === 'week' ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                      }`}
                    >
                      {t('inventory.timeFilterWeek')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeFilter('month');
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                        timeFilter === 'month' ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                      }`}
                    >
                      {t('inventory.timeFilterMonth')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeFilter('3months');
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                        timeFilter === '3months' ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                      }`}
                    >
                      {t('inventory.timeFilter3Months')}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="h-5 w-px bg-outline-variant/10 mx-1 hidden min-[480px]:block" />

            {/* Inspector Filter Dropdown Selector */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => {
                  setIsInspectorDropdownOpen(!isInspectorDropdownOpen);
                  setIsCityDropdownOpen(false);
                  setIsTimeDropdownOpen(false);
                }}
                className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  selectedInspectorFilter 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-outline-variant/15 bg-white text-on-surface-variant/60 hover:bg-gray-50'
                }`}
              >
                <span>
                  {selectedInspectorFilter === null && tr('inventory.filterInspector', 'Filter op inspecteur')}
                  {selectedInspectorFilter === 'unassigned' && tr('inventory.unassigned', 'Niet toegewezen')}
                  {selectedInspectorFilter !== null && selectedInspectorFilter !== 'unassigned' && selectedInspectorFilter}
                </span>
                <ChevronDown size={13} className={`text-on-surface-variant/40 transition-transform ${isInspectorDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isInspectorDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsInspectorDropdownOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-52 bg-white border border-outline-variant/10 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInspectorFilter(null);
                        setIsInspectorDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedInspectorFilter === null ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                      }`}
                    >
                      {tr('inventory.allInspectors', 'Alle inspecteurs')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInspectorFilter('unassigned');
                        setIsInspectorDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedInspectorFilter === 'unassigned' ? 'text-primary bg-primary/5' : 'text-amber-700 bg-amber-50/40'
                      }`}
                    >
                      {tr('inventory.unassigned', 'Niet toegewezen')}
                    </button>
                    <div className="my-1 border-t border-outline-variant/10" />
                    {SAMPLE_INSPECTORS.map(insp => (
                      <button
                        key={insp}
                        type="button"
                        onClick={() => {
                          setSelectedInspectorFilter(insp);
                          setIsInspectorDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedInspectorFilter === insp ? 'text-primary bg-primary/5' : 'text-on-surface-variant/70'
                        }`}
                      >
                        {insp}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Wis Filters Link */}
          {(searchTerm || selectedCity || timeFilter !== 'all' || selectedInspectorFilter !== null) && (
            <button
              onClick={handleClearFilters}
              type="button"
              className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center justify-end gap-1 self-end sm:self-auto"
            >
              {t('inventory.clearFilters')}
            </button>
          )}
        </motion.div>

        {/* Property Cards List */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-on-surface-variant/50 font-bold uppercase tracking-wider">
                {t('inventory.loading') || 'Projecten laden...'}
              </p>
            </div>
          ) : filteredAudits.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-outline-variant/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm"
            >
              <div className="p-3 bg-gray-50 rounded-full text-on-surface-variant/40">
                <Building size={28} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-on-surface-variant/60">{t('inventory.noAuditsFound')}</p>
              <button 
                onClick={handleClearFilters}
                className="text-xs font-bold text-primary hover:underline"
              >
                {t('inventory.resetFilters')}
              </button>
            </motion.div>
          ) : (
            filteredAudits.map((audit, index) => (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="w-full bg-white border border-outline-variant/10 rounded-2xl p-5 hover:border-primary/20 hover:shadow-md transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* Decorative Icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-on-surface-variant/40 border border-outline-variant/10 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <Building size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-black text-on-background tracking-tight leading-snug">
                      {audit.address}
                    </span>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-on-surface-variant/60 font-semibold flex-wrap">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md font-mono text-on-surface-variant/80 text-[10px]">
                        {audit.projectID}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {audit.city}
                      </span>
                      <span>•</span>
                      <span>{t('inventory.owner')}: {audit.owner}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-on-surface-variant/70 font-bold bg-gray-50 px-2 py-0.5 rounded-md">
                        <Calendar size={11} />
                        {formatDate(audit.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                  {/* Assign Inspector Selector Dropdown */}
                  <div className="flex flex-col min-w-[170px]">
                    <label className="text-[9px] font-black uppercase text-on-surface-variant/40 tracking-wider mb-1">
                      {tr('inventory.assignInspector', 'Toegewezen Inspecteur')}
                    </label>
                    <div className="relative">
                      <select
                        value={assignedInspectors[audit.id] || ''}
                        onChange={(e) => handleAssignInspector(audit.id, e.target.value)}
                        className="w-full bg-white border border-outline-variant/20 hover:border-primary/40 rounded-xl px-3 py-2 text-xs font-bold text-on-background focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-2xs appearance-none pr-8 transition-colors"
                      >
                        <option value="">-- Selecteer Inspecteur --</option>
                        {SAMPLE_INSPECTORS.map((insp) => (
                          <option key={insp} value={insp}>
                            {insp}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
                    </div>
                  </div>

                  {/* Audit trigger button (styled forest green of massEPA) */}
                  <button
                    type="button"
                    onClick={() => {
                      const chosenInspector = assignedInspectors[audit.id];
                      if (chosenInspector) {
                        try {
                          const clientId = audit.id;
                          const inspectorFlagsKey = `inspector_flags_${clientId}`;
                          const existing = JSON.parse(localStorage.getItem(inspectorFlagsKey) || '{}');
                          existing.adviseur = chosenInspector;
                          localStorage.setItem(inspectorFlagsKey, JSON.stringify(existing));
                        } catch (e) { }
                      }
                      onStartAudit(audit.rawRecord);
                    }}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm uppercase tracking-wider shrink-0 active:scale-[0.98] self-end sm:self-auto"
                  >
                    <span>{t('inventory.startAudit')}</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default InventoryView;
