<template>
  <v-container>
    <v-card>
      <v-card-title class="bg-blue-lighten-3"
        >Nuxt 4 + Vuetify 3 + TypeScript</v-card-title
      >
      <v-card-text class="pt-4">
        <v-chip color="purple">{{ count }}</v-chip>
      </v-card-text>
      <v-card-actions class="bg-blue">
        <v-btn variant="flat" color="red-darken-4" @click="down">Down</v-btn>
        <v-btn variant="flat" color="green-darken-4" @click="up">Up</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
<script setup lang="ts">
const count = ref(0);

// Create up and down functions to modify count
function up() {
  if (count.value < 9) count.value++;
  else count.value = 0;
}

function down() {
  if (count.value <= 0) count.value = 9;
  else count.value--;
}
</script>
