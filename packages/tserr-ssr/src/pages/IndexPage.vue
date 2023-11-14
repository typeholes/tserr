<template>
  <q-page class="col items-center justify-evenly">
    <AllErrors :key="stateNum" />
    <hr />
    <ErrorDescriptions :key="stateNum" />
    {{ schema }}
  </q-page>
</template>

<script setup lang="ts">
import ErrorDescriptions from 'src/components/ErrorDescriptions.vue';
import AllErrors from '../components/AllErrors.vue';
import { schema } from '../../../tserr-common/src/index';
import { stateNum } from 'src/boot/clientSocket';

setTimeout(() => {
   stateNum.value++;
}, 500);
</script>

<style>
.bordered {
  border: 1px green solid;
}
</style>
