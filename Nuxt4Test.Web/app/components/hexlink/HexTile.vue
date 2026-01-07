<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    class="hex-tile"
    style="overflow: visible"
    @click="$emit('click')"
  >
    <!-- Hex background (hidden in indicators-only mode) -->
    <polygon
      v-if="!indicatorsOnly"
      :points="hexPoints"
      :fill="backgroundColor"
      :stroke="isHighlighted ? '#FFD700' : '#333'"
      :stroke-width="isHighlighted ? 3 : 1"
      class="hex-bg"
    />

    <!-- Connection paths (hidden in indicators-only mode) -->
    <g v-if="tileType && !indicatorsOnly">
      <template v-for="(conn, idx) in rotatedConnections" :key="idx">
        <path
          v-if="conn.from !== conn.to"
          :d="getConnectionPath(conn.from, conn.to)"
          fill="none"
          :stroke="getPathColor(conn.from, conn.to)"
          :stroke-width="pathWidth"
          stroke-linecap="round"
          :class="{ 'longest-chain': isLongestChainPath(conn.from, conn.to) }"
        />
        <!-- Dead end (connection to self) -->
        <circle
          v-else
          :cx="getEdgePoint(conn.from).x"
          :cy="getEdgePoint(conn.from).y"
          :r="pathWidth / 2"
          :fill="getPathColor(conn.from, conn.to)"
          :class="{ 'longest-chain': isLongestChainPath(conn.from, conn.to) }"
        />
      </template>
    </g>

    <!-- Edge connection indicators -->
    <g v-if="showEdgeIndicators">
      <circle
        v-for="edge in connectedEdges"
        :key="edge"
        :cx="getEdgePoint(edge).x"
        :cy="getEdgePoint(edge).y"
        r="4"
        :fill="getEdgeColor(edge)"
        stroke="#333"
        stroke-width="1"
      />
    </g>

    <!-- Empty hex indicator -->
    <text
      v-if="isEmpty && !isHighlighted && !indicatorsOnly"
      :x="center"
      :y="center + 4"
      text-anchor="middle"
      fill="#666"
      font-size="10"
    >
      {{ positionLabel }}
    </text>

    <!-- Valid placement indicator -->
    <circle
      v-if="isHighlighted && !indicatorsOnly"
      :cx="center"
      :cy="center"
      r="8"
      fill="#FFD700"
      opacity="0.6"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TileType, EdgeIndex, Connection } from "~/classes/hexlink/types";
import { getTileType, getConnectedEdges } from "~/classes/hexlink/tiles";

const props = defineProps<{
  tileTypeId?: string;
  rotation?: number;
  size?: number;
  isEmpty?: boolean;
  isHighlighted?: boolean;
  connectedPaths?: Set<string>;
  longestChainPaths?: Set<string>;
  positionKey?: string;
  showEdgeIndicators?: boolean;
  indicatorsOnly?: boolean;
  positionLabel?: string;
}>();

defineEmits<{
  click: [];
}>();

const size = computed(() => props.size ?? 60);
const center = computed(() => size.value / 2);
const radius = computed(() => size.value / 2 - 2); // Minimal padding for clean edges

const tileType = computed<TileType | null>(() => {
  if (!props.tileTypeId) return null;
  return getTileType(props.tileTypeId) ?? null;
});

const rotation = computed(() => props.rotation ?? 0);

const backgroundColor = computed(() => {
  if (props.isEmpty) return "#1a1a2e";
  if (!tileType.value) return "#2a2a4e";
  // Check if any path on this tile is connected
  if (hasAnyConnectedPath()) {
    return tileType.value.color + "44"; // Vibrant - more visible alpha
  }
  return "#3a3a4e"; // Dull gray for disconnected tiles
});

// Check if a specific path is connected to center
function isPathConnected(edge1: EdgeIndex, edge2: EdgeIndex): boolean {
  if (!props.connectedPaths || !props.positionKey) return false;
  const minEdge = Math.min(edge1, edge2);
  const maxEdge = Math.max(edge1, edge2);
  const pathKey = `${props.positionKey}:${minEdge}-${maxEdge}`;
  return props.connectedPaths.has(pathKey);
}

// Check if a path is part of the longest chain
function isLongestChainPath(edge1: EdgeIndex, edge2: EdgeIndex): boolean {
  if (!props.longestChainPaths || !props.positionKey) return false;
  const minEdge = Math.min(edge1, edge2);
  const maxEdge = Math.max(edge1, edge2);
  const pathKey = `${props.positionKey}:${minEdge}-${maxEdge}`;
  return props.longestChainPaths.has(pathKey);
}

