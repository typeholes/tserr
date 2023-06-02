<script setup lang="ts">
import type { ResolvedError } from '../resolvedError'
import { appState } from '../appState'

const props = defineProps<{
  parsed: ResolvedError
}>()
</script>

<template>
  <div class="row">
    <!-- <div>parsed: {{ props.parsed}}</div> -->
    <span :style="{ minWidth: `${props.parsed[1] ?? 0}rem` }"></span>
    <span v-if="props.parsed[2].type === 'unknownError'">
      {{ props.parsed[2].parts }}
    </span>
    <span v-if="props.parsed[2].type === 'aliasSelfReference'">
      {{ props.parsed[2].from }}
    </span>
    <span> {{ appState.supplements[props.parsed[0]] }} </span>
  </div>
</template>

<style scoped>
.row {
  display: flex;
}
</style>
