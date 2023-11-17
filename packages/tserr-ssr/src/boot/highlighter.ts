import { boot } from 'quasar/wrappers';
import { Quasar } from 'quasar';

// Import icon libraries
import '@quasar/extras/roboto-font-latin-ext/roboto-font-latin-ext.css';
import '@quasar/extras/material-icons/material-icons.css';

// Import Quasar css
import 'quasar/src/css/index.sass';



// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app /*router, ...*/ }) => {
const shiki =window.require('shiki');

  shiki
    .getHighlighter({
      theme: 'dracula',
      themes: shiki.BUNDLED_THEMES,
    })
    .then((_highlighter: any) => {

    (window as any).highlighter = _highlighter;

      app.use({
        install: (app) => {
          app.provide('highlighter', _highlighter);
        },
      });
    });

});
