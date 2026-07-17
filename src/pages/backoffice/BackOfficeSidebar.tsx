import React, { useState, useEffect } from 'react';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface SidebarItem {
  id: string;
  labelKey?: string;
  labelDefault?: string;
  icon: any; // LucideIcon component
  subItems?: SidebarItem[];
}

interface BackOfficeSidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onLogout: () => void;
  userName: string;
  items: SidebarItem[];
}

export const BackOfficeSidebar: React.FC<BackOfficeSidebarProps> = ({
  currentView,
  onViewChange,
  onLogout,
  userName,
  items,
}) => {
  const { t, locale } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    geometry: true,
    bouwkundig: true,
    identificatie: true
  });

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isItemActive = (itemId: string): boolean => {
    return currentView === itemId;
  };

  return (
    <aside className={`bg-sidebar text-on-surface flex flex-col shrink-0 h-screen transition-all duration-300 ease-in-out border-r border-outline-variant/10 select-none z-30 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Brand Header */}
      <div className={`p-4 border-b border-outline-variant/10 flex items-center justify-between ${isCollapsed ? 'flex-col gap-3 px-2 py-4' : ''}`}>
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="bg-primary p-2 rounded-xl flex items-center justify-center shadow-sm">
            <Layers size={18} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col text-left">
              <span className="font-display font-black text-sm tracking-tight text-on-surface leading-none">MassEPA</span>
              <span className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">BackOffice</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-on-surface-variant/60 hover:text-primary transition-colors p-1.5 hover:bg-surface-container-high rounded-xl cursor-pointer"
          title={isCollapsed ? "Menu uitklappen" : "Menu inklappen"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Profile/Role Widget */}
      {!isCollapsed && (
        <div className="mx-4 mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl">
          <p className="font-display font-black text-[10px] text-primary uppercase tracking-wider leading-none">
            {locale === 'en' ? 'Selected role' : 'Geselecteerde rol'}
          </p>
          <p className="font-display font-black text-xs text-on-surface truncate mt-1.5">{userName || 'Demo Back Office'}</p>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-grow space-y-1.5 overflow-y-auto py-4 px-3">
        {items.map((item) => {
          const itemLabel = item.labelKey ? t(item.labelKey) : (item.labelDefault || item.id);
          const isSubActive = item.subItems && item.subItems.some(sub => isItemActive(sub.id));
          const isActive = isItemActive(item.id) || isSubActive;

          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (isCollapsed) {
                    if (item.subItems) {
                      setIsCollapsed(false);
                      setExpandedItems(prev => ({ ...prev, [item.id]: true }));
                    } else {
                      onViewChange(item.id);
                    }
                  } else {
                    if (item.subItems) {
                      toggleExpand(item.id);
                    } else {
                      onViewChange(item.id);
                    }
                  }
                }}
                title={isCollapsed ? itemLabel : undefined}
                className={`w-full flex items-center transition-all relative cursor-pointer ${isCollapsed ? 'justify-center py-4 px-0' : 'px-3.5 py-3 gap-3'
                  } rounded-xl ${isActive
                    ? 'bg-primary text-white font-black shadow-sm'
                    : 'text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface font-bold'
                  }`}
              >
                <item.icon size={16} />

                {!isCollapsed && (
                  <span className="text-xs flex-1 text-left uppercase tracking-wider font-display font-bold">
                    {itemLabel}
                  </span>
                )}

                {!isCollapsed && item.subItems && (
                  expandedItems[item.id] ? <ChevronDown size={14} className="opacity-55" /> : <ChevronRight size={14} className="opacity-55" />
                )}
              </button>

              {!isCollapsed && item.subItems && expandedItems[item.id] && (
                <div className="py-1 overflow-hidden space-y-1 pl-2">
                  {item.subItems.map((sub) => {
                    const subLabel = sub.labelKey ? t(sub.labelKey) : (sub.labelDefault || sub.id);
                    const isSubItemActive = isItemActive(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onViewChange(sub.id)}
                        className={`w-full flex items-center gap-3 pl-8 pr-4 py-2.5 transition-all relative cursor-pointer rounded-xl ${isSubItemActive
                          ? 'text-primary font-black bg-primary/10 border-l-4 border-primary'
                          : 'text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-high/50 font-bold'
                          }`}
                      >
                        <sub.icon size={13} />
                        <span className="text-xs font-display">{subLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Sidebar Collapse/Expand Toggle (bottom) */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`mt-auto flex items-center gap-3 rounded-xl hover:bg-surface-container-high/80 text-on-surface-variant/70 hover:text-primary transition-all font-bold text-sm mx-3 mb-2 shrink-0 cursor-pointer ${isCollapsed ? 'justify-center py-4 px-0' : 'px-3 py-3'}`}
        title={isCollapsed ? (locale === 'en' ? 'Expand menu' : 'Menu uitklappen') : (locale === 'en' ? 'Collapse menu' : 'Menu inklappen')}
      >
        {isCollapsed ? <ChevronRight size={18} /> : (
          <>
            <ChevronLeft size={18} />
            <span className="text-xs uppercase tracking-wider font-display font-black">
              {locale === 'en' ? 'Collapse' : 'Inklappen'}
            </span>
          </>
        )}
      </button>

      {/* Logout button */}
      <button
        type="button"
        onClick={onLogout}
        className={`mb-2 flex items-center gap-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm ${isCollapsed ? 'justify-center py-4 px-0' : 'px-3 py-3 mx-3'}`}
        title={t('common.logout')}
      >
        <LogOut size={18} />
        {!isCollapsed && <span>{t('common.logout')}</span>}
      </button>
    </aside>
  );
};

export default BackOfficeSidebar;
