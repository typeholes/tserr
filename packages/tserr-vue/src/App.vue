<script setup lang="ts">
import { inject, ref } from 'vue';
import ServerState from './app/components/ServerState.vue';
import AppState from './app/components/AppState.vue';
import { appState, positionInfo } from './app/appState';
import { Emitters } from './app/socket';
import { BUNDLED_THEMES } from 'shiki';

const emitters = inject<Emitters>('emitters');

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}

function refresh() {
  emitters?.refreshFrontend();
}
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <q-img src="./assets/tsFire.jpg" img-class="logo-image" />
          </q-avatar>
          TsErr Problems View
        </q-toolbar-title>

        <q-btn dense flat round icon="refresh" @click="refresh" />
        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <q-select v-model="appState.shikiTheme" :options="BUNDLED_THEMES" />
      {{ positionInfo }}
      <!-- drawer content -->
    </q-drawer>

    <q-drawer
      show-if-above
      v-model="rightDrawerOpen"
      side="right"
      bordered
      :width="500"
    >
      <ServerState />
    </q-drawer>

    <q-page-container>
      <AppState />
    </q-page-container>
  </q-layout>
</template>

<style>
.logo-image {
  mix-blend-mode: screen;
  filter: invert();
}
</style>
