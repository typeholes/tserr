<script setup lang="ts">
// import ProblemsView from './ProblemsView.vue';
import ResolvedErrors from './ResolvedErrors.vue';
</script>

<template>
  <div class="appstate">

    <ResolvedErrors />
  </div>
</template>

<style scoped>
.appstate {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100vw;
}
</style>
