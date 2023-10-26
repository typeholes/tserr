<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { getAllStates } from './boot/clientSocket';

onMounted(() => {
  const $q = useQuasar();
  $q.onSSRHydrated!();
  console.log('hydrated');
  getAllStates();
});
</script>
