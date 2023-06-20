<script setup lang="ts">
import { appState } from '../appState';
// import ProblemsView from './ProblemsView.vue';
import ResolvedErrors from './ResolvedErrors.vue';
import PluginManager from './PluginManager.vue';
</script>

<template>
  <div class="appstate">

    <!-- <span> error: {{ appState.error }} </span> -->
    <!-- <ProblemsView /> -->
    <ResolvedErrors />
    <!-- <pre> resolved: {{ JSON.stringify(Array.from(appState.resolvedErrors.values()), null, 2) }}  </pre> -->
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
