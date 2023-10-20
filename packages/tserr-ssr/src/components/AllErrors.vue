<script setup lang="ts">
import { states } from 'src/app/state/states';
import DynamicError from './DynamicError.vue';
</script>

<template>
  <div>
    <div v-for="key in states.Err.keys.value" :key="key">
      <DynamicError :err="states.Err.get(key)" />
    </div>
  </div>
</template>
