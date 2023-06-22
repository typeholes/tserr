<script setup lang="ts">
import { ref } from 'vue';
import ServerState from './app/components/ServerState.vue';
import AppState from './app/components/AppState.vue';
import { useTheme } from 'vuetify';

const drawer = ref(false);

const theme = useTheme();

const toggleTheme = () =>
  (theme.global.name.value = theme.global.current.value.dark
    ? 'light'
    : 'dark');
</script>

<template>
  <v-layout>
    <v-app-bar color="primary">
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>

      <v-toolbar-title>TsErr Problems View</v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn @click="toggleTheme" icon="mdi-theme-light-dark" />
      <v-icon icon="mdi-refresh" />
      <v-btn variant="text" icon="mdi-dots-vertical"></v-btn>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" location="bottom" temporary>
      <ServerState/>
    </v-navigation-drawer>
    <v-main>
      <AppState />
    </v-main>
  </v-layout>
</template>

<style></style>
