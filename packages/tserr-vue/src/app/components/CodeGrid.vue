<script setup lang="ts">
import { reactive } from 'vue';
import CodeBlock from './CodeBlock.vue';
import diff from 'html-diff-ts';

const props = defineProps<{
  blocks: [label: string, code: string][];
  headerKey: string;
}>();

const compares = reactive({
  left: undefined as string | undefined,
  right: undefined as string | undefined,
  diff: undefined as string | undefined,
});

function setCompare(x: string | undefined) {
  if (compares.left !== undefined) {
    if (compares.right ??= x) {
      compares.diff = diff(compares.left, compares.right ?? '');
    }
    return;
  }
  compares.left ??= x;
}
</script>

<template>
  <div class="codeGrid">
    <template v-for="entry of props.blocks" :key="entryObject">
      <div class="codeColumn" v-if="entry[0] !== props.headerKey">
        <div>{{ entry[0] }}</div>
        <CodeBlock :code="entry[1]" :registerHtml="['from','to'].includes(entry[0]) ? setCompare : ()=>{}" />
      </div>
    </template>
    <div class="diff">
      <div v-html="compares.diff"></div>
    </div>
  </div>
</template>

<style scoped>
.codeGrid {
  display: flex;
  gap: 0.5rem;
}

.codeColumn {
  border: 1px solid green;
}

.diff {
  white-space: pre-wrap;
  text-align: left;
  max-height: 30rem;
  overflow-y: auto;
  display: inline-block;
  scrollbar-width: none;
}

.diff::-webkit-scrollbar {
  /* WebKit */
  width: 0;
  height: 0;
}
</style>
