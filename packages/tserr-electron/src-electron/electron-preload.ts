/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

// import { contextBridge } from 'electron';
// // import { dialog, } from 'electron';
// import { dialog, BrowserWindow, getCurrentWindow } from '@electron/remote';

import { readFileSync, writeFileSync } from 'fs';
import * as shiki from 'shiki';
import { Schema } from '@typeholes/tserr-common'

declare global {
  interface Window {
    codeToHtml: (code: string, theme?: string, lang?: string) => string;
    tserrPlugins: string[];
    tserrConfigPath: string | undefined;
    tserrFileApi: { readFile: typeof readFileSync, writeFile: typeof writeFileSync};
    tserrSchema: {schema: Schema};
  }
}


window.tserrFileApi = { readFile: readFileSync, writeFile: writeFileSync }


shiki
  .getHighlighter({
    theme: 'dracula',
    themes: shiki.BUNDLED_THEMES,
  })
  .then((highlighter) => {
    const html = highlighter.codeToHtml('type foo<T> = T', {
      lang: 'ts',
      theme: 'dracula',
    });
    console.log({ html });
    window.codeToHtml = (code: string, theme?: string, lang?: string) =>
      highlighter.codeToHtml(code, {
        lang: lang ?? 'ts',
        theme: theme ?? 'dracula',
      });
  });
const configIndex = process.argv.indexOf('--tserrConfig');
window.tserrConfigPath =
  configIndex < 0 ? undefined : process.argv[configIndex + 1];

const pluginIndex = process.argv.indexOf('--tserrPlugins');
window.tserrPlugins = pluginIndex < 0 ? [] : process.argv.slice(pluginIndex);

/*
contextBridge.exposeInMainWorld('tserrPlugins', tserrPlugins);

contextBridge.exposeInMainWorld('windowAPI', {
  minimize() {
    BrowserWindow.getFocusedWindow()?.minimize();
  },

  toggleMaximize() {
    // const win = BrowserWindow.getFocusedWindow();
    const window = getCurrentWindow();
    // console.log({ win });
    // if (!win) return;

    // if (win.isMaximized()) {
    // win.unmaximize();
    // } else {
    // win.setPosition(0,0);
    // win.maximize();
    window.setFullScreen(!window.isFullScreen());
  },

  close() {
    BrowserWindow.getFocusedWindow()?.close();
  },
  openFileDialog: () => {
    return dialog.showOpenDialogSync({ properties: ['openFile'] });
  },
});
*/