<script setup lang="ts">
import { ProjectConfigs } from '@typeholes/tserr-common';
import { appState } from '../appState';
import { ref } from 'vue';

export type ConfigTreeItem = {
  label: string;
  children: ConfigTreeItem[];
  config: ProjectConfigs[string] & { parentPath: string };
  id: number;
};

let idx = 0;

function asTree(): ConfigTreeItem[] {
  const tree: ConfigTreeItem[] = [];
  const entries = Object.entries(appState.configs).sort();

  const keyStack = [{ key: './', into: tree }];

  entries.forEach(([key, value]) => {
    let state = keyStack[keyStack.length - 1];
    while (!key.startsWith(state.key)) {
      keyStack.pop();
      state = keyStack[keyStack.length - 1];
    }

    const children: ConfigTreeItem[] = [];
    state.into.push({
      label: key,
      config: { ...value, parentPath: state.key },
      children,
      id: idx++,
    });

    keyStack.push({ key, into: children });
  });

  return tree;
}

const dummy = ref(false);

// const tree = computed( () => asTree() )
</script>

<template>
  <div>
    <!-- foo: {{ JSON.stringify(appState.configs, null, 2) }} -->
    <!-- foo: {{ JSON.stringify(asTree(), null, 2) }} -->
    <q-tree dense :nodes="asTree()" node-key="label">
      <template #default-body="props">
        {{ props.node.title }}
        <template v-for="ts of props.node.config.tsconfig" :key="ts">
          <q-checkbox :label="ts as string" :model-value="dummy" />
        </template>
        <div class="row q-gutter-xs" v-if="props.node.config?.config?.ignoreErrCodes?.length>0">
          <div class="col-auto"> ignore:   </div>
        <template v-for="code of props.node.config?.config?.ignoreErrCodes" :key="code">
          <div class="col-auto"> {{ code }}  </div>
        </template>
      </div>
      </template>
    </q-tree>
  </div>
</template>
