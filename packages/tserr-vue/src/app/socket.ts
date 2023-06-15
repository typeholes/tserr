import { Socket, io } from 'socket.io-client';
import { socketHandlers, appState } from './appState';

let socket: Socket;

export type Emitters = ReturnType<typeof startSocket>;

export function startSocket() {
  const URL = 'http://localhost:3000';

  socket = io(URL, { autoConnect: false });

  socket.onAny((event, ...args) => {
    console.log(event, args);
  });

  appState.socketStarted = true;

  for (const event in socketHandlers) {
    socket.on(event, socketHandlers[event as never]);
  }

  socket.connect();

  console.log('socket started');

  return {
    applyFix: (fixId: number) => {
      socket.emit('applyFix', fixId);
    },
    setPlugin: (pluginKey: string, active: boolean) => {
      socket.emit('setPlugin', pluginKey, active);
    },
    gotoDefinition: (
      filename: string,
      textContent: string,
      fromLine: number,
      toLine: number
    ) => {
      console.log(
        'socket.gotoDefinition',
        filename,
        textContent,
        fromLine,
        toLine
      );
      socket.emit('gotoDefinition', filename, textContent, fromLine, toLine);
    },
  };
}

let requestId = 0;

export function emit(
  event: string,
  onSucces: (requestId: number, ...args: any[]) => void,
  onError: (requestId: number, ...args: any[]) => void,
  ...args: any[]
) {
  if (!socket) {
    appState.error = 'Socket not started';
    return;
  }
  requestId++;
  socket.emit(event, requestId, ...args);
  appState.requests.set(requestId, {
    resolve: (...args: any[]) => onSucces(requestId, args),
    reject: (...args: any[]) => onError(requestId, args),
  });
}
