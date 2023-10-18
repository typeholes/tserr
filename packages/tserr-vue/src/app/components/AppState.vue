<script setup lang="ts">
// import ProblemsView from './ProblemsView.vue';
import ResolvedErrors from './ResolvedErrors.vue';
import HtmlWithCode from './HtmlWithCode.vue';
import { positionInfo } from '../appState';
import { ref } from 'vue';
import ErrorFormatter from './ErrorFormatter.vue';
import { appState } from '../appState';

const splitAt = ref(100);
const horizontal = ref( true)
</script>

<template>
  <div class="appstate">
    <q-splitter v-model="splitAt" unit="px" :horizontal="horizontal" >
      <template v-slot:after>
        <ResolvedErrors />
      </template>
      <template v-slot:before>
        <template v-for="items in positionInfo">
          <q-list v-for="info in items.info">
            <HtmlWithCode :html="info" />
          </q-list>
        </template>
      </template>
      <template v-slot:separator>
        <q-icon size="sm" :name="horizontal ? 'vertical_split' : 'horizontal_split'" @click="horizontal = !horizontal"/>
      </template>
    </q-splitter>
    <ErrorFormatter v-if="!appState.connected"/>
  </div>
</template>

<style scoped>
.appstate {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100vw;
}
</style>
