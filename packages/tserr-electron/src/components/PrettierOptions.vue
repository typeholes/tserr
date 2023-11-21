<script setup lang="ts">
// import { Options as PrettierOptions } from 'prettier';
import { appState } from 'src/app/appState';
import { type } from 'arktype';

const prettierConfig = type({
  printWidth: 'number',
  tabWidth: 'number',
  useTabs: 'boolean',
  semi: 'boolean',
  singleQuote: 'boolean',
  jsxSingleQuote: 'boolean',
  trailingComma: '"none" | "es5" | "all"',
  bracketSpacing: 'boolean',
  bracketSameLine: 'boolean',
  jsxBracketSameLine: 'boolean',
  // rangeStart: 'number',
  // rangeEnd: 'number',
  // filepath: 'string',
  // requirePragma: 'boolean',
  // insertPragma: 'boolean',
  proseWrap: '"always" | "never" | "preserve"',
  arrowParens: '"avoid" | "always"',
  htmlWhitespaceSensitivity: '"css" | "strict" | "ignore"',
  endOfLine: '"auto" | "lf" | "crlf" | "cr"',
  quoteProps: '"as-needed" | "consistent" | "preserve"',
  vueIndentScriptAndStyle: 'boolean',
  embeddedLanguageFormatting: '"auto" | "off"',
  singleAttributePerLine: 'boolean',
});

const children : (readonly [any, any])[]  = prettierConfig.root.children.filter(x => x.isConstraint()).map((node) => {

  if (node.isConstraint()) {
    const json = node.toJSON();

    if ( 'key' in json && 'value' in json) {
      // appState.prettierOptions[json.key as keyof typeof appState.prettierOptions] ??= undefined;
      return [json.key, json.value] as const;
    }
    return undefined as unknown as readonly [any,any]
  }
    return undefined as unknown as readonly [any,any]
}).filter(x=>x !== undefined);

</script>

<template>
  <div>
    <hr>
  <div class="rows" v-for="child,idx of children" :key="idx">
    <div class="column">
    </div>
    <div >
      <q-input v-if="child[1]==='string'" :label="child[0]" v-model="(appState.prettierOptions as any)[child[0]]"/>
      <q-input v-if="child[1]==='number'" type="number" :label="child[0]" v-model.number="(appState.prettierOptions as any)[child[0]]"/>
      <q-select v-if="Array.isArray(child[1])" :label="child[0]" v-model="(appState.prettierOptions as any)[child[0]]" :options="child[1]" option-label="is" option-value="is" :emit-value="true" />
      <!-- <div v-else>      {{ child[1] }} </div> -->

    </div>
  </div>
</div>
</template>
>
