<script setup lang="ts">
import { schema, Err } from '../../../tserr-common/src/index';
import { compile, computed } from 'vue';

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
