<script setup lang="ts">
import { format } from 'prettier';
import parserTS from 'prettier/parser-typescript';
import type { Highlighter } from 'shiki';
import { inject } from 'vue';

const props = defineProps<{
  code: string | undefined;
  registerHtml: (x: string | undefined) => void;
}>();

const highlighter = inject<Highlighter>('highlighter');

const highlighted = highlight(formatCode(props.code));

props.registerHtml(highlighted);

function highlight(code: string | undefined) {
  if ( code === undefined) { return undefined; }
  if (highlighter) {
    return highlighter.codeToHtml(code, { lang: 'ts' });
  }
  return code;
}

function formatCode(code: string | undefined) {
  if ( code === undefined) { return undefined; }
  try {
    return format(`declare const __TSE_STUB__: ${code}`, {
      parser: 'typescript',
      plugins: [parserTS],
    }).replace(/declare const __TSE_STUB__:\s+/, '');
  } catch (e) {
    return code;
    // return `${e}\n${code}`;
  }
}
</script>

<template>
  <div class="row">
    <code>
      <div v-html="highlighted" />
    </code>
  </div>
</template>

<style scoped>
table,
th,
td {
  border: 1px solid rgb(105, 129, 0);
  border-collapse: collapse;
  padding-left: 0.3rem;
  padding-right: 0.3rem;
  align-content: top;
}

td {
  width: max-content;
  vertical-align: top;
}

table {
  width: max-content;
}

.row {
  display: flex;
  flex-direction: row;
  gap: 0.1rem;
}

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
