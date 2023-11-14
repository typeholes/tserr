<script setup lang="ts">
import { ref } from 'vue';

import TsProjects from 'src/components/TsProjects.vue';
const { BrowserWindow, getCurrentWindow } = (window as any).require('@electron/remote');

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}


function minimize() {
    BrowserWindow.getFocusedWindow()?.minimize();
  }

function toggleMaximize() {
    // const win = BrowserWindow.getFocusedWindow();
    const window = getCurrentWindow();
    // console.log({ win });
    // if (!win) return;

    // if (win.isMaximized()) {
    // win.unmaximize();
    // } else {
    // win.setPosition(0,0);
    // win.maximize();
    window.setFullScreen(!window.isFullScreen());
  }

  function closeApp() {
    BrowserWindow.getFocusedWindow()?.close();
  }

</script>

<template>
  <div class="q-pa-md">
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar class="q-electron-drag">

        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> TsErr </q-toolbar-title>

        <div>TsErr v0.0.1</div>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleRightDrawer"
        />
        <q-btn dense flat icon="minimize" @click="minimize" />
        <q-btn dense flat icon="crop_square" @click="toggleMaximize" />
        <q-btn dense flat icon="close" @click="closeApp" />
          </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered side="left">
    </q-drawer>
    <q-drawer v-model="rightDrawerOpen" show-if-above bordered side="right">
      <TsProjects />
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</div>
</template>
