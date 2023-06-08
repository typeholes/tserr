<script setup lang="ts">
import CodeGrid from './CodeGrid.vue';
import type { ResolvedError } from '../resolvedError';
import { appState } from '../appState';
import { inject } from 'vue';
import { Emitters } from '../socket';

const props = defineProps<{
  parsed: ResolvedError;
}>();

function getOrder() {
  return (props.parsed as any).getOrder();
}

const emitters = inject<Emitters>('emitters');

function unknownPartsToBlock(parts: string[]) {
  const evens = parts.filter((_, i) => i % 2 === 0);
  const blocks = evens.map((k, i) => {
    const entry = [k, parts[(i*2) + 1]] as [string, string];
    return entry;
  });
  return blocks;
}
</script>

<template>
  <div class="row" :style="{ order: getOrder() }">
    <!-- <div>parsed: {{ props.parsed}}</div> -->
    <div>{{ props.parsed[2].type }}</div>
    <span :style="{ minWidth: `${props.parsed[1] ?? 0}rem` }"></span>
    <!-- <span v-if="props.parsed[2].type === 'unknownError'">
      {{ props.parsed[2].parts }}
    </span> -->
    <span v-if="props.parsed[2].type === 'aliasSelfReference'">
      {{ props.parsed[2].from }}
    </span>
    <div v-if="['notAssignable','excessProperty'].includes(props.parsed[2].type)">
      <CodeGrid :blocks="Object.entries(props.parsed[2])" header-key="type" />
    </div>
    <div v-if="props.parsed[2].type === 'unknownError'">
      <CodeGrid
        :blocks="unknownPartsToBlock(props.parsed[2].parts)"
        header-key=""
      />
    </div>
    <pre> {{ appState.supplements[props.parsed[0]] }} </pre>
    <div class="fixes">
      <template v-for="fix of appState.fixes[props.parsed[0]]" :key="fix">
          <button @click="emitters?.applyFix(fix[0])">
          {{ fix[1] }}
          </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 0.24rem;
}

button {
  background-color: rgb(5, 48, 24);
  color: white;
  box-shadow: .1rem .1rem .2rem rgb(9, 93, 47);;
}

.fixes {
  display:flex;
  flex-direction: column;
  gap: .2rem
}
</style>
