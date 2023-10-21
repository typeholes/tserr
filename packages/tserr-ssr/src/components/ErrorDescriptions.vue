<script setup lang="ts">
import { states } from '../app/state/states';
</script>

<template>
  <div>

  <div v-for="desc in states.ErrDesc.keys.value" :key="desc">
  {{ desc }}:
  keys: {{  states.ErrDesc.get(desc)?.keys }}
  <pre> {{  states.ErrDesc.get(desc)?.template }} </pre>

  </div>
  </div>
</template>
