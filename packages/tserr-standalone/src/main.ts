import { startServer } from '@typeholes/tserr-server';
import { tmpdir } from 'os';
import { join as joinPath, resolve as resolvePath } from 'path';
import { cpSync, readdirSync, statSync } from 'fs';
import { version as nodeVersion } from 'process';

let port = 0;
const { projectPath } = processArgs();

function processArgs(): { projectPath: string } {
  // process.argv[2] ?? errorSamplePath;
  if (process.argv.length < 3 || process.argv.length > 4) {
    console.error('Usage: node main.js <path to project directory> <port>');
    throw new Error('project path not specified');
  }

  const arg = process.argv[2];
  port = parseInt(process.argv[3] ?? '3000') ?? 0;

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

const server = startServer(
  __dirname + '../../../../../tserr-vue/',
  projectPath,
  port
);

const tserr = server.mkPluginInterface({
  key: 'standalone',
  displayName: 'standalone',
  register: () => {
    /**/
  },
});

const tsmorph = server.mkPluginInterface(tsmorphPlugin);

const configs = tserr.getConfigs();

for (const path in configs) {
  const config = configs[path];
  config.tsconfig?.forEach((fileName) => {
    tsmorph.send.hasProject(joinPath(path, fileName));
  });
  config.config?.openProjects.forEach((projectFile) => {
    tsmorph.send.openProject(joinPath(projectPath, projectFile));
  });
}
console.log('dirname: ', __dirname);
