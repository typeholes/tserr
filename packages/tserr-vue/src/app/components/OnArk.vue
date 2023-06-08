<script setup lang="ts" generic="T extends {}">
import { Space } from 'arktype';
import { reactive } from 'vue';

const props = defineProps<{  space: Space<T>; data: unknown }>();
const names : (keyof typeof props.space)[] = reactive([]);

const data = props.data;

for (const k in props.space) {
  names.push( k);
}

function getValue<K extends keyof typeof props.space>( x: unknown, name: K)  {
  type T = (typeof props.space)[K]['infer'];
  return  props.space[name].allows(x) ? x as T : undefined;
}


</script>

<template>
  <div>

    <template v-for="name of names" :key="name">
      <span> name: {{ name }}   </span>
      <slot :name="name" v-bind="getValue(data, name)">
      </slot>
    </template>
        <slot name="stringSlot" :string="'s'"> </slot>
        <slot name="numberSlot" :number="1"> </slot>
  </div>
</template>
