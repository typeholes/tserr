import { app, BrowserWindow } from 'electron';
import path from 'path';
import os from 'os';

import { initialize, enable } from '@electron/remote/main'; // <-- add this

const pluginIndex = process.argv.indexOf('--tserrPlugins');
const tserrPlugins = pluginIndex < 0 ? [] : process.argv.slice(pluginIndex);

initialize(); // <-- add this

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow: BrowserWindow | undefined;

function createWindow() {
  /**
   * Initial window options
   */

  console.log('system version', process.getSystemVersion());

  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 2000,
    height: 1200,
    // useContentSize: true,
    frame: false, // <-- add this
    // fullscreen: true,
    fullscreenable: true,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      additionalArguments: tserrPlugins,
      sandbox: false,
    },
  });

  enable(mainWindow.webContents); // <-- add this

  mainWindow.loadURL(process.env.APP_URL);
  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    // mainWindow.webContents.on('devtools-opened', () => {
    // mainWindow?.webContents.closeDevTools();
    // });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});
