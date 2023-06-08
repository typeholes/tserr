import { createApp } from 'vue'
import App from './App.vue'
import { startSocket } from './app/socket'
import * as shiki from 'shiki'

import './assets/main.css'

shiki
  .getHighlighter({
    theme: 'dark-plus'
  })
  .then((highlighter) => {
    const app = createApp(App)

    const emitters = startSocket()
    app.use({ install: (app) => {
       app.provide('highlighter', highlighter)
       app.provide('emitters', emitters);
  }})

    app.mount('#app')

  })
