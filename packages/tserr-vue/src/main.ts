import { createApp } from 'vue';
import { Quasar } from 'quasar';

// Import icon libraries
import '@quasar/extras/roboto-font-latin-ext/roboto-font-latin-ext.css';
import '@quasar/extras/material-icons/material-icons.css';

// Import Quasar css
import 'quasar/src/css/index.sass';

import App from './App.vue';
import { startSocket } from './app/socket';
import * as shiki from 'shiki';
import type { Highlighter } from 'shiki';

// import './assets/main.css'

export let highlighter: Highlighter | undefined = undefined;

shiki
  .getHighlighter({
    theme: 'dracula',
    themes: shiki.BUNDLED_THEMES,
  })
  .then((_highlighter) => {
    highlighter = _highlighter;

    const app = createApp(App);

    const emitters = startSocket();
    app.use({
      install: (app) => {
        app.provide('highlighter', _highlighter);
        app.provide('emitters', emitters);
      },
    });

    app.use(Quasar, {
      plugins: {}, // import Quasar plugins and add here
      config: {
        dark: 'auto',
        /*
    brand: {
      // primary: '#e46262',
      // ... or all other brand colors
    },
    notify: {...}, // default set of options for Notify Quasar plugin
    loading: {...}, // default set of options for Loading Quasar plugin
    loadingBar: { ... }, // settings for LoadingBar Quasar plugin
    // ..and many more (check Installation card on each Quasar component/directive/plugin)
  */
      },
    });

    app.mount('#app');
  });
