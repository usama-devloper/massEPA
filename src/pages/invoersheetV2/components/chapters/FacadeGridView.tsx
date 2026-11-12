import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Box } from '@react-three/drei';
import * as THREE from 'three';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Box as BoxIcon, 
  MapPin, 
  Layers, 
  Maximize2, 
  RotateCw, 
  Compass, 
  Info, 
  ChevronDown, 
  Check, 
  ExternalLink, 
  Search,
  Building,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';
import { ProjectDossier } from '../../types';
import { 
  findGlbForAddress, 
  getUnitsForComplex, 
  getAllComplexes, 
  fetchPandPolygon,
  GlbUnitInfo, 
  GlbComplexInfo 
} from '../../utils/glbAddressMatcher';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom active pin
const activeUnitIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Neighbor unit pin
const neighborUnitIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -26],
  shadowSize: [32, 32]
});

/**
 * Controller to smoothly animate Leaflet map to new center coordinates
 */
const MapCenterController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 19 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center[0], center[1], zoom, map]);
  return null;
};

/**
 * 3D Model Renderer using useGLTF with wireframe and centering
 */
interface GlbMeshProps {
  url: string;
  wireframe: boolean;
  onLoaded?: () => void;
}

const GlbModelMesh: React.FC<GlbMeshProps> = ({ url, wireframe, onLoaded }) => {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => {
              m.wireframe = wireframe;
            });
          } else if (mesh.material) {
            mesh.material.wireframe = wireframe;
          }
        }
      });
      onLoaded?.();
    }
  }, [scene, wireframe, onLoaded]);

  if (!scene) {
    return (
      <Box args={[4, 6, 8]}>
        <meshStandardMaterial color="#0284c7" wireframe={wireframe} />
      </Box>
    );
  }

  return (
    <Center top>
      <primitive object={scene} />
    </Center>
  );
};

interface FacadeGridViewProps {
  dossier: ProjectDossier;
  onNavigateToChapter?: (chapter: any) => void;
  onUpdateBag?: (updates: any) => void;
}

