<template>
  <q-page class="row items-center justify-evenly">
    <div>todo</div>
    <AllErrors />
    dummy: {{ dummy }}
    {{  [...__private_errors.keys()] }}
  </q-page>
</template>

<script setup lang="ts">
import AllErrors from '../components/AllErrors.vue';
import { dummy } from '../app/state/dummyState';
import { __private_errors } from 'src/app/state/ErrState';

</script>

<style>
.bordered {
  border: 1px green solid;
}
</style>
