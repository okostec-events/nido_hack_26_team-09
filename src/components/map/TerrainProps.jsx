import { memo, useMemo } from 'react';

function seededRandForTile(x, y) {
  let s = ((x * 73856093) ^ (y * 19349663)) & 0x7fffffff;
  if (s === 0) s = 1;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const TerrainProps = memo(function TerrainProps({ terrain, x, y }) {
  const rand = useMemo(() => seededRandForTile(x, y), [x, y]);

  if (terrain === 'forest') return <ForestProps rand={rand} />;
  if (terrain === 'mountain') return <MountainProps rand={rand} />;
  if (terrain === 'urban') return <UrbanProps rand={rand} />;
  return null;
});

function ForestProps({ rand }) {
  const trees = useMemo(() => {
    const count = 4 + Math.floor(rand() * 3);
    return Array.from({ length: count }, (_, i) => ({
      ox: (rand() - 0.5) * 20,
      oy: (rand() - 0.5) * 12,
      r: 4 + rand() * 4,
      shade: rand() > 0.5 ? '#2D6B3F' : '#256B35',
      key: i,
    }));
  }, [rand]);

  const sorted = [...trees].sort((a, b) => a.oy - b.oy);

  return (
    <g>
      {sorted.map(t => (
        <g key={t.key}>
          {/* Shadow */}
          <ellipse cx={t.ox} cy={t.oy + 1} rx={t.r * 0.7} ry={t.r * 0.3} fill="rgba(0,0,0,0.12)" />
          {/* Trunk */}
          <rect x={t.ox - 1} y={t.oy - 6} width={2} height={6} fill="#3E2723" rx={0.5} />
          {/* Canopy */}
          <circle cx={t.ox} cy={t.oy - 9} r={t.r} fill={t.shade} stroke="#1A4A28" strokeWidth={0.6}>
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${-0.4 + t.key * 0.1},0; ${0.4 - t.key * 0.1},0; ${-0.4 + t.key * 0.1},0`}
              dur={`${4 + t.key * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
          {/* Highlight on canopy */}
          <circle cx={t.ox - t.r * 0.3} cy={t.oy - 10} r={t.r * 0.35} fill="rgba(255,255,255,0.06)" />
        </g>
      ))}
    </g>
  );
}

function MountainProps({ rand }) {
  const hasSecondary = rand() < 0.5;
  const hasTertiary = rand() < 0.3;
  return (
    <g>
      {/* Main peak - larger */}
      <polygon
        points="-14,2 14,2 0,-22"
        fill="url(#mountainGrad)"
        opacity={0.9}
      />
      {/* Shadow on left side */}
      <polygon
        points="-14,2 -3,-16 0,-22 -7,2"
        fill="rgba(0,0,0,0.18)"
      />
      {/* Rock texture lines */}
      <line x1={-6} y1={-4} x2={-3} y2={-10} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
      <line x1={4} y1={-2} x2={6} y2={-8} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
      {/* Snow cap */}
      <polygon
        points="-4,-15 4,-15 0,-22"
        fill="#E0E0E8"
        opacity={0.85}
      />
      {/* Snow line detail */}
      <line x1={-4} y1={-15} x2={4} y2={-15} stroke="rgba(255,255,255,0.3)" strokeWidth={0.3} />

      {hasSecondary && (
        <g transform="translate(-10, 4)">
          <polygon points="-8,0 8,0 0,-14" fill="#5A5A6A" opacity={0.75} />
          <polygon points="-8,0 -2,-10 0,-14 -5,0" fill="rgba(0,0,0,0.12)" />
          <polygon points="-3,-10 3,-10 0,-14" fill="#D0D0D8" opacity={0.7} />
        </g>
      )}
      {hasTertiary && (
        <g transform="translate(8, 5)">
          <polygon points="-5,0 5,0 0,-8" fill="#4A4A58" opacity={0.6} />
          <polygon points="-2,-6 2,-6 0,-8" fill="#C8C8D0" opacity={0.5} />
        </g>
      )}
    </g>
  );
}

function UrbanProps({ rand }) {
  const buildings = useMemo(() => {
    const count = 5 + Math.floor(rand() * 4);
    return Array.from({ length: count }, (_, i) => {
      const isTall = rand() < 0.3;
      const w = isTall ? 6 + rand() * 5 : 4 + rand() * 4;
      const h = isTall ? 14 + rand() * 10 : 5 + rand() * 8;
      return {
        ox: -12 + (rand()) * 24,
        oy: (rand() - 0.5) * 8,
        w,
        h,
        depth: 2 + rand() * 3,
        color: ['#3D3D52', '#4A4A60', '#353548', '#3A3A50', '#454560'][Math.floor(rand() * 5)],
        roofColor: isTall ? '#5A5A70' : null,
        hasLight: rand() < 0.4,
        hasWindows: h > 10,
        windowRows: Math.floor(h / 4),
        isTall,
        key: i,
      };
    });
  }, [rand]);

  // Sort back-to-front
  const sorted = [...buildings].sort((a, b) => a.oy - b.oy);

  return (
    <g>
      {sorted.map(b => {
        const bx = b.ox - b.w / 2;
        const by = -b.h + b.oy;
        return (
          <g key={b.key}>
            {/* Shadow */}
            <ellipse cx={b.ox} cy={b.oy + 2} rx={b.w * 0.6} ry={2} fill="rgba(0,0,0,0.15)" />

            {/* Right side face (darker) */}
            <polygon
              points={`${bx + b.w},${by} ${bx + b.w + b.depth},${by + b.depth} ${bx + b.w + b.depth},${b.oy + b.depth} ${bx + b.w},${b.oy}`}
              fill={darkenHex(b.color, 0.3)}
            />
            {/* Front face */}
            <rect
              x={bx}
              y={by}
              width={b.w}
              height={b.h}
              fill={b.color}
              rx={0.5}
            />
            {/* Top face */}
            <polygon
              points={`${bx},${by} ${bx + b.depth},${by - b.depth} ${bx + b.w + b.depth},${by - b.depth} ${bx + b.w},${by}`}
              fill={lightenHex(b.color, 0.15)}
            />

            {/* Windows */}
            {b.hasWindows && Array.from({ length: b.windowRows }, (_, row) => {
              const cols = Math.floor(b.w / 3);
              return Array.from({ length: cols }, (_, col) => (
                <rect
                  key={`w${row}-${col}`}
                  x={bx + 1.5 + col * 3}
                  y={by + 2 + row * 4}
                  width={1.8}
                  height={1.5}
                  fill="rgba(255,220,100,0.15)"
                  rx={0.2}
                />
              ));
            })}

            {/* Rooftop light */}
            {b.hasLight && (
              <circle
                cx={b.ox + b.depth / 2}
                cy={by - b.depth}
                r={1}
                fill="rgba(255,220,100,0.6)"
              >
                <animate attributeName="opacity" values="0.6;0.3;0.6" dur="3s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Antenna on tall buildings */}
            {b.isTall && (
              <>
                <line x1={b.ox} y1={by - b.depth} x2={b.ox} y2={by - b.depth - 6} stroke="#78909C" strokeWidth={0.5} />
                <circle cx={b.ox} cy={by - b.depth - 6} r={0.6} fill="#FF1744" opacity={0.6}>
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

function darkenHex(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function lightenHex(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 + amount;
  return `rgb(${Math.min(255, Math.round(r * f))},${Math.min(255, Math.round(g * f))},${Math.min(255, Math.round(b * f))})`;
}

export default TerrainProps;
