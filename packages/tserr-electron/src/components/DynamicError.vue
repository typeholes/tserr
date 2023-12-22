<script setup lang="ts">
import type { Err } from '@typeholes/tserr-common';
import { compile, computed, reactive } from 'vue';
import CodeBlock from './CodeBlock.vue';

import { matClose } from '@quasar/extras/material-icons';

const schema = window.tserrSchema.schema;

import type { Symbol, Node, Type, ObjectType } from 'typescript';
import { expando } from 'src/app/expando';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ err: Err<any> | undefined }>();

const desc = schema.ErrDesc.getByKeys(props.err?.name);

const component = computed(() =>
  compile(
    desc?.template ?? `<div> ${props.err?.name ?? 'Missing Error'} </div>`,
  ),
);

function unknownCodeString() {
  return JSON.stringify(props.err?.values);
}

const ts = window.tserrFileApi.ts;
const printer = ts.createPrinter();
const printNode = (n: Node) =>
  printer.printNode(ts.EmitHint.Unspecified, n, n.getSourceFile());

const selected = reactive({
  menuOpen: false,
  clicked: undefined as undefined | RealDiagnosticArgument,
  arg: undefined as undefined | RealDiagnosticArgument,
  stickySource: undefined as undefined | string,
  stickyType: 'raw' as 'raw' | 'type' | 'signature',
  expandedType: undefined as undefined | string,
});

function clearSticky() {
  console.log('clearing sticky');
  selected.stickySource = undefined;
  selected.expandedType = undefined;
}

type RealDiagnosticArgument = {
  cacheId: number | undefined;
  text: string;
  type: 'Node' | 'Symbol' | 'Signature' | 'Type' | 'TypePredicate' | 'string';
};

function matchMessageParts() {
  const entries = [] as [string, [string, RealDiagnosticArgument]][];
  let entry = [undefined, undefined] as [
    string | undefined,
    [string, RealDiagnosticArgument] | undefined,
  ];

  if (!props.err) return [];
  let argIdx = -1;
  const parts = (props.err.values.msg as string).split(/('[^']*')/);
  parts.forEach((part) => {
    let arg;
    if (part.startsWith("'")) {
      argIdx++;
      arg = props.err?.values[argIdx] as string | RealDiagnosticArgument;
      entry[1] = [
        'type',
        typeof arg === 'object' && 'cacheId' in arg
          ? arg
          : {
              cacheId: undefined,
              type: 'string',
              text:
                arg === undefined
                  ? part
                  : `${arg}`.replaceAll(/(^') | ('$)/g, ''),
            },
      ];
    } else {
      entry[0] = part;
    }

    if (entry[0] && entry[1]) {
      entries.push(entry as any);
      entry = [undefined, undefined];
    }
  });

  if (entry[0] && !entry[1]) {
    entry[1] = ['text', { cacheId: undefined, text: '', type: 'string' }];
    entries.push(entry as any);
  }

  if (!entry[0] && entry[1]) {
    entry[0] = '';
    entries.push(entry as any);
  }

  return entries;

  //  return (window.tserrFileApi as any).ts.getDiagnosticArgValue(n);
}

function getValueDefinition(arg: RealDiagnosticArgument) {
  if (arg.cacheId !== undefined) {
    const argValue = window.tserrFileApi.ts.getDiagnosticArgValue(arg.cacheId);

    let srcText = '';
    // eslint-disable-next-line @typescript-eslint/ban-types
    if ((argValue as Symbol).valueDeclaration) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const sym = argValue as Symbol;
      if (sym.valueDeclaration) {
        srcText = printNode(sym.valueDeclaration);
        selected.stickyType = 'raw';
        selected.stickySource = srcText;
        return;
      }
    }
  }

  selected.stickySource = undefined;
}

function selectArg(arg: RealDiagnosticArgument) {
  if (arg.cacheId === undefined) return;
  selected.clicked = arg;
  console.log('selected');
}
function onShow() {
  if (!selected.clicked) {
    selected.menuOpen = false;
    selected.arg = undefined;
    return;
  }
  selected.arg = selected.clicked;
  selected.clicked = undefined;
  console.log('menu opened');
}

function expandType(arg: RealDiagnosticArgument) {
  selected.stickySource = undefined;
  if (arg.cacheId == undefined) return;
  const type = window.tserrFileApi.ts.getDiagnosticArgValue(
    arg.cacheId,
  ) as Type;
  selected.stickyType = 'type';
  selected.stickySource = expando(type);
}
</script>

<template>
  <div v-if="err">
    <q-menu
      auto-close
      touch-position
      @show="onShow"
      v-model="selected.menuOpen"
    >
      <q-list v-if="selected.arg && selected.arg.cacheId !== undefined">
        <q-item
          v-if="selected.arg.type === 'Symbol'"
          clickable
          @click="getValueDefinition(selected.arg)"
        >
          Value Definition
        </q-item>
        <q-item
          v-if="selected.arg.type === 'Type'"
          clickable
          @click="expandType(selected.arg)"
        >
          Expand Type
        </q-item>
      </q-list>
    </q-menu>
    <q-page-sticky position="top-right" v-if="selected.stickySource">
      <div class="row">
        <q-icon clickable :name="matClose" @click="clearSticky" />
        <CodeBlock
          v-if="selected.stickySource"
          :code="selected.stickySource"
          :code-type="selected.stickyType"
        />
      </div>
    </q-page-sticky>
    <div v-if="err.name === 'UnknownError'">
      <div>Unknown Error</div>
      <CodeBlock
        :code="unknownCodeString()"
        code-type="type"
        lang="ts"
        pretty
      />
    </div>
    <div v-if="err.name === 'FakeError'">
      <!-- <div>
        {{ err.values.msg }}
      </div> -->
      <div class="row" style="boder: 1px solid purple">
        <div
          v-for="(part, idx) of matchMessageParts()"
          :key="idx"
          class="column"
          style="border: 1px solid blue"
        >
          <div style="border-bottom: 1px dashed blue">
            {{ part[0] }}
          </div>
          <div v-if="part[1][0] === 'type' && part[1][1]">
            <CodeBlock :code="(part[0][1] as any).text" code-type="type" />
          </div>
          <div v-else></div>
          <div @click="selectArg(part[1][1])">
            <CodeBlock v-if="part[1][0] === 'type'" :code="part[1][1].text" />
            <div v-else>{{ part[1][1].text }}</div>
          </div>
        </div>
      </div>
      <!-- <CodeBlock v-if="srcText && showSrc" :code="srcText" code-type="raw" /> -->
    </div>
    <div v-else>
      <component :is="component" :err="props.err" />
    </div>
  </div>
</template>
