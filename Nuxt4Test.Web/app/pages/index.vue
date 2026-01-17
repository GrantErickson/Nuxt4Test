<template>
  <v-card>
    <v-card-title class="bg-blue-lighten-3">Games</v-card-title>
    <v-card-text class="pt-4">
      <v-list>
        <v-list-item
          v-for="game in games"
          :key="game.route"
          :to="game.route"
          :prepend-icon="game.icon"
        >
          <v-list-item-title
            >{{ game.emoji }} {{ game.name }}</v-list-item-title
          >
          <v-list-item-subtitle>{{ game.description }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const games = [
  {
    name: "Wordle",
    emoji: "🔤",
    route: "/wordle",
    icon: "mdi-alphabetical",
    description: "Guess the 5-letter word in 6 tries",
  },
  {
    name: "HexLink",
    emoji: "⬡",
    route: "/hexlink",
    icon: "mdi-hexagon-multiple",
    description: "Connect hex tiles to build the longest chain",
  },
  {
    name: "Crossword",
    emoji: "📝",
    route: "/crossword",
    icon: "mdi-grid",
    description: "Fill in the crossword puzzle",
  },
  {
    name: "Bear Patrol",
    emoji: "🏕️",
    route: "/minesweeper",
    icon: "mdi-mine",
    description: "Find the bears without getting caught",
  },
  {
    name: "Mastermind",
    emoji: "🎯",
    route: "/mastermind",
    icon: "mdi-bullseye",
    description: "Crack the color code",
  },
  {
    name: "Thermal Hunt",
    emoji: "🌡️",
    route: "/thermalhunt",
    icon: "mdi-thermometer",
    description: "Find the hidden target using hot/cold clues",
  },
  {
    name: "Cavern",
    emoji: "🏔️",
    route: "/cavern",
    icon: "mdi-tunnel",
    description: "Explore the cavern",
  },
  {
    name: "Physics",
    emoji: "🎱",
    route: "/physics",
    icon: "mdi-billiards",
    description: "Physics simulation playground",
  },
  {
    name: "Hair Salon",
    emoji: "✂️",
    route: "/haircutting",
    icon: "mdi-content-cut",
    description: "Physics-based hair cutting and styling game",
  },
  {
    name: "VoidCatcher 2D",
    emoji: "🕳️",
    route: "/voidcatcher2d",
    icon: "mdi-circle-outline",
    description: "Catch falling shapes with your void in 2D",
  },
  {
    name: "VoidCatcher 3D",
    emoji: "⚫",
    route: "/voidcatcher3d",
    icon: "mdi-sphere",
    description: "Physics-based 3D void catcher with powerups",
  },
];
</script>
