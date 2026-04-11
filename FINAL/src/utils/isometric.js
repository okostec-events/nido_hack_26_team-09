export const TILE_WIDTH = 52;
export const TILE_HEIGHT = 26;
export const HEIGHT_SCALE = 0.22;

export function gridToScreen(gridX, gridY, elevation = 0) {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2);
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2) - (elevation * HEIGHT_SCALE);
  return { screenX, screenY };
}

export function screenToGrid(screenX, screenY) {
  const gx = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const gy = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;
  return {
    gridX: Math.round(gx),
    gridY: Math.round(gy),
  };
}

// Top face diamond points (relative to tile screen position)
export function getTopFacePoints(elevation) {
  const h = elevation * HEIGHT_SCALE;
  return [
    { x: 0, y: -h },                           // top
    { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 - h }, // right
    { x: 0, y: TILE_HEIGHT - h },               // bottom
    { x: -TILE_WIDTH / 2, y: TILE_HEIGHT / 2 - h }, // left
  ];
}

// Left face (south-west side)
export function getLeftFacePoints(elevation) {
  const h = elevation * HEIGHT_SCALE;
  return [
    { x: -TILE_WIDTH / 2, y: TILE_HEIGHT / 2 - h }, // top-left
    { x: 0, y: TILE_HEIGHT - h },                     // top-right
    { x: 0, y: TILE_HEIGHT },                          // bottom-right
    { x: -TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },       // bottom-left
  ];
}

// Right face (south-east side)
export function getRightFacePoints(elevation) {
  const h = elevation * HEIGHT_SCALE;
  return [
    { x: 0, y: TILE_HEIGHT - h },                     // top-left
    { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 - h },   // top-right
    { x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 },        // bottom-right
    { x: 0, y: TILE_HEIGHT },                          // bottom-left
  ];
}

export function pointsToSvg(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

export function getViewBox(cols, rows) {
  const maxElev = 100;
  // Calculate bounds
  const topLeft = gridToScreen(0, 0, maxElev);
  const topRight = gridToScreen(cols - 1, 0, maxElev);
  const bottomLeft = gridToScreen(0, rows - 1, 0);
  const bottomRight = gridToScreen(cols - 1, rows - 1, 0);

  const minX = Math.min(topLeft.screenX, bottomLeft.screenX) - TILE_WIDTH;
  const maxX = Math.max(topRight.screenX, bottomRight.screenX) + TILE_WIDTH;
  const minY = Math.min(topLeft.screenY, topRight.screenY) - TILE_HEIGHT * 3;
  const maxY = Math.max(bottomLeft.screenY, bottomRight.screenY) + TILE_HEIGHT * 2;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
