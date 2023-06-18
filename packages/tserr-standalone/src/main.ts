import { startServer } from '@typeholes/tserr-server';
import { tmpdir } from 'os';
import { join as joinPath, resolve as resolvePath } from 'path';
import { cpSync } from 'fs';
import { version as nodeVersion } from 'process';

const errorSamplePath = '/home/hw/projects/nx/typeholes/error_samples';
const { projectPath } = processArgs();

function processArgs(): { projectPath: string } {
  // process.argv[2] ?? errorSamplePath;
  if (process.argv.length != 3) {
    console.error('Usage: node main.js <path to project directory');
    throw new Error('project path not specified');
  }

  const arg = process.argv[2];
  if (arg === '--builtin-examples') {
    if (nodeVersion !== 'v18.15.0') {
      console.error(
        'Needs node v18.15.0 - cpSync is experimental and I do not want to code up something or pull in  a dependency just for this'
      );
      throw new Error('invalid node version');
    }
    const projectPath = joinPath(tmpdir(), 'tserr-examples');
    const samplePath = joinPath(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      '..',
      'error_samples'
    );

    console.log('from path', resolvePath(samplePath), projectPath);
    try {
      cpSync(samplePath, projectPath, { errorOnExist: true });
    } catch (e) {
      console.error('temp sample directory already exists');
    }
    return { projectPath };

    // todo copy samples folder to temp and open it
  } else {
    // todo validate directory exists and has a ts.config file
    return { projectPath: arg };
  }
}

import { plugin as tsmorphPlugin } from '@typeholes/tserr-ts-morph';

const server = startServer(__dirname + '../../../../../tserr-vue/');

const tserr = server.mkPluginInterface({
  key: 'standalone',
  displayName: 'standalone',
  register: () => {
    /**/
  },
});

 server.mkPluginInterface(tsmorphPlugin);

tserr.send.openProject(projectPath);
console.log('dirname: ', __dirname);
