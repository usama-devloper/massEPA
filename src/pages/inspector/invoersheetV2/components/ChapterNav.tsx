import React, { useRef, useEffect, useState } from 'react';
import { 
  Eye,
  FolderKanban, 
  Layers, 
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

export type ChapterId = 'visuals' | 'dossier' | 'identification' | 'envelope' | 'installations';

interface ChapterNavProps {
  activeChapter: ChapterId;
  onSelectChapter: (id: ChapterId) => void;
  facadeCount: number;
  spacesCount: number;
  unresolvedValidationCount?: number;
}

interface ChapterDef {
  id: ChapterId;
  number: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const ChapterNav: React.FC<ChapterNavProps> = ({
  activeChapter,
  onSelectChapter,
  facadeCount,
  spacesCount,
  unresolvedValidationCount
}) => {
  const { t } = useLanguage();

  const chapters: ChapterDef[] = [
    {
      id: 'visuals',
      number: '1',
      title: t('invoersheetV2.visuals.title') || '1. Visuals (House information)',
      shortTitle: t('invoersheetV2.visuals.shortTitle') || 'Visuals',
      icon: Eye
    },
    {
      id: 'dossier',
      number: '2',
      title: t('invoersheetV2.identification.title') || '2. Identificatie',
      shortTitle: t('invoersheetV2.identification.shortTitle') || 'Identificatie',
      icon: FolderKanban
    },
    {
      id: 'envelope',
      number: '3',
      title: t('invoersheetV2.exterior.title') || '3. Exterior',
      shortTitle: t('invoersheetV2.exterior.shortTitle') || 'Exterior',
      icon: Layers,
      badge: `${facadeCount} ${t('invoersheetV2.exterior.facades') || 'Gevels'}`,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'installations',
      number: '4',
      title: t('invoersheetV2.interior.title') || '4. Interior (Spaces)',
      shortTitle: t('invoersheetV2.interior.shortTitle') || 'Interior',
      icon: Flame,
      badge: `${spacesCount} ${t('invoersheetV2.interior.spaces') || 'Ruimtes'}`,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    }
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [chapters.length]);

  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
      
      const scrollLeft = tab.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeChapter]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const isChapterActive = (chapId: ChapterId) => {
    if (activeChapter === chapId) return true;
    if ((chapId === 'dossier' || chapId === 'identification') && (activeChapter === 'dossier' || activeChapter === 'identification')) return true;
    return false;
  };

  return (
    <div className="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-sm w-fit max-w-full">
      {showLeftArrow && (
        <button 
          onClick={() => scrollByAmount(-200)}
          className="absolute left-0 z-10 h-full px-2 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-l-xl border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <nav 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex-1 overflow-x-auto no-scrollbar p-1.5 scroll-smooth"
      >
        <div className="flex items-center space-x-1 min-w-max">
        {chapters.map((chapter) => {
          const isActive = isChapterActive(chapter.id);
          const Icon = chapter.icon;

          return (
            <button
              key={chapter.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onSelectChapter(chapter.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span>{chapter.title}</span>
              {chapter.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-[#213145] text-emerald-500' : chapter.badgeColor}`}>
                  {chapter.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </nav>

      {showRightArrow && (
        <button 
          onClick={() => scrollByAmount(200)}
          className="absolute right-0 z-10 h-full px-2 bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-r-xl border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

