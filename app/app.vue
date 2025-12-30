<template>
  <v-app>
    <v-main>
      <v-container>
        <v-tabs v-model="tab" bg-color="primary" class="mb-4">
          <v-tab value="home" to="/">Home</v-tab>
          <v-tab value="wordle" to="/wordle">Wordle</v-tab>
          <v-tab value="minesweeper" to="/minesweeper">🏕️ Bear Patrol</v-tab>
          <v-tab value="mastermind" to="/mastermind">🎯 Mastermind</v-tab>
          <v-tab value="thermalhunt" to="/thermalhunt">🌡️ Thermal Hunt</v-tab>
          <v-tab value="cavern" to="/cavern">🏔️ Cavern</v-tab>
        </v-tabs>
        <NuxtPage />
      </v-container>
    </v-main>
  </v-app>
</template>
<script setup lang="ts">
const tab = ref("home");
</script>
