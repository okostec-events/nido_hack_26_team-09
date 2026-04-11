import { memo } from 'react';
import { gridToScreen, TILE_HEIGHT } from '../../utils/isometric';

const ConnectionLines = memo(function ConnectionLines({ cells }) {
  const placed = cells.filter(c => c.placedInfra);
  const substations = placed.filter(c => c.placedInfra.type === 'substation');
  const connected = placed.filter(c => c.placedInfra && c.placedInfra.isConnected && c.placedInfra.type !== 'substation');

  const lines = [];
  for (const cell of connected) {
    let nearest = null;
    let minDist = Infinity;
    for (const s of substations) {
      const d = Math.abs(s.x - cell.x) + Math.abs(s.y - cell.y);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }
    if (nearest && minDist <= 8) {
      const from = gridToScreen(cell.x, cell.y, cell.elevation);
      const to = gridToScreen(nearest.x, nearest.y, nearest.elevation);
      lines.push({
        key: `${cell.x},${cell.y}-${nearest.x},${nearest.y}`,
        x1: from.screenX,
        y1: from.screenY + TILE_HEIGHT / 2,
        x2: to.screenX,
        y2: to.screenY + TILE_HEIGHT / 2,
      });
    }
  }

  return (
    <g>
      {lines.map(l => (
        <line
          key={l.key}
          x1={l.x1} y1={l.y1}
          x2={l.x2} y2={l.y2}
          stroke="#00E676"
          strokeWidth={0.8}
          opacity={0.2}
          strokeDasharray="3 3"
        />
      ))}
    </g>
  );
});

export default ConnectionLines;
