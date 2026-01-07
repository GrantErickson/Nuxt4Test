<template>
  <div class="mt-4">
    <v-btn
      block
      variant="outlined"
      color="blue-darken-2"
      size="large"
      class="mb-2"
      :loading="loading"
      :disabled="loading"
      @click="$emit('getHint')"
    >
      <v-icon start>mdi-lightbulb-outline</v-icon>
      Get Hint
    </v-btn>

    <v-alert
      v-if="showHint && hintWord"
      type="info"
      variant="tonal"
      density="compact"
    >
      <div class="d-flex align-center justify-space-between">
        <div>
          <strong>Suggested word:</strong>
          <span class="text-h6 ml-2 font-weight-bold">{{
            hintWord.toUpperCase()
          }}</span>
        </div>
        <v-btn
          size="small"
          variant="elevated"
          color="green-darken-2"
          class="ml-2"
          @click="$emit('useHint')"
        >
          <v-icon start size="small">mdi-check-circle</v-icon>
          Use it
        </v-btn>
      </div>
      <div class="text-caption mt-1">
        {{ possibleWordsCount }} possible words remaining
      </div>
    </v-alert>

    <v-alert
      v-if="showHint && !hintWord"
      type="warning"
      variant="tonal"
      density="compact"
    >
      No valid words found. Check your guesses!
    </v-alert>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean;
  showHint: boolean;
  hintWord: string | null;
  possibleWordsCount: number;
}>();

defineEmits<{
  getHint: [];
  useHint: [];
}>();
</script>
