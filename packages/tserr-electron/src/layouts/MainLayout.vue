<script setup lang="ts">
import { ref } from 'vue';
import { appState } from 'src/app/appState';

import TsProjects from 'src/components/TsProjects.vue';

import { writeConfig, configDirty } from 'src/app/config'

import PrettierOptions from 'src/components/PrettierOptions.vue';

const configPath = window.tserrConfigPath;

const { BrowserWindow, getCurrentWindow } = window.require ? window.require(
  '@electron/remote',
) : { BrowserWindow: undefined, getCurrentWindow: ()=>undefined};

const themes = [
  'css-variables',
  'dark-plus',
  'dracula-soft',
  'dracula',
  'github-dark-dimmed',
  'github-dark',
  'github-light',
  'hc_light',
  'light-plus',
  'material-theme-darker',
  'material-theme-lighter',
  'material-theme-ocean',
  'material-theme-palenight',
  'material-theme',
  'min-dark',
  'min-light',
  'monokai',
  'nord',
  'one-dark-pro',
  'poimandres',
  'rose-pine-dawn',
  'rose-pine-moon',
  'rose-pine',
  'slack-dark',
  'slack-ochin',
  'solarized-dark',
  'solarized-light',
  'vitesse-dark',
  'vitesse-light',
];

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function minimize() {
  BrowserWindow?.getFocusedWindow()?.minimize();
}

function location() {
  return window.location.toString();
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
  window?.setFullScreen(!window.isFullScreen());
}

function closeApp() {
  BrowserWindow?.getFocusedWindow()?.close();
}
</script>

<template>
  <div class="q-pa-md">
    <q-layout view="hHh LpR fFf">
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
          <div>{{ location() }}</div>
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
        <q-select
          lable="Theme"
          v-model="appState.shikiTheme"
          :options="themes"
        />
        <q-btn label="Home" to="/" />
        <q-btn label="Plugins" to="/plugins" />
        <q-btn label="Error Meta" to="/errorManager" />
        <q-btn label="Save Config" v-if="configDirty && configPath" @click="writeConfig(configPath)" />
      </q-drawer>
      <q-drawer v-model="rightDrawerOpen" show-if-above bordered side="right">
        <TsProjects />
        <PrettierOptions/>
      </q-drawer>
      <q-page-container>
<router-view v-slot="{ Component }">
  <keep-alive>
    <component :is="Component" />
  </keep-alive>
</router-view>
      </q-page-container>
    </q-layout>
  </div>
</template>
