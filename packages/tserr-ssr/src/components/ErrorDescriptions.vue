<script setup lang="ts">
import { schema } from '../../../tserr-common/src/index';

import { computed } from 'vue';

const values = computed(() => schema.ErrDesc.values(), {
  onTrack(event) {
    console.log('trigger', event);
  },
  onTrigger(event) {
    console.log('trigger', event);
  },
});
</script>

<template>
  <div>
    <!-- <div v-for="desc in states.ErrDesc.values()" :key="desc.name"> -->
    <div v-for="desc in values" :key="desc.name">
      {{ desc }}: keys: {{ desc.keys }}
      <pre> {{ desc.template }} </pre>
    </div>
  </div>
</template>
