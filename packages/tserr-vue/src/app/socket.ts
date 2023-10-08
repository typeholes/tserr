import { Socket, io } from 'socket.io-client';
import { socketHandlers, appState } from './appState';

let socket: Socket;

export type Emitters = {
    refreshFrontend: () => void;
    closeProject: (path: string) => void;
    openProject: (path: string) => void;
    applyFix: (fixId: number) => void;
    setPlugin: (pluginKey: string, active: boolean) => void;
    gotoDefinition: (filename: string, textContent: string, fromLine: number, toLine: number) => void;
    gotoFileLine: (filename: string, line: number) => void;
}

export let emitters : Emitters | undefined = undefined;

export function startSocket() : Emitters {
  const port = (window as any).TsErrPort ?? '3000';
  const URL = `http://localhost:${port}`;

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

  return (emitters = {
    refreshFrontend: () => {
      socket.emit('refreshFrontend');
    },
    closeProject: (path: string) => {
      socket.emit('closeProject', path);
    },
    openProject: (path: string) => {
      socket.emit('openProject', path);
    },
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

    gotoFileLine: ( fileName:string, line: number) =>  socket.emit('gotoFileLine', fileName, line),
  });
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
