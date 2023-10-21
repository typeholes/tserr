import { Socket as ClientSocket } from 'socket.io-client';
import { Socket as ServerSocket } from 'socket.io';

import { ErrDescState } from './ErrDescState';
import { ErrParserState } from './ErrParserState';
import { ErrState } from './ErrState';

export const states = {
  ErrDesc: ErrDescState,
  ErrParser: ErrParserState,
  Err: ErrState,
};

export function serverStates(server: ServerSocket) {
  console.log('in serverStates');
  for (const state of Object.values(states)) {
    server.on('set' + state.stateName, (...args) => state.set(args as never));
    // eslint-disable-next-line @typescript-eslint/ban-types
    const oldSet: Function = state.set;
    state.set = (...args: unknown[]) => {
      server.emit('set' + state.stateName, ...args);
      console.log('set' + state.stateName, ...args);
      return oldSet(...args);
    };
  }

  server.on('sendAllStates', () => {
    console.log('sending all states');
    for (const state of Object.values(states)) {
      for (const key of state.keys.value) {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const value = (state.get as Function)(key);
        server.emit('set' + state.stateName, value);
      }
    }
  });

}

export let sendAllStates : undefined | (()=>void) = undefined;

export function clientStates(client: ClientSocket) {
  for (const state of Object.values(states)) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const oldSet: Function = state.set;
    client.on('set' + state.stateName, (...args) => {
      if (args[0] === null || args[0] === undefined) {
        return false;
      }
      console.log(`received ${state.stateName}`, args);
      oldSet(...args);
    });
    state.set = (...args: unknown[]) => {
      client.emit('set' + state.stateName, ...args);
      return true;
    };
  }

  sendAllStates = () => client.emit('sendAllStates');
}
