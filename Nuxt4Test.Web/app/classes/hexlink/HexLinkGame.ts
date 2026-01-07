// HexLink game logic
import type {
  PlacedTile,
  HexPosition,
  HandTile,
  GameState,
  EdgeIndex,
} from "./types";
import {
  positionToKey,
  keyToPosition,
  getNeighbor,
  getOppositeEdge,
  isValidPosition,
  getAllBoardPositions,
} from "./types";
import {
  getTileType,
  getRandomTileType,
  hasConnectionOnEdge,
  getStarterTile,
  getConnectedEdges,
} from "./tiles";

export class HexLinkGame {
  private board: Map<string, PlacedTile>;
  private hand: HandTile[];
  private selectedHandIndex: number | null;
  private gameOver: boolean;
  private score: number;
  private connectedPaths: Set<string>;
  private longestChainPaths: Set<string>;

  constructor() {
    this.board = new Map();
    this.hand = [];
    this.selectedHandIndex = null;
    this.connectedPaths = new Set();
    this.longestChainPaths = new Set();
    this.gameOver = false;
    this.score = 0;
    this.initializeGame();
  }

  private initializeGame(): void {
    // Place starter tile in center
    const starterTile = getStarterTile();
    this.board.set(positionToKey({ q: 0, r: 0 }), {
      typeId: starterTile.id,
      rotation: 0,
      position: { q: 0, r: 0 },
    });

    // Deal initial hand
    this.dealHand();
    this.calculateScore();
  }

  private dealHand(): void {
    this.hand = [];
    for (let i = 0; i < 3; i++) {
      this.hand.push({
        typeId: getRandomTileType().id,
        rotation: 0,
      });
    }
    this.selectedHandIndex = null;
  }

  public getState(): GameState {
    return {
      board: new Map(this.board),
      hand: [...this.hand],
      score: this.score,
      gameOver: this.gameOver,
      selectedHandIndex: this.selectedHandIndex,
      connectedPaths: new Set(this.connectedPaths),
      longestChainPaths: new Set(this.longestChainPaths),
    };
  }

  public selectHandTile(index: number): void {
    if (index >= 0 && index < this.hand.length) {
      this.selectedHandIndex = index;
    }
  }

  public rotateSelectedTile(clockwise: boolean = true): void {
    if (this.selectedHandIndex === null) return;
    const tile = this.hand[this.selectedHandIndex];
    if (!tile) return;
    if (clockwise) {
      tile.rotation = (tile.rotation + 1) % 6;
    } else {
      tile.rotation = (tile.rotation + 5) % 6; // +5 is same as -1 mod 6
    }
  }

  public canPlaceTile(position: HexPosition, handIndex: number): boolean {
    const key = positionToKey(position);

    // Check if position is valid and empty
    if (!isValidPosition(position) || this.board.has(key)) {
      return false;
    }

    const handTile = this.hand[handIndex];
    if (!handTile) return false;
    const tileType = getTileType(handTile.typeId);
    if (!tileType) return false;

    // Check if at least one edge connects with an existing tile
    let hasValidConnection = false;

    for (let edge = 0; edge < 6; edge++) {
      const neighborPos = getNeighbor(position, edge as EdgeIndex);
      const neighborKey = positionToKey(neighborPos);
      const neighbor = this.board.get(neighborKey);

      if (neighbor) {
        const neighborType = getTileType(neighbor.typeId);
        if (!neighborType) continue;

        const oppositeEdge = getOppositeEdge(edge as EdgeIndex);
        const tileHasConnection = hasConnectionOnEdge(
          tileType,
          handTile.rotation,
          edge as EdgeIndex
        );
        const neighborHasConnection = hasConnectionOnEdge(
          neighborType,
          neighbor.rotation,
          oppositeEdge
        );

        // Both tiles must have matching connection state on adjacent edges
        // For valid placement, we need at least one connecting match
        if (tileHasConnection && neighborHasConnection) {
          hasValidConnection = true;
        }
      }
    }

    return hasValidConnection;
  }

  public getValidPlacements(handIndex: number): HexPosition[] {
    const validPositions: HexPosition[] = [];
    const allPositions = getAllBoardPositions();

    for (const pos of allPositions) {
      if (this.canPlaceTile(pos, handIndex)) {
        validPositions.push(pos);
      }
    }

    return validPositions;
  }

  public placeTile(position: HexPosition, handIndex: number): boolean {
    if (!this.canPlaceTile(position, handIndex)) {
      return false;
    }

    const handTile = this.hand[handIndex];
    if (!handTile) return false;
    const key = positionToKey(position);

    // Place the tile
    this.board.set(key, {
      typeId: handTile.typeId,
      rotation: handTile.rotation,
      position: { ...position },
    });

    // Remove from hand and deal a new tile
    this.hand.splice(handIndex, 1);
    this.hand.push({
      typeId: getRandomTileType().id,
      rotation: 0,
    });

    this.selectedHandIndex = null;
    this.calculateScore();
    this.checkGameOver();

    return true;
  }

