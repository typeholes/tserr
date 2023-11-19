<script setup lang="ts">
import { ErrDesc, } from '@typeholes/tserr-common'

import { computed, ref } from 'vue';
import CodeBlock from './CodeBlock.vue';
import TemplateEditor from './TemplateEditor.vue';

const schema = window.tserrSchema.schema;

const values = computed(() =>
  schema.ErrDesc.values().filter((x) => x.name.includes(filterStr.value)),
);

const filterStr = ref('');

const editing = ref(undefined as undefined | ErrDesc);
</script>

<template>
  <div>
    <div v-if="editing">
      <TemplateEditor :err-desc="editing" @cancel="editing = undefined" />
    </div>
    <q-input label="Filter error descriptions" v-model="filterStr" />
    <!-- <div v-for="desc in states.ErrDesc.values()" :key="desc.name"> -->
    <q-virtual-scroll
      :items="values"
      separator
      v-slot="{ item, index }"
      style="max-height: 50vh"
    >
      <q-expansion-item :label="item.name" :key="index">
        <CodeBlock :code="item.template" lang="html" />
        <q-btn label="Edit Template" @click="editing = item" />
      </q-expansion-item>
    </q-virtual-scroll>
  </div>
</template>

<style scoped>
.key-name {
  border: 1px solid rgb(0, 238, 255);
  width: fit-content;
}
</style>
