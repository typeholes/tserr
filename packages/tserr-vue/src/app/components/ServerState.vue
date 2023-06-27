<script setup lang="ts">
import { inject } from 'vue';
import { appState } from '../appState';
import { Emitters } from '../socket';
import { ProjectPath } from '@typeholes/tserr-common';
import ConfigView from './ConfigView.vue';
import PluginManager from './PluginManager.vue';

const emitters = inject<Emitters>('emitters');

function toggleProject(open: boolean, path: string) {
  emitters && emitters[open ? 'openProject' : 'closeProject']?.(path);
}
</script>

<template>
  <div>
    <div dense>socket started: {{ appState.socketStarted }}</div>
    <div dense>connected: {{ appState.connected }}</div>
    <div dense><PluginManager /></div>
    <div dense>
      <ConfigView />
    </div>
    <!-- <div
      dense
      v-for="path in Object.keys(appState.projects).sort()"
      :key="path"
    >
      <q-checkbox
        density="compact"
        hide-details="auto"
        :label="path"
        v-model="appState.projects[ProjectPath.for(path)]"
        @update:model-value="(open) => toggleProject(open, path)"
      />
    </div>
  -->
  </div>
</template>
