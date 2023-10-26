<template>
  <q-page class="col items-center justify-evenly">
    <AllErrors :key="stateNum" />
    <hr />
    <ErrorDescriptions :key="stateNum" />
    {{ states }}
  </q-page>
</template>

<script setup lang="ts">
import ErrorDescriptions from 'src/components/ErrorDescriptions.vue';
import AllErrors from '../components/AllErrors.vue';
import { states } from 'src/app/state/states';
import { stateNum } from 'src/boot/clientSocket';
</script>

<style>
.bordered {
  border: 1px green solid;
}
</style>
