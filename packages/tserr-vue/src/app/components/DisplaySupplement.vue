<script setup lang="ts">
import DisplaySupplement from '../supplement';
import CodeGrid from './CodeGrid.vue';

const props = defineProps<{ text: string }>();

function getObj() {
  try {
    const obj = JSON.parse(props.text);
    return obj;
  } catch (e) {
    return props.text;
  }
}

const obj = getObj();
</script>

<template>
  <div>
    <DisplaySupplement :data="obj">
      <template #text="{ text }">
        <span> {{ text }}</span>
      </template>
      <template #overloadPiece="{ overloadPiece }">
        <CodeGrid
          :blocks="[[
            `Overload ${overloadPiece.idx} of ${overloadPiece.length}`,
            `${overloadPiece.functionName}${overloadPiece.signature}`,
            'signature'
          ]]"
        />
      </template>
    </DisplaySupplement>
  </div>
</template>
