<script setup lang="ts">
import { inject } from 'vue';
import { appState } from '../appState';
import { Emitters } from '../socket';

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
    {{ appState.plugins[props.pluginKey].displayName }}
    </label>
    <input :id="id" type="checkbox" :checked="appState.plugins[props.pluginKey].active" @input="toggle"/>
  </div>
</template>
