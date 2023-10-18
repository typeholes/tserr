<script setup lang="ts">
import { prettyCode } from '../prettyCode';
import { marked } from 'marked';

const props = defineProps<{ html: string }>();

// const parts = props.html.split('```').map((part, idx) => {
//   if (idx % 2 === 1) {
//     if (part.startsWith('ts')) {
//       return prettyCode(part.substring(3));
//     }

//     if (part.startsWith('typescript')) {
//       return prettyCode(part.substring(10));
//     }

//     return part;
//   }

//   return part;
// });

// const rendered = marked(parts.join('\n'), { sanitize: false, gfm: true });

const rendered = marked(props.html, {
  sanitize: false,
  gfm: true,
  highlight: (code) => prettyCode(code),
});
</script>

<template>
  <div v-html="rendered" />
</template>
