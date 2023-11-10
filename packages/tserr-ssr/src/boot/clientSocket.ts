import { boot } from 'quasar/wrappers';

import { Socket, io } from 'socket.io-client';
import { schema } from '../../../tserr-common/src/index'; // path doesn't work for client boot files:w

import { ref } from 'vue';

let _socket: Socket | undefined = undefined;

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  // something to do
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //  const port = (window as any).TsErrPort ?? '9100';
  const port = window?.location?.port ?? '3000';
  const URL = `http://localhost:${port}`;

  const socket = io(URL, { autoConnect: false });

  console.log('connecting...');
  socket.connect();
  console.log('connected');
  clientStates(socket);

  //console.log('client socket finished');
});

export const stateNum = ref(0);

function clientStates(socket: Socket) {
  _socket = socket;
  console.log(schema);
  //console.log('in clientStates');
  socket.onAny(console.log);
  socket.on('mutateState', (name: string, operation: string, arg: unknown) => {
    if (!(name in schema)) return;
    const k = name as keyof typeof schema;
    schema[k][operation as 'add'](arg as any);
    stateNum.value = (stateNum.value + 1) % 1e6;
  });

  socket.on('allStates', (newStates: any) => {
    for (const name in newStates) {
      for (const value of newStates[name]) {
        // @ts-expect-error correspondence issue
        schema[name].add(value);
      }
    }
    stateNum.value = (stateNum.value + 1) % 1e6;
  });

  socket.on('AllRelatedStates', (...args) => {
    console.log('AllRelatedStates', args);
  });
  socket.on('mutateRelatedState', (...args) => {
    console.log('mutateRelatedState', args);
  });
}

export function getAllStates() {
  if (_socket) {
    _socket.emit('sendAllStates');
  }
}