  private checkGameOver(): void {
    // Game is over if board is full
    const allPositions = getAllBoardPositions();
    const emptyPositions = allPositions.filter(
      (pos) => !this.board.has(positionToKey(pos))
    );

    if (emptyPositions.length === 0) {
      this.gameOver = true;
      return;
    }

    // Game is over if no tile in hand can be placed
    let canPlaceAny = false;
    for (let i = 0; i < this.hand.length; i++) {
      const handTile = this.hand[i];
      if (!handTile) continue;
      // Try all rotations
      const originalRotation = handTile.rotation;
      for (let r = 0; r < 6; r++) {
        handTile.rotation = r;
        if (this.getValidPlacements(i).length > 0) {
          canPlaceAny = true;
          break;
        }
      }
      handTile.rotation = originalRotation;
      if (canPlaceAny) break;
    }

    if (!canPlaceAny) {
      this.gameOver = true;
    }
  }

  private calculateScore(): void {
    // First calculate which tiles are connected to center
    this.calculateConnectedToCenter();

    // Score is the longest chain of connected tiles
    // A tile can be counted multiple times if it has multiple connection paths

    let maxChainLength = 0;
    let longestChainVisited = new Set<string>();

    // Try starting from each tile and each of its connection edges
    for (const [posKey, tile] of this.board) {
      const tileType = getTileType(tile.typeId);
      if (!tileType) continue;

      const connectedEdges = getConnectedEdges(tileType, tile.rotation);

      for (const startEdge of connectedEdges) {
        const chainVisited = new Set<string>();
        const chainLength = this.traceChainWithPaths(
          posKey,
          startEdge,
          new Set(),
          chainVisited
        );
        if (chainLength > maxChainLength) {
          maxChainLength = chainLength;
          longestChainVisited = chainVisited;
        }
      }
    }

    this.score = maxChainLength;

    // Convert visited edges to path keys for the longest chain
    this.longestChainPaths.clear();
    for (const visitKey of longestChainVisited) {
      // visitKey is "posKey:edge1-edge2", convert to canonical path key
      const [posKey, edges] = visitKey.split(":");
      if (posKey && edges) {
        const [e1, e2] = edges.split("-").map(Number);
        if (e1 !== undefined && e2 !== undefined) {
          const minEdge = Math.min(e1, e2);
          const maxEdge = Math.max(e1, e2);
          this.longestChainPaths.add(`${posKey}:${minEdge}-${maxEdge}`);
        }
      }
    }
  }

  // Trace chain and collect all visited path keys
  private traceChainWithPaths(
    startPosKey: string,
    startEdge: EdgeIndex,
    visited: Set<string>,
    collectedPaths: Set<string>
  ): number {
    const tile = this.board.get(startPosKey);
    if (!tile) return 0;

    const tileType = getTileType(tile.typeId);
    if (!tileType) return 0;

    // Find which edges this edge connects to within the tile
    const connectedToEdges: EdgeIndex[] = [];
    for (const conn of tileType.connections) {
      const fromRotated = ((conn.from + tile.rotation) % 6) as EdgeIndex;
      const toRotated = ((conn.to + tile.rotation) % 6) as EdgeIndex;

      if (fromRotated === startEdge && conn.from !== conn.to) {
        connectedToEdges.push(toRotated);
      } else if (toRotated === startEdge && conn.from !== conn.to) {
        connectedToEdges.push(fromRotated);
      }
    }

    let maxLength = 1; // Count this tile
    let bestPaths = new Set<string>();

    for (const exitEdge of connectedToEdges) {
      const visitKey = `${startPosKey}:${startEdge}-${exitEdge}`;
      if (visited.has(visitKey)) continue;

      const newVisited = new Set(visited);
      newVisited.add(visitKey);
      newVisited.add(`${startPosKey}:${exitEdge}-${startEdge}`); // Both directions

      // Find neighbor tile through this edge
      const pos = keyToPosition(startPosKey);
      const neighborPos = getNeighbor(pos, exitEdge);
      const neighborKey = positionToKey(neighborPos);
      const neighbor = this.board.get(neighborKey);

      if (neighbor) {
        const neighborType = getTileType(neighbor.typeId);
        if (neighborType) {
          const enterEdge = getOppositeEdge(exitEdge);
          if (hasConnectionOnEdge(neighborType, neighbor.rotation, enterEdge)) {
            const subPaths = new Set<string>();
            const chainLength =
              1 +
              this.traceChainWithPaths(
                neighborKey,
                enterEdge,
                newVisited,
                subPaths
              );
            if (chainLength > maxLength) {
              maxLength = chainLength;
              bestPaths = new Set(subPaths);
              bestPaths.add(visitKey);
            }
          }
        }
      }
    }

    // Add best paths to collected
    for (const p of bestPaths) {
      collectedPaths.add(p);
    }

    return maxLength;
  }

