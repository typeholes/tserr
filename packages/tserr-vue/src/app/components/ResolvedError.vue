<script setup lang="ts">
import CodeBlock from './CodeBlock.vue';
import type { ResolvedError } from '../resolvedError';
import { appState } from '../appState';

const props = defineProps<{
  parsed: ResolvedError;
}>();
</script>

<template>
  <div class="row">
    <!-- <div>parsed: {{ props.parsed}}</div> -->
      <div> {{ props.parsed[2].type }} </div>
    <span :style="{ minWidth: `${props.parsed[1] ?? 0}rem` }"></span>
    <span v-if="props.parsed[2].type === 'unknownError'">
      {{ props.parsed[2].parts }}
    </span>
    <span v-if="props.parsed[2].type === 'aliasSelfReference'">
      {{ props.parsed[2].from }}
    </span>
    <div v-if="props.parsed[2].type === 'notAssignable'">
      <CodeBlock :code="props.parsed[2].to" />
      <CodeBlock :code="props.parsed[2].from" />
    </div>
    <pre> {{ appState.supplements[props.parsed[0]] }} </pre>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: .24rem;
}
</style>
