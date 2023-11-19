<script setup lang="ts">
import {  Err } from '@typeholes/tserr-common'
import { compile, computed } from 'vue';

const schema = window.tserrSchema.schema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ err: Err<any> | undefined }>();

const desc = schema.ErrDesc.getByKeys(props.err?.name);

const component = computed(() =>
  desc === undefined
    ? undefined
    : compile(desc.template ?? `<div> ${desc} </div>`),
);
</script>

<template>
  <div v-if="err">
    <component :is="component" :err="props.err" />
  </div>
</template>
