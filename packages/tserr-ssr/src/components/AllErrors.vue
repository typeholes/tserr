<script setup lang="ts">
import { states } from 'src/app/state/states';
import DynamicError from './DynamicError.vue';
import { computed } from 'vue';

const values = computed(() => states.Err.values());
</script>

<template>
  <div>
    <div v-for="(err, idx) in values" :key="idx">
      <DynamicError :err="err" />
    </div>
  </div>
</template>
