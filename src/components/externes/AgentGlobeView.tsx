import { useEffect, useRef, useState, useCallback } from 'react';
import { GlobeCountryModal } from './GlobeCountryModal';
import type { AgentExterne } from '../../types';

// ── Type déclarations pour globe.gl (chargé via <script>) ─
type GlobeInstance = {
  width: (w: number) => GlobeInstance;
  height: (h: number) => GlobeInstance;
  backgroundColor: (c: string) => GlobeInstance;
  showAtmosphere: (v: boolean) => GlobeInstance;
  atmosphereColor: (c: string) => GlobeInstance;
  atmosphereAltitude: (a: number) => GlobeInstance;
  globeImageUrl: (url: string | null) => GlobeInstance;
  polygonsData: (d: GeoFeature[]) => GlobeInstance;
  polygonAltitude: (fn: number | ((f: GeoFeature) => number)) => GlobeInstance;
  polygonCapColor: (fn: (f: GeoFeature) => string) => GlobeInstance;
  polygonSideColor: (fn: (f: GeoFeature) => string) => GlobeInstance;
  polygonStrokeColor: (fn: (f: GeoFeature) => string) => GlobeInstance;
  polygonLabel: (fn: (f: GeoFeature) => string) => GlobeInstance;
  onPolygonClick: (fn: (f: GeoFeature) => void) => GlobeInstance;
  onPolygonHover: (fn: (f: GeoFeature | null) => void) => GlobeInstance;
  pointsData: (d: MarkerPoint[]) => GlobeInstance;
  pointLat: (fn: (d: MarkerPoint) => number) => GlobeInstance;
  pointLng: (fn: (d: MarkerPoint) => number) => GlobeInstance;
  pointColor: (fn: (d: MarkerPoint) => string) => GlobeInstance;
  pointAltitude: (fn: (d: MarkerPoint) => number) => GlobeInstance;
  pointRadius: (fn: (d: MarkerPoint) => number) => GlobeInstance;
  pointLabel: (fn: (d: MarkerPoint) => string) => GlobeInstance;
  onPointClick: (fn: (d: MarkerPoint) => void) => GlobeInstance;
  htmlElementsData: (d: MarkerPoint[]) => GlobeInstance;
  htmlElement: (fn: (d: MarkerPoint) => HTMLElement) => GlobeInstance;
  onHtmlElementClick: (fn: (d: MarkerPoint) => void) => GlobeInstance;
  controls: () => { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean };
  scene: () => object;
  camera: () => object;
  pauseAnimation: () => void;
  resumeAnimation: () => void;
  (element: HTMLElement): GlobeInstance;
};

interface GeoFeature {
  type: 'Feature';
  properties: { name: string; ISO_A3?: string; ISO_A2?: string };
  geometry: object;
}

interface MarkerPoint {
  paysId: string;
  paysNom: string;
  codeIso3: string;
  codeIso2?: string | null;
  regionNom?: string;
  lat: number;
  lng: number;
  count: number;
  agents: AgentExterne[];
}

// ── Coordonnées centroides ISO3 ─────────────────────────
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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Globe?: any;
  }
}

interface Props { agents: AgentExterne[] }