export const FacadeGridView: React.FC<FacadeGridViewProps> = ({
  dossier,
  onNavigateToChapter,
  onUpdateBag
}) => {
  const complexes = useMemo(() => getAllComplexes(), []);

  // Initial matched unit based on dossier address
  const initialMatchedUnit = useMemo(() => {
    return findGlbForAddress(
      `${dossier.bag?.address || ''} ${dossier.bag?.houseNumber || ''}`.trim(),
      dossier.bag?.pandId,
      dossier.bag?.vboId,
      (dossier.generalDetails as any)?.complex || (dossier.generalDetails as any)?.technischComplex
    );
  }, [dossier]);

  const [selectedUnit, setSelectedUnit] = useState<GlbUnitInfo | null>(initialMatchedUnit);
  const [activeComplexId, setActiveComplexId] = useState<string>(
    initialMatchedUnit?.complexId || complexes[0]?.id || '1132'
  );

  // Sync selectedUnit when dossier address updates
  useEffect(() => {
    if (initialMatchedUnit) {
      setSelectedUnit(initialMatchedUnit);
      setActiveComplexId(initialMatchedUnit.complexId);
    }
  }, [initialMatchedUnit]);

  // All units in currently active complex
  const complexUnits = useMemo(() => {
    return getUnitsForComplex(activeComplexId);
  }, [activeComplexId]);

  // If selectedUnit's complex changes, keep selectedUnit consistent
  useEffect(() => {
    if (selectedUnit && selectedUnit.complexId !== activeComplexId) {
      const matchInComplex = complexUnits.find(u => u.vhe === selectedUnit.vhe);
      if (matchInComplex) {
        setSelectedUnit(matchInComplex);
      } else if (complexUnits.length > 0) {
        setSelectedUnit(complexUnits[0]);
      }
    }
  }, [activeComplexId, complexUnits, selectedUnit]);

  // 3D View state
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'split' | '3d' | 'map'>('split');
  const [mapLayer, setMapLayer] = useState<'kadaster' | 'osm'>('kadaster');
  const [cameraKey, setCameraKey] = useState<number>(0);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState<boolean>(false);
  const [unitSearch, setUnitSearch] = useState<string>('');
  const [pandPolygonCoords, setPandPolygonCoords] = useState<[number, number][] | null>(null);

  // Fetch GeoJSON polygon for current unit pand
  useEffect(() => {
    let isCancelled = false;
    if (selectedUnit?.pandId && selectedUnit.complexId) {
      fetchPandPolygon(selectedUnit.complexId, selectedUnit.pandId).then((styles) => {
        if (isCancelled || !styles || !Array.isArray(styles) || styles.length === 0) return;
        const geom = styles[0]?.geometry;
        if (geom && geom.coordinates) {
          // Polygon coords in GeoJSON are [lng, lat]
          let rawRing: number[][] = [];
          if (geom.type === 'Polygon') {
            rawRing = geom.coordinates[0];
          } else if (geom.type === 'MultiPolygon') {
            rawRing = geom.coordinates[0]?.[0] || [];
          }
          if (rawRing.length > 0) {
            const leafletCoords: [number, number][] = rawRing.map(([lng, lat]) => [lat, lng]);
            setPandPolygonCoords(leafletCoords);
          }
        }
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [selectedUnit]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedUnit && selectedUnit.lat && selectedUnit.lng) {
      return [selectedUnit.lat, selectedUnit.lng];
    }
    return [52.33597, 5.23578]; // Default Almere Jaagmeent
  }, [selectedUnit]);

  const filteredComplexUnits = useMemo(() => {
    if (!unitSearch.trim()) return complexUnits;
    const q = unitSearch.toLowerCase();
    return complexUnits.filter(u => 
      u.address.toLowerCase().includes(q) || 
      u.postalCode.toLowerCase().includes(q) ||
      u.vhe.toLowerCase().includes(q) ||
      String(u.houseNumber).includes(q)
    );
  }, [complexUnits, unitSearch]);

  const handleSelectUnit = (unit: GlbUnitInfo) => {
    setSelectedUnit(unit);
    setIsUnitDropdownOpen(false);
  };

  const handleLinkToDossier = () => {
    if (selectedUnit && onUpdateBag) {
      onUpdateBag({
        address: selectedUnit.street,
        houseNumber: selectedUnit.houseNumberFull,
        postalCode: selectedUnit.postalCode,
        city: selectedUnit.city,
        pandId: selectedUnit.pandId,
        vboId: selectedUnit.vboId
      });
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header Bar with Complex switcher & status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BoxIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
                <span>5. Facade Grid</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                  GLB 3D & Kaart
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Exacte 3D GLB modellen en kadastrale kaartweergave per adres (VHE) via <span className="font-mono text-slate-700">GLB_name</span>
              </p>
            </div>
          </div>
        </div>

        {/* Complex Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
          {complexes.map((c) => {
            const isActive = activeComplexId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveComplexId(c.id);
                  const firstInComplex = getUnitsForComplex(c.id)[0];
                  if (firstInComplex) setSelectedUnit(firstInComplex);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {c.name.split(' ')[0]} ({c.name.includes('+') ? 'Jaag/Riet' : c.name.split(' ')[1] || c.id})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Address / VHE Selection Bar & View Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Address Dropdown */}
        <div className="relative min-w-[280px] flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Geselecteerd Adres:
            </span>
            <button
              type="button"
              onClick={() => setIsUnitDropdownOpen(prev => !prev)}
              className="flex-1 flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {selectedUnit ? `${selectedUnit.address}, ${selectedUnit.postalCode}` : 'Selecteer een woning...'}
                </span>
                {selectedUnit && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    VHE: {selectedUnit.vhe}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </div>

          {/* Unit Dropdown Menu */}
          {isUnitDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 max-h-80 flex flex-col">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Zoek straat, huisnummer, postcode of VHE..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                {filteredComplexUnits.map((u) => {
                  const isSelected = selectedUnit?.vhe === u.vhe;
                  return (
                    <button
                      key={u.vhe}
                      type="button"
                      onClick={() => handleSelectUnit(u)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{u.address}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                          {u.postalCode} {u.city} • PAND: {u.pandId}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.glbFileName}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filteredComplexUnits.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Geen adressen gevonden voor "{unitSearch}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Link to dossier button if address differs */}
          {selectedUnit && (
            <button
              type="button"
              onClick={handleLinkToDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
              title="Koppel dit adres aan het huidige dossier"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Koppel aan Dossier</span>
            </button>
          )}

          {/* Layout switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                layoutMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('3d')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                layoutMode === '3d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              3D Focus
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('map')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                layoutMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Kaart Focus
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: 3D GLB Model View & 2D Kadastrale Kaart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px]">
        {/* LEFT: 3D Model Viewer Canvas */}
        {(layoutMode === 'split' || layoutMode === '3d') && (
          <div className={`${layoutMode === '3d' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-slate-950 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden flex flex-col`}>
            {/* 3D Top Info Header */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-lg pointer-events-auto flex items-center gap-2">
                <BoxIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>{selectedUnit?.address || 'GLB Model'}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 rounded">
                      GLB_name: {selectedUnit?.glbName || selectedUnit?.glbFileName}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    VHE: {selectedUnit?.vhe || '-'} • PAND: {selectedUnit?.pandId || '-'}
                  </div>
                </div>
              </div>

              {/* 3D Viewer Toolbar */}
              <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg pointer-events-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWireframe(prev => !prev)}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    wireframe ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title="Wissel Wireframe / Solid"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRotate(prev => !prev)}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    autoRotate ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title="Auto-Rotatie Aan/Uit"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCameraKey(k => k + 1)}
                  className="p-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Herstel Camera Positie"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas 3D */}
            <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
              <Canvas
                key={`canvas-${cameraKey}-${selectedUnit?.glbUrl}`}
                camera={{ position: [15, 12, 18], fov: 45 }}
                shadows
              >
                <ambientLight intensity={0.8} />
                <directionalLight position={[15, 25, 15]} intensity={1.5} castShadow />
                <directionalLight position={[-15, 10, -15]} intensity={0.6} />
                
                <Suspense
                  fallback={
                    <Box args={[4, 5, 6]} position={[0, 2.5, 0]}>
                      <meshStandardMaterial color="#0284c7" wireframe />
                    </Box>
                  }
                >
                  {selectedUnit?.glbUrl ? (
                    <GlbModelMesh
                      url={selectedUnit.glbUrl}
                      wireframe={wireframe}
                    />
                  ) : (
                    <Box args={[4, 6, 8]} position={[0, 3, 0]}>
                      <meshStandardMaterial color="#0284c7" wireframe={wireframe} />
                    </Box>
                  )}
                </Suspense>

                {/* Ground grid */}
                <gridHelper args={[40, 40, '#0284c7', '#334155']} position={[0, -0.01, 0]} />
                
                <OrbitControls 
                  makeDefault 
                  autoRotate={autoRotate} 
                  autoRotateSpeed={1.5}
                  enableDamping 
                  dampingFactor={0.08}
                />
              </Canvas>
            </div>

            {/* 3D Footer info bar */}
            <div className="bg-slate-900/90 px-4 py-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>Rotatie: <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">Linkermuisknop</kbd></span>
                <span>Pannen: <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">Rechtermuisknop</kbd></span>
                <span>Zoomen: <kbd className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">Scrollwiel</kbd></span>
              </div>
              {selectedUnit?.scale && (
                <span className="font-mono text-slate-300">Schaal: {selectedUnit.scale}x</span>
              )}
            </div>
          </div>
        )}

        {/* RIGHT: 2D Kadaster / OSM Map */}
        {(layoutMode === 'split' || layoutMode === 'map') && (
          <div className={`${layoutMode === 'map' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-white rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden flex flex-col`}>
            {/* Map Header Toolbar */}
            <div className="absolute top-3 left-3 right-3 z-1000 flex items-center justify-between pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-slate-800 pointer-events-auto flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold truncate">
                  {selectedUnit ? `${selectedUnit.address} • ${selectedUnit.postalCode}` : 'Kaartoverzicht'}
                </span>
              </div>

              {/* Layer Switcher */}
              <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md pointer-events-auto flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMapLayer('kadaster')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    mapLayer === 'kadaster'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Kadaster Satelliet
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayer('osm')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    mapLayer === 'osm'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Stratenkaart
                </button>
              </div>
            </div>

            {/* Leaflet Map */}
            <div className="flex-1 w-full h-full relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={19}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                <MapCenterController center={mapCenter} zoom={19} />
                
                {mapLayer === 'kadaster' ? (
                  <TileLayer
                    attribution='&copy; Kadaster / PDOK'
                    url="https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg"
                    maxZoom={20}
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={20}
                  />
                )}

                {/* Building Footprint Polygon */}
                {pandPolygonCoords && pandPolygonCoords.length > 0 && (
                  <Polygon
                    positions={pandPolygonCoords}
                    pathOptions={{
                      color: '#059669',
                      weight: 3,
                      fillColor: '#10b981',
                      fillOpacity: 0.45
                    }}
                  />
                )}

                {/* Selected Unit Marker */}
                {selectedUnit && (
                  <Marker
                    position={[selectedUnit.lat, selectedUnit.lng]}
                    icon={activeUnitIcon}
                  >
                    <Popup>
                      <div className="p-1 font-sans text-xs">
                        <div className="font-bold text-slate-900 text-sm mb-1">{selectedUnit.address}</div>
                        <div className="text-slate-600 space-y-0.5 font-mono text-[11px]">
                          <div>Postcode: <strong>{selectedUnit.postalCode}</strong></div>
                          <div>VHE: <strong>{selectedUnit.vhe}</strong></div>
                          <div>PAND: <strong>{selectedUnit.pandId}</strong></div>
                          <div>GLB: <strong className="text-emerald-700">{selectedUnit.glbFileName}</strong></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Sibling Units in Complex */}
                {complexUnits.map((u) => {
                  if (selectedUnit && u.vhe === selectedUnit.vhe) return null;
                  return (
                    <Marker
                      key={`unit-${u.vhe}`}
                      position={[u.lat, u.lng]}
                      icon={neighborUnitIcon}
                      eventHandlers={{
                        click: () => handleSelectUnit(u)
                      }}
                    >
                      <Popup>
                        <div className="p-1 font-sans text-xs">
                          <div className="font-bold text-slate-900">{u.address}</div>
                          <div className="text-[11px] text-slate-500 mb-2">VHE: {u.vhe}</div>
                          <button
                            type="button"
                            onClick={() => handleSelectUnit(u)}
                            className="w-full px-2 py-1 bg-primary text-white text-[11px] font-semibold rounded hover:bg-primary-dark transition cursor-pointer"
                          >
                            Toon 3D Model
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Map Footer Bar */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-800">Geselecteerd Pand</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 ml-2"></span>
                <span>Buurpanden ({complexUnits.length - 1} eenheden in complex)</span>
              </div>
              <div className="font-mono text-slate-500">
                Lat: {selectedUnit?.lat.toFixed(5)} • Lng: {selectedUnit?.lng.toFixed(5)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Building Details & NTA 8800 Integration Card */}
      {selectedUnit && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <span>Technische Specificaties & BAG Koppeling</span>
            </h2>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
              Complex: {selectedUnit.complexName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-0.5">VHE Nummer</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{selectedUnit.vhe}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-0.5">PAND Identificatie</span>
              <span className="font-bold text-slate-900 font-mono truncate block" title={selectedUnit.pandId}>
                {selectedUnit.pandId || '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-0.5">VBO Identificatie</span>
              <span className="font-bold text-slate-900 font-mono truncate block" title={selectedUnit.vboId}>
                {selectedUnit.vboId || '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-0.5">Bouwblok</span>
              <span className="font-bold text-slate-900 truncate block" title={selectedUnit.bouwblok}>
                {selectedUnit.bouwblok || '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-0.5">3D Model Bestand</span>
              <span className="font-bold text-emerald-700 font-mono truncate block" title={selectedUnit.glbName}>
                {selectedUnit.glbName}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block mb-0.5">Status Model</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Geverifieerd
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacadeGridView;
