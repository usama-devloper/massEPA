import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Maximize2, Save, X, Check, Compass, RotateCcw, RotateCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { resolvePropertyMapPresentation } from '../../utils/propertyMap';

const GOOGLE_MAPS_API_KEY = "AIzaSyDDmn40fnqUeFhv-nd53z5T413Jk69Hfyk";


function isJaagmeent1Address(addr?: string | null): boolean {
  if (!addr) return false;
  const l = addr.toLowerCase();
  return /\bjaagmeent\s+1\b/i.test(l) && !/\bjaagmeent\s+1\d+/i.test(l);
}

const parseNum = (v: string | number | null | undefined, fallback: number): number => {
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
};

interface StreetViewProps {
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  heading?: string | number | null;
  pitch?: string | number | null;
  zoom?: string | number | null;
  onSaveCamera?: (pov: { heading: number; pitch: number; zoom: number; lat: number; lng: number }) => void;
  containerClassName?: string;
  initialInteractive?: boolean;
  onEnlarge?: () => void;
}

export const HybridStreetView: React.FC<StreetViewProps> = ({
  address,
  latitude,
  longitude,
  heading,
  pitch,
  zoom,
  onSaveCamera,
  containerClassName,
  initialInteractive = false,
  onEnlarge
}) => {
  const { t } = useLanguage();
  const [isInteractive, setIsInteractive] = useState(Boolean(initialInteractive));
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [cameraPov, setCameraPov] = useState({
    heading: parseNum(heading, 0),
    pitch: parseNum(pitch, 0),
    zoom: parseNum(zoom, 1)
  });
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(
    latitude != null && longitude != null
      ? { lat: parseNum(latitude, 0), lng: parseNum(longitude, 0) }
      : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Load Google Maps Script (without places to prevent MIME/referer restrictions)
  const loadGoogleMapsScript = useCallback(() => {
    if (window.google && window.google.maps && window.google.maps.StreetViewPanorama) {
      setIsScriptLoaded(true);
      return;
    }
    const scriptId = 'google-maps-script';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!existing) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps && window.google.maps.StreetViewPanorama) {
          setIsScriptLoaded(true);
          setScriptError(false);
        } else {
          setScriptError(true);
        }
      };
      script.onerror = () => {
        setScriptError(true);
      };
      document.body.appendChild(script);
    } else {
      if (window.google && window.google.maps && window.google.maps.StreetViewPanorama) {
        setIsScriptLoaded(true);
      }
    }

    // Fallback timer: if script takes > 2.5s (e.g. blocked by adblock/MIME error), fallback to iframe
    const fallbackTimer = setTimeout(() => {
      if (!window.google?.maps?.StreetViewPanorama) {
        setScriptError(true);
      }
    }, 2500);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Handle initialInteractive
  useEffect(() => {
    if (initialInteractive) {
      setIsInteractive(true);
      loadGoogleMapsScript();
    }
  }, [initialInteractive, loadGoogleMapsScript]);

  // Reset panorama, interactive state, and coordinates when address changes
  useEffect(() => {
    isInitializedRef.current = false;
    setIsInteractive(Boolean(initialInteractive));
    setPosition(null);
  }, [address]);

  // Geocode address if we don't have lat/lng
  useEffect(() => {
    if (latitude == null || longitude == null) {
      if (!address || !address.trim()) return;
      resolvePropertyMapPresentation(address)
        .then(res => {
          if (res?.embedUrl) {
            const cbll = res.embedUrl.match(/cbll=([-\d.]+),([-\d.]+)/);
            const cbp = res.embedUrl.match(/cbp=([^,]+),([^,]+)/);
            if (cbll) {
              const lat = parseFloat(cbll[1]);
              const lng = parseFloat(cbll[2]);
              const h = cbp ? parseFloat(cbp[2]) || 0 : 0;
              setPosition({ lat, lng });
              setCameraPov(prev => ({ ...prev, heading: prev.heading || h }));
              return;
            }
          }
          return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", Netherlands")}&key=${GOOGLE_MAPS_API_KEY}`)
            .then(r => r.json())
            .then(data => {
              if (data.status === 'OK' && data.results.length > 0) {
                setPosition(data.results[0].geometry.location);
              }
            });
        })
        .catch(console.error);
    }
  }, [address, latitude, longitude]);

  // Sync position state with props when data loads or updates
  useEffect(() => {
    if (latitude != null && longitude != null) {
      let lat = parseNum(latitude, 0);
      let lng = parseNum(longitude, 0);
      let h = heading != null ? parseNum(heading, 0) : 0;
      if (isJaagmeent1Address(address) && (lat < 52.3365 || lng > 5.2345)) {
        lat = 52.33702599569312;
        lng = 5.232569310471482;
        h = 102;
      }
      setPosition({ lat, lng });
      if (h) setCameraPov(prev => ({ ...prev, heading: h }));
      isInitializedRef.current = false;
    }
  }, [latitude, longitude, heading, address]);

  // Sync camera state with props when data loads or updates
  useEffect(() => {
    if (heading != null || pitch != null || zoom != null) {
      setCameraPov(prev => ({
        heading: heading != null ? parseNum(heading, prev.heading) : prev.heading,
        pitch: pitch != null ? parseNum(pitch, prev.pitch) : prev.pitch,
        zoom: zoom != null ? parseNum(zoom, prev.zoom) : prev.zoom
      }));
    }
  }, [heading, pitch, zoom]);

  // Initialize Panorama when in interactive mode and script is loaded without error
  useEffect(() => {
    if (isInteractive && isScriptLoaded && !scriptError && position && containerRef.current && window.google?.maps?.StreetViewService && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const svService = new window.google.maps.StreetViewService();
      
      svService.getPanorama({ location: position, radius: 50, source: window.google.maps.StreetViewSource.OUTDOOR })
        .then(({ data }: any) => {
          if (data.location?.latLng) {
            setPosition({ lat: data.location.latLng.lat(), lng: data.location.latLng.lng() });
          }

          panoramaRef.current = new window.google.maps.StreetViewPanorama(
            containerRef.current as HTMLElement,
            {
              pano: data.location?.pano,
              position: data.location?.latLng || position,
              pov: cameraPov,
              zoom: cameraPov.zoom,
              addressControl: false,
              showRoadLabels: false,
            }
          );

          // Listen to camera changes with debounce to auto-save
          let debounceTimer: ReturnType<typeof setTimeout>;
          panoramaRef.current.addListener("pov_changed", () => {
            const currentPov = panoramaRef.current.getPov();
            const currentZoom = panoramaRef.current.getZoom();
            
            const newCamera = {
              heading: currentPov.heading,
              pitch: currentPov.pitch,
              zoom: currentZoom
            };
            
            setCameraPov(newCamera);
            
            // Auto-save logic
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              if (onSaveCamera) {
                const currentPos = panoramaRef.current.getPosition();
                if (currentPos) {
                  onSaveCamera({
                    ...newCamera,
                    lat: currentPos.lat(),
                    lng: currentPos.lng()
                  });
                }
              }
            }, 800);
          });
          
          panoramaRef.current.addListener("position_changed", () => {
            const newPos = panoramaRef.current.getPosition();
            if (newPos) {
              setPosition({ lat: newPos.lat(), lng: newPos.lng() });
            }
          });
        })
        .catch((e: any) => {
          console.warn("Outdoor Street View via JS API failed, falling back to embed iframe:", e);
          setScriptError(true);
        });
    }
  }, [isInteractive, isScriptLoaded, scriptError, position]);

  const defaultContainerClass = "relative w-full h-[240px] md:h-[280px] rounded-2xl overflow-hidden border border-outline-variant/15 shadow-sm group";
  const wrapperClass = containerClassName || defaultContainerClass;

  if (!position) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-slate-900 text-center text-slate-300 ${wrapperClass}`}>
        <Compass size={28} className="text-emerald-400 animate-spin" />
        <p className="text-xs font-medium">Street View data laden...</p>
      </div>
    );
  }

  // Realistic FOV converted from Google Maps StreetView Panorama zoom:
  // zoom 0 -> ~85° FOV, zoom 1 -> ~55° FOV, zoom 2 -> ~35° FOV, zoom 3 -> ~20° FOV
  const zoomVal = Math.max(0, cameraPov.zoom || 0);
  const calculatedFov = Math.max(15, Math.min(100, Math.round(85 / Math.pow(1.5, zoomVal))));

  // Cost-saving Static Outdoor Street View Image URL with accurate FOV & cache key
  const staticImageUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${position.lat},${position.lng}&heading=${Math.round(cameraPov.heading)}&pitch=${Math.round(cameraPov.pitch)}&fov=${calculatedFov}&source=outdoor&key=${GOOGLE_MAPS_API_KEY}`;
  const cacheKey = `sv-img-${Math.round(position.lat * 10000)}-${Math.round(position.lng * 10000)}-${Math.round(cameraPov.heading)}-${Math.round(cameraPov.pitch)}-${calculatedFov}`;

  // Iframe fallback URL (immune to adblockers / referer errors)
  const embedIframeUrl = `https://maps.google.com/maps?q=&layer=c&cbll=${position.lat},${position.lng}&cbp=0,${Math.round(cameraPov.heading)},0,0,${Math.round(cameraPov.pitch)}&output=svembed`;

  const useIframeFallback = scriptError || !isScriptLoaded;

  const handleManualRotate = (delta: number) => {
    const newHeading = (Math.round(cameraPov.heading) + delta + 360) % 360;
    const newCamera = { ...cameraPov, heading: newHeading };
    setCameraPov(newCamera);
    if (onSaveCamera) {
      onSaveCamera({ ...newCamera, lat: position.lat, lng: position.lng });
    }
  };

  const handleSaveAndClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveCamera) {
      onSaveCamera({
        ...cameraPov,
        lat: position.lat,
        lng: position.lng
      });
    }
    setIsInteractive(false);
    isInitializedRef.current = false;
  };

  const labelAdjustCamera = t('home.adjustCamera') || 'Gevelzicht aanpassen';
  const labelSaveCamera = t('invoersheetV2.visualsHouseInfo.saveCamera') || 'Vastzetten & Opslaan';
  const labelDragToAdjust = t('invoersheetV2.visualsHouseInfo.dragToAdjust') || 'Draai naar de gevel • Positie & hoek worden automatisch opgeslagen';

  return (
    <div className={wrapperClass}>
      {!isInteractive ? (
        <div 
          onClick={() => {
            setIsInteractive(true);
            loadGoogleMapsScript();
          }}
          className="w-full h-full cursor-pointer relative group"
        >
          <img 
            key={cacheKey}
            src={staticImageUrl} 
            alt={`Street View ${address || ''}`}
            className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
          />

          {/* Address badge top-left */}
          {address && (
            <div className="absolute top-2 left-2 bg-slate-900/85 text-white p-1.5 rounded text-[9px] leading-tight max-w-[200px] shadow-sm backdrop-blur-xs z-10 pointer-events-none">
              <div className="font-bold flex items-center space-x-1 truncate">
                <MapPin className="w-2.5 h-2.5 text-red-400 shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            </div>
          )}

          {/* Hover overlay with button */}
          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsInteractive(true);
                loadGoogleMapsScript();
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full font-bold shadow-lg transform transition-transform hover:scale-105 text-xs cursor-pointer"
            >
              <Compass size={15} className="text-emerald-300" />
              <span>{labelAdjustCamera}</span>
            </button>
          </div>

          {/* Quick Enlarge Button if onEnlarge provided */}
          {onEnlarge && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEnlarge();
              }}
              className="absolute bottom-2 right-2 bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md border border-slate-700 flex items-center space-x-1 transition z-10"
              title="Vergroten"
            >
              <Maximize2 className="w-3 h-3 text-sky-400" />
              <span>Vergroten</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative w-full h-full bg-slate-900">
          {useIframeFallback ? (
            <iframe
              key={`sv-iframe-${position.lat}-${position.lng}-${Math.round(cameraPov.heading)}`}
              src={embedIframeUrl}
              title="Street View 360 Full"
              className="w-full h-full border-0"
              allow="geolocation; gyroscope; accelerometer"
            />
          ) : (
            <div ref={containerRef} className="w-full h-full" />
          )}

          {/* Manual camera angle controls in fallback mode */}
          {useIframeFallback && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20 bg-slate-900/90 p-1 rounded-lg backdrop-blur-xs border border-slate-700/80 shadow-md">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleManualRotate(-45); }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium rounded transition flex items-center gap-1 cursor-pointer"
                title="Draai 45° linksom"
              >
                <RotateCcw size={12} />
                <span>-45°</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleManualRotate(45); }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium rounded transition flex items-center gap-1 cursor-pointer"
                title="Draai 45° rechtsom"
              >
                <span>+45°</span>
                <RotateCw size={12} />
              </button>
              <span className="text-[10px] text-emerald-400 px-1 font-mono font-bold">{Math.round(cameraPov.heading)}°</span>
            </div>
          )}

          {/* Save / Freeze view button in top-right */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-md transition cursor-pointer"
              title="Vastzetten en terug naar statische foto"
            >
              <Check size={13} />
              <span>{labelSaveCamera}</span>
            </button>
          </div>

          {/* Bottom helper text */}
          <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white text-[9px] px-2 py-1 rounded shadow-md pointer-events-none z-10 max-w-[80%] truncate">
            {labelDragToAdjust}
          </div>
        </div>
      )}
    </div>
  );
};
