import React, { useState, useEffect } from 'react';
import { ProjectDossier } from '../../types';
import { fileToPersistedUrl } from '../../../../utils/persistedFileUrl';
import { idbGet, idbPut } from '../../../../storage/idbKv';
import {
  Eye,
  Maximize2,
  MapPin,
  ExternalLink,
  Compass,
  Layers,
  Navigation,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  X,
  Calendar,
  Building2,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Trash2,
  Plus,
  ChevronLeft,
  FileText,
  RefreshCw,
  AlertTriangle,
  Box
} from 'lucide-react';
import { MediaViewerModal } from '../../../../components/common/MediaViewerModal';
import { useLanguage } from '../../../../context/LanguageContext';
import { PdfThumbnail } from '../../../../components/common/PdfThumbnail';
import { resolvePropertyMapPresentation } from '../../../../utils/propertyMap';
import { parseDutchAddress } from '../../utils/dossierHydrator';
import { HybridStreetView } from '../../../../components/common/HybridStreetView';
import { GlbOnMapViewer } from '../common/GlbOnMapViewer';


const JAAGMEENT_1_CAMERA = {
  lat: 52.33702599569312,
  lng: 5.232569310471482,
  heading: 102,
  pitch: 0,
  zoom: 1,
  url: 'https://maps.google.com/maps?layer=c&cbll=52.33702599569312,5.232569310471482&cbp=0,102,0,1,0'
};

const isJaagmeent1Address = (addr?: string | null): boolean => {
  if (!addr) return false;
  const l = addr.toLowerCase();
  return /\bjaagmeent\s+1\b/i.test(l) && !/\bjaagmeent\s+1\d+/i.test(l);
};

const parseStreetViewUrl = (url?: string | null) => {
  if (!url) return null;
  const cbll = url.match(/cbll=([-\d.]+),([-\d.]+)/);
  const cbp = url.match(/cbp=([^,]+),([^,]+)(?:,([^,]+),([^,]+)(?:,([^,]+))?)?/);
  if (!cbll) return null;
  return {
    lat: parseFloat(cbll[1]),
    lng: parseFloat(cbll[2]),
    heading: cbp ? parseFloat(cbp[2]) || 0 : 0,
    zoom: cbp && cbp[4] ? parseFloat(cbp[4]) || 1 : 1,
    pitch: cbp && cbp[5] ? parseFloat(cbp[5]) || 0 : 0,
  };
};

const GOOGLE_MAPS_API_KEY = "AIzaSyDDmn40fnqUeFhv-nd53z5T413Jk69Hfyk";

interface VisualsHouseInfoProps {
  dossier: ProjectDossier;
  onNavigateToChapter?: (chapter: any) => void;
  onSaveStreetviewUrl?: (url: string) => void;
}

type VisualModalType = 'gevelraster' | 'ahn' | 'streetview' | 'floorplan' | null;

