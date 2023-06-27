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
    <!-- <template v-for="item of tree" :key="item.id">
      <ConfigTree :item="item" />
    </template> -->
    <q-tree dense :nodes="asTree()" node-key="label">
      <template #default-body="props">
        {{ props.node.title }}
        <template v-for="ts of props.node.config.tsconfig" :key="ts">
          <q-checkbox :label="ts as string" :model-value="dummy" />
        </template>
      </template>
    </q-tree>
  </div>
</template>
