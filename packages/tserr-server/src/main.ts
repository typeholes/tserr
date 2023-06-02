import { watch } from 'chokidar';
import { setProject } from './handleDiagnostics.js';
import { startServer } from './server.js';

const errorSamplePath = '/home/hw/projects/nx/typeholes/error_samples';

const server = startServer(__dirname + '../../../../../tserr-vue/');
console.log('dirname: ', __dirname);

type EventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

let waiting = true;
let events: [EventType, string][] = [];

const projectEventHandler = setProject(
  errorSamplePath + '/tsconfig.json',
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

const watcher = watch(errorSamplePath);
watcher.on('all', handleEvent);

setInterval(processEvents, 100);
