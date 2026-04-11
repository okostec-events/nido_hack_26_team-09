import { useCallback } from 'react';
import { INFRASTRUCTURE } from '../../data/infrastructure';
import GlassPanel from '../shared/GlassPanel';
import InfraTile from './InfraTile';

export default function Toolbox({ budget, totalBudget, onDragStart }) {
  const pct = budget / totalBudget;
  const budgetColor = pct > 0.6 ? '#00E676' : pct > 0.3 ? '#FFC107' : '#FF1744';

  return (
    <GlassPanel style={{
      width: 300,
      height: '100%',
      padding: 20,
      overflowY: 'auto',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      borderRadius: 0,
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      {/* Budget */}
      <div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: 2,
          marginBottom: 4,
        }}>
          BUDGET
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          color: budgetColor,
        }}>
          {budget} / {totalBudget}
        </div>
        <div style={{
          width: '100%',
          height: 4,
          borderRadius: 2,
          background: 'var(--bg-surface)',
          marginTop: 6,
        }}>
          <div style={{
            width: `${pct * 100}%`,
            height: '100%',
            borderRadius: 2,
            background: budgetColor,
            transition: 'width 300ms, background 300ms',
          }} />
        </div>
      </div>

      {/* Infrastructure header */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        color: 'var(--text-muted)',
        letterSpacing: 3,
        marginTop: 16,
        marginBottom: 4,
      }}>
        INFRASTRUCTURE
      </div>

      {/* Infrastructure tiles */}
      {INFRASTRUCTURE.map(infra => (
        <InfraTile
          key={infra.type}
          infra={infra}
          canAfford={budget >= infra.cost}
          onDragStart={onDragStart}
        />
      ))}
    </GlassPanel>
  );
}
