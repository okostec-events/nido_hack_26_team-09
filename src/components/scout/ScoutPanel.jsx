import { useApp } from '../../contexts/AppContext';
import { REGIONS } from '../../data/regions';
import GlassPanel from '../shared/GlassPanel';
import { PrimaryButton } from '../shared/Button';
import RegionCard from './RegionCard';
import DataLayerToggles from './DataLayerToggles';

export default function ScoutPanel({ onLoadRegion }) {
  const { selectedRegion, setSelectedRegion, navigateTo } = useApp();

  const handleSelect = (region) => {
    setSelectedRegion(region);
    onLoadRegion(region.id);
  };

  return (
    <GlassPanel style={{
      width: 300,
      height: '100%',
      padding: 20,
      overflowY: 'auto',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      borderRadius: 0,
    }}>
      {/* Section header */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        color: 'var(--text-muted)',
        letterSpacing: 3,
        marginBottom: 4,
      }}>
        SELECT REGION
      </div>

      {/* Region cards */}
      {REGIONS.map(region => (
        <RegionCard
          key={region.id}
          region={region}
          isSelected={selectedRegion?.id === region.id}
          onSelect={() => handleSelect(region)}
        />
      ))}

      {/* Separator */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '12px 0' }} />

      {/* Data layer toggles */}
      <DataLayerToggles />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Proceed button */}
      <PrimaryButton
        disabled={!selectedRegion}
        onClick={() => navigateTo('build')}
      >
        Begin Site Planning →
      </PrimaryButton>
    </GlassPanel>
  );
}
