<script setup lang="ts">
import { format } from 'prettier';
import parserTS from 'prettier/parser-typescript';
import type { Highlighter } from 'shiki';
import { computed, inject } from 'vue';
import { appState } from '../appState';


const codeTypes = {
  type: {
    stub: 'type __TSE_STUB__ =',
    cleanup: (s: string | undefined) =>
      s
        ?.replace(/ *type */, '')
        .replace(/ *__TSE_STUB__ */, '')
        .replace('>=', '>')
        .replace(/(<span[^>]*>\s*<\/span>)+/, ''),
  },
  signature: {
    stub: 'function ',
    cleanup: (s: string | undefined) => s?.replace(/function */, ''),
  },
} as const;

const props = defineProps<{
  code: string | undefined;
  registerHtml: (x: string | undefined) => void;
  codeType?: keyof typeof codeTypes;
}>();

const highlighter = inject<Highlighter>('highlighter');

const highlighted = computed(() => {
  const {stub, cleanup} = codeTypes[props.codeType??'type'];
  return cleanup(highlight(formatCode(`${stub} ${props.code}`)));
});

props.registerHtml(highlighted.value);

function highlight(code: string | undefined) {
  if (code === undefined) {
    return undefined;
  }
  if (highlighter) {
    return highlighter.codeToHtml(code, {
      lang: 'ts',
      theme: appState.shikiTheme,
    });
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
    try {
      let fixed = code.replaceAll('...', 'ⵈ');

      return format(fixed, {
        parser: 'typescript',
        plugins: [parserTS],
      });
    } catch (e) {
      return code;
      // return `${e}\n${code}`;
    }
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
