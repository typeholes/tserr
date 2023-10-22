import { boot } from 'quasar/wrappers';

import { io } from 'socket.io-client';
import { clientStates } from 'src/app/state/states';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  // something to do
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //  const port = (window as any).TsErrPort ?? '9100';
  const port = window?.location?.port ?? '3000';
  const URL = `http://localhost:${port}`;

  const socket = io(URL, { autoConnect: false });

  socket.connect();
  clientStates(socket);

  console.log('client socket finished');
});
