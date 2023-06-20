/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';

import viteTsConfigPaths from 'vite-tsconfig-paths';

import vuetify from 'vite-plugin-vuetify';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/tserr-vue',

  server: {
    port: 4200,
    host: 'localhost',
    fs: { allow: ['.', '/home/hw/projects/nx/typeholes/node_modules/@mdi'] },
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [
    viteTsConfigPaths({
      root: '../../',
    }),
    vue(),
    vuetify(),
    visualizer(),
  ],

  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../',
  //    }),
  //  ],
  // },

  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },

  // build: {
  //   minify: false,
  // },
});
