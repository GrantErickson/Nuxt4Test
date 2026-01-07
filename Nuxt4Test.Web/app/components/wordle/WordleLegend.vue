<template>
  <div>
    <div class="text-subtitle-2 mb-2">Legend:</div>
    <div class="d-flex ga-4 flex-wrap">
      <div class="d-flex align-center ga-2">
        <div class="legend-box bg-green text-white">A</div>
        <span>Correct letter & position</span>
      </div>
      <div class="d-flex align-center ga-2">
        <div class="legend-box bg-yellow-darken-2 text-white">B</div>
        <span>Correct letter, wrong position</span>
      </div>
      <div class="d-flex align-center ga-2">
        <div class="legend-box bg-grey-darken-1 text-white">C</div>
        <span>Letter not in word</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legend-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: bold;
}
</style>
