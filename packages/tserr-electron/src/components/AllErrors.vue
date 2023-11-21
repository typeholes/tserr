<script setup lang="ts">
import DynamicError from './DynamicError.vue';
import { computed } from 'vue';

const schema = window.tserrSchema.schema;


const locations = computed(() => {
   return schema.ErrLocation.values();
});
</script>

<template>
  <div>
    <div v-for="(location, idx) in locations" :key="idx">
      {{ location.fileName }}
      {{ location.span.start.line }}
      <!-- err: {{ schema.ErrLocation.$.At.Err(location) }} -->
      <template
        v-for="(err, errIdx) of schema.ErrLocation.$.At.Err(location)"
        :key="errIdx"
      >
        <DynamicError :err="err" />
      </template>
    </div>

  </div>
</template>
