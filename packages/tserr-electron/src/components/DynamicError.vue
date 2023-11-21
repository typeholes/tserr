<script setup lang="ts">
import {  Err } from '@typeholes/tserr-common'
import { compile, computed } from 'vue';
import CodeBlock from './CodeBlock.vue';

const schema = window.tserrSchema.schema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ err: Err<any> | undefined }>();

const desc = schema.ErrDesc.getByKeys(props.err?.name);

const component = computed(() =>
    compile(desc?.template ?? `<div> ${props.err?.name ?? 'Missing Error'} </div>`),
);

function unknownCodeString() {
  return JSON.stringify(props.err?.values);
}

</script>

<template>
  <div v-if="err">
    <div v-if="err.name==='UnknownError'">
      <div>Unknown Error</div>
      <CodeBlock :code="unknownCodeString()" code-type="type" lang="ts" pretty />
    </div>
    <div v-else>
    <component :is="component" :err="props.err" />
    </div>
  </div>
</template>
