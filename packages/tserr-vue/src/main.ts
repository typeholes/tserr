import { createApp } from 'vue';
import App from './App.vue';
import { startSocket } from './app/socket';
import * as shiki from 'shiki';

// import './assets/main.css'




import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import './typeholes-reset.css';
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
    global: {
      dense: true,
      'no-gutters': true,
      class: 'mt0 pt0',
      style: 'min-height: 0px',
    },
    VExpansionPanelTitle: { style: 'padding: 4px 4px; min-height: 0px' },
    VContainer: { style: 'padding: 0px' },
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
