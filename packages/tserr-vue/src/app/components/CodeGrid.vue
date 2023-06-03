<script setup lang="ts">
import CodeBlock from './CodeBlock.vue';

const props = defineProps<{
  blocks: [label: string, code: string][];
  headerKey: string;
}>();
</script>

<template>
  <div class="codeGrid">
    <template v-for="entry of props.blocks" :key="entry">
      <div class="codeColumn" v-if="entry[0] !== props.headerKey">
        <div>{{ entry[0] }}</div>
        <CodeBlock :code="entry[1]" />
      </div>
    </template>
  </div>
</template>

<style scoped>

.codeGrid {
  display: flex;
  gap: .5rem;
}

.codeColumn {
  border: 1px solid green ;
}

</style>
