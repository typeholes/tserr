<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { sendAllStates } from './app/state/states';

onMounted(() => {
  const $q = useQuasar();
  $q.onSSRHydrated!();
  sendAllStates!();
});
</script>
