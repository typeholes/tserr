<script setup lang="ts">
import { reactive } from 'vue'
import ErrorTable from './ErrorTable.vue'
import type { Diagnostic } from '../appState'

const props = defineProps<{
  diagnostic: Diagnostic
}>()

const state = reactive({
  expand: true,
  seperator: '...',
  forceIndent: 3 as number | undefined,
  lines: [] as string[]
})

function toggleExpand() {
  const lines = props.diagnostic.message.split('\n')
  state.expand = !state.expand
  if (state.expand) {
    state.seperator = '->'
    state.forceIndent = undefined
    state.lines = lines
  } else {
    state.seperator = '...'
    state.forceIndent = 3
    state.lines = lines.length > 1 ? [lines[0], lines[lines.length - 1]] : lines
  }
}

toggleExpand()

function getIndent(i: number) {
  return i == 0 ? 0 : state.forceIndent ?? i
}
</script>

<template>
  <div>
    {{ props.diagnostic.start }}
    {{ props.diagnostic.end }}
    <ErrorTable
      v-for="(line, index) in state.lines"
      :errorText="line"
      :indent="getIndent(index)"
      :seperator="state.seperator"
      :whenSeperatorClicked="toggleExpand"
      :key="index"
    />
  </div>
</template>

<style scoped>
.files {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.errors {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.error {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
</style>
