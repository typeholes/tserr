<script setup lang="ts">
import { appState } from '../appState';
import ResolvedError from './ResolvedError.vue';


// function getParsed(e: ResolvedErrorType, key: string) {
//   return e[key as keyof typeof e]
//   // <template v-for="parsed of err.parsed[key as keyof typeof err.parsed]" :key="parsed">
// }
</script>

<template>
  <div>
    <div class="files">
          <q-expansion-item label="---">
                  <q-list dense>
                    <template
                      v-for="(err, _idx) of appState.resolvedErrors"
                      :key="_idx"
                    >
                        <div>
                            <ResolvedError :errKey="err[0]" :errValue="err[1]" />
                        </div>
                    </template>
                  </q-list>
          </q-expansion-item>
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
