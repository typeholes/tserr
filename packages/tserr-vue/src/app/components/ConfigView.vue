<script setup lang="ts">
import ConfigTree from './ConfigTree.vue';
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
  let into = tree;
  const entries = Object.entries(appState.configs).sort();

  let lastKey = '';
  entries.forEach(([key, value]) => {
    if (!key.startsWith(lastKey)) {
      into = tree;
    }

    const children: ConfigTreeItem[] = [];
    into.push({
      label: key,
      config: { ...value, parentPath: lastKey },
      children,
      id: idx++,
    });
    into = children;

    lastKey = key;
  });

  return tree;
}

const dummy = ref(false);



// const tree = computed( () => asTree() )
</script>

<template>
  <div>
    <!-- foo: {{ JSON.stringify(appState.configs, null, 2) }} -->
    <!-- foo: {{ JSON.stringify(tree, null, 2) }} -->
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
