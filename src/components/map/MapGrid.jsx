import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GRID_COLS, GRID_ROWS } from '../../utils/gridGenerator';
import { getViewBox, gridToScreen, TILE_HEIGHT } from '../../utils/isometric';
import IsometricTile from './IsometricTile';
import ConnectionLines from './ConnectionLines';
import DataAttribution from './DataAttribution';
import HoverTooltip from './HoverTooltip';

let hasAnimatedOnce = false;

const MapGrid = memo(function MapGrid({
  cells,
  overlays = [],
  compareMode = false,
  hoveredCell,
  onCellHover,
  onCellLeave,
  onCellDrop,
  interactive = true,
  style = {},
}) {
  const vb = useMemo(() => getViewBox(GRID_COLS, GRID_ROWS), []);
  const [loadPhase, setLoadPhase] = useState(() =>
    cells.length > 0 && hasAnimatedOnce ? 'done' : 'idle'
  );
  const prevCellCount = useRef(cells.length > 0 && hasAnimatedOnce ? cells.length : 0);

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef(null);

  // Tooltip position
  const [tooltipPos, setTooltipPos] = useState(null);

  // Cascade animation
  useEffect(() => {
    if (cells.length > 0 && prevCellCount.current === 0 && !hasAnimatedOnce) {
      hasAnimatedOnce = true;
      setLoadPhase('cascade');
      const t1 = setTimeout(() => setLoadPhase('flat'), 1600);
      const t2 = setTimeout(() => setLoadPhase('transition3d'), 2100);
      const t3 = setTimeout(() => setLoadPhase('done'), 3300);
      prevCellCount.current = cells.length;
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    if (cells.length > 0 && hasAnimatedOnce) {
      setLoadPhase('done');
      prevCellCount.current = cells.length;
    }
    if (cells.length === 0) {
      prevCellCount.current = 0;
      hasAnimatedOnce = false;
      setLoadPhase('idle');
    }
  }, [cells.length]);

  const show3D = loadPhase === 'transition3d' || loadPhase === 'done';

  const sortedCells = useMemo(() => {
    return [...cells].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }, [cells]);

  const showTiles = loadPhase !== 'idle';

  // Zoom on wheel
  const handleWheel = useCallback((e) => {
    if (!interactive) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.4, Math.min(4, prev * delta)));
  }, [interactive]);

  // Pan handlers
  const handlePanStart = useCallback((e) => {
    if (!interactive) return;
    // Only pan on middle-click or when holding space, or right-drag
    // For simplicity: any mousedown on the background starts pan
    if (e.target.tagName === 'svg' || e.target.tagName === 'DIV') {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [interactive, pan]);

  const handlePanMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Track mouse for tooltip
  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointerup', handlePanEnd);
    window.addEventListener('pointermove', handlePanMove);
    return () => {
      window.removeEventListener('pointerup', handlePanEnd);
      window.removeEventListener('pointermove', handlePanMove);
    };
  }, [handlePanEnd, handlePanMove]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePanStart}
      onMouseMove={interactive ? handleMouseMove : undefined}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'default',
        ...style,
      }}
    >
      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, var(--bg-primary) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Hover tooltip */}
      {interactive && hoveredCell && tooltipPos && (
        <HoverTooltip cell={hoveredCell} pos={tooltipPos} />
      )}

      <div
        style={{
          transition: show3D ? 'transform 1.2s cubic-bezier(0.34, 1.4, 0.64, 1)' : 'none',
          transform: `
            ${show3D ? 'perspective(1000px) rotateX(55deg) rotateZ(-45deg)' : ''}
            translate(${pan.x}px, ${pan.y}px)
            scale(${show3D ? 0.82 * zoom : zoom})
          `,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
          style={{
            width: vb.width * 1.8,
            height: vb.height * 1.8,
          }}
        >
          <defs>
            <linearGradient id="mountainGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#5A5A6A" />
              <stop offset="50%" stopColor="#8A8A9A" />
              <stop offset="80%" stopColor="#E0E0E8" />
            </linearGradient>
          </defs>

          <ConnectionLines cells={cells} />

          {showTiles && sortedCells.map((cell) => {
            const rowDelay = cell.y * 100;
            return (
              <g
                key={`${cell.x}-${cell.y}`}
                style={{
                  animation: loadPhase === 'cascade'
                    ? `tileAppear 200ms ease-out ${rowDelay}ms both`
                    : undefined,
                }}
              >
                <IsometricTile
                  cell={cell}
                  overlays={overlays}
                  showCompare={compareMode && overlays.length === 2}
                  isHovered={hoveredCell?.x === cell.x && hoveredCell?.y === cell.y}
                  onPointerEnter={interactive ? () => onCellHover?.(cell) : undefined}
                  onPointerLeave={interactive ? () => onCellLeave?.() : undefined}
                  onPointerUp={interactive ? () => onCellDrop?.(cell) : undefined}
                />
              </g>
            );
          })}

          <g transform={`translate(${vb.x + vb.width - 10}, ${vb.y + vb.height - 20})`}>
            <DataAttribution />
          </g>
        </svg>
      </div>

      {/* Zoom controls */}
      {interactive && (
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 5,
        }}>
          <ZoomBtn label="+" onClick={() => setZoom(z => Math.min(4, z * 1.25))} />
          <ZoomBtn label="−" onClick={() => setZoom(z => Math.max(0.4, z * 0.8))} />
          <ZoomBtn label="⟲" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} />
        </div>
      )}

      <style>{`
        @keyframes tileAppear {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
});

function ZoomBtn({ label, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        color: 'var(--text-secondary)',
        fontSize: 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        fontFamily: "'Space Mono', monospace",
      }}
      onMouseEnter={e => { e.target.style.background = 'var(--bg-tertiary)'; e.target.style.color = 'white'; }}
      onMouseLeave={e => { e.target.style.background = 'var(--glass-bg)'; e.target.style.color = 'var(--text-secondary)'; }}
    >
      {label}
    </button>
  );
}

export default MapGrid;
