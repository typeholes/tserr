import { createApp } from 'vue';
import App from './App.vue';
import { startSocket } from './app/socket';
import * as shiki from 'shiki';

// import './assets/main.css'

import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
// import { aliases, mdi } from 'vuetify/iconsets/mdi';

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'dark',
  },
  defaults: {
    global: { dense: true, 'no-gutters': true },
  },
});

shiki
  .getHighlighter({
    theme: 'dark-plus',
  })
  .then((highlighter) => {
    const app = createApp(App);

    app.use(vuetify);

    const emitters = startSocket();
    app.use({
      install: (app) => {
        app.provide('highlighter', highlighter);
        app.provide('emitters', emitters);
      },
    });

    app.mount('#app');
  });
