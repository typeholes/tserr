
<script setup lang="ts">
import { appState } from '../appState';
import TserrPlugin from './TserrPlugin.vue';
</script>

<template>
  <div>
    <template v-for="pluginKey of Object.keys(appState.plugins)" :key="pluginKey">
      <TserrPlugin :pluginKey="pluginKey"/>
    </template>
  </div>

</template>

