<script setup lang="ts">
import { appState } from '../appState';
</script>

<template>
  <pre>
     {{ JSON.stringify(appState.configs, null, 2) }}
  </pre>
</template>
