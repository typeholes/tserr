<script setup lang="ts">
import { appState } from '../appState';
import ConfigView from './ConfigView.vue';
import PluginManager from './PluginManager.vue';
</script>

<template>
  <div>
    <div dense>socket started: {{ appState.socketStarted }}</div>
    <div dense>connected: {{ appState.connected }}</div>
    <div dense><PluginManager /></div>
    <div dense>
      <ConfigView />
    </div>
  </div>
</template>
