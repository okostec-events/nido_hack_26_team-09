import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { getInfraDefinition } from '../../data/infrastructure';
import { getClassification } from '../../utils/scoring';
import Toast from '../shared/Toast';

export default function ReportPanel({ scores, cells, budget, totalBudget }) {
  const { selectedRegion } = useApp();
  const [showToast, setShowToast] = useState(false);
  const placed = cells.filter(c => c.placedInfra);
  const classification = getClassification(scores.overall);

  const solarCount = placed.filter(c => c.placedInfra.type === 'solar').length;
  const windCount = placed.filter(c => c.placedInfra.type === 'wind').length;
  const disconnected = placed.filter(c => !c.placedInfra.isConnected);
  const highFlood = placed.filter(c => c.floodRisk > 60);
  const hotSolar = placed.filter(c => c.placedInfra.type === 'solar' && c.temperature > 35);
  const lowWind = placed.filter(c => c.placedInfra.type === 'wind' && c.windIndex < 25);
  const hasWeather = placed.some(c => c.placedInfra.type === 'weatherStation');
  const budgetPct = Math.round((budget / totalBudget) * 100);

  const totalCost = totalBudget - budget;

  // Environmental averages
  const avgSolar = cells.length > 0 ? Math.round(cells.reduce((s, c) => s + c.solarIndex, 0) / cells.length) : 0;
  const avgWind = cells.length > 0 ? Math.round(cells.reduce((s, c) => s + c.windIndex, 0) / cells.length) : 0;
  const avgFlood = cells.length > 0 ? Math.round(cells.reduce((s, c) => s + c.floodRisk, 0) / cells.length) : 0;
  const temps = cells.map(c => c.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  // Build risk flags
  const flags = [];
  highFlood.forEach(c => {
    const def = getInfraDefinition(c.placedInfra.type);
    flags.push({ severity: 'critical', text: `⚠ ${def.name} at (${c.x},${c.y}) is in a high flood risk zone (risk index: ${c.floodRisk})` });
  });
  disconnected.forEach(c => {
    const def = getInfraDefinition(c.placedInfra.type);
    flags.push({ severity: 'critical', text: `⚠ ${def.name} at (${c.x},${c.y}) is not connected to the grid` });
  });
  hotSolar.forEach(c => {
    flags.push({ severity: 'advisory', text: `⚡ Solar Farm at (${c.x},${c.y}) faces thermal efficiency loss (-15%) due to high temperatures` });
  });
  lowWind.forEach(c => {
    flags.push({ severity: 'advisory', text: `💨 Wind Turbine at (${c.x},${c.y}) is in a low wind zone (index: ${c.windIndex}) — expected low output` });
  });
  if (!hasWeather) {
    flags.push({ severity: 'info', text: '📡 No field monitoring stations deployed — expert validation recommended' });
  }
  if (budgetPct > 60) {
    flags.push({ severity: 'info', text: `💰 Significant budget remaining (${budgetPct}%) — consider additional infrastructure` });
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.8 + i * 0.3, duration: 0.5 },
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      style={{
        flex: 1,
        overflowY: 'auto',
        background: '#FAFAFA',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        padding: '32px 40px',
        position: 'relative',
        color: '#374151',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'linear-gradient(90deg, #00E676, #448AFF, #AB47BC)',
        borderTopLeftRadius: 12,
      }} />

      <Toast message="Export functionality available in full release" visible={showToast} onHide={() => setShowToast(false)} />

      {/* Header */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
        <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
          GRIDSCOPE SITE FEASIBILITY REPORT
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6B7280', marginTop: 8 }}>
          Region: {selectedRegion?.name || 'Unknown'} | Date: April 11, 2026 | Classification: {classification}
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '16px 0 24px' }} />
      </motion.div>

      {/* Section 1: Executive Summary */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
        <SectionTitle>1. Executive Summary</SectionTitle>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#374151', lineHeight: 1.8, marginBottom: 24 }}>
          The proposed site in {selectedRegion?.name || 'the selected region'} achieves a feasibility score of {scores.overall}/100,
          classified as '{classification}'. The configuration features {solarCount} solar installation(s) and {windCount} wind
          turbine(s) with a combined renewable capacity of {scores.totalMW} MW.
          {highFlood.length > 0 && ` Flood mitigation measures are recommended for ${highFlood.length} exposed installation(s).`}
          {disconnected.length > 0 && ` Grid connectivity gaps exist — ${disconnected.length} installation(s) remain unconnected to distribution infrastructure.`}
          {highFlood.length === 0 && disconnected.length === 0 && ' All installations are connected and positioned in low-risk zones.'}
        </p>
      </motion.div>

      {/* Section 2: Environmental Analysis */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
        <SectionTitle>2. Environmental Analysis</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <EnvCard title="Solar Suitability" value={avgSolar} max={100} color="#FFD54F" />
          <EnvCard title="Wind Suitability" value={avgWind} max={100} color="#4FC3F7" />
          <EnvCard title="Flood Risk" value={avgFlood} max={100} color="#EF5350" reverse />
          <EnvCard title="Thermal Profile" value={`${minTemp}°C / ${maxTemp}°C`} barValue={(maxTemp / 50) * 100} color="#7E57C2" />
        </div>
      </motion.div>

      {/* Section 3: Infrastructure Inventory */}
      <motion.div custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
        <SectionTitle>3. Infrastructure Inventory</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
              {['Type', 'Location', 'Efficiency', 'Status', 'Cost'].map(h => (
                <th key={h} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '8px 12px',
                  textAlign: 'left',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {placed.map((c, i) => {
              const def = getInfraDefinition(c.placedInfra.type);
              return (
                <tr key={c.placedInfra.id} style={{ background: i % 2 === 0 ? 'white' : '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '8px 12px', fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ color: def.themeColor, marginRight: 6 }}>●</span>
                    {def.name}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    ({c.x}, {c.y})
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {c.placedInfra.type === 'solar' || c.placedInfra.type === 'wind' ? `${c.placedInfra.efficiency}%` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {c.placedInfra.isConnected
                      ? <span style={{ color: '#16a34a' }}>Connected ✓</span>
                      : <span style={{ color: '#FF1744' }}>Disconnected ✗</span>
                    }
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {def.cost}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #E5E7EB' }}>
              <td colSpan={5} style={{
                padding: '10px 12px',
                textAlign: 'right',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
              }}>
                Total Cost: {totalCost} / {totalBudget}
              </td>
            </tr>
          </tfoot>
        </table>
      </motion.div>

      {/* Section 4: Risk Flags */}
      <motion.div custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
        <SectionTitle>4. Risk Flags</SectionTitle>
        {flags.length === 0 ? (
          <FlagCard severity="success" text="✅ No risk flags detected. All infrastructure is optimally placed." />
        ) : (
          flags.map((f, i) => <FlagCard key={i} severity={f.severity} text={f.text} />)
        )}
      </motion.div>

      {/* Section 5: Expert Field Studies */}
      <motion.div custom={5} initial="hidden" animate="visible" variants={sectionVariants} style={{ marginTop: 24 }}>
        <SectionTitle>5. Expert Field Studies</SectionTitle>
        <div style={{
          border: '2px dashed #D1D5DB',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
          transition: 'all 200ms',
          cursor: 'default',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#9CA3AF';
            e.currentTarget.style.background = '#F9FAFB';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#D1D5DB';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9CA3AF' }}>
            Upload field study data (PDF, CSV)
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#D1D5DB', marginTop: 4 }}>
            Field studies from deployed Weather Stations can be cross-referenced here
          </div>
        </div>
      </motion.div>

      {/* Export button */}
      <motion.div custom={6} initial="hidden" animate="visible" variants={sectionVariants} style={{ marginTop: 24, marginBottom: 32 }}>
        <button
          onClick={() => setShowToast(true)}
          style={{
            background: 'transparent',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            padding: '10px 20px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: '#374151',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { e.target.style.background = '#F3F4F6'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; }}
        >
          📄 Export as PDF
        </button>
      </motion.div>
    </motion.div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 14,
      fontWeight: 700,
      color: '#1A1A2E',
      marginBottom: 12,
      marginTop: 8,
    }}>
      {children}
    </h2>
  );
}

function EnvCard({ title, value, max = 100, color, reverse = false, barValue }) {
  const numericValue = typeof value === 'number' ? value : 0;
  const pct = barValue !== undefined ? barValue : (numericValue / max) * 100;

  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      padding: 16,
    }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
        {typeof value === 'number' ? `${value} / ${max}` : value}
      </div>
      <div style={{ width: '100%', height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          float: reverse ? 'right' : 'left',
          transition: 'width 500ms',
        }} />
      </div>
    </div>
  );
}

function FlagCard({ severity, text }) {
  const colors = {
    critical: { bg: '#FEF2F2', border: '#FF1744' },
    advisory: { bg: '#FFFBEB', border: '#FFC107' },
    info: { bg: '#EFF6FF', border: '#448AFF' },
    success: { bg: '#F0FDF4', border: '#00E676' },
  };
  const c = colors[severity] || colors.info;

  return (
    <div style={{
      borderLeft: `3px solid ${c.border}`,
      background: c.bg,
      borderRadius: '0 8px 8px 0',
      padding: '10px 14px',
      marginBottom: 8,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13,
      color: '#374151',
    }}>
      {text}
    </div>
  );
}
