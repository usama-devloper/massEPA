import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Info, 
  Ruler, 
  Wrench, 
  Triangle,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Layers,
  FileDigit,
  ClipboardList,
  LogOut
} from 'lucide-react';
import { ViewType } from '../../pages/backoffice/backofficeTypes';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

interface BackOfficeSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  userName: string;
}

export const BackOfficeSidebar: React.FC<BackOfficeSidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onLogout,
  userName
}) => {
  const { t } = useLanguage();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    bouwkundig: true
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuItems = [
    { id: 'inventory' as ViewType, key: 'inventory', label: 'Inventory', icon: ClipboardList },
    { id: 'dashboard' as ViewType, key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bewoner' as ViewType, key: 'identificatie', label: 'Identificatie', icon: UserCheck },
    { id: 'algemeen' as ViewType, key: 'algemeen', label: 'Algemeen', icon: Info },
    { id: 'installatie' as ViewType, key: 'installatie', label: 'Installatie', icon: Wrench },
    { 
      id: 'geometry' as ViewType, 
      key: 'bouwkundig',
      label: 'Bouwkundig', 
      icon: Triangle,
      subItems: [
        { id: 'constructie' as ViewType, key: 'constructie', label: 'Constructie', icon: Ruler },
        { id: 'bouwkundig-gevel' as ViewType, key: 'gevel', label: 'Gevel', icon: Info },
        { id: 'bouwkundig-vloer' as ViewType, key: 'vloer', label: 'Vloer', icon: Info },
        { id: 'bouwkundig-dak' as ViewType, key: 'dak', label: 'Dak', icon: Info },
        { id: 'geometry-kozijn' as ViewType, key: 'kozijn', label: 'Kozijn', icon: Info },
        { id: 'geometry-overstek' as ViewType, key: 'overstek', label: 'Overstek & belemmering', icon: Triangle },
      ]
    },
    { id: 'woningdossier' as ViewType, key: 'woningdossier', label: 'WoningDossier', icon: Layers },
    { id: 'invoersheet' as ViewType, key: 'invoersheet', label: 'Invoersheet', icon: FileDigit },
  ];

  const isItemActive = (item: any) => {
    if (item.id === currentView) return true;
    if (item.id === 'bewoner' && (currentView === 'bewoner' || currentView === 'inspector' || currentView === 'bid-intern')) {
      return true;
    }
    if (item.subItems && item.subItems.some((sub: any) => sub.id === currentView)) {
      return true;
    }
    return false;
  };

  return (
    <aside className="app-sidebar fixed left-0 top-[var(--app-topbar-height)] hidden md:flex h-[calc(100dvh-var(--app-topbar-height))] h-[calc(100vh-var(--app-topbar-height))] w-64 flex-col bg-sidebar p-5 z-[100] border-r border-outline-variant/10">
      <div className="mb-6 p-3 bg-primary/10 rounded-xl">
        <p className="font-display font-black text-md text-primary truncate" title={userName}>{userName || 'Back Office'}</p>
        <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">Back Office</span>
      </div>

      <nav className="flex-grow space-y-1 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const itemLabel = item.key ? t(`nav.${item.key}`) : item.label;
          const active = isItemActive(item);
          
          return (
            <React.Fragment key={item.key}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (item.subItems) {
                      setExpandedItems(prev => ({ ...prev, [item.key]: !prev[item.key] }));
                    } else {
                      onViewChange(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm font-bold transition-all ${
                    active && !item.subItems
                      ? 'bg-primary text-white'
                      : 'text-on-surface-variant/60 hover:bg-surface-container-high'
                  }`}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="flex-1 text-left">{itemLabel}</span>
                  {item.subItems && (
                    <div 
                      onClick={(e) => toggleExpand(item.key, e)}
                      className="p-1 hover:bg-black/5 rounded-md transition-colors"
                    >
                      {expandedItems[item.key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  )}
                </button>
              </div>

              {item.subItems && expandedItems[item.key] && (
                <div className="ml-4 mt-1 pl-3 border-l border-outline-variant/20 space-y-1">
                  {item.subItems.map((sub) => {
                    const subLabel = sub.key ? t(`nav.${sub.key}`) : sub.label;
                    const subActive = currentView === sub.id;
                    
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onViewChange(sub.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-xs font-bold transition-all ${
                          subActive
                            ? 'bg-primary/10 text-primary font-black'
                            : 'text-on-surface-variant/50 hover:bg-surface-container-high'
                        }`}
                      >
                        <sub.icon size={12} className="shrink-0" />
                        <span className="truncate">{subLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-auto mb-2 flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
      >
        <LogOut size={18} />
        {t('common.logout')}
      </button>
    </aside>
  );
};
