<script setup lang="ts">
import ResolvedError from './ResolvedError.vue';
import { computed, ref, ComputedRef } from 'vue';
import { FlatErrKey, parseError } from '@typeholes/tserr-common';

const src = ref("Type 'number' is not assignable to type 'string'");

const err: ComputedRef<FlatErrKey> = computed(() =>
  src.value
    .split('\n')
    .map((txt, depth) => ({ depth, value: parseError(txt) })),
);
</script>

<template>
  <div>
    <q-input label="Paste an error message" type="textarea" v-model="src" />

    {{ err }}

    <ResolvedError
      :err-key="err"
      :err-value="{ sources: { foo: { bar: [] } } } as never"
    />
  </div>
</template>
