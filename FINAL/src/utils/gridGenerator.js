function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

const GRID_COLS = 24;
const GRID_ROWS = 16;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function generateAtacama(rand) {
  const cells = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      let terrain = 'land';
      let elevation = 30 + Math.floor(rand() * 30);

      // Mountains in rows 0-2, columns 0-6
      if (y <= 2 && x <= 6) {
        terrain = 'mountain';
        elevation = 80 + Math.floor(rand() * 20);
      }

      // Diagonal river from ~(3,2) to ~(8,14)
      const riverX = 3 + Math.round((x / GRID_COLS) * 5);
      if (Math.abs(y - (2 + (x - 3) * (12 / 5))) < 1.2 && x >= 3 && x <= 8) {
        terrain = 'water';
        elevation = 3;
      }
      // Wider river path
      const ry = 2 + ((x - 3) * 12) / 5;
      if (x >= 3 && x <= 9 && Math.abs(y - ry) < 1.5) {
        terrain = 'water';
        elevation = 3;
      }

      // Forest near river
      if (terrain === 'land' && x >= 2 && x <= 10) {
        const dist = Math.abs(y - (2 + ((x - 3) * 12) / 5));
        if (dist >= 1.5 && dist < 3 && rand() < 0.4) {
          terrain = 'forest';
          elevation = 25 + Math.floor(rand() * 15);
        }
      }

      // Urban cluster at (12,8)-(14,10)
      if (x >= 12 && x <= 14 && y >= 8 && y <= 10) {
        terrain = 'urban';
        elevation = 30 + Math.floor(rand() * 15);
      }

      // Solar: high 75-95
      let solarIndex = 75 + Math.floor(rand() * 20);
      if (terrain === 'forest') solarIndex -= 20;
      if (terrain === 'mountain') solarIndex -= 10;
      // Mountain shadow (cells south of mountains)
      if (y > 2 && y <= 5 && x <= 6) solarIndex -= 30;

      // Wind: low 15-35
      let windIndex = 15 + Math.floor(rand() * 20);
      if (terrain === 'mountain' || elevation > 60) windIndex += 15;
      if (terrain === 'urban') windIndex -= 20;

      // Flood
      let floodRisk = 5;
      if (terrain === 'water') floodRisk = 0;
      else {
        // Adjacent to water check done after generation
        if (elevation < 20) floodRisk += 60;
        if (terrain === 'mountain') floodRisk -= 30;
      }

      // Temperature
      let temperature = 28 + Math.floor(rand() * 10);
      temperature -= Math.floor(elevation / 20) * 5;

      const isRestricted = terrain === 'mountain' || (terrain === 'forest' && rand() < 0.08);

      cells.push({
        x, y, terrain, elevation,
        solarIndex: clamp(solarIndex + Math.floor((rand() - 0.5) * 10), 0, 100),
        windIndex: clamp(windIndex + Math.floor((rand() - 0.5) * 10), 0, 100),
        floodRisk: clamp(floodRisk, 0, 100),
        temperature: clamp(temperature, -10, 50),
        isRestricted,
        placedInfra: null,
      });
    }
  }
  // Flood adjacency pass
  addFloodAdjacency(cells);
  return cells;
}

function generatePatagonia(rand) {
  const cells = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      let terrain = 'land';
      let elevation = 25 + Math.floor(rand() * 30);

      // Ocean: columns 18-23
      if (x >= 18) {
        terrain = 'water';
        elevation = 3;
      }

      // Mountains: columns 0-2
      if (x <= 2) {
        terrain = 'mountain';
        elevation = 80 + Math.floor(rand() * 20);
      }

      // Forest in lower-left
      if (x >= 3 && x <= 8 && y >= 10 && terrain === 'land' && rand() < 0.5) {
        terrain = 'forest';
        elevation = 20 + Math.floor(rand() * 20);
      }

      // Urban cluster at (10,6)-(12,8)
      if (x >= 10 && x <= 12 && y >= 6 && y <= 8) {
        terrain = 'urban';
        elevation = 30 + Math.floor(rand() * 10);
      }

      let solarIndex = 30 + Math.floor(rand() * 25);
      let windIndex = 65 + Math.floor(rand() * 25);
      let floodRisk = 15;
      // Coastal flood
      if (x >= 16 && x < 18) floodRisk += 70;
      if (terrain === 'water') floodRisk = 0;
      let temperature = 2 + Math.floor(rand() * 10);

      const isRestricted = terrain === 'mountain' || (terrain === 'forest' && rand() < 0.08);

      cells.push({
        x, y, terrain, elevation,
        solarIndex: clamp(solarIndex, 0, 100),
        windIndex: clamp(windIndex, 0, 100),
        floodRisk: clamp(floodRisk, 0, 100),
        temperature: clamp(temperature, -10, 50),
        isRestricted,
        placedInfra: null,
      });
    }
  }
  addFloodAdjacency(cells);
  return cells;
}

function generateCentralValley(rand) {
  const cells = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      let terrain = 'land';
      let elevation = 25 + Math.floor(rand() * 25);

      // River rows 7-8
      if (y === 7 || y === 8) {
        terrain = 'water';
        elevation = 3;
      }

      // Forest in corners (4x4 blocks)
      if ((x < 4 && y < 4) || (x < 4 && y >= 12) ||
          (x >= 20 && y < 4) || (x >= 20 && y >= 12)) {
        if (terrain !== 'water') {
          terrain = 'forest';
          elevation = 20 + Math.floor(rand() * 20);
        }
      }

      // Large urban area (10,5)-(15,11) but not river
      if (x >= 10 && x <= 15 && y >= 5 && y <= 11 && terrain !== 'water') {
        terrain = 'urban';
        elevation = 30 + Math.floor(rand() * 15);
      }

      let solarIndex = 50 + Math.floor(rand() * 20);
      let windIndex = 30 + Math.floor(rand() * 20);
      let floodRisk = 10;
      if ((y === 6 || y === 9) && terrain !== 'water') floodRisk += 50;
      if (terrain === 'water') floodRisk = 0;
      let temperature = 15 + Math.floor(rand() * 10);

      const isRestricted = (terrain === 'forest' && rand() < 0.08);

      cells.push({
        x, y, terrain, elevation,
        solarIndex: clamp(solarIndex, 0, 100),
        windIndex: clamp(windIndex, 0, 100),
        floodRisk: clamp(floodRisk, 0, 100),
        temperature: clamp(temperature, -10, 50),
        isRestricted,
        placedInfra: null,
      });
    }
  }
  addFloodAdjacency(cells);
  return cells;
}

function addFloodAdjacency(cells) {
  const getCell = (x, y) => cells.find(c => c.x === x && c.y === y);
  for (const cell of cells) {
    if (cell.terrain === 'water') continue;
    const neighbors = [
      getCell(cell.x - 1, cell.y),
      getCell(cell.x + 1, cell.y),
      getCell(cell.x, cell.y - 1),
      getCell(cell.x, cell.y + 1),
    ];
    if (neighbors.some(n => n && n.terrain === 'water')) {
      cell.floodRisk = clamp(cell.floodRisk + 40, 0, 100);
    }
  }
}

export function generateGrid(regionId) {
  const rand = seededRandom(hashString(regionId));
  switch (regionId) {
    case 'atacama': return generateAtacama(rand);
    case 'patagonia': return generatePatagonia(rand);
    case 'central-valley': return generateCentralValley(rand);
    default: return generateAtacama(rand);
  }
}

export { GRID_COLS, GRID_ROWS, clamp };
