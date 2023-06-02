<script setup lang="ts">
import { appState, type Diagnostic } from '@/appState'
import { emit } from '@/socket'
import ProblemView from './ProblemView.vue'

function problemClick(e: MouseEvent, filename: string, diagnostic: Diagnostic) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (el && el.textContent) {
    console.log('found element:', el)
    emit(
      'gotoDefinition',
      () => {},
      () => {},
      filename,
      el.textContent,
      diagnostic
    )
  }
}
</script>

<template>
  <div>
    <div class="files">
      <template v-for="fileName in appState.diagnostics.keys()" :key="fileName">
        <div>
          <hr />
          <span> {{ fileName }} </span>
          <!-- <pre> {{ JSON.stringify(appState.diagnostics.get(fileName), null, 2) }} </pre> -->
          <div class="errors">
            <div
              class="error"
              v-for="diagnostic in appState.diagnostics.get(fileName) ?? []"
              :key="`${diagnostic}`"
              @click="(e) => problemClick(e, fileName, diagnostic)"
            >
              <ProblemView :diagnostic="diagnostic" />
            </div>
          </div></div
      ></template>
    </div>
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
