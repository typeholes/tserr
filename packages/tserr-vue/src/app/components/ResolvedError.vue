<script setup lang="ts">
import { computed } from 'vue';
import CodeGrid from './CodeGrid.vue';
import { FlatErrKey, FlatErrValue, uniqObjects } from '@typeholes/tserr-common';
// import { appState } from '../appState';
// import { inject } from 'vue';
// import { Emitters } from '../socket';
// import DisplaySupplement from './DisplaySupplement.vue';

const props = defineProps<{
  errKey: FlatErrKey;
  errValue: FlatErrValue;
}>();

// const emitters = inject<Emitters>('emitters');
const counts = computed(() => {
  const ret = Object.values(props.errValue.sources)
    .map((x) => Object.values(x))
    .flat()
    .map((x) => Object.values(x))
    .flat()
    .length / props.errKey.length;

  return ret;
});

const summary = computed(() => {
  const files = Object.entries(props.errValue.sources)[0][1];
  const raw = Object.entries(files)[0][1][0].raw;
  return raw[raw.length - 1];
});

// const spans = computed(() => {
//   const ret: Record<string, Span[]> = {};

//   for (const span of Object.values(props.err.sources)
//     .map((x) => x.map((y) => y.span))
//     .flat()) {
//     ret[span.fileName] ??= [];
//     ret[span.fileName].push(span);
//   }

//   return Object.entries(ret);
// });

function unknownPartsToBlock(parts: string[]): [string, string][] {
  if (parts[0] === '') {
    parts.shift();
  }
  if (parts.length === 2) {
    return [[parts[1], parts[0]]];
  }
  const evens = parts.filter((_, i) => i % 2 === 0);
  const blocks = evens.map((k, i) => {
    const entry = [k, parts[i * 2 + 1]] as [string, string];
    return entry;
  });
  return blocks;
}

function problemClick(e: MouseEvent) {
  console.log(e);
  /*
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
  */
}
</script>

<template>
  <div class="row">
    <q-expansion-item :label="`cnt: ${counts} - ${summary}`">
      <div class="column reverse">
      <div
        class="row"
        @click="problemClick"
        v-for="(parsed, idx) of props.errKey"
        :key="idx"
      >
        <div :style="{ minWidth: 'contents' }">{{ parsed.value.type }}</div>
        <!-- <div :style="{ minWidth: `${parsed[1] ?? 0}rem` }"></div> -->
        <!-- <span v-if="props.parsed[2].type === 'unknownError'">
      {{ props.parsed[2].parts }}
    </span> -->
        <div cols="">
          <CodeGrid
            :blocks="Object.entries(parsed.value)"
            header-key="type"
            v-if="
              ['notAssignable', 'excessProperty'].includes(parsed.value.type)
            "
          />
          <CodeGrid
            :blocks="unknownPartsToBlock(parsed.value.parts)"
            header-key=""
            v-if="parsed.value.type === 'unknownError'"
          />
        </div>

        <!-- <div
      cols=""
      class="supplements"
      v-for="text in appState.supplements[parsed[0]]"
      :key="text"
    >
      <DisplaySupplement :text="text" />
    </div> -->
        <!-- <div>
      <div v-for="fix of appState.fixes[parsed[0]]" :key="fix[0]">
        <button @click="emitters?.applyFix(fix[0])">
          {{ fix[1] }}
        </button>
      </div>
    </div> -->
        <!-- </div> -->
      </div>
      </div>
      <template v-for="(files, _plugin) in errValue.sources">
        <q-list v-for="(items, file) in files">
          <q-item>
            <q-expansion-item :label="`${file} (${items.length / props.errKey.length})`">
              <q-list v-for="span of uniqObjects(items.map((x) => x.span))">
                <q-item v-if="span.start.line = span.end.line"> Line: {{span.start.line}} char: {{ span.start.char }} </q-item>
                <q-item v-else> Line: {{ span.start.line }} -> {{ span.end.line }} </q-item>
              </q-list>
            </q-expansion-item>
          </q-item>
        </q-list>
      </template>
    </q-expansion-item>
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
