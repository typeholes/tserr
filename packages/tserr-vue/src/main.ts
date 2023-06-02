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

    app.use({ install: (app) => app.provide('highlighter', highlighter) })

    app.mount('#app')

    startSocket()
  })
