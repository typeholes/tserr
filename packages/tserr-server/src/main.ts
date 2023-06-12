import { watch } from 'chokidar';
import { setProject } from './handleDiagnostics.js';
import { startServer } from './server.js';
import { tmpdir } from 'os';
import { join as joinPath, resolve as resolvePath } from 'path';
import { cpSync } from 'fs';
import { version as nodeVersion } from 'process';

import { tsErrPlugin as arkTypePlugin } from '@typeholes/tserr-arktype'


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
      console.error('Needs node v18.15.0 - cpSync is experimental and I do not want to code up something or pull in  a dependency just for this');
      throw new Error('invalid node version');
    }
    const projectPath = joinPath(tmpdir(), 'tserr-examples');
    const samplePath = joinPath(__dirname, '..', '..', '..', '..', '..', '..', 'error_samples' );

    console.log('from path', resolvePath(samplePath), projectPath);
    try {
    cpSync( samplePath, projectPath, { errorOnExist: true })
    } catch (e) {
      console.error('temp sample directory already exists');
    };
    return {projectPath};

    // todo copy samples folder to temp and open it
  } else {
    // todo validate directory exists and has a ts.config file
    return { projectPath: arg };
  }
}

const server = startServer(__dirname + '../../../../../tserr-vue/');
console.log('dirname: ', __dirname);

type EventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

let waiting = true;
let events: [EventType, string][] = [];

const projectEventHandler = setProject(
  projectPath + '/tsconfig.json',
  // '../../../../../../error_samples/tsconfig.json',
  server
);

function handleEvent(event: EventType, path: string) {
  console.log('handling event');
  events.push([event, path]);
  waiting = true;
}

function processEvents() {
  if (waiting) {
    waiting = false;
    return;
  }

  if (events.length > 0) {
    console.log(events);
    server.sendResetResolvedErrors();
    projectEventHandler(events);
    events = [];
  }
}

server.addSemanticErrorIdentifiers(...arkTypePlugin.semanticErrorIdentifiers);

const watcher = watch(projectPath);
watcher.on('all', handleEvent);

setInterval(processEvents, 100);
