import { Server } from 'socket.io';
import express from 'express';

export type Diagnostic = {
  message: string;
  start: {
    line: number;
    character: number;
  };
  end: {
    line: number;
    character: number;
  };
};

process.on('uncaughtException', function (err) {
  // Handle the error safely
  console.log(err);
});

// import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import type { FlatErr } from './Err';

// Do not use these until startServer is called
let app: ReturnType<typeof express> = undefined as never;
let server: http.Server /*<
   typeof http.IncomingMessage,
   typeof http.ServerResponse
>*/ = undefined as never;
let io: Server = undefined as never;

let gotoDefinition = (
  fileName: string,
  text: string,
  diagnostic: Diagnostic
) => {
  /* todo */ console.log({ fileName, text, diagnostic });
};

export type ErrorServer = ReturnType<typeof startServer>;
export function startServer(basePath: string) {
  app = express();
  server = http.createServer(app);
  io = new Server(server, { cors: { origin: 'http://localhost:4200' } });
  app.get('/', (req, res) => {
    res.sendFile(path.join(basePath, 'index.html'));
  });

  app.use(express.static(basePath));

  io.on('connection', (socket) => {
    socket.use((packet, next) => {
      console.log(packet);
      next();
    });
    socket.on(
      'gotoDefinition',
      (_requestId: number, filename, text, diagnostic) => {
        gotoDefinition(filename, text, diagnostic);
      }
    );
  });

  server.listen(3000, () => {
    console.log('listening on *:3000');
  });

  function sendSupplement(id: number, supplement: string) {
    io.emit('supplement', id, supplement);
  }

  function sendDiagnostic(fileName: string, diagnostics: Diagnostic[]) {
    io.emit('diagnostics', fileName, diagnostics);
  }

  function sendResolvedErrors(fileName: string, resolvedError: FlatErr[]) {
    io.emit('resolvedError', fileName, resolvedError);
  }

  function onGotoDefinition(
    callback: (fileName: string, text: string, diagnostic: Diagnostic) => void
  ) {
    gotoDefinition = callback;
  }

  function sendResetResolvedErrors() {
    io.emit('resetResolvedErrors');
  }

  // let idx = 0;
  // setInterval(() => {
  //    idx++;
  //    onDiagnostic('testFile', [
  //       `type 'foo${idx}' is not assignable to type 'Foo<number>'.`,
  //    ]);
  //    console.log('emitted test diagnostic');
  // }, 1000);

  return {
    sendDiagnostic,
    onGotoDefinition,
    sendResolvedError: sendResolvedErrors,
    sendResetResolvedErrors,
    sendSupplement,
  };
}
