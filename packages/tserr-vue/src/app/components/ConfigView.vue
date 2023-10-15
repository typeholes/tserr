<script setup lang="ts">
import { ProjectConfigs } from '@typeholes/tserr-common';
import { appState, toggleProject } from '../appState';
import { ProjectPath } from '@typeholes/tserr-common';

function fullPath(dir: string, path: string) {
  const ret = dir.replace('./', '') + path;
  console.log('fullPath', ret);
  return ret;
}

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

</script>

<template>
  <div>
    <q-tree dense :nodes="asTree()" node-key="label">
      <template #default-body="{ node }">
        {{ node.title }}
        <template v-for="ts of node.config.tsconfig" :key="ts">
          <q-checkbox
            :label="ts as string"
            :model-value="
              appState.projects[fullPath(node.label, ts) as ProjectPath] ?? false
            "
            @update:model-value="toggleProject(fullPath(node.label, ts))"
          />
        </template>
        <div
          class="row q-gutter-xs"
          v-if="node.config?.config?.ignoreErrCodes?.length > 0"
        >
          <div class="col-auto">ignore:</div>
          <template
            v-for="code of node.config?.config?.ignoreErrCodes"
            :key="code"
          >
            <div class="col-auto">{{ code }}</div>
          </template>
        </div>
      </template>
    </q-tree>
  </div>
</template>
