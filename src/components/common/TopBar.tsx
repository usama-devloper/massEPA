// src/components/common/TopBar.tsx
import { useEffect, useRef } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { UserMenu } from './UserMenu';

function syncTopBarHeight(el: HTMLElement | null) {
  if (!el) return;
  document.documentElement.style.setProperty('--app-topbar-height', `${el.offsetHeight}px`);
}

interface TopBarProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
  showUserMenu?: boolean;
  userName?: string;
  onManageProfile?: () => void;
  onLogout?: () => void;
  rightButton?: React.ReactNode;
  onLogoClick?: () => void;
  onOpenSettings?: () => void;
  onSidebarToggle?: () => void;      // ← ADD THIS
  isSidebarOpen?: boolean;           // ← ADD THIS
}

export const TopBar = ({ 
  onMenuClick, 
  showMenu = false, 
  showUserMenu = false,
  userName = 'User',
  onManageProfile,
  onLogout,
  rightButton,
  onLogoClick,
  onOpenSettings,
  onSidebarToggle,      // ← ADD THIS
  isSidebarOpen = true, // ← ADD THIS
}: TopBarProps) => {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    syncTopBarHeight(el);
    const ro = new ResizeObserver(() => syncTopBarHeight(el));
    ro.observe(el);
    const onResize = () => syncTopBarHeight(el);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="app-top-bar bg-surface px-4 sm:px-6 py-4 flex justify-between items-center border-b border-outline-variant/10 shadow-sm"
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {showMenu && (
          <button type="button" onClick={onMenuClick} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all">
            <Menu size={24} />
          </button>
        )}
        
        {/* Desktop sidebar toggle button */}
        {showMenu && onSidebarToggle && (
          <button 
            type="button" 
            onClick={onSidebarToggle} 
            className="hidden md:block p-2 hover:bg-gray-100 rounded-lg transition-all"
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        )}
        
        {/* Logo */}
        <button
          type="button"
          onClick={() => onLogoClick?.()}
          className="cursor-pointer focus:outline-none"
          title="BuildingID"
        >
          <img 
            src="/logo.png" 
            alt="BuildingID" 
            className="h-10 w-auto" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=B';
            }} 
          />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        {rightButton && <div>{rightButton}</div>}
        {showUserMenu && (
          <UserMenu 
            userName={userName}
            onManageProfile={onManageProfile || (() => {})}
            onLogout={onLogout || (() => {})}
            onOpenSettings={onOpenSettings}
          />
        )}
      </div>
    </header>
  );
};