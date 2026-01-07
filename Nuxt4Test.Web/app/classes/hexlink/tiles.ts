// Tile type definitions for HexLink game
import type { TileType, EdgeIndex } from "./types";

// Helper to create a tile type
function createTile(
  id: string,
  name: string,
  connections: [EdgeIndex, EdgeIndex][],
  color: string
): TileType {
  return {
    id,
    name,
    connections: connections.map(([from, to]) => ({ from, to })),
    color,
  };
}

// All available tile types
export const TILE_TYPES: TileType[] = [
  // Straight through tiles (opposite edges)
  createTile("straight-0", "Straight A", [[0, 3]], "#4CAF50"),
  createTile("straight-1", "Straight B", [[1, 4]], "#4CAF50"),
  createTile("straight-2", "Straight C", [[2, 5]], "#4CAF50"),

  // Curve tiles (adjacent edges, 60 degree turn)
  createTile("curve-60-a", "Curve 60° A", [[0, 1]], "#2196F3"),
  createTile("curve-60-b", "Curve 60° B", [[1, 2]], "#2196F3"),
  createTile("curve-60-c", "Curve 60° C", [[2, 3]], "#2196F3"),

  // Curve tiles (skip one edge, 120 degree turn)
  createTile("curve-120-a", "Curve 120° A", [[0, 2]], "#9C27B0"),
  createTile("curve-120-b", "Curve 120° B", [[1, 3]], "#9C27B0"),
  createTile("curve-120-c", "Curve 120° C", [[2, 4]], "#9C27B0"),

  // Y-junction (3 connections meeting in center)
  createTile(
    "y-junction-a",
    "Y Junction A",
    [
      [0, 2],
      [2, 4],
      [4, 0],
    ],
    "#FF9800"
  ),
  createTile(
    "y-junction-b",
    "Y Junction B",
    [
      [1, 3],
      [3, 5],
      [5, 1],
    ],
    "#FF9800"
  ),

  // T-junction (3 edges, one straight through and one branch)
  createTile(
    "t-junction-a",
    "T Junction A",
    [
      [0, 3],
      [0, 1],
    ],
    "#E91E63"
  ),
  createTile(
    "t-junction-b",
    "T Junction B",
    [
      [0, 3],
      [3, 4],
    ],
    "#E91E63"
  ),
  createTile(
    "t-junction-c",
    "T Junction C",
    [
      [1, 4],
      [1, 2],
    ],
    "#E91E63"
  ),

  // Cross (4 connections, two straight lines crossing)
  createTile(
    "cross-a",
    "Cross A",
    [
      [0, 3],
      [1, 4],
    ],
    "#F44336"
  ),
  createTile(
    "cross-b",
    "Cross B",
    [
      [0, 3],
      [2, 5],
    ],
    "#F44336"
  ),
  createTile(
    "cross-c",
    "Cross C",
    [
      [1, 4],
      [2, 5],
    ],
    "#F44336"
  ),

  // Double curve (two separate curved paths)
  createTile(
    "double-curve-a",
    "Double Curve A",
    [
      [0, 1],
      [3, 4],
    ],
    "#00BCD4"
  ),
  createTile(
    "double-curve-b",
    "Double Curve B",
    [
      [1, 2],
      [4, 5],
    ],
    "#00BCD4"
  ),
  createTile(
    "double-curve-c",
    "Double Curve C",
    [
      [0, 2],
      [3, 5],
    ],
    "#00BCD4"
  ),

  // Hub (all 6 edges connected to center)
  createTile(
    "hub",
    "Hub",
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
    "#FFD700"
  ),

  // Center starter tile (single connection point)
  createTile("center", "Center", [[0, 0]], "#FFD700"),

  // Parallel (two straight lines)
  createTile(
    "parallel-a",
    "Parallel A",
    [
      [0, 3],
      [1, 4],
    ],
    "#FF6B6B"
  ),
  createTile(
    "parallel-b",
    "Parallel B",
    [
      [1, 4],
      [2, 5],
    ],
    "#FF6B6B"
  ),
];

// Get a tile type by ID
export function getTileType(id: string): TileType | undefined {
  return TILE_TYPES.find((t) => t.id === id);
}

// Get a random tile type
export function getRandomTileType(): TileType {
  const tile = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
  return tile ?? TILE_TYPES[0]!;
}

// Get edges that have connections on a tile (considering rotation)
export function getConnectedEdges(
  tile: TileType,
  rotation: number
): Set<EdgeIndex> {
  const edges = new Set<EdgeIndex>();
  for (const conn of tile.connections) {
    const fromRotated = ((conn.from + rotation) % 6) as EdgeIndex;
    const toRotated = ((conn.to + rotation) % 6) as EdgeIndex;
    edges.add(fromRotated);
    if (conn.from !== conn.to) {
      edges.add(toRotated);
    }
  }
  return edges;
}

// Check if an edge has a connection (considering rotation)
export function hasConnectionOnEdge(
  tile: TileType,
  rotation: number,
  edge: EdgeIndex
): boolean {
  return getConnectedEdges(tile, rotation).has(edge);
}

// Get the starting tile (placed in center)
export function getStarterTile(): TileType {
  // Use center tile as starter - single connection point
  return TILE_TYPES.find((t) => t.id === "center")!;
}
