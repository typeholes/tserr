<script setup lang="ts">
import { computed } from 'vue';
import { CodeType,  prettyCode } from '../app/prettyCode'

const props = defineProps<{
  code: string | undefined;
  codeType?: CodeType;
  pretty?: boolean
}>();

const highlighted = computed(() =>
  prettyCode(props.code ?? '', props.codeType, props.pretty ?? true),
);

</script>

<template>
  <code>
    <div v-html="highlighted" />
  </code>
</template>

<style scoped>
code {
  white-space: pre-wrap;
  text-align: left;
  max-height: 30rem;
  overflow-y: auto;
  display: inline-block;
  scrollbar-width: none;
}

code::-webkit-scrollbar {
  /* WebKit */
  width: 0;
  height: 0;
}
</style>
