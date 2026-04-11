import { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './contexts/AppContext';
import { DragProvider, useDrag } from './contexts/DragContext';
import { useGridState } from './hooks/useGridState';
import { useBudget } from './hooks/useBudget';
import { calculateScore } from './utils/scoring';
import { getInfraDefinition, INFRASTRUCTURE } from './data/infrastructure';

import LandingPage from './components/LandingPage';
import TopNav from './components/TopNav';
import ScoutPanel from './components/scout/ScoutPanel';
import EmptyState from './components/scout/EmptyState';
import MapGrid from './components/map/MapGrid';
import Toolbox from './components/build/Toolbox';
import DragGhost from './components/build/DragGhost';
import AnalysisDashboard from './components/build/AnalysisDashboard';
import PlacementLog from './components/build/PlacementLog';
import ReportPanel from './components/report/ReportPanel';
import { GhostButton } from './components/shared/Button';
import { Monitor } from 'lucide-react';

function AppContent() {
  const { currentMode, activeOverlays, compareMode, navigateTo, selectedRegion } = useApp();
  const { cells, loadRegion, placeInfrastructure, removeInfrastructure, undoLastPlacement, placementLog } = useGridState();
  const { budget, totalBudget, spend, refund, canAfford, reset: resetBudget } = useBudget();
  const { dragItem, dragPosition, startDrag, updateDrag, endDrag } = useDrag();

  const [hoveredCell, setHoveredCell] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activePlacementType, setActivePlacementType] = useState(null);
  const [windowTooSmall, setWindowTooSmall] = useState(false);

  // Check min width
  useEffect(() => {
    const check = () => setWindowTooSmall(window.innerWidth < 1280);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Calculate scores
  const scores = useMemo(() => calculateScore(cells, budget, totalBudget), [cells, budget, totalBudget]);

  // Handle region load
  const handleLoadRegion = useCallback((regionId) => {
    loadRegion(regionId);
    resetBudget();
  }, [loadRegion, resetBudget]);

  // Drag and drop handlers
  const handleDragStart = useCallback((type, pos) => {
    // Single click: toggle click-to-place mode
    // Hold+drag: traditional drag
    setActivePlacementType(prev => prev === type ? null : type);
    setIsDragging(true);
    startDrag(type);
    updateDrag(pos, null, null);

    const handleMove = (e) => {
      updateDrag({ x: e.clientX, y: e.clientY }, null, null);
    };
    const handleUp = () => {
      setIsDragging(false);
      endDrag();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [startDrag, updateDrag, endDrag]);

  // Handle cell click/drop — works for both drag-drop and click-to-place
  const handleCellDrop = useCallback((cell) => {
    const activeType = dragItem || activePlacementType;
    if (!activeType) return;
    const def = getInfraDefinition(activeType);
    if (!def) return;

    if (!canAfford(activeType)) return;
    if (cell.placedInfra) return;

    const result = def.canPlace(cell, cells);
    if (!result.valid) return;

    placeInfrastructure(cell.x, cell.y, activeType);
    spend(activeType);
  }, [dragItem, activePlacementType, canAfford, cells, placeInfrastructure, spend]);

  // Remove infrastructure
  const handleRemove = useCallback((x, y) => {
    const cell = cells.find(c => c.x === x && c.y === y);
    if (cell?.placedInfra) {
      refund(cell.placedInfra.type);
      removeInfrastructure(x, y);
    }
  }, [cells, refund, removeInfrastructure]);

  // Undo
  const handleUndo = useCallback(() => {
    const placed = cells.filter(c => c.placedInfra);
    if (placed.length > 0) {
      const last = placed[placed.length - 1];
      refund(last.placedInfra.type);
    }
    undoLastPlacement();
  }, [cells, refund, undoLastPlacement]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo]);

  if (windowTooSmall) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, background: 'var(--bg-primary)',
      }}>
        <Monitor size={48} color="var(--text-muted)" />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '0 20px' }}>
          GridScope requires a display width of at least 1280px
        </p>
      </div>
    );
  }

  // Bottom bar for scout mode
  const ScoutBottomBar = () => (
    <div style={{
      height: 56, width: '100%',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', flexShrink: 0,
    }}>
      {hoveredCell ? (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-secondary)' }}>
          X: {hoveredCell.x}  Y: {hoveredCell.y}  |  Elev: {hoveredCell.elevation}m  |  Terrain: {hoveredCell.terrain}  |{' '}
          <span style={{ color: '#FFD54F' }}>☀ {hoveredCell.solarIndex}</span>{' '}
          <span style={{ color: '#4FC3F7' }}>💨 {hoveredCell.windIndex}</span>{' '}
          <span style={{ color: '#EF5350' }}>🌊 {hoveredCell.floodRisk}</span>{' '}
          <span style={{ color: '#7E57C2' }}>🌡 {hoveredCell.temperature}°C</span>
        </span>
      ) : (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>
          Hover over a cell to inspect data
        </span>
      )}
    </div>
  );

  if (currentMode === 'landing') {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <LandingPage />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopNav />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {currentMode === 'scout' && (
          <>
            <ScoutPanel onLoadRegion={handleLoadRegion} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {cells.length === 0 ? (
                <EmptyState />
              ) : (
                <MapGrid
                  cells={cells}
                  overlays={activeOverlays}
                  compareMode={compareMode}
                  hoveredCell={hoveredCell}
                  onCellHover={setHoveredCell}
                  onCellLeave={() => setHoveredCell(null)}
                />
              )}
              <ScoutBottomBar />
            </div>
          </>
        )}

        {currentMode === 'build' && (
          <>
            <Toolbox budget={budget} totalBudget={totalBudget} onDragStart={handleDragStart} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <MapGrid
                cells={cells}
                overlays={activeOverlays}
                compareMode={compareMode}
                hoveredCell={hoveredCell}
                onCellHover={setHoveredCell}
                onCellLeave={() => setHoveredCell(null)}
                onCellDrop={handleCellDrop}
              />
              <PlacementLog log={placementLog} onUndo={handleUndo} />
            </div>
            <AnalysisDashboard
              scores={scores}
              cells={cells}
              onRemove={handleRemove}
              onNavigateBack={() => navigateTo('scout')}
            />
            {isDragging && <DragGhost type={dragItem} position={dragPosition} />}
          </>
        )}

        {currentMode === 'report' && (
          <>
            {/* Left: Map (45%) */}
            <div style={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <motion.div
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ width: '100%', height: '100%' }}
              >
                <MapGrid
                  cells={cells}
                  overlays={[]}
                  interactive={false}
                  style={{ padding: 20 }}
                />
              </motion.div>
              <div style={{ position: 'absolute', bottom: 20 }}>
                <GhostButton onClick={() => navigateTo('build')} style={{ width: 'auto' }}>
                  ← Back to Build
                </GhostButton>
              </div>
            </div>
            {/* Right: Report (55%) */}
            <ReportPanel scores={scores} cells={cells} budget={budget} totalBudget={totalBudget} />
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DragProvider>
        <AppContent />
      </DragProvider>
    </AppProvider>
  );
}
