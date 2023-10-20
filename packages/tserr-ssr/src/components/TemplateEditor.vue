<template>
  <q-page class="row items-center justify-evenly">
    <div class="rows">
      <div>
        <q-input
          rows="20"
          type="textarea"
          label="SyntaxError template"
          v-model="components.SyntaxError.current.template"
          @update:modelValue="changeTemplate"
        />
      </div>
      <div>
        <!-- {{ templateError }} -->
        <!-- <dynamic-error :err="syntaxError"/> -->
      </div>

      <div class="bordered">
        <hr />
        <component
          v-if="component"
          :is="component"
          :err="syntaxError"
          :="$attrs"
        />
        <span v-else>Component not found</span>
        <hr />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { components, SyntaxErrorParser, SyntaxErrorDesc } from '../app/ErrDesc';
import { compile, computed, ref } from 'vue';

const component = computed(
  () =>
    components.SyntaxError?.current.render ??
    components.SyntaxError?.prev.render ??
    (() => 'component for "SyntaxError" not found'),
);

const templateError = ref('');

const syntaxError = computed(() => ({
  name: SyntaxErrorDesc.name,
  keys: SyntaxErrorDesc.keys,
  values: SyntaxErrorParser.parse(templateError.value),
}));

function changeTemplate(text: string | number | null) {
  if (!text || typeof text === 'number') {
    return;
  }

  try {
    let hasErr = false;
    const render = compile(text, {
      onError: (error) => {
        hasErr = true;
        templateError.value = String(error);
      },
      onWarn: (error) => {
        hasErr = true;
        templateError.value = String(error);
      },
    });
    components.SyntaxError.current.render = render;
    components.SyntaxError.current.template = text;
    if (hasErr) {
      components.SyntaxError.current.render = undefined;
    } else {
      templateError.value = '';
      components.SyntaxError.prev.render = render;
      components.SyntaxError.prev.template = text;
    }
  } catch (e) {
    templateError.value = String(e);
    components.SyntaxError.current.render = undefined;
  }
}
</script>

<style>
.bordered {
  border: 1px green solid;
}
</style>
