
<script setup lang="ts">
import { appState } from '../appState';
</script>

<template>
  <div>
    <template v-for="pluginKey of Object.keys(appState.plugins)" :key="pluginKey">
      <TserrPlugin :pluginKey="pluginKey"/>
    </template>
  </div>

</template>

