const fs = require('fs');
const path = require('path');

// 1. Update VisualsHouseInfo.tsx in massEPA_live
const visualsPath = 'M:\\mEPA\\massEPA_live\\src\\pages\\invoersheetV2\\components\\chapters\\VisualsHouseInfo.tsx';
let visualsContent = fs.readFileSync(visualsPath, 'utf8');

// Replace card iframe and badge
const oldCardBlock = `<div className="w-full h-full relative overflow-hidden">
                  <iframe
                    src={threeDBagIframeSrc}
                    className="absolute top-[-54px] left-0 w-full h-[calc(100%+86px)] border-0"
                    title="3D BAG Model"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                  {/* Address badge top-left */}
                  {cleanFullAddress && (
                    <div className="absolute top-2 left-2 bg-slate-900/85 text-white p-1.5 rounded text-[9px] leading-tight max-w-[200px] shadow-sm backdrop-blur-xs z-10 pointer-events-none">
                      <div className="font-bold flex items-center space-x-1 truncate">
                        <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{cleanFullAddress}</span>
                      </div>
                    </div>
                  )}
                  {/* Quick enlarge button overlay on bottom right */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('ahn');
                    }}
                    className="absolute bottom-2 right-2 bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md border border-slate-700 flex items-center space-x-1 transition z-10 cursor-pointer"
                    title="Vergroten"
                  >
                    <Maximize2 className="w-3 h-3 text-emerald-400" />
                    <span>Vergroten</span>
                  </button>
                </div>`;

const newCardBlock = `<div className="w-full h-full relative overflow-hidden">
                  <iframe
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
                  {/* Address badge bottom-left to prevent overlap with top toolbar */}
                  {cleanFullAddress && (
                    <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white px-2 py-1 rounded text-[9.5px] leading-tight max-w-[190px] shadow-sm backdrop-blur-xs z-10 pointer-events-none flex items-center space-x-1">
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
                    className="absolute bottom-2 right-2 bg-slate-900/90 hover:bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-md border border-slate-700 flex items-center space-x-1 transition z-10 cursor-pointer"
                    title="Vergroten"
                  >
                    <Maximize2 className="w-3 h-3 text-emerald-400" />
                    <span>Vergroten</span>
                  </button>
                </div>`;

if (visualsContent.includes(oldCardBlock)) {
  visualsContent = visualsContent.replace(oldCardBlock, newCardBlock);
  console.log('Successfully replaced oldCardBlock in VisualsHouseInfo.tsx');
} else {
  console.log('oldCardBlock not found directly, checking for regex/partial match');
  // fallback search
  visualsContent = visualsContent.replace(
    /<div className="w-full h-full relative overflow-hidden">[\s\S]*?title="3D BAG Model"[\s\S]*?<\/button>\s*<\/div>/,
    newCardBlock
  );
}

// Replace modal iframe
const oldModalBlock = `<div className="w-full h-full relative overflow-hidden">
                        <iframe
                          src={threeDBagIframeSrc}
                          className="absolute top-[-54px] left-0 w-full h-[calc(100%+86px)] border-0"
                          title="3D BAG Fullscreen Viewer"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>`;

const newModalBlock = `<div className="w-full h-full relative overflow-hidden">
                        <iframe
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
                      </div>`;

if (visualsContent.includes(oldModalBlock)) {
  visualsContent = visualsContent.replace(oldModalBlock, newModalBlock);
  console.log('Successfully replaced oldModalBlock in VisualsHouseInfo.tsx');
} else {
  console.log('oldModalBlock not found directly, checking for regex/partial match');
  visualsContent = visualsContent.replace(
    /<div className="w-full h-full relative overflow-hidden">[\s\S]*?title="3D BAG Fullscreen Viewer"[\s\S]*?<\/div>/,
    newModalBlock
  );
}

fs.writeFileSync(visualsPath, visualsContent, 'utf8');
console.log('Saved VisualsHouseInfo.tsx');

// 2. Update ThreeDBagViewPage.tsx in massEPA_live
const threeDPagePath = 'M:\\mEPA\\massEPA_live\\src\\pages\\backoffice\\ThreeDBagViewPage.tsx';
let threeDPageContent = fs.readFileSync(threeDPagePath, 'utf8');

const oldThreeDBlock = `<div className="w-full h-full relative">
          <iframe 
            src={iframeSrc}
            className="w-full h-full border-0"
            title="3D BAG Viewer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>`;

const newThreeDBlock = `<div className="w-full h-full relative overflow-hidden">
          <iframe 
            src={iframeSrc}
            style={{
              position: 'absolute',
              top: '-54px',
              left: 0,
              width: '100%',
              height: 'calc(100% + 84px)',
              border: 0,
            }}
            title="3D BAG Viewer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>`;

if (threeDPageContent.includes(oldThreeDBlock)) {
  threeDPageContent = threeDPageContent.replace(oldThreeDBlock, newThreeDBlock);
  console.log('Successfully replaced oldThreeDBlock in ThreeDBagViewPage.tsx');
} else {
  console.log('oldThreeDBlock not found directly, using regex replacement');
  threeDPageContent = threeDPageContent.replace(
    /<div className="w-full h-full relative">\s*<iframe[\s\S]*?title="3D BAG Viewer"[\s\S]*?\/>\s*<\/div>/,
    newThreeDBlock
  );
}

fs.writeFileSync(threeDPagePath, threeDPageContent, 'utf8');
console.log('Saved ThreeDBagViewPage.tsx');
