import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Save
} from 'lucide-react';
import { ProjectDossier } from '../types';
import { NtaCalculationResult } from '../utils/nta8800Calculator';
import { useLanguage } from '../../../context/LanguageContext';

interface HeaderProps {
  dossier: ProjectDossier;
  calcResult?: NtaCalculationResult;
  isSplitView?: boolean;
  onToggleSplitView?: () => void;
  onOpenBcrg?: () => void;
  onOpenCertificate?: () => void;
  onOpenXml?: () => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  isFirstScreen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  dossier,
  hasUnsavedChanges,
  onSave
}) => {
  const { t } = useLanguage();
  return (
    <header className="bg-primary text-white border-b border-primary-dark sticky top-0 z-30 shadow-md">
      {/* Top utility row */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-display font-bold text-base tracking-tight text-white">
            <span className="bg-primary text-white p-1 rounded">
              <Building2 className="w-4 h-4" />
            </span>
            <span>MassEPA <span className="text-emerald-500 font-normal">Inspect Pro</span></span>
          </div>

          <span className="text-slate-500">|</span>
          
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
            <span className="text-slate-400">{t('invoersheetV2.header.dossier')}</span>
            <span className="font-semibold text-white bg-primary-dark px-2 py-0.5 rounded border border-primary-dark">
              {dossier.dossierNumber}
            </span>
          </div>

          <span className="hidden sm:inline text-slate-400">
            {dossier.bag.address} {dossier.bag.houseNumber}, {dossier.bag.city}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={onSave}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition ${
                hasUnsavedChanges 
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30' 
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {hasUnsavedChanges ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('invoersheetV2.header.saveChanges')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('invoersheetV2.header.autoSaved')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