export const VisualsHouseInfo: React.FC<VisualsHouseInfoProps> = ({
  dossier,
  onNavigateToChapter,
  onSaveStreetviewUrl
}) => {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<VisualModalType>(null);
  const [modalZoom, setModalZoom] = useState(1);
  const [floorPlanFiles, setFloorPlanFiles] = useState<{ url: string, isPdf: boolean }[]>([]);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [resolvedOutdoorSv, setResolvedOutdoorSv] = useState<string>('');
  const [rdCoords, setRdCoords] = useState<{ x: number; y: number } | null>(null);
  const [latLonCoords, setLatLonCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [ahnViewMode, setAhnViewMode] = useState<'3d' | 'kadaster'>('3d');
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Check if WebGL is available in browser (or if ANGLE driver pool was exhausted)
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlAvailable(false);
      } else {
        setWebGlAvailable(true);
      }
    } catch {
      setWebGlAvailable(false);
    }
  }, []);
  const [isAhnLoading, setIsAhnLoading] = useState(false);

  // Sanitize address components to eliminate duplicates (e.g., "Jaagmeent 1 1356 AA Almere" + "1")
  const parsedBag = parseDutchAddress(`${dossier.bag?.address || ''} ${dossier.bag?.houseNumber || ''}`);
  const displayStreet = parsedBag.street || dossier.bag?.address || '';
  const displayHouseNum = parsedBag.houseNumber || dossier.bag?.houseNumber || '';
  const displayPostcode = parsedBag.postalCode || dossier.bag?.postalCode || '';
  const displayCity = parsedBag.city || dossier.bag?.city || '';

  const cleanFullAddress = `${displayStreet} ${displayHouseNum}, ${displayPostcode} ${displayCity}`.replace(/\s+/g, ' ').trim();
  const frontPhoto = dossier.facadesData?.[0]?.photoUrls?.[0] || dossier.facadesData?.[0]?.photoUrl;

  const isGoogleStreetViewUrl = (url?: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    if (
      lower.startsWith('data:') ||
      lower.startsWith('blob:') ||
      lower.includes('/uploads/') ||
      lower.includes('/images/') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp')
    ) {
      return false;
    }
    return lower.includes('maps.google.') || lower.includes('google.com/maps') || lower.includes('output=svembed') || lower.includes('layer=c');
  };

  // Dedicated effect to resolve RD coordinates for 3DBAG model (NTA 8800)
  useEffect(() => {
    let isMounted = true;
    if (!cleanFullAddress) return;

    setIsAhnLoading(true);
    const query = cleanFullAddress.replace(/Netherlands/i, '').trim();

    fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(query)}&fl=centroide_ll,centroide_rd`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data?.response?.docs?.length > 0) {
          const doc = data.response.docs[0];
          if (doc.centroide_rd) {
            const m = doc.centroide_rd.match(/POINT\(([\d.]+) ([\d.]+)\)/);
            if (m) {
              setRdCoords({ x: parseFloat(m[1]), y: parseFloat(m[2]) });
            }
          }
        }
      })
      .catch(err => {
        console.warn('PDOK 3DBAG geocoding failed:', err);
      })
      .finally(() => {
        if (isMounted) setIsAhnLoading(false);
      });

    return () => { isMounted = false; };
  }, [cleanFullAddress]);

  const threeDBagIframeSrc = rdCoords
    ? `https://3dbag.nl/en/viewer?rdx=${rdCoords.x}&rdy=${rdCoords.y}&ox=60&oy=60&oz=60&basemap=standaard&lod=lod22&placeMarker=true`
    : '';

  const threeDBagExternalUrl = rdCoords
    ? `https://3dbag.nl/en/viewer?rdx=${rdCoords.x}&rdy=${rdCoords.y}&ox=60&oy=60&oz=60&basemap=standaard&lod=lod22&placeMarker=true`
    : 'https://3dbag.nl/en/viewer';

  useEffect(() => {
    setResolvedOutdoorSv('');
    setActiveSvUrl('');
    setRdCoords(null);
  }, [cleanFullAddress]);

  const houseKey = (dossier.bag?.pandId && dossier.bag.pandId !== '0034100000029155'
    ? dossier.bag.pandId
    : (cleanFullAddress || '')).toLowerCase().trim();

  const isJaagmeent1 = isJaagmeent1Address(cleanFullAddress) || isJaagmeent1Address(dossier.bag?.address);

  // Active check to purge corrupted 175 coordinates for Jaagmeent 1
  useEffect(() => {
    if (isJaagmeent1 && typeof localStorage !== 'undefined') {
      try {
        const fullKey = cleanFullAddress ? `streetview_url_${cleanFullAddress.toLowerCase().trim()}` : '';
        if (fullKey) {
          const r = localStorage.getItem(fullKey);
          if (r && (r.includes('52.3359') || r.includes('5.2361'))) {
            localStorage.removeItem(fullKey);
          }
        }
        ['jaagmeent 1 1356 aa almere', 'jaagmeent 1, 1356 aa almere', 'jaagmeent 1'].forEach(k => {
          const r = localStorage.getItem(`streetview_url_${k}`);
          if (r && (r.includes('52.3359') || r.includes('5.2361'))) {
            localStorage.removeItem(`streetview_url_${k}`);
          }
        });
      } catch { }
    }
  }, [isJaagmeent1, cleanFullAddress]);

  const rawScopedSv = cleanFullAddress
    ? localStorage.getItem(`streetview_url_${cleanFullAddress.toLowerCase().trim()}`)
    : null;
  const addressScopedSv = (isJaagmeent1 && rawScopedSv && (rawScopedSv.includes('52.3359') || rawScopedSv.includes('5.2361')))
    ? null
    : rawScopedSv;

  const [activeSvUrl, setActiveSvUrl] = useState<string>('');

  // Dedicated effect to resolve OUTDOOR street camera coordinates specifically for cleanFullAddress
  useEffect(() => {
    let isMounted = true;
    setResolvedOutdoorSv('');

    if (!cleanFullAddress) return;

    // Jaagmeent 1 always locks to verified outdoor camera facing the building
    if (isJaagmeent1) {
      if (addressScopedSv && !addressScopedSv.includes('52.3359') && !addressScopedSv.includes('5.2361') && addressScopedSv.includes('cbll=')) {
        setResolvedOutdoorSv(addressScopedSv);
        setActiveSvUrl(addressScopedSv);
        return;
      }
      setResolvedOutdoorSv(JAAGMEENT_1_CAMERA.url);
      setActiveSvUrl(JAAGMEENT_1_CAMERA.url);
      return;
    }

    // 1. If user specifically saved a custom camera angle for THIS address, use it
    if (addressScopedSv && addressScopedSv.includes('cbll=')) {
      setResolvedOutdoorSv(addressScopedSv);
      setActiveSvUrl(addressScopedSv);
      return;
    }

    // 2. Otherwise always resolve via geocoding & outdoor street camera check for the current address
    resolvePropertyMapPresentation(cleanFullAddress).then((res) => {
      if (isMounted && res?.embedUrl) {
        setResolvedOutdoorSv(res.embedUrl);
        setActiveSvUrl(res.embedUrl);
      }
    });

    return () => { isMounted = false; };
  }, [cleanFullAddress, addressScopedSv, isJaagmeent1]);

  let rawSv = activeSvUrl || resolvedOutdoorSv || addressScopedSv || dossier.streetviewUrl || '';
  if (isJaagmeent1 && (rawSv.includes('52.3359') || rawSv.includes('5.2361') || !rawSv)) {
    rawSv = JAAGMEENT_1_CAMERA.url;
  }
  const streetviewEmbedUrl = resolvedOutdoorSv || (rawSv && isGoogleStreetViewUrl(rawSv) && rawSv.includes('cbll=') ? rawSv : '');
  let savedSvUrl = activeSvUrl || resolvedOutdoorSv || addressScopedSv || dossier.streetviewUrl || '';
  if (isJaagmeent1 && (savedSvUrl.includes('52.3359') || savedSvUrl.includes('5.2361') || !savedSvUrl)) {
    savedSvUrl = JAAGMEENT_1_CAMERA.url;
  }
  let parsedSv = parseStreetViewUrl(savedSvUrl);
  if (isJaagmeent1 && (!parsedSv || parsedSv.lat < 52.3365)) {
    parsedSv = {
      lat: JAAGMEENT_1_CAMERA.lat,
      lng: JAAGMEENT_1_CAMERA.lng,
      heading: JAAGMEENT_1_CAMERA.heading,
      zoom: JAAGMEENT_1_CAMERA.zoom,
      pitch: JAAGMEENT_1_CAMERA.pitch
    };
  }

  const handleSaveCamera = async (pov: { heading: number; pitch: number; zoom: number; lat: number; lng: number }) => {
    const url = `https://maps.google.com/maps?layer=c&cbll=${pov.lat},${pov.lng}&cbp=0,${Math.round(pov.heading)},0,${Math.round(pov.zoom)},${Math.round(pov.pitch)}`;
    setActiveSvUrl(url);
    if (onSaveStreetviewUrl) {
      onSaveStreetviewUrl(url);
    }
    if (houseKey) {
      localStorage.setItem(`streetview_url_${houseKey}`, url);
    }
    if (cleanFullAddress) {
      localStorage.setItem(`streetview_url_${cleanFullAddress.toLowerCase().trim()}`, url);
    }

    try {
      const { apiRequest } = await import('../../../../services/api');
      const audits = await apiRequest('/api/audits', { method: 'GET' });
      if (Array.isArray(audits) && audits.length > 0) {
        const activeAudit = audits.find(a =>
          (a.client?.address?.toLowerCase().trim() === cleanFullAddress.toLowerCase().trim()) ||
          (a.building_details?.adres?.toLowerCase().trim() === cleanFullAddress.toLowerCase().trim())
        );
        if (activeAudit) {
          await apiRequest(`/api/audits/${activeAudit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              building_details: {
                latitude: String(pov.lat),
                longitude: String(pov.lng),
                sv_heading: String(pov.heading),
                sv_pitch: String(pov.pitch),
                sv_zoom: String(pov.zoom),
                streetview_url: url
              }
            })
          });
        }
      }
    } catch (e) {
      console.warn('Failed to update audit with streetview:', e);
    }
  };

  const googleMapsExternalUrl = cleanFullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanFullAddress)}&layer=c`
    : 'https://www.google.com/maps';

  // Load stored floor plans on component mount (scoped to house)
  useEffect(() => {
    let isMounted = true;
    const loadFloorPlans = async () => {
      try {
        let stored = houseKey ? await idbGet<{ url: string, isPdf: boolean }[]>(`massEPA_v2_floorplans_${houseKey}`) : null;
        if (stored && Array.isArray(stored) && isMounted) {
          setFloorPlanFiles(stored);
        } else if (isMounted) {
          setFloorPlanFiles([]);
        }
      } catch (e) {
        console.warn('Could not load floor plans from IndexedDB', e);
      }
    };
    loadFloorPlans();
    return () => { isMounted = false; };
  }, [houseKey]);

  // Helper to persist floor plans
  const persistFloorPlans = async (files: { url: string, isPdf: boolean }[]) => {
    setFloorPlanFiles(files);
    try {
      if (houseKey) {
        await idbPut(`massEPA_v2_floorplans_${houseKey}`, files);
      }
    } catch (e) {
      console.error('Error saving floor plans to IndexedDB', e);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Convert files to persisted Data URLs (Base64) so they survive reload
        const newFiles = await Promise.all(
          Array.from(files).map(async (file) => ({
            url: await fileToPersistedUrl(file),
            isPdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
          }))
        );
        persistFloorPlans([...floorPlanFiles, ...newFiles]);
      }
    };
    input.click();
  };

  const removeFloorPlanFile = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const updated = floorPlanFiles.filter((_, idx) => idx !== indexToRemove);
    persistFloorPlans(updated);
  };

  const openModal = (type: VisualModalType) => {
    setActiveModal(type);
    setModalZoom(1);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveModalIndex(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Chapter Top Header Bar (Format matching rest of the application) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Eye className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.visuals.title') || '1. Visuals (House information)'}</span>
          </h1>
        </div>


      </div>

      {/* Primary Visuals Matrix: 3 Top Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. (EYE) Gevelraster Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide">
                {t('invoersheetV2.visualsHouseInfo.gevelraster') || 'Facade grid'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                3D GLB & Kaart
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => openModal('gevelraster')}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                title={t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className="p-2 bg-slate-100/50 flex-1 flex flex-col relative min-h-[260px] h-[280px]"
          >
            <GlbOnMapViewer dossier={dossier} isCompact={true} />
          </div>


        </div>

        {/* 2. (EYE) AHN Model Card (3DBAG 3D View / Kadaster Luchtfoto) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="font-display font-semibold text-xs tracking-wide truncate">
                {ahnViewMode === '3d'
                  ? (t('invoersheetV2.visualsHouseInfo.ahnModel') || 'AHN Model (3DBAG 3D)')
                  : 'Kadaster Luchtfoto (PDOK)'}
              </span>
            </div>

            {/* View Mode Switcher & Tools */}
            <div className="flex items-center space-x-1 shrink-0">
              <div className="flex items-center bg-black/25 p-0.5 rounded border border-white/10 text-[10px]">
                <button
                  type="button"
                  onClick={() => setAhnViewMode('3d')}
                  className={`px-1.5 py-0.5 rounded font-medium transition flex items-center space-x-1 ${ahnViewMode === '3d'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                    }`}
                  title="3D BAG Hoogtemodel"
                >
                  <Building2 className="w-2.5 h-2.5" />
                  <span>3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAhnViewMode('kadaster')}
                  className={`px-1.5 py-0.5 rounded font-medium transition flex items-center space-x-1 ${ahnViewMode === 'kadaster'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                    }`}
                  title="Kadaster PDOK Luchtfoto (2D Satelliet)"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>Kadaster</span>
                </button>
              </div>

              {threeDBagExternalUrl && (
                <a
                  href={threeDBagExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
                  title="Openen in 3D BAG Viewer (Nieuw tabblad)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
                title="Herladen"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => openModal('ahn')}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
                title={t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-100/50 flex-1 flex items-center justify-center relative group">
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shadow-2xs relative">
              {isAhnLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300 bg-slate-900">
                  <Compass size={24} className="text-emerald-400 animate-spin" />
                  <span className="text-xs font-medium">Kaartdata laden...</span>
                </div>
              ) : ahnViewMode === 'kadaster' ? (
                /* 2D Kadaster / PDOK Official Aerial Orthophoto (Zero WebGL required, 100% reliable) */
                <div className="w-full h-full relative">
                  {latLonCoords ? (
                    <MapContainer
                      key={`kadaster-${latLonCoords.lat}-${latLonCoords.lng}`}
                      center={[latLonCoords.lat, latLonCoords.lng]}
                      zoom={19}
                      zoomControl={false}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <LeafletMapController center={[latLonCoords.lat, latLonCoords.lng]} />
                      <TileLayer
                        attribution='&copy; Kadaster / PDOK'
                        url="https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg"
                        maxZoom={20}
                      />
                      <Marker position={[latLonCoords.lat, latLonCoords.lng]} />
                    </MapContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-800">
                      <Layers size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">Geen coördinaten gevonden</span>
                    </div>
                  )}

                  {/* Address badge bottom-left */}
                  {cleanFullAddress && (
                    <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white px-2 py-1 rounded text-[9.5px] leading-tight max-w-[190px] shadow-sm backdrop-blur-xs z-[1000] pointer-events-none flex items-center space-x-1">
                      <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{cleanFullAddress}</span>
                    </div>
                  )}

                  {/* Quick enlarge button overlay on bottom right */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('ahn');
                    }}
                    className="absolute bottom-2 right-2 bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md border border-slate-700 flex items-center space-x-1 transition z-[1000] cursor-pointer"
                    title="Vergroten"
                  >
                    <Maximize2 className="w-3 h-3 text-emerald-400" />
                    <span>Vergroten</span>
                  </button>
                </div>
              ) : threeDBagIframeSrc ? (
                /* 3D BAG Viewer */
                <div className="w-full h-full relative overflow-hidden bg-slate-950">
                  <iframe
                    key={`3dbag-iframe-${iframeKey}`}
                    src={threeDBagIframeSrc}
                    style={{
                      position: 'absolute',
                      top: '-54px',
                      left: 0,
                      width: '100%',
                      height: 'calc(100% + 84px)',
                      border: 0,
                    }}
                    title="3D BAG Model"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />

                  {/* Address badge bottom-left */}
                  {cleanFullAddress && (
                    <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white px-2 py-1 rounded text-[9.5px] leading-tight max-w-[190px] shadow-sm backdrop-blur-xs z-10 pointer-events-none flex items-center space-x-1">
                      <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{cleanFullAddress}</span>
                    </div>
                  )}

                  {/* Quick controls on bottom right */}
                  <div className="absolute bottom-2 right-2 flex items-center space-x-1 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAhnViewMode('kadaster');
                      }}
                      className="bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md border border-slate-700 flex items-center space-x-1 transition cursor-pointer"
                      title="Schakel over naar Kadaster Luchtfoto als 3D wit blijft"
                    >
                      <Layers className="w-2.5 h-2.5 text-emerald-400" />
                      <span>2D Kaart</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('ahn');
                      }}
                      className="bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md border border-slate-700 flex items-center space-x-1 transition cursor-pointer"
                      title="Vergroten"
                    >
                      <Maximize2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Vergroten</span>
                    </button>
                  </div>

                  {/* WebGL Context Warning Banner if WebGL is unavailable in browser */}
                  {!webGlAvailable && (
                    <div className="absolute top-2 left-2 right-2 bg-amber-950/95 border border-amber-600/70 rounded-md p-2 text-amber-200 text-[10.5px] leading-snug shadow-lg backdrop-blur-xs z-20 flex items-start space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-white">WebGL niet actief in browser</div>
                        <div className="text-[9.5px] text-amber-200/90">
                          GPU driver is uitgeput of hardwareversnelling staat uit in Firefox.
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setAhnViewMode('kadaster')}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-2 py-0.5 rounded text-[9.5px] transition"
                          >
                            Toon Kadaster Kaart
                          </button>
                          {threeDBagExternalUrl && (
                            <a
                              href={threeDBagExternalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-300 underline hover:text-white text-[9.5px]"
                            >
                              Open extern ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400 bg-slate-800">
                  <Building2 size={24} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">Geen 3D BAG model beschikbaar</span>
                  <span className="text-[10px] text-slate-500 mt-1">Geen RD-coördinaten gevonden voor dit adres</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. (EYE) Street view / 360° Gevelzicht Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition">
          <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display font-semibold text-xs tracking-wide">
                {t('invoersheetV2.visualsHouseInfo.streetView') || 'Street view (360° Gevelzicht)'}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <a
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
                title="Openen in Google Maps Street View"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => openModal('streetview')}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
                title={t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-100/50 flex-1 flex items-center justify-center relative">
            <HybridStreetView
              key={`sv-main-${cleanFullAddress}-${parsedSv?.lat ?? '0'}-${parsedSv?.lng ?? '0'}`}
              address={cleanFullAddress}
              latitude={parsedSv?.lat ?? null}
              longitude={parsedSv?.lng ?? null}
              heading={parsedSv?.heading ?? null}
              pitch={parsedSv?.pitch ?? null}
              zoom={parsedSv?.zoom ?? null}
              onSaveCamera={handleSaveCamera}
              containerClassName="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 shadow-2xs group bg-slate-900"
              onEnlarge={() => openModal('streetview')}
            />
          </div>
        </div>
      </div>

      {/* Featured Bottom Card: (EYE) Floor plan (Architecture & Dimensions) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-primary text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display font-semibold text-sm tracking-wide">
              {t('invoersheetV2.visualsHouseInfo.floorPlanTitle') || 'Floor plans & Elevation'}
            </h3>
          </div>
        </div>

        <div className="p-5 flex-1 bg-white w-full overflow-y-auto min-h-[360px] max-h-[500px]">
          <div className={`grid gap-4 flex-1 ${floorPlanFiles.length === 0 ? 'grid-cols-1 h-[320px]' :
              floorPlanFiles.length === 1 ? 'grid-cols-2 h-[320px]' :
                floorPlanFiles.length === 2 ? 'grid-cols-3 h-[240px]' :
                  'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[200px]'
            }`}>
            {floorPlanFiles.map((file, idx) => (
              <div key={idx} className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white relative group flex items-center justify-center shadow-xs">
                <div onClick={() => { setActiveModalIndex(idx); setModalZoom(1); }} className="w-full h-full cursor-pointer relative">
                  {file.isPdf ? (
                    <PdfThumbnail url={file.url} altTitle={`Plattegrond ${idx + 1}`} />
                  ) : (
                    <img
                      src={file.url}
                      alt={`Floorplan ${idx}`}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                    <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-primary" />
                      <span>{t('invoersheetV2.visualsHouseInfo.enlarge') || 'Vergroten'}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => removeFloorPlanFile(e, idx)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md shadow-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition z-10"
                  title={t('invoersheetV2.visualsHouseInfo.delete') || 'Verwijder'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div
              onClick={handleUploadClick}
              className="w-full h-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition group"
            >
              {floorPlanFiles.length === 0 ? (
                <>
                  <FileCheck className="w-12 h-12 text-slate-400 mb-4 group-hover:text-primary transition" />
                  <span className="text-sm font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.visualsHouseInfo.addFloorPlan') || 'Floor plan toevoegen'}</span>
                  <span className="text-xs text-slate-400 mt-2">{t('invoersheetV2.visualsHouseInfo.multiplePhotosPdfs') || "Meerdere Foto's of PDF's"}</span>
                </>
              ) : (
                <>
                  <Plus className="w-8 h-8 text-slate-400 mb-2 group-hover:text-primary transition" />
                  <span className="text-xs font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.visualsHouseInfo.addMore') || 'Meer toevoegen'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared MediaViewerModal for Floorplans */}
      {activeModalIndex !== null && (
        <MediaViewerModal
          files={floorPlanFiles}
          initialIndex={activeModalIndex}
          onClose={() => setActiveModalIndex(null)}
          titlePrefix={t('invoersheetV2.visualsHouseInfo.uploadedFloorPlan') || 'Geüploade Floor plan'}
          footerText={`Dossier ${dossier.dossierNumber} • ${dossier.bag.address} ${dossier.bag.houseNumber}, ${dossier.bag.city}`}
        />
      )}

      {/* Fullscreen High-Resolution Inspection Modal (Inline for Gevelraster, AHN, Streetview) */}
      {activeModal && (
        <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Eye className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-base tracking-wide">
                  {activeModal === 'gevelraster' && (t('invoersheetV2.visualsHouseInfo.gevelrasterModalTitle') || 'Gevelraster & Kadastrale Kaart')}
                  {activeModal === 'ahn' && (t('invoersheetV2.visualsHouseInfo.ahnModalTitle') || 'AHN Model - 3D Gebouwhoogtedata (3DBAG NTA 8800)')}
                  {activeModal === 'streetview' && (t('invoersheetV2.visualsHouseInfo.streetViewModalTitle') || 'Google Street View - 360° Gevelzicht')}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {activeModal === 'streetview' && (
                  <a
                    href={googleMapsExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 rounded text-xs transition font-medium mr-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Maps ↗</span>
                  </a>
                )}
                {activeModal === 'ahn' && (
                  <div className="flex items-center space-x-2 mr-2">
                    <div className="flex items-center bg-black/30 p-0.5 rounded border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setAhnViewMode('3d')}
                        className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${ahnViewMode === '3d'
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-300 hover:text-white'
                          }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>3D BAG</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAhnViewMode('kadaster')}
                        className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1.5 ${ahnViewMode === 'kadaster'
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-300 hover:text-white'
                          }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Kadaster Luchtfoto</span>
                      </button>
                    </div>
                    {threeDBagExternalUrl && (
                      <a
                        href={threeDBagExternalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded text-xs transition font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>3DBAG Tab ↗</span>
                      </a>
                    )}
                  </div>
                )}
                {activeModal !== 'streetview' && activeModal !== 'ahn' && (
                  <>
                    <button
                      onClick={() => setModalZoom((z) => Math.min(2.5, z + 0.25))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                      title={t('invoersheetV2.visualsHouseInfo.zoomIn') || 'Inzoomen'}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setModalZoom((z) => Math.max(0.75, z - 0.25))}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs"
                      title={t('invoersheetV2.visualsHouseInfo.zoomOut') || 'Uitzoomen'}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={closeModal}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Canvas Viewer */}
            <div className="flex-1 p-6 overflow-auto bg-primary-dark flex items-center justify-center">
              <div
                className="transition-transform duration-150 origin-center max-w-full bg-white rounded-lg p-2 shadow-xl"
                style={{ transform: activeModal === 'streetview' || activeModal === 'ahn' ? 'none' : `scale(${modalZoom})` }}
              >
                {activeModal === 'gevelraster' && (
                  <div className="w-[980px] max-w-[95vw] h-[640px] max-h-[80vh]">
                    <GlbOnMapViewer dossier={dossier} isCompact={false} />
                  </div>
                )}

                {activeModal === 'ahn' && (
                  <div className="w-[840px] max-w-[94vw] h-[520px] overflow-hidden rounded bg-slate-900 relative">
                    {ahnViewMode === 'kadaster' ? (
                      latLonCoords ? (
                        <div className="w-full h-full relative">
                          <MapContainer
                            key={`modal-kadaster-${latLonCoords.lat}-${latLonCoords.lng}`}
                            center={[latLonCoords.lat, latLonCoords.lng]}
                            zoom={19}
                            style={{ width: '100%', height: '100%' }}
                          >
                            <LeafletMapController center={[latLonCoords.lat, latLonCoords.lng]} />
                            <TileLayer
                              attribution='&copy; Kadaster / PDOK'
                              url="https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/{z}/{x}/{y}.jpeg"
                              maxZoom={20}
                            />
                            <Marker position={[latLonCoords.lat, latLonCoords.lng]} />
                          </MapContainer>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <Layers size={28} className="mb-2 opacity-50" />
                          <span>Geen coördinaten beschikbaar</span>
                        </div>
                      )
                    ) : threeDBagIframeSrc ? (
                      <div className="w-full h-full relative overflow-hidden bg-slate-950">
                        <iframe
                          key={`modal-3dbag-${iframeKey}`}
                          src={threeDBagIframeSrc}
                          style={{
                            position: 'absolute',
                            top: '-54px',
                            left: 0,
                            width: '100%',
                            height: 'calc(100% + 84px)',
                            border: 0,
                          }}
                          title="3D BAG Fullscreen Viewer"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        {/* Switch to Kadaster if blank */}
                        <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setAhnViewMode('kadaster')}
                            className="bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded shadow-lg border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Wissel naar Kadaster Luchtfoto</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                        <Compass size={28} className="text-emerald-400 animate-spin" />
                        <span className="text-sm font-medium">3D BAG Model laden...</span>
                      </div>
                    )}
                  </div>
                )}

                {activeModal === 'streetview' && (
                  <div className="w-[840px] max-w-[94vw] h-[520px] overflow-hidden rounded bg-slate-900 relative">
                    <HybridStreetView
                      key={`sv-modal-${cleanFullAddress}-${parsedSv?.lat ?? '0'}-${parsedSv?.lng ?? '0'}`}
                      address={cleanFullAddress}
                      latitude={parsedSv?.lat ?? null}
                      longitude={parsedSv?.lng ?? null}
                      heading={parsedSv?.heading ?? null}
                      pitch={parsedSv?.pitch ?? null}
                      zoom={parsedSv?.zoom ?? null}
                      onSaveCamera={handleSaveCamera}
                      containerClassName="relative w-full h-full rounded overflow-hidden bg-slate-900"
                      initialInteractive={true}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-mono">
                Dossier {dossier.dossierNumber} • {displayStreet} {displayHouseNum}, {displayCity}
              </span>
              <div className="flex items-center space-x-3">
                {activeModal === 'streetview' && (
                  <a
                    href={googleMapsExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center space-x-1 font-medium"
                  >
                    <span>Google Maps Street View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {activeModal === 'ahn' && (
                  <a
                    href={threeDBagExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center space-x-1 font-medium"
                  >
                    <span>3D BAG Viewer (NTA 8800)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={closeModal}
                  className="px-4 py-1.5 bg-primary hover:bg-primary text-white rounded font-medium"
                >
                  {t('invoersheetV2.visualsHouseInfo.close') || 'Sluiten'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

