import type { ReactNode } from 'react';
import { seeded } from '@/lib/math';
import type { IdFactory, VisualLayers, VisualVariant } from './types';

export interface VisualScene {
  defs: ReactNode;
  layers: VisualLayers;
}

const HOT = '#FF2D95';
const FLARE = '#FF4FA3';
const BLUSH = '#FF9FCC';
const PETAL = '#FFC1DC';
const DISPLAY_FONT = 'Archivo, Arial Narrow, sans-serif';
const SERIF_FONT = 'Instrument Serif, Georgia, serif';
const MONO_FONT = 'JetBrains Mono, monospace';

const glowDef = (id: string, color: string, opacity = 0.75): ReactNode => (
  <radialGradient id={id} cx="50%" cy="50%" r="50%">
    <stop offset="0%" stopColor={color} stopOpacity={opacity} />
    <stop offset="100%" stopColor={color} stopOpacity={0} />
  </radialGradient>
);

/* ---------- 01 Ledger: fintech runway dashboard ---------- */
const ledger = (id: IdFactory): VisualScene => {
  const chartPoints = [0, 120, 90, 210, 180, 300, 260, 380, 340, 470, 430, 560];
  const chartPath = chartPoints.map((value, index) => `${index === 0 ? 'M' : 'L'} ${360 + index * 82} ${760 - value}`).join(' ');

  return {
    defs: (
      <>
        {glowDef(id('glow'), HOT, 0.55)}
        <linearGradient id={id('area')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={HOT} stopOpacity={0.55} />
          <stop offset="100%" stopColor={HOT} stopOpacity={0} />
        </linearGradient>
      </>
    ),
    layers: {
      back: (
        <g>
          <rect width="1600" height="1000" fill="#0a0a0a" />
          {Array.from({ length: 17 }, (_, index) => (
            <line key={`v${index}`} x1={index * 100} y1="0" x2={index * 100} y2="1000" stroke="#fff" strokeOpacity={0.04} />
          ))}
          {Array.from({ length: 11 }, (_, index) => (
            <line key={`h${index}`} x1="0" y1={index * 100} x2="1600" y2={index * 100} stroke="#fff" strokeOpacity={0.04} />
          ))}
          <circle cx="1280" cy="820" r="620" fill={`url(#${id('glow')})`} />
          <text
            x="-20"
            y="980"
            fontFamily={DISPLAY_FONT}
            fontWeight={900}
            fontSize="520"
            fill="none"
            stroke={HOT}
            strokeOpacity={0.22}
            strokeWidth={2}
            style={{ fontVariationSettings: "'wdth' 62" }}
          >
            7.2M
          </text>
        </g>
      ),
      mid: (
        <g>
          <rect x="300" y="170" width="1040" height="660" rx="28" fill="#111" stroke="#fff" strokeOpacity={0.1} />
          <text x="360" y="250" fontFamily={DISPLAY_FONT} fontSize="30" fill="#fff" fillOpacity={0.6}>
            Runway
          </text>
          <text
            x="360"
            y="340"
            fontFamily={DISPLAY_FONT}
            fontWeight={800}
            fontSize="92"
            fill="#fff"
            style={{ fontVariationSettings: "'wdth' 70" }}
          >
            7.2 months
          </text>
          <path d={`${chartPath} L ${360 + 11 * 82} 780 L 360 780 Z`} fill={`url(#${id('area')})`} />
          <path d={chartPath} fill="none" stroke={HOT} strokeWidth={5} strokeLinejoin="round" />
          {chartPoints.map((value, index) =>
            index % 3 === 2 ? (
              <circle key={index} cx={360 + index * 82} cy={760 - value} r="10" fill="#0a0a0a" stroke={PETAL} strokeWidth={4} />
            ) : null,
          )}
          <rect x="360" y="790" width="900" height="6" rx="3" fill="#fff" fillOpacity={0.1} />
          <rect x="360" y="790" width="540" height="6" rx="3" fill={HOT} />
        </g>
      ),
      front: (
        <g>
          <g transform="translate(1120 110) rotate(4)">
            <rect width="360" height="170" rx="22" fill={HOT} />
            <text x="32" y="62" fontFamily={DISPLAY_FONT} fontSize="26" fill="#050505">
              Invoice · Studio Kin
            </text>
            <text
              x="32"
              y="130"
              fontFamily={DISPLAY_FONT}
              fontWeight={800}
              fontSize="64"
              fill="#050505"
              style={{ fontVariationSettings: "'wdth' 75" }}
            >
              + $8,400
            </text>
          </g>
          <g transform="translate(110 620) rotate(-5)">
            <rect width="300" height="130" rx="20" fill="#050505" stroke={PETAL} strokeWidth={2} />
            <text x="28" y="52" fontFamily={MONO_FONT} fontSize="22" fill={PETAL}>
              tax_jar
            </text>
            <text x="28" y="104" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize="44" fill="#fff">
              $3,120
            </text>
          </g>
          <path d="M 1010 520 l 0 58 l 16 -15 l 12 26 l 10 -5 l -12 -25 l 22 -2 z" fill="#fff" stroke="#050505" strokeWidth={3} />
        </g>
      ),
    },
  };
};

/* ---------- 02 Atelier: luxury vitrines ---------- */
const atelier = (id: IdFactory): VisualScene => ({
  defs: (
    <>
      <linearGradient id={id('bg')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#070707" />
        <stop offset="100%" stopColor="#24091a" />
      </linearGradient>
      <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="45%" stopColor={BLUSH} />
        <stop offset="100%" stopColor={HOT} />
      </linearGradient>
      {glowDef(id('glow'), BLUSH, 0.45)}
    </>
  ),
  layers: {
    back: (
      <g>
        <rect width="1600" height="1000" fill={`url(#${id('bg')})`} />
        <circle cx="800" cy="560" r="560" fill={`url(#${id('glow')})`} />
        <text
          x="800"
          y="760"
          textAnchor="middle"
          fontFamily={SERIF_FONT}
          fontStyle="italic"
          fontSize="620"
          fill="none"
          stroke={PETAL}
          strokeOpacity={0.2}
          strokeWidth={2}
        >
          Oré
        </text>
      </g>
    ),
    mid: (
      <g>
        {[330, 800, 1270].map((cx, index) => (
          <g key={cx} transform={`translate(${cx} ${index === 1 ? 470 : 530})`}>
            <path
              d="M -170 300 L -170 -120 A 170 170 0 0 1 170 -120 L 170 300 Z"
              fill="#0b0b0b"
              stroke={PETAL}
              strokeOpacity={0.35}
              strokeWidth={2}
            />
            <ellipse
              cx="0"
              cy="40"
              rx={index === 1 ? 92 : 74}
              ry={index === 1 ? 92 : 74}
              fill="none"
              stroke={`url(#${id('metal')})`}
              strokeWidth={index === 1 ? 22 : 16}
            />
            <circle cx="0" cy={index === 1 ? -52 : -34} r={index === 1 ? 20 : 14} fill="#fff" />
            <ellipse cx="0" cy="250" rx="120" ry="14" fill={HOT} fillOpacity={0.25} />
          </g>
        ))}
      </g>
    ),
    front: (
      <g>
        <g transform="translate(980 170) rotate(-6)">
          <rect width="250" height="96" rx="48" fill={PETAL} />
          <text x="125" y="62" textAnchor="middle" fontFamily={SERIF_FONT} fontSize="46" fill="#050505">
            € 1,480
          </text>
        </g>
        <g transform="translate(470 860)">
          <rect width="660" height="96" rx="48" fill="#050505" stroke={BLUSH} strokeWidth={2} />
          {[0, 1, 2].map((slot) => (
            <circle key={slot} cx={70 + slot * 90} cy="48" r="28" fill="none" stroke={BLUSH} strokeWidth={6} />
          ))}
          <rect x="400" y="18" width="240" height="60" rx="30" fill={HOT} />
          <text x="520" y="58" textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize="26" fill="#050505">
            Add to tray
          </text>
        </g>
      </g>
    ),
  },
});

/* ---------- 03 Synapse: AI reasoning canvas ---------- */
const synapse = (id: IdFactory): VisualScene => {
  const random = seeded(31);
  const stars = Array.from({ length: 70 }, () => ({ x: random() * 1600, y: random() * 1000, r: 1 + random() * 3 }));
  const nodes = [
    { x: 800, y: 480, r: 58 },
    { x: 560, y: 320, r: 26 },
    { x: 1060, y: 300, r: 32 },
    { x: 1120, y: 640, r: 24 },
    { x: 520, y: 690, r: 30 },
    { x: 820, y: 180, r: 18 },
    { x: 330, y: 480, r: 16 },
    { x: 1340, y: 470, r: 18 },
  ];

  return {
    defs: (
      <>
        {glowDef(id('core'), FLARE, 0.9)}
        {glowDef(id('haze'), HOT, 0.35)}
      </>
    ),
    layers: {
      back: (
        <g>
          <rect width="1600" height="1000" fill="#070707" />
          <circle cx="800" cy="480" r="520" fill={`url(#${id('haze')})`} />
          {stars.map((star, index) => (
            <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" fillOpacity={0.25 + (index % 4) * 0.12} />
          ))}
        </g>
      ),
      mid: (
        <g>
          {nodes.slice(1).map((node, index) => {
            const controlY = (node.y + 480) / 2 - 90 + index * 20;
            return (
              <path
                key={index}
                d={`M 800 480 Q ${(node.x + 800) / 2} ${controlY} ${node.x} ${node.y}`}
                fill="none"
                stroke={BLUSH}
                strokeOpacity={0.55}
                strokeWidth={2.5}
                strokeDasharray={index % 2 ? '8 10' : undefined}
              />
            );
          })}
          <circle cx="800" cy="480" r="220" fill={`url(#${id('core')})`} />
          {nodes.map((node, index) => (
            <g key={index}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={index === 0 ? HOT : '#0a0a0a'}
                stroke={index === 0 ? '#fff' : PETAL}
                strokeWidth={index === 0 ? 4 : 3}
              />
              {index === 0 && (
                <circle cx={node.x} cy={node.y} r={node.r + 30} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={2} />
              )}
            </g>
          ))}
        </g>
      ),
      front: (
        <g>
          <g transform="translate(90 110)">
            <rect width="470" height="120" rx="26" fill="#111" stroke="#fff" strokeOpacity={0.15} />
            <text x="32" y="54" fontFamily={DISPLAY_FONT} fontSize="28" fill="#fff">
              Why did churn rise in Q3?
            </text>
            <text x="32" y="92" fontFamily={MONO_FONT} fontSize="20" fill={BLUSH}>
              3 branches · 11 sources
            </text>
          </g>
          <g transform="translate(1030 790)">
            <rect width="480" height="130" rx="26" fill={HOT} />
            <text x="32" y="56" fontFamily={DISPLAY_FONT} fontWeight={700} fontSize="30" fill="#050505">
              Pricing change, Sept 04
            </text>
            <rect x="32" y="82" width="300" height="12" rx="6" fill="#050505" fillOpacity={0.25} />
            <rect x="32" y="82" width="246" height="12" rx="6" fill="#050505" />
            <text x="350" y="96" fontFamily={MONO_FONT} fontSize="22" fill="#050505">
              82%
            </text>
          </g>
          {['[src 04]', '[src 07]', '[src 11]'].map((label, index) => (
            <g key={label} transform={`translate(${170 + index * 180} 860)`}>
              <rect width="150" height="54" rx="27" fill="#050505" stroke={PETAL} strokeWidth={2} />
              <text x="75" y="35" textAnchor="middle" fontFamily={MONO_FONT} fontSize="20" fill={PETAL}>
                {label}
              </text>
            </g>
          ))}
        </g>
      ),
    },
  };
};

/* ---------- 04 Noir: festival brand poster ---------- */
const noir = (id: IdFactory): VisualScene => ({
  defs: (
    <>
      <path id={id('badge')} d="M 0 -110 A 110 110 0 1 1 -0.1 -110" />
      {glowDef(id('glow'), FLARE, 0.6)}
    </>
  ),
  layers: {
    back: (
      <g>
        <rect width="1600" height="1000" fill="#050505" />
        <path d="M 0 0 L 980 0 L 620 1000 L 0 1000 Z" fill={HOT} />
        <text
          x="-30"
          y="700"
          fontFamily={DISPLAY_FONT}
          fontWeight={900}
          fontSize="560"
          fill="#050505"
          letterSpacing="-20"
          style={{ fontVariationSettings: "'wdth' 62" }}
        >
          NOIR
        </text>
        <circle cx="1300" cy="220" r="360" fill={`url(#${id('glow')})`} />
      </g>
    ),
    mid: (
      <g>
        <text
          x="1560"
          y="930"
          textAnchor="end"
          fontFamily={DISPLAY_FONT}
          fontWeight={900}
          fontSize="250"
          fill="#fff"
          style={{ fontVariationSettings: "'wdth' 125" }}
        >
          PARADE
        </text>
        {(
          [
            [1080, 160, 46],
            [1420, 520, 30],
            [760, 120, 24],
          ] as const
        ).map(([x, y, size]) => (
          <path
            key={`${x}-${y}`}
            transform={`translate(${x} ${y})`}
            d={`M 0 ${-size} Q 0 0 ${size} 0 Q 0 0 0 ${size} Q 0 0 ${-size} 0 Q 0 0 0 ${-size} Z`}
            fill={PETAL}
          />
        ))}
        <g transform="translate(1260 300)">
          <circle r="138" fill="#050505" stroke={PETAL} strokeWidth={2} />
          <text fontFamily={MONO_FONT} fontSize="26" fill={PETAL} letterSpacing="6">
            <textPath href={`#${id('badge')}`}>MANILA ✦ AFTER DARK ✦ 2025 ✦</textPath>
          </text>
          <text y="22" textAnchor="middle" fontFamily={DISPLAY_FONT} fontWeight={900} fontSize="72" fill={HOT}>
            25
          </text>
        </g>
      </g>
    ),
    front: (
      <g transform="translate(180 120) rotate(-8)">
        <rect width="520" height="220" rx="16" fill="#fff" />
        <line x1="380" y1="14" x2="380" y2="206" stroke="#050505" strokeWidth={3} strokeDasharray="10 10" />
        <text
          x="36"
          y="80"
          fontFamily={DISPLAY_FONT}
          fontWeight={800}
          fontSize="54"
          fill="#050505"
          style={{ fontVariationSettings: "'wdth' 70" }}
        >
          ADMIT ONE
        </text>
        <text x="36" y="130" fontFamily={MONO_FONT} fontSize="22" fill="#050505">
          STAGE B · 02:40 AM
        </text>
        <g transform="translate(250 175) rotate(-14)">
          <rect x="-130" y="-38" width="260" height="76" rx="8" fill="none" stroke={HOT} strokeWidth={6} />
          <text textAnchor="middle" y="18" fontFamily={DISPLAY_FONT} fontWeight={900} fontSize="48" fill={HOT}>
            SOLD OUT
          </text>
        </g>
      </g>
    ),
  },
});

/* ---------- 05 Pocket: ambient running app ---------- */
const pocket = (id: IdFactory): VisualScene => ({
  defs: (
    <>
      {glowDef(id('halo'), PETAL, 0.7)}
      <linearGradient id={id('screen')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#141014" />
        <stop offset="100%" stopColor="#050505" />
      </linearGradient>
    </>
  ),
  layers: {
    back: (
      <g>
        <rect width="1600" height="1000" fill="#060606" />
        {[160, 260, 380, 520, 680].map((radius, index) => (
          <circle
            key={radius}
            cx="820"
            cy="500"
            r={radius}
            fill="none"
            stroke={index === 2 ? HOT : PETAL}
            strokeOpacity={0.35 - index * 0.05}
            strokeWidth={index === 2 ? 3 : 1.5}
          />
        ))}
        <path
          d="M 0 860 C 300 760, 500 940, 820 820 S 1300 700, 1600 800"
          fill="none"
          stroke={HOT}
          strokeOpacity={0.5}
          strokeWidth={4}
          strokeDasharray="2 14"
          strokeLinecap="round"
        />
      </g>
    ),
    mid: (
      <g>
        <g transform="translate(1130 250) rotate(12)">
          <rect x="-150" y="-10" width="300" height="600" rx="48" fill="#0d0d0d" stroke="#fff" strokeOpacity={0.12} strokeWidth={3} />
          {[0, 1, 2].map((row) => (
            <rect key={row} x="-110" y={50 + row * 150} width="220" height="120" rx="22" fill={row === 0 ? HOT : '#161616'} />
          ))}
        </g>
        <g transform="translate(700 90)">
          <rect width="400" height="820" rx="62" fill={`url(#${id('screen')})`} stroke={PETAL} strokeOpacity={0.5} strokeWidth={3} />
          <rect x="150" y="26" width="100" height="28" rx="14" fill="#050505" />
          <circle cx="200" cy="380" r="240" fill={`url(#${id('halo')})`} />
          <circle cx="200" cy="380" r="130" fill="none" stroke={PETAL} strokeWidth={18} />
          <circle
            cx="200"
            cy="380"
            r="130"
            fill="none"
            stroke={HOT}
            strokeWidth={18}
            strokeDasharray="560 900"
            strokeLinecap="round"
            transform="rotate(-90 200 380)"
          />
          <text
            x="200"
            y="400"
            textAnchor="middle"
            fontFamily={DISPLAY_FONT}
            fontWeight={800}
            fontSize="76"
            fill="#fff"
            style={{ fontVariationSettings: "'wdth' 65" }}
          >
            5'12"
          </text>
          <text x="200" y="650" textAnchor="middle" fontFamily={DISPLAY_FONT} fontSize="28" fill="#fff" fillOpacity={0.6}>
            on pace · 6.4 km
          </text>
        </g>
      </g>
    ),
    front: (
      <g>
        <g transform="translate(250 300) rotate(-7)">
          <rect width="330" height="150" rx="26" fill={PETAL} />
          <text x="30" y="58" fontFamily={DISPLAY_FONT} fontSize="26" fill="#050505">
            Split 04
          </text>
          <text
            x="30"
            y="118"
            fontFamily={DISPLAY_FONT}
            fontWeight={800}
            fontSize="58"
            fill="#050505"
            style={{ fontVariationSettings: "'wdth' 70" }}
          >
            4'58"/km
          </text>
        </g>
        {[0, 1, 2].map((wave) => (
          <path
            key={wave}
            d={`M ${1260 + wave * 34} 700 q 18 30 0 60 q -18 30 0 60`}
            fill="none"
            stroke={HOT}
            strokeWidth={5}
            strokeLinecap="round"
            strokeOpacity={1 - wave * 0.28}
          />
        ))}
      </g>
    ),
  },
});

export const SCENES: Record<VisualVariant, (id: IdFactory) => VisualScene> = {
  ledger,
  atelier,
  synapse,
  noir,
  pocket,
};
