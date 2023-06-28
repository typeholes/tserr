<script setup lang="ts">
import { appState } from '../appState';
import ResolvedError from './ResolvedError.vue';
// import type { PluginName, FileName} from '@typeholes/tserr-common';

import type { FlatErr } from '../resolvedError';

// import type { ResolvedError as ResolvedErrorType } from '../resolvedError'

function groupErrors(errors: FlatErr[]) {
  return groupBy(errors, (e) => e.line);
}

function groupBy<T, U extends number | string>(
  ts: T[],
  by: (t: T) => U
): [U, T[]][] {
  const entries = ts
    .map((t) => [by(t), t] as const)
    .sort((a, b) => (a[0] > b[0] ? 1 : 0));
  const ret: [U, T[]][] = [];
  let last: undefined | U = undefined;
  let idx = -1;
  for (const pair of entries) {
    if (pair[0] != last) {
      ret[++idx] = [pair[0], []];
    }
    last = pair[0];
    ret[idx][1].push(pair[1]);
  }
  console.log(groupBy, ret);
  return ret;
}

function relativePath(name: string) {
  return name.startsWith(appState.projectRoot) ? name.replace(appState.projectRoot,'.') : name;
}

// function getParsed(e: ResolvedErrorType, key: string) {
//   return e[key as keyof typeof e]
//   // <template v-for="parsed of err.parsed[key as keyof typeof err.parsed]" :key="parsed">
// }
</script>

<template>
  <div>
    <div class="files">
      <q-list>
        <template
          v-for="(map, fileName) in appState.resolvedErrors"
          :key="fileName"
        >
          <q-expansion-item :label="relativePath(fileName)">
          <!-- <q-expansion-item :label="fileName"> -->
            <q-list dense>
              <template v-for="(errors, pluginName) in map" :key="pluginName">
                <q-expansion-item :label="pluginName" dense >
                  <q-list dense>
                    <template
                      v-for="(errs, _idx) of groupErrors(errors)"
                      :key="_idx"
                    >
                      <q-expansion-item
                        :label="'Line: ' + errs[0]"
                        class="mt0 pt0"
                      >
                        <div>
                          <!-- <pre> {{ err.lines.join('\n') }}</pre> -->
                          <template v-for="err of errs[1]" :key="err">
                            <ResolvedError :err="err" :fileName="fileName" />
                          </template>
                        </div>
                      </q-expansion-item>
                    </template>
                  </q-list>
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
                </q-expansion-item>
              </template>
            </q-list>
          </q-expansion-item>
        </template>
      </q-list>
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
