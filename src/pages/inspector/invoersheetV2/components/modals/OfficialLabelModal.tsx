import React from 'react';
import { ProjectDossier, EnergyLabel } from '../../types';
import { NtaCalculationResult, LABEL_COLORS } from '../../utils/nta8800Calculator';
import { Award, Printer, X, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

interface OfficialLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: ProjectDossier;
  calcResult: NtaCalculationResult;
}

const ALL_LABELS: EnergyLabel[] = ['A++++', 'A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

export const OfficialLabelModal: React.FC<OfficialLabelModalProps> = ({
  isOpen,
  onClose,
  dossier,
  calcResult
}) => {
  if (!isOpen) return null;

  const currentConfig = LABEL_COLORS[calcResult.label];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-300 overflow-hidden my-6">
        {/* Top Control Bar */}
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2 text-xs">
            <Award className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">Officieel Energielabel Certificaat (RVO Model)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1 px-3 py-1 bg-primary hover:bg-primary-dark text-white text-xs rounded transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Afdrukken / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Content - Printable Layout */}
        <div className="p-8 space-y-6 text-slate-900 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-5 gap-4">
            <div>
              <div className="text-xs font-mono tracking-widest text-slate-500 uppercase">
                Rijksdienst voor Ondernemend Nederland • NTA 8800
              </div>
              <h1 className="text-3xl font-black font-display tracking-tight text-slate-900 mt-1">
                Energielabel Woning
              </h1>
              <div className="text-xs text-slate-600 mt-0.5">
                Conform BRL 9500-01 en NTA 8800:2024 rekenmethodiek
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Registratienummer</span>
                <span className="font-mono font-bold text-xs text-slate-900">{dossier.dossierNumber}</span>
                <span className="text-[10px] text-slate-500 block">Geldig tot 12-03-2035</span>
              </div>
              <QrCode className="w-10 h-10 text-slate-800" />
            </div>
          </div>

          {/* Building Address details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Adres</span>
              <span className="font-bold text-slate-900">{dossier.bag.address} {dossier.bag.houseNumber}</span>
              <span className="block text-slate-600">{dossier.bag.postalCode} {dossier.bag.city}</span>
            </div>
            <div>
              <span className="text-slate-500 block">BAG Pand & VBO</span>
              <span className="font-mono font-medium text-slate-900 block">{dossier.bag.pandId}</span>
              <span className="font-mono text-slate-600">{dossier.bag.vboId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Gebruiksoppervlakte</span>
              <span className="font-bold text-slate-900">{dossier.bag.usableAreaAg} m²</span>
              <span className="block text-slate-600">{dossier.bag.buildingType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bouwjaar</span>
              <span className="font-bold text-slate-900">{dossier.bag.constructionYear}</span>
              <span className="block text-slate-600">Compactheid: {dossier.bag.compactnessAlsAg}</span>
            </div>
          </div>

          {/* Main Energielabel Ladder Visualization */}
          <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Vertical label ladder */}
              <div className="space-y-1.5 w-full md:w-80">
                {ALL_LABELS.map((lbl) => {
                  const isCurrent = calcResult.label === lbl;
                  const cfg = LABEL_COLORS[lbl];
                  return (
                    <div key={lbl} className="flex items-center space-x-2">
                      <div
                        className={`h-7 px-3 rounded flex items-center justify-between text-xs font-bold text-white transition-all ${cfg.bg}`}
                        style={{ width: `${Math.max(80, 240 - ALL_LABELS.indexOf(lbl) * 14)}px` }}
                      >
                        <span>{lbl}</span>
                      </div>
                      {isCurrent && (
                        <div className="flex items-center space-x-2 font-display font-black text-xl text-slate-900 animate-pulse">
                          <span className="text-2xl">◀</span>
                          <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-sm">
                            HUIDIG LABEL
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Big summary card */}
              <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-xs uppercase font-mono text-slate-500 tracking-wider">
                  Toegekend Energielabel
                </span>
                <div className={`px-8 py-3 rounded-xl font-display font-black text-5xl shadow-lg ${currentConfig.bg} ${currentConfig.text}`}>
                  {calcResult.label}
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {currentConfig.desc}
                </div>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Deze woning verbruikt conform NTA 8800 normering <strong>{calcResult.ep1} kWh/m²</strong> fossiele energie per jaar.
                </p>
              </div>
            </div>
          </div>

          {/* BENG Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">EP1 Fossiel</span>
              <span className="font-mono font-bold text-base text-slate-900">{calcResult.ep1}</span>
              <span className="text-[10px] text-slate-400 block">kWh/m²·jr</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">EP2 Primair</span>
              <span className="font-mono font-bold text-base text-slate-900">{calcResult.ep2}</span>
              <span className="text-[10px] text-slate-400 block">kWh/m²·jr</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">EP3 Hernieuwbaar</span>
              <span className="font-mono font-bold text-base text-emerald-700">{calcResult.ep3}%</span>
              <span className="text-[10px] text-slate-400 block">Min. 50% vereist</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block">Oververhitting TO_juli</span>
              <span className="font-mono font-bold text-base text-slate-900">{calcResult.toJuli}</span>
              <span className="text-[10px] text-slate-400 block">Grenswaarde 1.20</span>
            </div>
          </div>

          {/* Auditor Certification Box */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
            <div>
              Geregistreerd EPA-adviseur: <span className="font-semibold text-slate-900">{dossier.inspectorName}</span> ({dossier.inspectorCertNumber})
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Conform BRL 9500-01 gewaarmerkt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

