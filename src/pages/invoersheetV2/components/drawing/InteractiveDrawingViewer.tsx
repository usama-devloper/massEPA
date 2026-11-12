import React, { useState, useRef } from 'react';
import { 
  DrawingItem, 
  InspectionPin 
} from '../../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  PlusCircle, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Eye, 
  Layers, 
  SunMedium,
  Image as ImageIcon,
  Compass
} from 'lucide-react';

interface InteractiveDrawingViewerProps {
  drawings: DrawingItem[];
  activeDrawingId: string;
  onSelectDrawing: (id: string) => void;
  selectedElementId?: string;
  onSelectElement?: (elementId: string) => void;
  onAddPin: (drawingId: string, pin: InspectionPin) => void;
}

export const InteractiveDrawingViewer: React.FC<InteractiveDrawingViewerProps> = ({
  drawings,
  activeDrawingId,
  onSelectDrawing,
  selectedElementId,
  onSelectElement,
  onAddPin
}) => {
  const currentDrawing = drawings.find((d) => d.id === activeDrawingId) || drawings[0];
  const [zoom, setZoom] = useState<number>(1);
  const [activePin, setActivePin] = useState<InspectionPin | null>(null);
  const [isAddingPin, setIsAddingPin] = useState<boolean>(false);
  const [newPinTag, setNewPinTag] = useState<string>('Rc 4.0');
  const [newPinTitle, setNewPinTitle] = useState<string>('Nieuw Schil Opnamepunt');
  const [pinFilter, setPinFilter] = useState<'all' | 'envelope' | 'window' | 'installation'>('all');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.75, prev - 0.25));
  const handleZoomReset = () => setZoom(1);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPin || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = Math.round((x / rect.width) * 100);
    const yPct = Math.round((y / rect.height) * 100);

    const newPin: InspectionPin = {
      id: `pin-${Date.now()}`,
      xPct,
      yPct,
      title: newPinTitle || 'Veldinspectie Markering',
      tag: newPinTag || 'Opname',
      description: 'Handmatig geplaatst veldinspectiepunt via CAD split-viewer.',
      type: 'envelope',
      status: 'verified'
    };

    onAddPin(currentDrawing.id, newPin);
    setActivePin(newPin);
    setIsAddingPin(false);
  };

  const filteredPins = currentDrawing.pins.filter((pin) => {
    if (pinFilter === 'all') return true;
    return pin.type === pinFilter;
  });

  return (
    <div className="flex flex-col h-full bg-primary-dark border-l border-slate-700 text-slate-200 overflow-hidden select-none">
      {/* Drawing selection toolbar */}
      <div className="px-3 py-2 bg-primary border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-white tracking-wide">
            Architectuur & Veldopname Viewer
          </span>
        </div>

        {/* Viewport controls */}
        <div className="flex items-center space-x-1 bg-primary-dark p-1 rounded border border-slate-700 text-xs">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
            title="Uitzoomen"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
            title="Inzoomen"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 transition border-l border-slate-800 ml-1 pl-1.5"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`p-1 rounded transition ml-1 ${
              highContrast ? 'bg-emerald-500 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Hoog contrast filter (CAD optimalisatie)"
          >
            <SunMedium className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs for different drawings */}
      <div className="bg-primary-dark px-3 py-1.5 border-b border-slate-800 flex items-center space-x-1 overflow-x-auto text-xs">
        {drawings.map((dwg) => {
          const isActive = dwg.id === currentDrawing.id;
          return (
            <button
              key={dwg.id}
              onClick={() => {
                onSelectDrawing(dwg.id);
                setActivePin(null);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded whitespace-nowrap transition ${
                isActive
                  ? 'bg-primary text-white font-medium shadow-xs border border-primary/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {dwg.type === 'photo' ? (
                <ImageIcon className="w-3 h-3 text-amber-400" />
              ) : (
                <Compass className="w-3 h-3 text-emerald-500" />
              )}
              <span className="truncate max-w-[130px]">{dwg.title}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded font-mono">
                {dwg.pins.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Add Marker Bar */}
      <div className="px-3 py-1.5 bg-primary-dark border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-[11px]">
          <span className="text-slate-400 mr-1">Filter:</span>
          {(['all', 'envelope', 'window', 'installation'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPinFilter(f)}
              className={`px-2 py-0.5 rounded capitalize ${
                pinFilter === f
                  ? 'bg-primary text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Alle' : f === 'envelope' ? 'Schil/Rc' : f === 'window' ? 'Kozijnen' : 'Installaties'}
            </button>
          ))}
        </div>

        <div>
          <button
            onClick={() => setIsAddingPin(!isAddingPin)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition ${
              isAddingPin
                ? 'bg-amber-500 text-slate-950 font-semibold ring-2 ring-amber-300'
                : 'bg-primary hover:bg-primary-dark text-emerald-500 border border-primary-dark'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isAddingPin ? 'Klik op tekening om te plaatsen' : 'Punt Plaatsen'}</span>
          </button>
        </div>
      </div>

      {/* Main image canvas area */}
      <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center bg-[#1a1c19]">
        <div
          ref={imageContainerRef}
          onClick={handleImageClick}
          className={`relative inline-block transition-transform duration-150 origin-center max-w-full shadow-2xl rounded border border-slate-800 ${
            isAddingPin ? 'cursor-crosshair' : 'cursor-default'
          } ${highContrast ? 'contrast-125 brightness-105 saturate-150' : ''}`}
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Main hotlinked image */}
          <img
            src={currentDrawing.url}
            alt={currentDrawing.title}
            className="max-h-[520px] w-auto object-contain rounded select-none pointer-events-none block"
            crossOrigin="anonymous"
            loading="eager"
          />

          {/* Grid overlay for technical inspection feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded"></div>

          {/* Interactive Inspection Pins */}
          {filteredPins.map((pin) => {
            const isSelected = activePin?.id === pin.id || (selectedElementId && pin.elementId === selectedElementId);
            return (
              <div
                key={pin.id}
                style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(pin);
                  if (pin.elementId && onSelectElement) {
                    onSelectElement(pin.elementId);
                  }
                }}
              >
                <div
                  className={`group relative flex items-center justify-center cursor-pointer transition-transform duration-150 ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                  }`}
                >
                  <div
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shadow-lg border ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400/50'
                        : pin.type === 'window'
                        ? 'bg-sky-500 text-white border-sky-200'
                        : pin.type === 'installation'
                        ? 'bg-emerald-600 text-white border-emerald-300'
                        : 'bg-primary text-white border-emerald-500'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{pin.tag}</span>
                  </div>

                  {/* Pin pulsing ring */}
                  <span className={`absolute -inset-1 rounded-full animate-ping opacity-25 ${
                    isSelected ? 'bg-amber-400' : 'bg-teal-400'
                  }`}></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspector Details Footer / Pin Inspector */}
      <div className="p-3 bg-primary-dark border-t border-slate-800">
        {activePin ? (
          <div className="bg-primary p-3 rounded-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary text-white">
                  {activePin.tag}
                </span>
                <span className="text-xs font-semibold text-white">
                  {activePin.title}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>BRL 9500 Geverifieerd</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePin.description}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {activePin.elementId && (
                <button
                  onClick={() => onSelectElement && onSelectElement(activePin.elementId!)}
                  className="px-2.5 py-1 text-xs bg-[#2563eb] hover:bg-blue-600 text-white rounded font-medium transition"
                >
                  Bekijk in Schil Matrix
                </button>
              )}
              <button
                onClick={() => setActivePin(null)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              >
                Sluiten
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-slate-500">Info:</span>
              <span>{currentDrawing.caption}</span>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-slate-500">
              <span>Klik op markering voor isolatie & constructiedetails</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

