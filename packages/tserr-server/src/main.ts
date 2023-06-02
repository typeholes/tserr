import { watch } from 'chokidar';
import { setProject } from './handleDiagnostics.js';
import { startServer } from './server.js';

const server = startServer(__dirname + '../../../../vue/tserr-client/dist/');

type EventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

let waiting = true;
let events: [EventType, string][] = [];

const projectEventHandler = setProject(
   '../../error_samples/tsconfig.json',
   server
);

function handleEvent(event: EventType, path: string) {
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

const watcher = watch('../../error_samples/');
watcher.on('all', handleEvent);

setInterval(processEvents, 100);
