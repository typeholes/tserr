<script setup lang="ts">
import { Err } from 'src/app/ErrDesc';
import { ErrDescState } from 'src/app/state/ErrDescState';
import { compile, computed } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ err: Err<any> | undefined }>();

const desc = ErrDescState.get(props.err?.name);

const component = computed(() =>
  desc === undefined
    ? undefined
    : compile(desc.template ?? `<div> ${desc.name} </div>`),
);
</script>

<template>
  <div v-if="err">
    <component :is="component" :err="props.err" />
  </div>
</template>
