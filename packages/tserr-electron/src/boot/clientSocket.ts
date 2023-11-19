// import { boot } from 'quasar/wrappers';

// import { Socket, io } from 'socket.io-client';
// import { onEvent, type State } from '@typeholes/tserr-common'

// import { ref } from 'vue';

// onEvent('*DEBUG*', 'fileChanges', (payload) =>
//   console.log({ fileChanges: payload }),
// );

// let _socket: Socket | undefined = undefined;

// // "async" is optional;
// // more info on params: https://v2.quasar.dev/quasar-cli/boot-files
// export default boot(async (/* { app, router, ... } */) => {
//   // something to do
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   //  const port = (window as any).TsErrPort ?? '9100';
//   const port = window?.location?.port ?? '3000';
//   const URL = `http://localhost:${port}`;

//   const socket = io(URL, { autoConnect: false });

//   console.log('connecting...');
//   socket.connect();
//   console.log('connected');
//   clientStates(socket);

//   //console.log('client socket finished');
// });


// let pause = false;

// function clientStates(socket: Socket) {
//   _socket = socket;
//   console.log(schema);
//   //console.log('in clientStates');
//   socket.onAny(console.log);
//   socket.on('mutateState', (name: string, operation: string, arg: unknown) => {
//     pause = true;
//     if (!(name in schema)) return;
//     const k = name as keyof typeof schema;
//     schema[k][operation as 'add'](arg as any);
//     pause = false;
//   });

//   socket.on('allStates', (newStates: any) => {
//     pause = true;
//     for (const name in newStates) {
//       for (const value of newStates[name]) {
//         schema[name].add(value);
//       }
//     }
//     pause = false;
//   });

//   socket.on('AllRelatedStates', (...args) => {
//     console.log('AllRelatedStates', args);
//   });
//   socket.on('mutateRelatedState', (...args) => {
//     console.log('mutateRelatedState', args);
//   });

//   for (const state of Object.values(schema)) {
//     // eslint-disable-next-line @typescript-eslint/ban-types
//     state.onMutate.push((...args: unknown[]) => {
//       if (pause) return;
//       socket.emit('mutateState', state.stateName, ...args);
//       //console.log('emit mutateState', state.name, ...args);
//     });
//     for (const _alias in state.$) {
//       const alias = _alias as keyof typeof state.$;
//       for (const _entry of Object.entries(state.$[alias])) {
//         const entry = _entry as [string, State<string, any, PropertyKey[]>];
//         const [relatedName, related] = entry;
//         console.log({ alias, related, onMutate: related.onMutate });
//         if (related.onMutate === undefined) {
//           console.log(
//             'skipping mutation listener',
//             alias,
//             relatedName,
//             related.onMutate,
//             { related },
//           );
//           continue;
//         }
//         console.log('adding mutation listiner to related');
//         related.onMutate.push((...args: unknown[]) => {
//           if (pause) return;
//           console.log({ alias, state, related });
//           socket.emit(
//             'mutateRelatedState',
//             state.stateName,
//             alias,
//             relatedName,
//             ...args,
//           );
//         });
//       }
//     }
//   }
// }

// export function getAllStates() {
//   if (_socket) {
//     _socket.emit('sendAllStates');
//   }
// }
