// HexLink game types and interfaces

// Each hex has 6 edges, numbered 0-5 starting from top-right going clockwise
// Edge 0: top-right, Edge 1: right, Edge 2: bottom-right
// Edge 3: bottom-left, Edge 4: left, Edge 5: top-left
export type EdgeIndex = 0 | 1 | 2 | 3 | 4 | 5;

// A connection defines which edges are connected through the tile
export interface Connection {
  from: EdgeIndex;
  to: EdgeIndex;
}

// A tile type defines its connection pattern
export interface TileType {
  id: string;
  name: string;
  connections: Connection[];
  color: string;
}

// A placed tile on the board
export interface PlacedTile {
  typeId: string;
  rotation: number; // 0-5, each step is 60 degrees clockwise
  position: HexPosition;
}

// Axial coordinates for hex grid
export interface HexPosition {
  q: number; // column
  r: number; // row
}

// Available tile in hand
export interface HandTile {
  typeId: string;
  rotation: number;
}

// Game state
export interface GameState {
  board: Map<string, PlacedTile>;
  hand: HandTile[];
  score: number;
  gameOver: boolean;
  selectedHandIndex: number | null;
  connectedPaths: Set<string>; // Keys like "q,r:edge1-edge2" for connected paths
  longestChainPaths: Set<string>; // Paths that are part of the longest chain
}

// Get the opposite edge (the edge that would connect when tiles are adjacent)
export function getOppositeEdge(edge: EdgeIndex): EdgeIndex {
  return ((edge + 3) % 6) as EdgeIndex;
}

// Get the actual edge after applying rotation
export function getRotatedEdge(edge: EdgeIndex, rotation: number): EdgeIndex {
  return ((edge + rotation) % 6) as EdgeIndex;
}

// Get the original edge before rotation was applied
export function getOriginalEdge(
  rotatedEdge: EdgeIndex,
  rotation: number
): EdgeIndex {
  return ((((rotatedEdge - rotation) % 6) + 6) % 6) as EdgeIndex;
}

// Convert hex position to a string key for Map
export function positionToKey(pos: HexPosition): string {
  return `${pos.q},${pos.r}`;
}

// Parse a position key back to HexPosition
export function keyToPosition(key: string): HexPosition {
  const parts = key.split(",").map(Number);
  return { q: parts[0] ?? 0, r: parts[1] ?? 0 };
}

// Get neighbor position in a given direction (edge)
// For flat-top hexes, edges are numbered 0-5 clockwise starting from top-right:
// Edge 0: top-right, Edge 1: right, Edge 2: bottom-right
// Edge 3: bottom-left, Edge 4: left, Edge 5: top-left
export function getNeighbor(pos: HexPosition, edge: EdgeIndex): HexPosition {
  // Axial coordinate offsets for flat-top hex edges
  const offsets: Record<EdgeIndex, [number, number]> = {
    0: [1, -1], // top-right (q+1, r-1)
    1: [1, 0], // right (q+1, r)
    2: [0, 1], // bottom-right (q, r+1)
    3: [-1, 1], // bottom-left (q-1, r+1)
    4: [-1, 0], // left (q-1, r)
    5: [0, -1], // top-left (q, r-1)
  };
  const [dq, dr] = offsets[edge];
  return { q: pos.q + dq, r: pos.r + dr };
}

// Get all 6 neighbors of a position
export function getAllNeighbors(pos: HexPosition): HexPosition[] {
  return [0, 1, 2, 3, 4, 5].map((edge) => getNeighbor(pos, edge as EdgeIndex));
}

// Check if a position is within the board (3 rings around center)
export function isValidPosition(pos: HexPosition): boolean {
  // For axial coordinates, distance from center is max of |q|, |r|, |q+r|
  const distance = Math.max(
    Math.abs(pos.q),
    Math.abs(pos.r),
    Math.abs(pos.q + pos.r)
  );
  return distance <= 3;
}

// Get all valid positions on the board
export function getAllBoardPositions(): HexPosition[] {
  const positions: HexPosition[] = [];
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      if (isValidPosition({ q, r })) {
        positions.push({ q, r });
      }
    }
  }
  return positions;
}

// Get ring number (0 = center, 1-3 = rings)
export function getRing(pos: HexPosition): number {
  return Math.max(Math.abs(pos.q), Math.abs(pos.r), Math.abs(pos.q + pos.r));
}
