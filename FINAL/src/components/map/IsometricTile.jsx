import { memo, useMemo } from 'react';
import { TILE_WIDTH, TILE_HEIGHT, HEIGHT_SCALE, gridToScreen } from '../../utils/isometric';
import { TERRAIN_COLORS, getOverlayColor } from '../../utils/colors';
import TerrainProps from './TerrainProps';
import InfrastructureIcon from './InfrastructureIcon';

function seededRandTile(x, y) {
  let s = ((x * 73856093) ^ (y * 19349663)) & 0x7fffffff;
  if (s === 0) s = 1;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const IsometricTile = memo(function IsometricTile({
  cell,
  overlays = [],
  isHovered = false,
  onPointerEnter,
  onPointerLeave,
  onPointerUp,
  showCompare = false,
}) {
  const { x, y, terrain, elevation } = cell;
  const colors = TERRAIN_COLORS[terrain];
  const h = elevation * HEIGHT_SCALE;
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;

  // Top face diamond
  const topPoints = `0,${-h} ${hw},${hh - h} 0,${TILE_HEIGHT - h} ${-hw},${hh - h}`;
  // Left face
  const leftPoints = `${-hw},${hh - h} 0,${TILE_HEIGHT - h} 0,${TILE_HEIGHT} ${-hw},${hh}`;
  // Right face
  const rightPoints = `0,${TILE_HEIGHT - h} ${hw},${hh - h} ${hw},${hh} 0,${TILE_HEIGHT}`;

  // Screen position
  const { screenX, screenY } = gridToScreen(x, y, 0);

  // Overlay colors
  const overlayColor1 = overlays.length > 0 ? getOverlayValue(cell, overlays[0]) : null;
  const overlayColor2 = overlays.length > 1 ? getOverlayValue(cell, overlays[1]) : null;

  // Water wave animation
  const isWater = terrain === 'water';

  // Restricted hatch pattern id
  const hatchId = `hatch-${x}-${y}`;

  // Hover lift offset
  const hoverLift = isHovered ? 3 : 0;

  return (
    <g
      transform={`translate(${screenX}, ${screenY - hoverLift})`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerUp}
      style={{ cursor: 'pointer' }}
    >
      {/* Left face */}
      <polygon points={leftPoints} fill={colors.left} />
      {/* Right face */}
      <polygon points={rightPoints} fill={colors.right} />
      {/* Top face */}
      <polygon points={topPoints} fill={colors.base} />

      {/* Water shimmer */}
      {isWater && <WaterTexture h={h} hw={hw} hh={hh} x={x} />}

      {/* Land texture dots */}
      {(terrain === 'land' || terrain === 'forest') && <LandTexture x={x} y={y} h={h} />}

      {/* Urban grid pattern */}
      {terrain === 'urban' && <UrbanTexture h={h} hw={hw} hh={hh} />}

      {/* Mountain surface lines */}
      {terrain === 'mountain' && <MountainTexture h={h} />}

      {/* Overlay tint */}
      {overlayColor1 && !showCompare && (
        <polygon points={topPoints} fill={overlayColor1} />
      )}
      {showCompare && overlayColor1 && overlayColor2 && (
        <>
          {/* Split diagonal - left triangle */}
          <polygon
            points={`0,${-h} ${-hw},${hh - h} 0,${TILE_HEIGHT - h}`}
            fill={overlayColor1}
          />
          {/* Right triangle */}
          <polygon
            points={`0,${-h} ${hw},${hh - h} 0,${TILE_HEIGHT - h}`}
            fill={overlayColor2}
          />
        </>
      )}
      {showCompare && overlayColor1 && !overlayColor2 && (
        <polygon points={topPoints} fill={overlayColor1} />
      )}

      {/* Restricted hatch */}
      {cell.isRestricted && (
        <>
          <defs>
            <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--accent-danger)" strokeWidth="2" opacity="0.25" />
            </pattern>
          </defs>
          <polygon points={topPoints} fill={`url(#${hatchId})`} />
          <text x={hw - 8} y={-h + 8} fontSize={8} fill="var(--accent-danger)" opacity={0.6}>⛔</text>
        </>
      )}

      {/* Terrain props (trees, mountains, buildings) */}
      <g transform={`translate(0, ${hh - h - 2})`}>
        <TerrainProps terrain={terrain} x={x} y={y} />
      </g>

      {/* Placed infrastructure */}
      {cell.placedInfra && (
        <g transform={`translate(0, ${hh - h - 2})`}>
          <InfrastructureIcon type={cell.placedInfra.type} cell={cell} />
        </g>
      )}

      {/* Hover highlight */}
      {isHovered && (
        <>
          <polygon
            points={topPoints}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(0,230,118,0.5)"
            strokeWidth={1.5}
          />
          {/* Glow under tile */}
          <polygon
            points={topPoints}
            fill="none"
            stroke="rgba(0,230,118,0.2)"
            strokeWidth={3}
            filter="url(#hoverGlow)"
          />
        </>
      )}
    </g>
  );
});

function WaterTexture({ h, hw, hh, x }) {
  const offsets = [0.2, 0.4, 0.65, 0.8];
  return (
    <g>
      {offsets.map((frac, i) => {
        const yPos = -h + (TILE_HEIGHT - 0) * frac;
        const xRange = hw * (1 - Math.abs(frac - 0.5) * 2) * 0.8;
        return (
          <line
            key={i}
            x1={-xRange}
            y1={yPos}
            x2={xRange}
            y2={yPos}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.8}
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`-3,0;3,0;-3,0`}
              dur={`${6}s`}
              begin={`${i * 1.5}s`}
              repeatCount="indefinite"
            />
          </line>
        );
      })}
    </g>
  );
}

function LandTexture({ x, y, h }) {
  const rand = seededRandTile(x + 100, y + 100);
  const dots = [];
  for (let i = 0; i < 3; i++) {
    dots.push(
      <circle
        key={i}
        cx={(rand() - 0.5) * 20}
        cy={-h + TILE_HEIGHT * 0.3 + rand() * TILE_HEIGHT * 0.4}
        r={0.5}
        fill="rgba(255,255,255,0.04)"
      />
    );
  }
  return <g>{dots}</g>;
}

function UrbanTexture({ h, hw, hh }) {
  return (
    <g opacity={0.05} stroke="white" strokeWidth={0.5}>
      <line x1={-hw * 0.3} y1={hh * 0.3 - h} x2={hw * 0.3} y2={hh * 1.3 - h} />
      <line x1={-hw * 0.6} y1={hh * 0.6 - h} x2={hw * 0.6} y2={hh * 0.6 - h} />
    </g>
  );
}

function MountainTexture({ h }) {
  return (
    <g stroke="rgba(255,255,255,0.08)" strokeWidth={0.8}>
      <line x1={-5} y1={-h + 8} x2={-2} y2={-h + 5} />
      <line x1={3} y1={-h + 10} x2={6} y2={-h + 7} />
    </g>
  );
}

function getOverlayValue(cell, overlay) {
  if (!overlay) return null;
  if (overlay === 'solar') return getOverlayColor('solar', cell.solarIndex);
  if (overlay === 'wind') return getOverlayColor('wind', cell.windIndex);
  if (overlay === 'flood') return getOverlayColor('flood', cell.floodRisk);
  if (overlay === 'temp') return getOverlayColor('temp', cell.temperature);
  return null;
}

export default IsometricTile;
