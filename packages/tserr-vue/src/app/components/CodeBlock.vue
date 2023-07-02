<script setup lang="ts">
import { format } from 'prettier';
import parserTS from 'prettier/parser-typescript';
import type { Highlighter } from 'shiki';
import { inject } from 'vue';

// const stub = 'declare const __TSE_STUB__:';
const stub = 'type __TSE_STUB__ =';

const props = defineProps<{
  code: string | undefined;
  registerHtml: (x: string | undefined) => void;
}>();

const highlighter = inject<Highlighter>('highlighter');

const highlighted = highlight(formatCode(`${stub} ${props.code}`))
  ?.replace(/ *type */, '')
  .replace(/ *__TSE_STUB__ */, '')
  .replace('= ', '')
  .replace(/(<span[^>]*>\s*<\/span>)+/,'')

props.registerHtml(highlighted);

function highlight(code: string | undefined) {
  if (code === undefined) {
    return undefined;
  }
  if (highlighter) {
    return highlighter.codeToHtml(code, { lang: 'ts' });
  }
  return code;
}

function formatCode(code: string | undefined) {
  if (code === undefined) {
    return undefined;
  }
  try {
    return format(code, {
      parser: 'typescript',
      plugins: [parserTS],
    });
  } catch (e) {
    return code;
    // return `${e}\n${code}`;
  }
}
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
