<script setup lang="ts">
import { ErrState } from 'src/app/state/ErrState';
import DynamicError from './DynamicError.vue';
</script>

<template>
  <div>
    <div v-for="key in ErrState.keys.value" :key="key">
      <DynamicError :err="ErrState.get(key)" />
    </div>
  </div>
</template>
