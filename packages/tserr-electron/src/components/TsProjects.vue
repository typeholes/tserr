<script setup lang="ts">
import { ref } from 'vue';
import { ProjectDesc } from '@typeholes/tserr-common';

const schema = window.tserrSchema.schema;

const { dialog } =
  typeof require === 'undefined'
    ? { dialog: undefined }
    : require('@electron/remote');

const forceList = ref(0);

function splitName(name: string) {
  /// BUG: windows paths need to spit by \
  const linuxName = name.match(/^.:/) ? name.replaceAll('\\', '/') : name;
  const parts = linuxName.split(/(\/[^\/]*$)/);
  console.log({ name, linuxName, parts });
  if (parts.length === 1) {
    parts.unshift('.');
  }
  return parts;
}

function openFileDialog() {
  return dialog?.showOpenDialogSync({ properties: ['openFile'] });
}

function openProject() {
  // const picked = dialog.showOpenDialogSync({properties: ['openFile']})
  const picked = openFileDialog();
  for (const fullPath of picked) {
    const [path, filename] = splitName(fullPath);
    const desc: ProjectDesc = {
      path,
      filename: filename.replace(/^\//, ''),
      open: true,
    };
    schema.Project.add(desc);
  }
  console.log(picked);
  forceList.value++;
}
</script>

<template>
  <q-card>
    <q-btn label="Open Project" @click="openProject" />
    <q-list :key="forceList">
      <q-item
        v-for="desc of schema.Project.values()"
        :key="desc.path + desc.filename"
      >
        <q-card class="row items-center">
          <span>{{ desc.path }}/</span>
          <span>{{ desc.filename }}</span>
          <q-checkbox label="Open" v-model="desc.open" />
        </q-card>
      </q-item>
    </q-list>
  </q-card>
</template>
