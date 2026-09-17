// src/components/common/TopBar.tsx
import { useEffect, useRef } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, ArrowLeft } from 'lucide-react';
import { UserMenu } from './UserMenu';

function syncTopBarHeight(el: HTMLElement | null) {
  if (!el) return;
  document.documentElement.style.setProperty('--app-topbar-height', `${el.offsetHeight}px`);
}

interface TopBarProps {
  onMenuClick?: () => void;
  onBack?: () => void;
  showMenu?: boolean;
  showUserMenu?: boolean;
  userName?: string;
  onManageProfile?: () => void;
  onLogout?: () => void;
  rightButton?: React.ReactNode;
  leftContent?: React.ReactNode;
  onLogoClick?: () => void;
  onOpenSettings?: () => void;
  onSidebarToggle?: () => void;      // ← ADD THIS
  isSidebarOpen?: boolean;           // ← ADD THIS
  profilePhoto?: string;
}

export const TopBar = ({
  onMenuClick,
  onBack,
  showMenu = false,
  showUserMenu = false,
  userName = 'User',
  onManageProfile,
  onLogout,
  rightButton,
  leftContent,
  onLogoClick,
  onOpenSettings,
  onSidebarToggle,      // ← ADD THIS
  isSidebarOpen = true, // ← ADD THIS
  profilePhoto,
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
      <div className="flex items-center gap-2 sm:gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-2 -ml-1 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all cursor-pointer text-slate-700 flex items-center justify-center"
            title="Terug"
          >
            <ArrowLeft size={22} />
          </button>
        ) : showMenu ? (
          <button type="button" onClick={onMenuClick} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
            <Menu size={24} />
          </button>
        ) : null}

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

        {leftContent && (
          <div className="ml-4 flex items-center">
            {leftContent}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {rightButton && <div>{rightButton}</div>}
        {showUserMenu && (
          <UserMenu
            userName={userName}
            onManageProfile={onManageProfile || (() => { })}
            onLogout={onLogout || (() => { })}
            onOpenSettings={onOpenSettings}
            profilePhoto={profilePhoto}
          />
        )}
      </div>
    </header>
  );
};