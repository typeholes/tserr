<template>
  <q-scroll-area style="height: 500px; max-width: 80vw">
    <div class="row">
      <q-btn label="Accept" @click="accept" />
      <q-btn label="Cancel" @click="cancel" />
      <q-space />
      <q-btn label="view" @click="toggleView" />
    </div>
    <div class="column">
      <div v-if="templates.view" style="width: 60vw; overflow-wrap: break-word">
        <code-block :code="templates.current" lang="html" codeType="raw" />
      </div>
      <div v-else>
        <q-input
          rows="20"
          type="textarea"
          label="SyntaxError template"
          v-model="templates.current"
          @update:modelValue="changeTemplate"
        />
      </div>
      <div>
        <!-- <code-block :code="templates.current" lang="html" /> -->
        {{ templateError }}
        <!-- <dynamic-error :err="syntaxError"/> -->
      </div>

      <div class="bordered">
        <hr />
        <component
          v-if="templates.currentRender ?? templates.prevRender"
          :is="templates.currentRender ?? templates.prevRender"
          :err="err"
        />
        <!-- <span v-else>Component not found</span> -->
        <hr />
      </div>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { compile, reactive, ref } from 'vue';
import { ErrDesc, Err, } from '@typeholes/tserr-common'
import CodeBlock from './CodeBlock.vue';
import { config } from 'src/app/config';

const schema = window.tserrSchema.schema;

const emit = defineEmits<{
  (event: 'cancel'): void;
}>();

function accept() {
  const desc = schema.ErrDesc.get(props.errDesc)!;
  desc.template = templates.current;
  config.templates??={}
  config.templates[desc.name] = templates.current.split('\n');
  schema.ErrDesc.add(desc);
}

function cancel() {
  emit('cancel');
}

function toggleView() {
  templates.view = !templates.view;
}

function mkErr() {
  const err: Err<ErrDesc<string>> = {
    name: props.errDesc.name,
    values: {},
  };
  for (const key of props.errDesc.keys) {
    err.values[key] = 'DummyType';
  }
  return err;
}

const props = defineProps<{ errDesc: ErrDesc }>();

const err = mkErr();

const templates = reactive({
  current: props.errDesc.template ?? '<div> TODO </div>',
  prev: props.errDesc.template ?? '<div> TODO </div>',
  currentRender: undefined as undefined | ReturnType<typeof compile>,
  prevRender: undefined as undefined | ReturnType<typeof compile>,
  view: false,
});

const templateError = ref('');

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
    if (!hasErr) {
      templateError.value = '';
      templates.prev = templates.current;
      templates.prevRender = templates.currentRender;
      templates.current = text;
      templates.currentRender = render;
    }
  } catch (e) {
    templateError.value = String(e);
  }
}
</script>

<style>
.bordered {
  border: 1px green solid;
}
</style>