  public reset(): void {
    this.board.clear();
    this.hand = [];
    this.selectedHandIndex = null;
    this.gameOver = false;
    this.score = 0;
    this.initializeGame();
  }

  public getBoardAsArray(): PlacedTile[] {
    return Array.from(this.board.values());
  }

  public getTileAt(position: HexPosition): PlacedTile | undefined {
    return this.board.get(positionToKey(position));
  }

  private calculateConnectedToCenter(): void {
    this.connectedPaths.clear();
    const centerKey = positionToKey({ q: 0, r: 0 });
    const centerTile = this.board.get(centerKey);
    if (!centerTile) return;

    const centerType = getTileType(centerTile.typeId);
    if (!centerType) return;

    // Mark all paths in center tile as connected
    for (const conn of centerType.connections) {
      const fromRotated = ((conn.from + centerTile.rotation) % 6) as EdgeIndex;
      const toRotated = ((conn.to + centerTile.rotation) % 6) as EdgeIndex;
      const pathKey = this.makePathKey(centerKey, fromRotated, toRotated);
      this.connectedPaths.add(pathKey);
    }

    // BFS from center, following connected paths
    // Queue contains: position key, entry edge, and the path we came from
    const visitedEdges = new Set<string>(); // "posKey:edge" - tracks which tile edges we've entered through
    const queue: Array<{ posKey: string; entryEdge: EdgeIndex }> = [];

    // Start from each edge of the center tile that has a connection
    const centerEdges = getConnectedEdges(centerType, centerTile.rotation);
    for (const edge of centerEdges) {
      const neighborPos = getNeighbor({ q: 0, r: 0 }, edge);
      const neighborKey = positionToKey(neighborPos);
      const neighbor = this.board.get(neighborKey);
      if (neighbor) {
        const neighborType = getTileType(neighbor.typeId);
        if (neighborType) {
          const oppositeEdge = getOppositeEdge(edge);
          if (
            hasConnectionOnEdge(neighborType, neighbor.rotation, oppositeEdge)
          ) {
            const edgeKey = `${neighborKey}:${oppositeEdge}`;
            if (!visitedEdges.has(edgeKey)) {
              visitedEdges.add(edgeKey);
              queue.push({ posKey: neighborKey, entryEdge: oppositeEdge });
            }
          }
        }
      }
    }

    // BFS through connected tiles
    while (queue.length > 0) {
      const current = queue.shift()!;

      const tile = this.board.get(current.posKey);
      if (!tile) continue;

      const tileType = getTileType(tile.typeId);
      if (!tileType) continue;

      // Find which paths this entry edge is part of and mark them connected
      for (const conn of tileType.connections) {
        const fromRotated = ((conn.from + tile.rotation) % 6) as EdgeIndex;
        const toRotated = ((conn.to + tile.rotation) % 6) as EdgeIndex;

        // Check if this connection involves our entry edge
        if (
          fromRotated === current.entryEdge ||
          toRotated === current.entryEdge
        ) {
          // Mark this path as connected
          const pathKey = this.makePathKey(
            current.posKey,
            fromRotated,
            toRotated
          );
          if (!this.connectedPaths.has(pathKey)) {
            this.connectedPaths.add(pathKey);

            // Continue traversal through the exit edge (if different from entry)
            const exitEdge =
              fromRotated === current.entryEdge ? toRotated : fromRotated;
            if (exitEdge !== current.entryEdge) {
              const neighborPos = getNeighbor(tile.position, exitEdge);
              const neighborKey = positionToKey(neighborPos);
              const neighbor = this.board.get(neighborKey);
              if (neighbor) {
                const neighborType = getTileType(neighbor.typeId);
                if (neighborType) {
                  const oppositeEdge = getOppositeEdge(exitEdge);
                  if (
                    hasConnectionOnEdge(
                      neighborType,
                      neighbor.rotation,
                      oppositeEdge
                    )
                  ) {
                    const edgeKey = `${neighborKey}:${oppositeEdge}`;
                    if (!visitedEdges.has(edgeKey)) {
                      visitedEdges.add(edgeKey);
                      queue.push({
                        posKey: neighborKey,
                        entryEdge: oppositeEdge,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Create a canonical path key (smaller edge first for consistency)
  private makePathKey(
    posKey: string,
    edge1: EdgeIndex,
    edge2: EdgeIndex
  ): string {
    const minEdge = Math.min(edge1, edge2);
    const maxEdge = Math.max(edge1, edge2);
    return `${posKey}:${minEdge}-${maxEdge}`;
  }
}
