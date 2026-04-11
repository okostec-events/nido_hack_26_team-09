export function calculateScore(cells, budget, totalBudget) {
  const placed = cells.filter(c => c.placedInfra);
  if (placed.length === 0) return { overall: 0, solarEff: 0, windEff: 0, floodSafety: 100, connectivity: 0, budgetEff: 100, totalMW: 0, solarMW: 0, windMW: 0 };

  const solarFarms = placed.filter(c => c.placedInfra.type === 'solar');
  const windTurbines = placed.filter(c => c.placedInfra.type === 'wind');

  // Average solar efficiency
  const avgSolarEff = solarFarms.length > 0
    ? solarFarms.reduce((sum, c) => sum + c.placedInfra.efficiency, 0) / solarFarms.length
    : 50; // neutral if none placed

  // Average wind efficiency
  const avgWindEff = windTurbines.length > 0
    ? windTurbines.reduce((sum, c) => sum + c.placedInfra.efficiency, 0) / windTurbines.length
    : 50;

  // Flood safety: 100 - avg flood risk of infrastructure cells
  const avgFloodRisk = placed.reduce((sum, c) => sum + c.floodRisk, 0) / placed.length;
  const floodSafety = 100 - avgFloodRisk;

  // Grid connectivity
  const connected = placed.filter(c => c.placedInfra.isConnected).length;
  const connectivity = (connected / placed.length) * 100;

  // Budget efficiency
  const budgetEff = (budget / totalBudget) * 100;

  // Energy output
  const solarMW = solarFarms.reduce((sum, c) => sum + (50 * c.placedInfra.efficiency / 100), 0);
  const windMW = windTurbines.reduce((sum, c) => sum + (30 * c.placedInfra.efficiency / 100), 0);
  const totalMW = solarMW + windMW;

  const overall = Math.round(
    avgSolarEff * 0.25 +
    avgWindEff * 0.25 +
    floodSafety * 0.20 +
    connectivity * 0.20 +
    budgetEff * 0.10
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    solarEff: Math.round(avgSolarEff),
    windEff: Math.round(avgWindEff),
    floodSafety: Math.round(floodSafety),
    connectivity: Math.round(connectivity),
    budgetEff: Math.round(budgetEff),
    totalMW: Math.round(totalMW * 10) / 10,
    solarMW: Math.round(solarMW * 10) / 10,
    windMW: Math.round(windMW * 10) / 10,
  };
}

export function getClassification(score) {
  if (score >= 76) return 'Excellent Site';
  if (score >= 51) return 'Strong Site';
  if (score >= 26) return 'Moderate Site';
  return 'Poor Site';
}

export function getScoreColor(score) {
  if (score >= 60) return '#00E676';
  if (score >= 30) return '#FFC107';
  return '#FF1744';
}
