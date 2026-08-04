/** Декоративний L-орнамент у стилі геометричної вишиванки (hero).
 * Розтягується на блок eyebrow+title+lead; затухання — CSS mask на обгортці.
 */
const VIEW_W = 420
const VIEW_H = 360

const TOP_DIAMOND_X = Array.from({length: 24}, (_, index) => 24 + index * 16)
const TOP_DOT_X = Array.from({length: 40}, (_, index) => 20 + index * 10)
const SIDE_DIAMOND_Y = Array.from({length: 24}, (_, index) => 28 + index * 13)
const SIDE_DOT_Y = Array.from({length: 42}, (_, index) => 24 + index * 8)

function topDiamond(cx: number) {
  return (
    <g key={`td-${cx}`}>
      <path d={`M${cx} 11 ${cx + 5.5} 16.5 ${cx} 22 ${cx - 5.5} 16.5Z`} />
      <path d={`M${cx - 2.8} 16.5 H${cx + 2.8} M${cx} 13.8 V19.2`} opacity="0.9" />
    </g>
  )
}

function sideDiamond(cy: number) {
  return (
    <g key={`sd-${cy}`}>
      <path d={`M15 ${cy} 20.5 ${cy + 5.5} 15 ${cy + 11} 9.5 ${cy + 5.5}Z`} />
      <path d={`M12 ${cy + 5.5} H18 M15 ${cy + 2.5} V${cy + 8.5}`} opacity="0.9" />
    </g>
  )
}

export default function HeroVyshyvankaCorner() {
  return (
    <div className="hero-vyshyvanka" aria-hidden="true">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <g className="hero-vyshyvanka-stroke" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round">
          {/* Подвійна L-рейка — чітко читається на всю висоту/ширину. */}
          <path d={`M6 6 H${VIEW_W - 8}`} opacity="0.85" />
          <path d={`M6 6 V${VIEW_H - 10}`} opacity="0.85" />
          <path d={`M11 11 H${VIEW_W - 14}`} opacity="0.35" strokeDasharray="1.5 4" />
          <path d={`M11 11 V${VIEW_H - 14}`} opacity="0.35" strokeDasharray="1.5 4" />
          <path d="M6 6 15 15 6 24 15 33 6 42" opacity="0.88" />

          {TOP_DIAMOND_X.map(topDiamond)}
          {TOP_DOT_X.map((cx) => (
            <path key={`tp-${cx}`} d={`M${cx} 28 h0.01`} opacity="0.55" strokeWidth="2.2" />
          ))}
          <path d={`M18 26 H${VIEW_W - 20}`} opacity="0.4" strokeDasharray="2 5" />

          {SIDE_DIAMOND_Y.map(sideDiamond)}
          {SIDE_DOT_Y.map((cy) => (
            <path key={`sp-${cy}`} d={`M26 ${cy} h0.01`} opacity="0.5" strokeWidth="2.2" />
          ))}
        </g>
      </svg>
    </div>
  )
}
