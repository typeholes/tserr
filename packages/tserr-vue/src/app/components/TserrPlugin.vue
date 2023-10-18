<script setup lang="ts">
import { inject } from 'vue';
import { appState } from '../appState';
import { Emitters } from '../socket';
import { PluginName } from '@typeholes/tserr-common';

const props = defineProps<{ pluginKey: string }>();

const emitters = inject<Emitters>('emitters');

function toggle(e: Event) {
  emitters?.setPlugin(props.pluginKey, (e.target as any).checked);
}

const id = `pluginKey-${props.pluginKey}`;
</script>

<template>
  <div>
    <label :for="id">
      {{ appState.plugins[props.pluginKey as PluginName].displayName }}
    </label>
    <input
      :id="id"
      type="checkbox"
      :checked="appState.plugins[props.pluginKey as PluginName].active"
      @input="toggle"
    />
  </div>
</template>
