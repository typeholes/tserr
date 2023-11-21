<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  matArrowCircleUp,
  matArrowCircleDown,
} from '@quasar/extras/material-icons';
import CodeBlock from 'src/components/CodeBlock.vue';

import { loadPlugin } from '../boot/loadPlugins';

const schema = window.tserrSchema.schema;

const forceList = ref(0);

const { dialog } = require('@electron/remote');

const plugins = computed(() => {
  return forceList.value >= 0 ? schema.Plugin.values() : [];
});

function openFileDialog() {
  return dialog.showOpenDialogSync({ properties: ['openFile'] });
}

function openPlugin() {
  const fileNames = openFileDialog();
  for (const fileName of fileNames) {
    loadPlugin(schema, fileName);
  }
  forceList.value++;
}

const typeProblems = computed(() => {
  const problems: string[] = [];
  const plugins = schema.Plugin.values();
  for (const plugin of plugins) {
    for (const other of plugins) {
      if (plugin.name >= other.name) {
        continue;
      }
      for (const eventName in plugin.events) {
        if (eventName in other.events) {
          const type = plugin.events[eventName].type;
          const otherType = other.events[eventName].type;
          try {
            if (!type.extends(otherType)) {
              problems.push(
                `${eventName} incompatible between ${plugin.name} and ${other.name}`,
              );
            }
          } catch (_e) {
            problems.push(
              `${eventName} incompatible between ${plugin.name} and ${other.name}`,
            );
          }
        }
      }
    }
  }
  return problems;
});
</script>

<template>
  <q-page padding>
    <q-btn label="Load Plugin" @click="openPlugin" />
    <q-card :bordered="true" v-if="typeProblems.length>0">
      <div class="q-ma-sm error" v-for="problem of typeProblems" :key="problem">
    {{ problem }}
      </div>
    </q-card>
    <q-list>
      <q-expansion-item
        :label="plugin.name"
        v-for="plugin of plugins"
        :key="plugin.name"
        :content-inset-level="0.5"
        default-opened
      >
        <q-item> Descrition: 'todo: write descriptions' </q-item>
        <q-item> Events </q-item>
        <q-list>
          <q-expansion-item
            :header-inset-level="0.5"
            :content-inset-level="1"
            v-for="[eventName, event] of Object.entries(plugin.events)"
            :key="eventName"
            default-opened
          >
            <template v-slot:header>
              <q-item-section> {{ eventName }} </q-item-section>
              <q-item-section side>
                <q-icon
                  v-if="event.sends"
                  color="secondary"
                  :name="matArrowCircleUp"
                />
                <q-icon
                  v-if="event.handles"
                  color="secondary"
                  :name="matArrowCircleDown"
                />
              </q-item-section>
            </template>
            <code-block
              :code="
                JSON.stringify(event.type.definition, null, 2).replaceAll(
                  String.fromCharCode(34),
                  '',
                )
              "
              code-type="type"
            />
          </q-expansion-item>
        </q-list>
      </q-expansion-item>
    </q-list>
  </q-page>
</template>

<style scope>
.error {
  background-color: #300000;
}
</style>
