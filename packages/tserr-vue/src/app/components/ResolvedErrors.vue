<script setup lang="ts">
import { appState } from '../appState'
import ResolvedError from './ResolvedError.vue'
// import type { ResolvedError as ResolvedErrorType } from '../resolvedError'

function getErrors(fileName: string) {
  return appState.resolvedErrors.get(fileName)
}

// function getParsed(e: ResolvedErrorType, key: string) {
//   return e[key as keyof typeof e]
//   // <template v-for="parsed of err.parsed[key as keyof typeof err.parsed]" :key="parsed">
// }

</script>

<template>
  <div>
    <div class="files">
      <template v-for="fileName in appState.resolvedErrors.keys()" :key="fileName">
        <div>
          <hr />
          <span> {{ fileName }} </span>
          <!-- <pre>{{ getErrors(fileName) }}</pre> -->
          <div v-for="(err, idx) of getErrors(fileName)" :key="idx">
            <hr />
            <span> Line: {{ err.line }} </span>
            <!-- <pre> {{ err.lines.join('\n') }}</pre> -->
            <div class="parsedList" v-for="key of Object.keys(err.parsed)" :key="key">
              <!-- <pre> debug: {{ JSON.stringify(err.parsed[key as never]) }} </pre> -->
              <template v-for="parsed of err.parsed[key as keyof typeof err.parsed]" :key="parsed">
                <ResolvedError :parsed="parsed" />
              </template>
            </div>
          </div>
          <!-- <div
            class="errors"
            v-for="(group, idx) of appState.resolvedErrors.get(fileName)?.flat() ?? []"
            :key="idx"
          >
            <div
              class="error"
              v-for="error in group.filter(resolvedError.aliasSelfReferenceResult.allows) ?? []"
              :key="`${error}`"
            >
              <ResolvedError :error="(error as unknown as AliasSelfReferenceResult)" />
            </div>
          </div> -->
        </div>
      </template>
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

.parsedList {
  display: flex;
  flex-direction: column;
}
</style>
