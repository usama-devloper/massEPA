import React from 'react';

interface CadElevationSvgProps {
  type: 'voorgevel' | 'linkergevel' | 'rechtergevel' | 'achtergevel';
  className?: string;
  highlightKozijn?: string;
}

export const CadElevationSvg: React.FC<CadElevationSvgProps> = ({
  type,
  className = 'w-full h-full object-contain',
  highlightKozijn
}) => {
  if (type === 'voorgevel') {
    return (
      <svg viewBox="0 0 420 320" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="320" fill="#ffffff" />
        
        {/* Architectural Grid / Guide Lines */}
        <line x1="20" y1="280" x2="380" y2="280" stroke="#0f172a" strokeWidth="2" /> {/* Ground line 0 */}
        <line x1="20" y1="160" x2="350" y2="160" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" /> {/* Level 2800 */}
        <line x1="20" y1="50" x2="350" y2="50" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" /> {/* Level 5200 */}
        <line x1="20" y1="30" x2="350" y2="30" stroke="#0f172a" strokeWidth="1.5" /> {/* Parapet top */}

        {/* Building Contour (Voorgevel) */}
        <rect x="40" y="30" width="280" height="250" fill="none" stroke="#0f172a" strokeWidth="2.5" />
        
        {/* Parapet cap detail */}
        <line x1="36" y1="27" x2="324" y2="27" stroke="#0f172a" strokeWidth="1.5" />
        <rect x="36" y="27" width="288" height="4" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />

        {/* Ground Floor Elements */}
        {/* W01 Window (Begane Grond Links) */}
        <g className="transition-opacity">
          <rect x="60" y="190" width="85" height="75" fill={highlightKozijn === 'W01' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
          <rect x="64" y="194" width="77" height="67" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="102" y1="194" x2="102" y2="261" stroke="#64748b" strokeWidth="1.2" />
          <line x1="64" y1="215" x2="141" y2="215" stroke="#64748b" strokeWidth="1" />
          {/* Label W01 */}
          <rect x="90" y="222" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x="102" y="231" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">W01</text>
        </g>

        {/* D1 Entrance Door (Begane Grond Rechts) */}
        <g className="transition-opacity">
          <rect x="205" y="185" width="48" height="95" fill={highlightKozijn === 'D1' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="2" />
          <rect x="209" y="189" width="40" height="91" fill="none" stroke="#475569" strokeWidth="1" />
          {/* Door glass strip */}
          <rect x="222" y="200" width="14" height="55" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
          <line x1="229" y1="200" x2="229" y2="255" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* Door handle & mailbox */}
          <circle cx="214" cy="242" r="1.5" fill="#0f172a" />
          <rect x="218" y="260" width="22" height="3" fill="#64748b" stroke="#0f172a" strokeWidth="0.5" />
          {/* Label D1 */}
          <rect x="217" y="268" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x="229" y="277" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">D1</text>
        </g>

        {/* D1W Window beside door */}
        <g className="transition-opacity">
          <rect x="257" y="185" width="25" height="95" fill={highlightKozijn === 'D1W' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
          <rect x="260" y="189" width="19" height="91" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="269" y1="189" x2="269" y2="280" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* Label D1W */}
          <rect x="258" y="235" width="23" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x="269" y="244" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#ef4444" fontWeight="bold">D1W</text>
        </g>

        {/* Overhang canope above entrance */}
        <line x1="195" y1="180" x2="290" y2="180" stroke="#0f172a" strokeWidth="2.5" />
        <polygon points="195,180 200,183 285,183 290,180" fill="#334155" />

        {/* First Floor Elements */}
        {/* W02 Window (1e Verdieping Links) */}
        <g className="transition-opacity">
          {/* Accent panel above window */}
          <rect x="60" y="55" width="85" height="20" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="60" y1="65" x2="145" y2="65" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Window frame */}
          <rect x="60" y="75" width="85" height="65" fill={highlightKozijn === 'W2' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
          <rect x="64" y="79" width="77" height="57" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="102" y1="79" x2="102" y2="136" stroke="#64748b" strokeWidth="1.2" />
          {/* Vent grille at top */}
          <rect x="64" y="79" width="77" height="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Label W02 / W2 */}
          <rect x="90" y="100" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x="102" y="109" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">W02</text>
        </g>

        {/* W04 Window (1e Verdieping Rechts) */}
        <g className="transition-opacity">
          <rect x="215" y="75" width="40" height="65" fill={highlightKozijn === 'W4' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
          <rect x="219" y="79" width="32" height="57" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="235" y1="79" x2="235" y2="136" stroke="#64748b" strokeWidth="1" />
          {/* Label W04 / W4 */}
          <rect x="223" y="100" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x="235" y="109" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">W4</text>
        </g>

        {/* Dimension Line System on the Right (Matching screenshot) */}
        <g transform="translate(340, 0)">
          {/* Main vertical dimension line */}
          <line x1="25" y1="280" x2="25" y2="30" stroke="#0f172a" strokeWidth="1.2" />
          
          {/* Tick 0 (Ground) */}
          <line x1="15" y1="280" x2="35" y2="280" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="20" y1="285" x2="30" y2="275" stroke="#0f172a" strokeWidth="1.5" />
          <text x="42" y="283" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">0</text>

          {/* Tick 2800 (1st Floor) */}
          <line x1="15" y1="160" x2="35" y2="160" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="20" y1="165" x2="30" y2="155" stroke="#0f172a" strokeWidth="1.5" />
          <text x="42" y="163" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">2800</text>

          {/* Tick 5200 (Roof eave / ceiling) */}
          <line x1="15" y1="50" x2="35" y2="50" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="20" y1="55" x2="30" y2="45" stroke="#0f172a" strokeWidth="1.5" />
          <text x="42" y="53" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">5200</text>

          {/* Tick 5750 (Parapet top) */}
          <line x1="15" y1="30" x2="35" y2="30" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="20" y1="35" x2="30" y2="25" stroke="#0f172a" strokeWidth="1.5" />
          <text x="42" y="33" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">5750</text>
        </g>

        {/* Title & Scale Tag in corner */}
        <text x="45" y="308" fontSize="9" fontFamily="sans-serif" fill="#475569" fontWeight="600">
          Aanzicht Voorgevel (NTA 8800 CAD Schaal 1:100)
        </text>
      </svg>
    );
  }

  if (type === 'linkergevel') {
    return (
      <svg viewBox="0 0 420 320" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="320" fill="#ffffff" />
        
        {/* Architectural Grid / Guide Lines */}
        <line x1="20" y1="280" x2="380" y2="280" stroke="#0f172a" strokeWidth="2" />
        <line x1="20" y1="160" x2="350" y2="160" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />
        <line x1="20" y1="50" x2="350" y2="50" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />
        <line x1="20" y1="30" x2="350" y2="30" stroke="#0f172a" strokeWidth="1.5" />

        {/* Building Contour (Linker Zijgevel / Kopgevel) */}
        <rect x="40" y="30" width="280" height="250" fill="none" stroke="#0f172a" strokeWidth="2.5" />
        <rect x="36" y="27" width="288" height="4" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />

        {/* Brickwork Texture pattern indication */}
        <line x1="40" y1="100" x2="320" y2="100" stroke="#f1f5f9" strokeWidth="0.8" />
        <line x1="40" y1="210" x2="320" y2="210" stroke="#f1f5f9" strokeWidth="0.8" />

        {/* W11 Window (Begane Grond) */}
        <g className="transition-opacity">
          <rect x="140" y="190" width="55" height="70" fill={highlightKozijn === 'W11' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
          <rect x="144" y="194" width="47" height="62" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="167" y1="194" x2="167" y2="256" stroke="#64748b" strokeWidth="1" />
          <rect x="155" y="220" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x="167" y="229" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">W11</text>
        </g>

        {/* W12 Window (1e Verdieping) */}
        <g className="transition-opacity">
          <rect x="140" y="75" width="55" height="65" fill={highlightKozijn === 'W12' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
          <rect x="144" y="79" width="47" height="57" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="167" y1="79" x2="167" y2="136" stroke="#64748b" strokeWidth="1" />
          <rect x="155" y="100" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
          <text x="167" y="109" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">W12</text>
        </g>

        {/* Dimension Line System on the Right */}
        <g transform="translate(340, 0)">
          <line x1="25" y1="280" x2="25" y2="30" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="15" y1="280" x2="35" y2="280" stroke="#0f172a" strokeWidth="1.2" />
          <text x="42" y="283" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">0</text>
          <line x1="15" y1="160" x2="35" y2="160" stroke="#0f172a" strokeWidth="1.2" />
          <text x="42" y="163" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">2800</text>
          <line x1="15" y1="50" x2="35" y2="50" stroke="#0f172a" strokeWidth="1.2" />
          <text x="42" y="53" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">5200</text>
          <line x1="15" y1="30" x2="35" y2="30" stroke="#0f172a" strokeWidth="1.2" />
          <text x="42" y="33" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">5750</text>
        </g>

        <text x="45" y="308" fontSize="9" fontFamily="sans-serif" fill="#475569" fontWeight="600">
          Aanzicht Linkergevel (Linergevel / Kopgevel NTA 8800)
        </text>
      </svg>
    );
  }

  if (type === 'rechtergevel') {
    return (
      <svg viewBox="0 0 420 320" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="320" fill="#ffffff" />
        
        {/* Ground Line */}
        <line x1="20" y1="280" x2="380" y2="280" stroke="#0f172a" strokeWidth="2" />
        <line x1="20" y1="160" x2="350" y2="160" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />
        <line x1="20" y1="30" x2="350" y2="30" stroke="#0f172a" strokeWidth="1.5" />

        {/* Party Wall Outline (Bouwmuur) */}
        <rect x="40" y="30" width="280" height="250" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
        
        {/* Wall Hatching for Cavity Party Wall (Ankerloos) */}
        {Array.from({ length: 14 }).map((_, i) => (
          <line 
            key={i} 
            x1={50 + i * 18} 
            y1="30" 
            x2={30 + i * 18} 
            y2="280" 
            stroke="#e2e8f0" 
            strokeWidth="1.2" 
            strokeDasharray="5,5" 
          />
        ))}

        {/* Central annotation badge */}
        <g transform="translate(90, 130)">
          <rect x="0" y="0" width="180" height="55" rx="8" fill="#ffffff" stroke="#006a63" strokeWidth="1.5" />
          <text x="90" y="22" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#006a63" fontWeight="bold">
            WONINGSCHEIDENDE BOUWMUUR
          </text>
          <text x="90" y="36" textAnchor="middle" fontSize="8" fontFamily="sans-serif" fill="#64748b">
            Grenzend aan verwarmd pand (Fintstraat 3)
          </text>
          <text x="90" y="47" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#0284c7" fontWeight="semibold">
            NTA 8800: Geen transmissieverlies (AOR)
          </text>
        </g>

        {/* Dimension Line System on the Right */}
        <g transform="translate(340, 0)">
          <line x1="25" y1="280" x2="25" y2="30" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="15" y1="280" x2="35" y2="280" stroke="#0f172a" strokeWidth="1.2" />
          <text x="42" y="283" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">0</text>
          <line x1="15" y1="160" x2="35" y2="160" stroke="#0f172a" strokeWidth="1.2" />
          <text x="42" y="163" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">2800</text>
          <line x1="15" y1="30" x2="35" y2="30" stroke="#0f172a" strokeWidth="1.2" />
          <text x="42" y="33" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">5750</text>
        </g>

        <text x="45" y="308" fontSize="9" fontFamily="sans-serif" fill="#475569" fontWeight="600">
          Aanzicht Rechtergevel (reachter gevel / Bouwmuur NTA 8800)
        </text>
      </svg>
    );
  }

  // achtergevel
  return (
    <svg viewBox="0 0 420 320" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="420" height="320" fill="#ffffff" />
      
      {/* Ground Line */}
      <line x1="20" y1="280" x2="380" y2="280" stroke="#0f172a" strokeWidth="2" />
      <line x1="20" y1="160" x2="350" y2="160" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="20" y1="50" x2="350" y2="50" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="20" y1="30" x2="350" y2="30" stroke="#0f172a" strokeWidth="1.5" />

      {/* Building Contour (Achtergevel) */}
      <rect x="40" y="30" width="280" height="250" fill="none" stroke="#0f172a" strokeWidth="2.5" />
      <rect x="36" y="27" width="288" height="4" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1" />

      {/* D2 Schuifpui (Begane Grond) */}
      <g className="transition-opacity">
        <rect x="60" y="175" width="160" height="105" fill={highlightKozijn === 'D2' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="2" />
        <rect x="64" y="179" width="152" height="101" fill="none" stroke="#64748b" strokeWidth="1" />
        {/* Three sliding panes */}
        <line x1="114" y1="179" x2="114" y2="280" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="165" y1="179" x2="165" y2="280" stroke="#0f172a" strokeWidth="1.5" />
        {/* Label D2 */}
        <rect x="128" y="225" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
        <text x="140" y="234" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">D2</text>
      </g>

      {/* W21 Window (1e Verdieping Links) */}
      <g className="transition-opacity">
        <rect x="60" y="75" width="60" height="65" fill={highlightKozijn === 'W21' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
        <rect x="64" y="79" width="52" height="57" fill="none" stroke="#64748b" strokeWidth="1" />
        <line x1="90" y1="79" x2="90" y2="136" stroke="#64748b" strokeWidth="1" />
        <rect x="78" y="100" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
        <text x="90" y="109" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">W21</text>
      </g>

      {/* W22 Window (1e Verdieping Rechts) */}
      <g className="transition-opacity">
        <rect x="160" y="75" width="60" height="65" fill={highlightKozijn === 'W22' ? '#eff6ff' : '#ffffff'} stroke="#0f172a" strokeWidth="1.8" />
        <rect x="164" y="79" width="52" height="57" fill="none" stroke="#64748b" strokeWidth="1" />
        <line x1="190" y1="79" x2="190" y2="136" stroke="#64748b" strokeWidth="1" />
        <rect x="178" y="100" width="24" height="13" rx="2" fill="#ffffff" stroke="#ef4444" strokeWidth="0.8" />
        <text x="190" y="109" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#ef4444" fontWeight="bold">W22</text>
      </g>

      {/* Dimension Line System on the Right */}
      <g transform="translate(340, 0)">
        <line x1="25" y1="280" x2="25" y2="30" stroke="#0f172a" strokeWidth="1.2" />
        <line x1="15" y1="280" x2="35" y2="280" stroke="#0f172a" strokeWidth="1.2" />
        <text x="42" y="283" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">0</text>
        <line x1="15" y1="160" x2="35" y2="160" stroke="#0f172a" strokeWidth="1.2" />
        <text x="42" y="163" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">2800</text>
        <line x1="15" y1="50" x2="35" y2="50" stroke="#0f172a" strokeWidth="1.2" />
        <text x="42" y="53" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">5200</text>
        <line x1="15" y1="30" x2="35" y2="30" stroke="#0f172a" strokeWidth="1.2" />
        <text x="42" y="33" fontSize="9" fontFamily="monospace" fill="#0f172a" fontWeight="bold">5750</text>
      </g>

      <text x="45" y="308" fontSize="9" fontFamily="sans-serif" fill="#475569" fontWeight="600">
        Aanzicht Achtergevel (Tuinzijde NTA 8800)
      </text>
    </svg>
  );
};
