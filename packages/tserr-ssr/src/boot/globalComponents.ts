import { boot } from 'quasar/wrappers'
import CodeBlock from '../components/CodeBlock.vue';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ( { app} ) => {
  app.component('code-block',CodeBlock)
})
