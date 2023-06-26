<script setup lang="ts">
import { inject } from 'vue';
import { appState } from '../appState';
import { Emitters } from '../socket';
import { ProjectPath } from '@typeholes/tserr-common';
import ConfigView from './ConfigView.vue';

const emitters = inject<Emitters>('emitters');

function toggleProject(open: boolean, path: string) {
  emitters && emitters[open ? 'openProject' : 'closeProject']?.(path);
}
</script>

<template>
  <v-container dense>
    <v-row dense> socket started: {{ appState.socketStarted }} </v-row>
    <v-row dense> connected: {{ appState.connected }} </v-row>
    <v-row dense><PluginManager /></v-row>
    <v-row dense>
      <ConfigView/>
    </v-row>
    <v-row
      dense
      v-for="path in Object.keys(appState.projects).sort()"
      :key="path"
    >
      <v-checkbox
        density="compact"
        hide-details="auto"
        :label="path"
        v-model="appState.projects[ProjectPath.for(path)]"
        @update:model-value="(open) => toggleProject(open, path)"
      />
    </v-row>
  </v-container>
</template>
