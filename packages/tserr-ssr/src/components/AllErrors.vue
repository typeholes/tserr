<script setup lang="ts">
import { schema } from '../../../tserr-common/src/index';
import DynamicError from './DynamicError.vue';
import { computed } from 'vue';
import { stateNum } from 'src/boot/clientSocket';

const values = computed(() => schema.Err.values());

const locations = computed(() => schema.ErrLocation.values());
</script>

<template>
  <div :key="stateNum">
    <q-btn label="refresh view" @click="stateNum++"/>
    --------
    <div v-for="(err, idx) in values" :key="idx">
      <DynamicError :err="err" />
    </div> 
    <hr />
    <div v-for="(location, idx) in locations" :key="idx">
      {{ location.fileName }}
      <!-- err: {{ schema.ErrLocation.$.At.Err(location) }} -->
      <template v-for="err of schema.ErrLocation.$.At.Err(location)" :key="err.name">
      <DynamicError :err="err" />
      </template>
    </div>

    <!-- <div :key="stateNum">
      {{ locations }}
    </div> -->
  </div>
</template>
