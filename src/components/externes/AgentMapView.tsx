import { useEffect, useState, useRef, useCallback } from 'react';
import { GlobeCountryModal } from './GlobeCountryModal';
import type { AgentExterne } from '../../types';

// ── Projection Mercator ───────────────────────────────────
const W = 1000, H = 500;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * W;
  const latRad = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
  const y = (Math.PI - Math.log(Math.tan(Math.PI / 4 + latRad / 2))) / (2 * Math.PI) * H;
  return [x, y];
}

function ringToPath(coords: [number, number][]): string {
  if (coords.length < 3) return '';
  return coords
    .map(([lon, lat], i) => {
      const [x, y] = project(lon, lat);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join('') + 'Z';
}

function geomToPath(geom: GeoGeometry): string {
  if (!geom) return '';
  if (geom.type === 'Polygon') {
    return geom.coordinates.map((ring:any) => ringToPath(ring)).join(' ');
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates
      .flatMap((poly) => poly.map((ring) => ringToPath(ring)))
      .join(' ');
  }
  return '';
}

// ── Types GeoJSON ─────────────────────────────────────────
interface GeoGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: [number, number][][][];
}
interface GeoFeature {
  type: 'Feature';
  properties: { name: string; ISO_A3?: string; ISO_A2?: string };
  geometry: GeoGeometry;
}

// ── Centroides ISO3 ───────────────────────────────────────
const ISO3_COORDS: Record<string, [number, number]> = {
  AFG:[33,66],ALB:[41,20],DZA:[28,2],AGO:[-12,18],ARG:[-34,-64],ARM:[40,45],AUS:[-25,134],AUT:[47,14],
  AZE:[40,47],BHS:[25,-76],BHR:[26,50],BGD:[24,90],BLR:[53,28],BEL:[51,4],BEN:[9,2],BOL:[-17,-65],
  BIH:[44,17],BWA:[-22,24],BRA:[-10,-52],BGR:[43,25],BFA:[13,-1],BDI:[-3,30],KHM:[12,105],CMR:[6,12],
  CAN:[56,-96],CAF:[7,20],TCD:[15,17],CHL:[-30,-71],CHN:[35,104],COL:[4,-74],COD:[-4,24],COG:[-1,15],
  CRI:[10,-84],HRV:[45,16],CUB:[22,-79],CZE:[50,16],DNK:[56,10],DJI:[11,43],DOM:[19,-70],ECU:[-2,-78],
  EGY:[27,30],SLV:[14,-89],GNQ:[2,10],ERI:[15,38],EST:[59,25],ETH:[8,38],FIN:[64,25],FRA:[46,2],
  GAB:[-1,12],GMB:[13,-16],GEO:[42,43],DEU:[51,9],GHA:[8,-1],GRC:[39,22],GTM:[15,-90],GIN:[11,-11],
  GUY:[5,-59],HTI:[19,-72],HND:[15,-87],HUN:[47,19],ISL:[65,-18],IND:[20,77],IDN:[-5,120],IRN:[32,53],
  IRQ:[33,44],IRL:[53,-8],ISR:[31,35],ITA:[43,12],JPN:[36,138],JOR:[31,36],KAZ:[48,68],KEN:[-1,38],
  KOR:[37,128],KWT:[29,47],LAO:[18,103],LVA:[57,25],LBN:[33,35],LBR:[6,-9],LBY:[25,17],LTU:[56,24],
  MDG:[-20,47],MWI:[-13,34],MYS:[2,112],MLI:[18,-2],MRT:[20,-11],MEX:[23,-102],MDA:[47,29],MNG:[46,105],
  MAR:[32,-7],MOZ:[-18,35],MMR:[17,96],NAM:[-22,18],NPL:[28,84],NLD:[52,5],NZL:[-41,172],NIC:[13,-85],
  NER:[16,8],NGA:[10,8],NOR:[61,8],OMN:[22,57],PAK:[30,70],PAN:[9,-80],PRY:[-23,-58],PER:[-10,-76],
  PHL:[13,122],POL:[52,20],PRT:[39,-8],QAT:[25,51],ROU:[46,25],RUS:[60,100],RWA:[-2,30],SAU:[24,45],
  SEN:[14,-14],SRB:[44,21],SLE:[8,-11],SGP:[1,104],SOM:[10,46],ZAF:[-29,25],ESP:[40,-4],LKA:[7,81],
  SDN:[16,30],SWE:[62,15],CHE:[47,8],SYR:[35,38],TJK:[39,71],TZA:[-6,35],THA:[15,101],TGO:[8,1],
  TUN:[34,9],TUR:[39,35],UGA:[1,32],UKR:[49,32],ARE:[24,54],GBR:[54,-2],USA:[38,-97],URY:[-33,-56],
  VEN:[8,-66],VNM:[16,108],YEM:[15,47],ZMB:[-14,28],ZWE:[-20,30],
};

function countryFlag(code?: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  const pts = [...code.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...pts);
}

interface PaysInfo {
  paysId: string; paysNom: string;
  codeIso2?: string | null; codeIso3: string;
  regionNom?: string;
  lat: number; lng: number;
  count: number; agents: AgentExterne[];
}

interface Props { agents: AgentExterne[] }

export function AgentMapView({ agents }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [paths, setPaths] = useState<{ id: string; d: string; iso3: string; iso2: string }[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [modal, setModal] = useState<{ paysId: string; paysNom: string; codeIso2?: string | null; regionNom?: string } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; info: PaysInfo } | null>(null);

  // Index pays → agents
  const paysIndex = useRef<Map<string, PaysInfo>>(new Map());
  const iso3ToPays = useRef<Map<string, PaysInfo>>(new Map());
  const iso2ToPays = useRef<Map<string, PaysInfo>>(new Map());

  useEffect(() => {
    const byId = new Map<string, PaysInfo>();
    for (const a of agents) {
      if (!a.paysActuel) continue;
      const { id, nom, codeIso, codeIso2, region } = a.paysActuel;
      const coords = ISO3_COORDS[codeIso];
      if (!byId.has(id)) {
        byId.set(id, {
          paysId: id, paysNom: nom,
          codeIso3: codeIso, codeIso2,
          regionNom: (region as { nom?: string } | undefined)?.nom,
          lat: coords?.[0] ?? 0, lng: coords?.[1] ?? 0,
          count: 0, agents: [],
        });
      }
      const e = byId.get(id)!;
      e.count++;
      e.agents.push(a);
    }
    paysIndex.current = byId;

    const byIso3 = new Map<string, PaysInfo>();
    const byIso2 = new Map<string, PaysInfo>();
    for (const p of byId.values()) {
      byIso3.set(p.codeIso3, p);
      if (p.codeIso2) byIso2.set(p.codeIso2, p);
    }
    iso3ToPays.current = byIso3;
    iso2ToPays.current = byIso2;
  }, [agents]);

  // Charger GeoJSON
  useEffect(() => {
    fetch('/countries-light.geojson')
      .then((r) => r.json())
      .then((data) => setFeatures(data.features ?? []))
      .catch(() => {});
  }, []);

  // Générer les paths SVG (une seule fois au chargement)
  useEffect(() => {
    if (!features.length) return;
    const ps = features.map((f, i) => ({
      id: `c-${i}`,
      iso3: f.properties.ISO_A3 ?? '',
      iso2: f.properties.ISO_A2 ?? '',
      d: geomToPath(f.geometry),
    })).filter((p) => p.d);
    setPaths(ps);
  }, [features]);

  // Trouver PaysInfo par ISO
  const findInfo = useCallback((iso3: string, iso2: string): PaysInfo | undefined => {
    return iso3ToPays.current.get(iso3) ?? iso2ToPays.current.get(iso2);
  }, []);

  // Couleur d'un pays
  function getFill(iso3: string, iso2: string, isHovered: boolean): string {
    const info = findInfo(iso3, iso2);
    if (isHovered && info) return '#60a5fa';
    if (isHovered) return '#2d63c8';
    if (info) {
      if (info.count > 5) return '#007FFF';
      if (info.count > 2) return '#3b82f6';
      return '#facc15';
    }
    return '#1e3f8f';
  }

  // Marqueurs sur les pays actifs
  const markers = Array.from(paysIndex.current.values()).filter((p) => ISO3_COORDS[p.codeIso3]);

  return (
    <div className="p-4">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #030d1f 0%, #071a45 100%)' }}
      >
        {features.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-rdc-blue border-t-transparent rounded-full" />
            Chargement de la carte…
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full block"
            style={{ maxHeight: 520 }}
          >
            {/* Fond océan */}
            <rect width={W} height={H} fill="#0b1e50" />

            {/* Grille légère */}
            {[-60, -30, 0, 30, 60].map((lat) => {
              const [, y] = project(0, lat);
              return <line key={lat} x1={0} y1={y} x2={W} y2={y} stroke="#1a3a82" strokeWidth={lat === 0 ? 0.8 : 0.3} strokeDasharray={lat === 0 ? '4 4' : undefined} />;
            })}
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
              const [x] = project(lon, 0);
              return <line key={lon} x1={x} y1={0} x2={x} y2={H} stroke="#1a3a82" strokeWidth={0.3} />;
            })}

            {/* Pays */}
            <g>
              {paths.map((p) => {
                const isHov = hovered === p.id;
                const info = findInfo(p.iso3, p.iso2);
                return (
                  <path
                    key={p.id}
                    d={p.d}
                    fill={getFill(p.iso3, p.iso2, isHov)}
                    stroke="#2d63c8"
                    strokeWidth={0.3}
                    strokeLinejoin="round"
                    className={info ? 'cursor-pointer' : 'cursor-default'}
                    style={{ transition: 'fill 0.15s' }}
                    onMouseEnter={(e) => {
                      setHovered(p.id);
                      if (info) {
                        const rect = svgRef.current?.getBoundingClientRect();
                        if (rect) {
                          const svgX = (e.clientX - rect.left) / rect.width * W;
                          const svgY = (e.clientY - rect.top) / rect.height * H;
                          setTooltip({ x: svgX, y: svgY, info });
                        }
                      }
                    }}
                    onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                    onClick={() => {
                      if (info) {
                        setModal({
                          paysId: info.paysId, paysNom: info.paysNom,
                          codeIso2: info.codeIso2, regionNom: info.regionNom,
                        });
                      }
                    }}
                  />
                );
              })}
            </g>

            {/* Marqueurs agents */}
            {markers.map((m) => {
              const [px, py] = project(m.lng, m.lat);
              const r = Math.max(5, Math.min(16, 5 + m.count * 2));
              const isMany = m.count > 3;
              return (
                <g
                  key={m.paysId}
                  className="cursor-pointer"
                  onClick={() => setModal({ paysId: m.paysId, paysNom: m.paysNom, codeIso2: m.codeIso2, regionNom: m.regionNom })}
                >
                  {/* Halo */}
                  <circle cx={px} cy={py} r={r + 5} fill={isMany ? 'rgba(0,127,255,0.18)' : 'rgba(247,214,24,0.18)'} />
                  {/* Cercle */}
                  <circle
                    cx={px} cy={py} r={r}
                    fill={isMany ? '#007FFF' : '#F7D618'}
                    stroke={isMany ? '#005BBB' : '#d4a800'}
                    strokeWidth={1.5}
                    style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}
                  />
                  {/* Chiffre */}
                  <text
                    x={px} y={py}
                    textAnchor="middle" dominantBaseline="central"
                    fill={isMany ? 'white' : '#0d2b6e'}
                    fontSize={r > 10 ? 8 : 6}
                    fontWeight="800"
                    className="pointer-events-none select-none"
                  >
                    {m.count}
                  </text>
                </g>
              );
            })}

            {/* Tooltip SVG inline */}
            {tooltip && (() => {
              const { x, y, info } = tooltip;
              const tx = Math.min(x + 12, W - 160);
              const ty = Math.max(y - 60, 8);
              return (
                <g className="pointer-events-none">
                  <rect x={tx} y={ty} width={155} height={52} rx={8} fill="rgba(10,20,50,0.95)" stroke="rgba(0,127,255,0.4)" strokeWidth={0.8} />
                  <text x={tx + 10} y={ty + 18} fill="white" fontSize={12} fontWeight="700" fontFamily="system-ui">
                    {countryFlag(info.codeIso2)} {info.paysNom}
                  </text>
                  <rect x={tx + 10} y={ty + 26} width={62} height={16} rx={4} fill="rgba(0,127,255,0.35)" />
                  <text x={tx + 41} y={ty + 36} fill="white" fontSize={9} fontWeight="700" fontFamily="system-ui" textAnchor="middle" dominantBaseline="central">
                    🧑‍💼 {info.count} membre{info.count > 1 ? 's' : ''}
                  </text>
                  {info.regionNom && (
                    <text x={tx + 80} y={ty + 36} fill="rgba(255,255,255,0.45)" fontSize={8} fontFamily="system-ui" dominantBaseline="central">
                      {info.regionNom}
                    </text>
                  )}
                </g>
              );
            })()}
          </svg>
        )}

        {/* Légende bas gauche */}
        {paths.length > 0 && (
          <div className="absolute bottom-3 left-4 flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#007FFF]" />
              <span className="text-white/60 text-[11px]">&gt;5 membres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
              <span className="text-white/60 text-[11px]">3–5</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#facc15]" />
              <span className="text-white/60 text-[11px]">1–2</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <span className="text-white/30 text-[11px]">Cliquer sur un pays marqué</span>
          </div>
        )}

        {/* Compteur */}
        {markers.length > 0 && (
          <div className="absolute top-3 left-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
            <span className="text-white/70 text-xs font-semibold">
              🌍 {agents.length} membre{agents.length > 1 ? 's' : ''} du personnel · {markers.length} pays
            </span>
          </div>
        )}
      </div>

      {modal && (
        <GlobeCountryModal
          paysId={modal.paysId}
          paysNom={modal.paysNom}
          codeIso2={modal.codeIso2}
          regionNom={modal.regionNom}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
