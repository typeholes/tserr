<template>
  <q-page class="col items-center justify-evenly">
    <AllErrors />
    <hr>
    <ErrorDescriptions/>
  </q-page>
</template>

<script setup lang="ts">
import ErrorDescriptions from 'src/components/ErrorDescriptions.vue';
import AllErrors from '../components/AllErrors.vue';
</script>

<style>
.bordered {
  border: 1px green solid;
}
</style>
