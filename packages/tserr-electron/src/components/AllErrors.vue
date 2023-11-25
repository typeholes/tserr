<script setup lang="ts">
import DynamicError from './DynamicError.vue';
import { computed } from 'vue';
import CodeBlock from './CodeBlock.vue';

const schema = window.tserrSchema.schema;

const locations = computed(() => {
  return schema.ErrLocation.values();
});
</script>

<template>
  <div>
    <div v-for="(location, idx) in locations" :key="idx">
      <div class="column">
        <div>{{ location.fileName }}</div>
        <div class="row align-center">
          <div>Line: {{ location.span.start.line }}</div>
          <CodeBlock v-if="location.lineSrc" :code="location.lineSrc" />
        </div>

        <!-- err: {{ schema.ErrLocation.$.At.Err(location) }} -->
        <template
          v-for="(err, errIdx) of schema.ErrLocation.$.At.Err(location)"
          :key="errIdx"
        >
          <DynamicError :err="err" />
        </template>
      </div>
    </div>
  </div>
</template>
