<template>
  <q-page class="row items-center justify-evenly">
    <div>todo</div>
    <AllErrors />
  </q-page>
</template>

<script setup lang="ts">
import AllErrors from '../components/AllErrors.vue';
</script>

<style>
.bordered {
  border: 1px green solid;
}
</style>
