<script setup lang="ts">
import type { Type, UnionOrIntersectionType } from 'typescript';

import type { _Type } from '../app/expando';

const ts = window.tserrFileApi.ts;
const flags = ts.TypeFlags;

const props = defineProps<{ type: Type }>();

const checker = props.type.checker;

const arrayElementType = checker.getElementTypeOfArrayType(props.type);

const sep = props.type.flags & flags.Union ? ' | ' : ' & ';
const unionOrIntersection =
  props.type.flags & flags.UnionOrIntersection
    ? (props.type as UnionOrIntersectionType)
    : undefined;

const typeNode = checker.typeToTypeNode(props.type, undefined, undefined );



</script>

<template>
  <div>
    <div v-if="arrayElementType">
      <ts-type :type="arrayElementType" /><span>[]</span>
    </div>
    <div v-if="unionOrIntersection">
      <template v-for="(operand, idx) of unionOrIntersection.types" :key="idx">
        <span v-if="idx > 0"> {{ sep }} </span> <ts-type :type="operand" />
      </template>
    </div>
    <div v-else></div>
  </div>
</template>
