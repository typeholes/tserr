<script setup lang="ts">
import { schema } from '../../../tserr-common/src/index';
import DynamicError from './DynamicError.vue';
import { computed } from 'vue';

const values = computed(() => schema.Err.values());

const locations = computed(() => schema.ErrLocation.values());
</script>

<template>
  <div>
    <div v-for="(err, idx) in values" :key="idx">
      <DynamicError :err="err" />
    </div>
    <hr />
    <div v-for="(location, idx) in locations" :key="idx">
      Locations: {{ location }} err: {{ schema.ErrLocation.$.At.Err(location) }}
    </div>
  </div>
</template>
