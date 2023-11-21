import { reactive } from 'vue';

import { Options as PrettierOptions } from 'prettier';

export const appState = reactive({
  shikiTheme: 'dracula' as string,
  prettierOptions: {} as PrettierOptions
});



