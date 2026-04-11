export const INFRASTRUCTURE = [
  {
    type: 'solar',
    name: 'Solar Farm',
    description: 'Photovoltaic array · 50MW',
    cost: 120,
    themeColor: '#FFD54F',
    glowColor: 'rgba(255, 213, 79, 0.3)',
    canPlace: (cell) => {
      if (cell.terrain === 'water') return { valid: false, reason: 'Cannot place on water' };
      if (cell.terrain === 'mountain') return { valid: false, reason: 'Cannot place on mountain' };
      if (cell.isRestricted) return { valid: false, reason: 'Protected area — Construction prohibited' };
      if (cell.solarIndex < 33) return { valid: true, suboptimal: true, reason: `Low solar index (${cell.solarIndex}) — array will operate at ${cell.solarIndex}% efficiency` };
      return { valid: true };
    },
    getEfficiency: (cell) => {
      let eff = cell.solarIndex;
      if (cell.temperature > 35) eff *= 0.85;
      return Math.round(eff);
    },
  },
  {
    type: 'wind',
    name: 'Wind Turbine',
    description: 'Turbine cluster · 30MW',
    cost: 90,
    themeColor: '#4FC3F7',
    glowColor: 'rgba(79, 195, 247, 0.3)',
    canPlace: (cell) => {
      if (cell.terrain === 'water') return { valid: false, reason: 'Cannot place on water' };
      if (cell.terrain === 'urban') return { valid: false, reason: 'Cannot place in urban area' };
      if (cell.isRestricted) return { valid: false, reason: 'Protected area — Construction prohibited' };
      if (cell.windIndex < 25) return { valid: true, suboptimal: true, reason: `Low wind index (${cell.windIndex}) — expected low output` };
      return { valid: true };
    },
    getEfficiency: (cell) => {
      let eff = cell.windIndex;
      if (cell.elevation > 60) eff = Math.min(100, eff + 10);
      return Math.round(eff);
    },
  },
  {
    type: 'substation',
    name: 'Substation',
    description: 'Power distribution hub',
    cost: 60,
    themeColor: '#00E676',
    glowColor: 'rgba(0, 230, 118, 0.25)',
    canPlace: (cell) => {
      if (cell.terrain === 'water') return { valid: false, reason: 'Cannot place on water' };
      if (cell.isRestricted) return { valid: false, reason: 'Protected area — Construction prohibited' };
      return { valid: true };
    },
    getEfficiency: () => 100,
  },
  {
    type: 'transmission',
    name: 'Transmission Line',
    description: 'High-voltage link',
    cost: 30,
    themeColor: 'rgba(0, 230, 118, 0.6)',
    glowColor: 'rgba(0, 230, 118, 0.15)',
    canPlace: (cell) => {
      if (cell.terrain === 'mountain') return { valid: false, reason: 'Cannot place on mountain' };
      if (cell.isRestricted) return { valid: false, reason: 'Protected area — Construction prohibited' };
      return { valid: true };
    },
    getEfficiency: () => 100,
  },
  {
    type: 'floodBarrier',
    name: 'Flood Barrier',
    description: 'Flood defense wall',
    cost: 80,
    themeColor: '#66BB6A',
    glowColor: 'rgba(102, 187, 106, 0.25)',
    canPlace: (cell, cells) => {
      if (cell.isRestricted) return { valid: false, reason: 'Protected area — Construction prohibited' };
      if (cell.terrain === 'water') return { valid: false, reason: 'Cannot place on water' };
      const hasAdjacentWater = cells && cells.some(c =>
        c.terrain === 'water' &&
        Math.abs(c.x - cell.x) + Math.abs(c.y - cell.y) === 1
      );
      if (!hasAdjacentWater) return { valid: false, reason: 'Must be adjacent to water' };
      return { valid: true };
    },
    getEfficiency: () => 100,
  },
  {
    type: 'weatherStation',
    name: 'Weather Station',
    description: 'Environmental monitor',
    cost: 40,
    themeColor: '#448AFF',
    glowColor: 'rgba(68, 138, 255, 0.25)',
    canPlace: (cell) => {
      if (cell.terrain === 'water') return { valid: false, reason: 'Cannot place on water' };
      if (cell.isRestricted) return { valid: false, reason: 'Protected area — Construction prohibited' };
      return { valid: true };
    },
    getEfficiency: () => 100,
  },
  {
    type: 'battery',
    name: 'Battery Storage',
    description: 'Grid-scale battery · 200MWh',
    cost: 150,
    themeColor: '#AB47BC',
    glowColor: 'rgba(171, 71, 188, 0.25)',
    canPlace: (cell, cells) => {
      if (cell.terrain === 'water') return { valid: false, reason: 'Cannot place on water' };
      if (cell.terrain === 'mountain') return { valid: false, reason: 'Cannot place on mountain' };
      if (cell.isRestricted) return { valid: false, reason: 'Protected area — Construction prohibited' };
      // Must be within 4 cells of a substation
      if (cells) {
        const hasNearSubstation = cells.some(c =>
          c.placedInfra && c.placedInfra.type === 'substation' &&
          (Math.abs(c.x - cell.x) + Math.abs(c.y - cell.y)) <= 4
        );
        if (!hasNearSubstation) return { valid: false, reason: 'Must be within 4 cells of a substation' };
      }
      return { valid: true };
    },
    getEfficiency: () => 100,
  },
];

export function getInfraDefinition(type) {
  return INFRASTRUCTURE.find(i => i.type === type);
}