// Check if any path on this tile is connected
function hasAnyConnectedPath(): boolean {
  if (!tileType.value || !props.connectedPaths || !props.positionKey)
    return false;
  for (const conn of rotatedConnections.value) {
    if (isPathConnected(conn.from, conn.to)) return true;
  }
  return false;
}

// Get color for a specific path
function getPathColor(edge1: EdgeIndex, edge2: EdgeIndex): string {
  if (!tileType.value) return "#fff";
  if (isPathConnected(edge1, edge2)) {
    return tileType.value.color; // Vibrant color
  }
  return "#666"; // Dull gray for disconnected paths
}

// Get color for edge indicator based on whether any connected path uses this edge
function getEdgeColor(edge: EdgeIndex): string {
  if (!tileType.value) return "#fff";
  // Check if any connected path uses this edge
  for (const conn of rotatedConnections.value) {
    if (
      (conn.from === edge || conn.to === edge) &&
      isPathConnected(conn.from, conn.to)
    ) {
      return tileType.value.color;
    }
  }
  return "#666";
}

const pathWidth = computed(() => Math.max(4, size.value / 12));

// Generate hex points - flat-top orientation
// Vertices at 0°, 60°, 120°, 180°, 240°, 300°
// This creates flat edges at top and bottom
const hexPoints = computed(() => {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i; // Start from right, go counterclockwise
    const x = center.value + radius.value * Math.cos(angle);
    const y = center.value + radius.value * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
});

// Get rotated connections
const rotatedConnections = computed<Connection[]>(() => {
  if (!tileType.value) return [];
  return tileType.value.connections.map((conn) => ({
    from: ((conn.from + rotation.value) % 6) as EdgeIndex,
    to: ((conn.to + rotation.value) % 6) as EdgeIndex,
  }));
});

// Get connected edges (for indicators)
const connectedEdges = computed<EdgeIndex[]>(() => {
  if (!tileType.value) return [];
  return Array.from(getConnectedEdges(tileType.value, rotation.value));
});

// Get the midpoint of an edge (where connections enter/exit)
// For flat-top hex with vertices at 0°, 60°, 120°, 180°, 240°, 300° (counterclockwise)
// Edges numbered 0-5 clockwise starting from top-right:
// - Edge 0 (top-right): between v5 (300°) and v0 (0°) → midpoint at 330°
// - Edge 1 (lower-right): between v0 (0°) and v1 (60°) → midpoint at 30°
// - Edge 2 (bottom): between v1 (60°) and v2 (120°) → midpoint at 90°
// - Edge 3 (lower-left): between v2 (120°) and v3 (180°) → midpoint at 150°
// - Edge 4 (upper-left): between v3 (180°) and v4 (240°) → midpoint at 210°
// - Edge 5 (top): between v4 (240°) and v5 (300°) → midpoint at 270°
function getEdgePoint(edge: EdgeIndex): { x: number; y: number } {
  // Edge N is between vertex (N+5)%6 and vertex N
  const v1 = (edge + 5) % 6;
  const v2 = edge;
  const angle1 = (Math.PI / 3) * v1;
  const angle2 = (Math.PI / 3) * v2;
  const x =
    center.value + (radius.value * (Math.cos(angle1) + Math.cos(angle2))) / 2;
  const y =
    center.value + (radius.value * (Math.sin(angle1) + Math.sin(angle2))) / 2;
  return { x, y };
}

// Generate a curved path between two edges
function getConnectionPath(from: EdgeIndex, to: EdgeIndex): string {
  const p1 = getEdgePoint(from);
  const p2 = getEdgePoint(to);
  const c = center.value;

  // Calculate edge distance (number of edges apart)
  const diff = Math.abs((to - from + 6) % 6);

  if (diff === 3) {
    // Straight line through center
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  } else if (diff === 1 || diff === 5) {
    // Adjacent edges - small curve
    const controlX = c + (p1.x - c + p2.x - c) * 0.3;
    const controlY = c + (p1.y - c + p2.y - c) * 0.3;
    return `M ${p1.x} ${p1.y} Q ${controlX} ${controlY} ${p2.x} ${p2.y}`;
  } else {
    // Other cases - curve through center area
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const controlX = c + (midX - c) * 0.3;
    const controlY = c + (midY - c) * 0.3;
    return `M ${p1.x} ${p1.y} Q ${controlX} ${controlY} ${p2.x} ${p2.y}`;
  }
}
</script>

<style scoped>
.hex-tile {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.hex-tile:hover {
  transform: scale(1.05);
}

.hex-bg {
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.longest-chain {
  animation: pulse-glow 2.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    filter: drop-shadow(0 0 3px currentColor) drop-shadow(0 0 6px currentColor);
  }
  50% {
    opacity: 0.5;
    filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 12px currentColor);
  }
}
</style>