export function AgentGlobeView({ agents }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<{ paysId: string; paysNom: string; codeIso2?: string | null; regionNom?: string } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<GeoFeature[]>([]);

  // Markers from agents
  const markers: MarkerPoint[] = (() => {
    const m = new Map<string, MarkerPoint>();
    for (const a of agents) {
      if (!a.paysActuel) continue;
      const { id, nom, codeIso, codeIso2, region } = a.paysActuel;
      const coords = ISO3_COORDS[codeIso];
      if (!coords) continue;
      if (!m.has(id)) {
        m.set(id, {
          paysId: id,
          paysNom: nom,
          codeIso3: codeIso,
          codeIso2,
          regionNom: (region as { nom?: string } | undefined)?.nom,
          lat: coords[0],
          lng: coords[1],
          count: 0,
          agents: [],
        });
      }
      const entry = m.get(id)!;
      entry.count++;
      entry.agents.push(a);
    }
    return Array.from(m.values());
  })();

  // Charger GeoJSON frontières
  useEffect(() => {
    fetch('/countries-light.geojson')
      .then((r) => r.json())
      .then((data) => setCountries(data.features ?? []))
      .catch(() => setCountries([]));
  }, []);

  // Trouver le marker du pays cliqué via ISO
  const findMarkerByIso = useCallback((iso3?: string, iso2?: string): MarkerPoint | undefined => {
    return markers.find(
      (m) => m.codeIso3 === iso3 || (iso2 && m.codeIso2 === iso2)
    );
  }, [markers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialiser globe.gl
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.Globe || countries.length === 0) return;

    // Nettoyer si déjà initialisé
    if (globeRef.current) {
      container.innerHTML = '';
    }

    const globe = window.Globe({
      animateIn: true,
      waitForGlobeReady: true,
      rendererConfig: { antialias: true, alpha: true },
    });

    globe
      .width(container.offsetWidth)
      .height(540)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#1a5bce')
      .atmosphereAltitude(0.18)
      .globeImageUrl('/earth-dark.jpg')

      // ── Pays (polygones avec frontières) ──────────────────
      .polygonsData(countries)
      .polygonAltitude((f: GeoFeature) => f === (hoveredCountry as unknown) ? 0.06 : 0.01)
      .polygonCapColor((f: GeoFeature) => {
        const iso3 = f.properties.ISO_A3;
        const iso2 = f.properties.ISO_A2;
        const m = findMarkerByIso(iso3, iso2);
        if (m) {
          if (m.count > 5) return 'rgba(0,127,255,0.85)';
          if (m.count > 2) return 'rgba(0,127,255,0.65)';
          return 'rgba(247,214,24,0.75)';
        }
        return 'rgba(26,74,150,0.6)';
      })
      .polygonSideColor(() => 'rgba(10,30,80,0.4)')
      .polygonStrokeColor(() => 'rgba(80,140,255,0.4)')
      .polygonLabel((f: GeoFeature) => {
        const iso3 = f.properties.ISO_A3;
        const iso2 = f.properties.ISO_A2;
        const m = findMarkerByIso(iso3, iso2);
        if (!m) return ''; // pas de tooltip pour les pays sans agents
        return `<div style="background:rgba(10,20,50,0.95);color:white;padding:8px 12px;border-radius:10px;font-size:13px;font-family:system-ui;border:1px solid rgba(0,127,255,0.3)">
          <div style="font-size:18px;margin-bottom:4px">${countryFlag(m.codeIso2)} <b>${m.paysNom}</b></div>
          <div style="display:flex;gap:8px;font-size:11px">
            <span style="background:rgba(0,127,255,0.3);padding:2px 8px;border-radius:4px">🧑‍💼 ${m.count} membre${m.count > 1 ? 's' : ''}</span>
            ${m.regionNom ? `<span style="color:rgba(255,255,255,0.5)">${m.regionNom}</span>` : ''}
          </div>
          <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:4px">Cliquer pour les détails</div>
        </div>`;
      })
      .onPolygonHover((f: GeoFeature | null) => {
        setHoveredCountry(f ? f.properties.name : null);
        container.style.cursor = f ? 'pointer' : 'grab';
      })
      .onPolygonClick((f: GeoFeature) => {
        const iso3 = f.properties.ISO_A3;
        const iso2 = f.properties.ISO_A2;
        const m = findMarkerByIso(iso3, iso2);
        if (m) {
          setModal({
            paysId: m.paysId,
            paysNom: m.paysNom,
            codeIso2: m.codeIso2,
            regionNom: m.regionNom,
          });
        }
      })

      // ── Points agents (marqueurs lumineux) ─────────────────
      .pointsData(markers)
      .pointLat((d: MarkerPoint) => d.lat)
      .pointLng((d: MarkerPoint) => d.lng)
      .pointAltitude((d: MarkerPoint) => 0.02 + d.count * 0.005)
      .pointRadius((d: MarkerPoint) => 0.4 + d.count * 0.15)
      .pointColor((d: MarkerPoint) => d.count > 3 ? '#007FFF' : '#F7D618')
      .pointLabel((d: MarkerPoint) => '')
      .onPointClick((d: MarkerPoint) => {
        setModal({
          paysId: d.paysId,
          paysNom: d.paysNom,
          codeIso2: d.codeIso2,
          regionNom: d.regionNom,
        });
      })

      (container);

    globeRef.current = globe;

    // Config caméra
    const ctrl = globe.controls();
    ctrl.autoRotate = false;
    ctrl.enableZoom = true;

    setReady(true);

    return () => {
      if (container) container.innerHTML = '';
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  // Mettre à jour les données quand les agents changent
  useEffect(() => {
    if (!globeRef.current || !ready) return;
    globeRef.current
      .pointsData(markers)
      .polygonsData(countries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents, ready]);

  return (
    <div className="select-none">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at center, #0a1a3e 0%, #030d1f 100%)', minHeight: 540 }}
      >
        {/* Globe container */}
        <div ref={containerRef} className="w-full" style={{ height: 540 }} />

        {/* Chargement */}
        {countries.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full" />
            <p className="text-white/40 text-sm">Chargement du globe…</p>
          </div>
        )}

        {/* Légende */}
        {ready && (
          <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#007FFF] opacity-85" />
              <span className="text-white/60 text-[11px]">&gt;5 membres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#007FFF] opacity-65" />
              <span className="text-white/60 text-[11px]">3–5 membres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#F7D618] opacity-75" />
              <span className="text-white/60 text-[11px]">1–2 membres</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <span className="text-white/30 text-[11px]">Cliquer sur un pays pour les détails</span>
          </div>
        )}

        {/* Compteur top left */}
        {ready && markers.length > 0 && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
            <span className="text-white/70 text-xs font-semibold">
              🌍 {agents.length} agent{agents.length > 1 ? 's' : ''} dans {markers.length} pays
            </span>
          </div>
        )}

        {/* Indice top right */}
        {ready && (
          <div className="absolute top-4 right-4 text-white/25 text-[11px] pointer-events-none">
            ↕↔ Drag · Scroll zoom · Clic détails
          </div>
        )}
      </div>

      {/* Modal détails pays */}
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
