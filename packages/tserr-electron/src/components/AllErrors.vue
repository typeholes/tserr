<script setup lang="ts">
import DynamicError from './DynamicError.vue';
import { computed, reactive } from 'vue';
import CodeBlock from './CodeBlock.vue';
import type {
  Err,
  ErrDesc,
  ErrLocation,
  DiagnosticArgument,
} from '@typeholes/tserr-common';

const schema = window.tserrSchema.schema;

const locations = computed(() => {
  return schema.ErrLocation.values();
});

const menuAt = reactive({
  error: undefined as undefined | Err<ErrDesc<any>>,
  location: undefined as undefined | ErrLocation,
  diagnosticArgs: [] as { cacheId: number; text: string }[],
  code: undefined as undefined | string,
});

function onShow(evt: Event) {
  menuAt.error = undefined;
  menuAt.location = undefined;
  menuAt.diagnosticArgs = [];
  if (evt instanceof PointerEvent && evt.target instanceof Element) {
    const errorRow = evt.target.closest('.error_row');
    const err = errorRow?.attributes.getNamedItem('error');
    const loc = errorRow?.attributes.getNamedItem('location');
    if (!errorRow || !err || !loc) return false;
    const error = JSON.parse(err.value);
    const location = JSON.parse(loc.value);
    menuAt.error = error;
    menuAt.location = location;

    if (typeof error === 'object' && 'values' in error) {
      for (const [_key, value] of Object.entries(error.values)) {
        const arg = value as DiagnosticArgument;
        if (typeof arg === 'object' && 'cacheId' in arg) {
          menuAt.diagnosticArgs.push(arg);
        }
      }
    }
  }
}

const ts = window.tserrFileApi.ts;
const printer = ts.createPrinter();

function showSource(value: DiagnosticArgument) {
      if (!(typeof value === 'object' && 'cacheId' in value)) return;
        const argValue = window.tserrFileApi.ts.getDiagnosticArgValue(
        value.cacheId,
      );

      let srcText = '';
      // eslint-disable-next-line @typescript-eslint/ban-types
      if ('valueDeclaration' in argValue && argValue.valueDeclaration) {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const sym = argValue;
        if (sym.valueDeclaration) {
          menuAt.code = printer.printNode(
            ts.EmitHint.Unspecified,
            sym.valueDeclaration,
            sym.valueDeclaration.getSourceFile(),
          );
        }
      }

}

const menuActions = {
  logLocation() {
    console.log(menuAt.location);
  },
  logError() {
    console.log(menuAt.error);
  },
};
</script>

<template>
  <div>
    <!-- <q-page-sticky position="top-right" v-if="menuAt.code" >
      <CodeBlock :code="menuAt.code" code-type="raw"/>
    </q-page-sticky> -->
    <q-menu auto-close touch-position context-menu @show="onShow">
      <q-list >
        <q-item clickable @click="menuActions.logLocation">
          log location
        </q-item>
        <q-item clickable @click="menuActions.logError"> log error </q-item>
        <template v-for="(arg, idx) of menuAt.diagnosticArgs" :key="idx">
          <q-item clickable @click="showSource(arg)">
            {{ arg.text.slice(0, 20) }}
          </q-item>
        </template>
      </q-list>
    </q-menu>
    <div v-for="(location, idx) in locations" :key="idx">
      <div class="column">
        <div>{{ location.fileName }}</div>
        <div class="row align-center">
          <div>Line: {{ location.span.start.line }}</div>
          <CodeBlock v-if="location.lineSrc" :code="location.lineSrc" />
        </div>

        <!-- err: {{ schema.ErrLocation.$.At.Err(location) }} -->
        <template
          v-for="(err, errIdx) of schema.ErrLocation.$.At.Err(location)"
          :key="errIdx"
        >
          <div
            class="error_row"
            :error="JSON.stringify(err)"
            :location="JSON.stringify(location)"
          >
            <DynamicError :err="err" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
