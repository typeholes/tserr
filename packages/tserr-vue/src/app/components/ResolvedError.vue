<script setup lang="ts">
import CodeGrid from './CodeGrid.vue';
import type { FlatErr } from '../resolvedError';
import { appState } from '../appState';
import { inject } from 'vue';
import { Emitters } from '../socket';
import DisplaySupplement from './DisplaySupplement.vue';

const props = defineProps<{
  err: FlatErr;
  fileName: string;
}>();

const emitters = inject<Emitters>('emitters');

function unknownPartsToBlock(parts: string[]) {
  const evens = parts.filter((_, i) => i % 2 === 0);
  const blocks = evens.map((k, i) => {
    const entry = [k, parts[i * 2 + 1]] as [string, string];
    return entry;
  });
  return blocks;
}

function problemClick(e: MouseEvent) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el && el.textContent) {
    console.log('found element:', el);
    console.log(
      'calling gotoDefinition',
      props.fileName,
      el.textContent,
      props.err.line
    );
    emitters?.gotoDefinition(
      props.fileName,
      el.textContent,
      props.err.line,
      props.err.endLine
    );
  }
}
</script>

<template>
  <v-row
    no-gutters
    @click="problemClick"
    v-for="(parsed, idx) of props.err.parsed"
    :key="idx"
  >
    <v-col cols="12" :style="{ minWidth: 'contents'}" >{{ parsed[2].type }}</v-col>
    <!-- <v-col :style="{ minWidth: `${parsed[1] ?? 0}rem` }"></v-col> -->
    <!-- <span v-if="props.parsed[2].type === 'unknownError'">
      {{ props.parsed[2].parts }}
    </span> -->
    <v-col cols="">
      <v-container>
        <!-- <span v-if="parsed[2].type === 'aliasSelfReference'">
          {{ parsed[2].from }}
        </span> -->
        <CodeGrid
          :blocks="Object.entries(parsed[2])"
          header-key="type"
          v-if="['notAssignable', 'excessProperty'].includes(parsed[2].type)"
        />
        <CodeGrid
          :blocks="unknownPartsToBlock(parsed[2].parts)"
          header-key=""
          v-if="parsed[2].type === 'unknownError'"
        />
      </v-container>
    </v-col>
    <v-col
    cols=""
      class="supplements"
      v-for="text in appState.supplements[parsed[0]]"
      :key="text"
    >
      <DisplaySupplement :text="text" />
    </v-col>
    <v-col
      ><v-container>
        <v-row v-for="fix of appState.fixes[parsed[0]]" :key="fix[0]">
          <button @click="emitters?.applyFix(fix[0])">
            {{ fix[1] }}
          </button>
        </v-row>
      </v-container></v-col
    >
    <!-- </div> -->
  </v-row>
</template>

<style scoped>
.row {
  display: flex;
  gap: 0.24rem;
}

button {
  background-color: rgb(5, 48, 24);
  color: white;
  box-shadow: 0.1rem 0.1rem 0.2rem rgb(9, 93, 47);
}

.supplements {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.fixes {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
</style>
