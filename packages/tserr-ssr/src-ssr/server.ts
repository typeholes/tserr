/**
 * More info about this file:
 * https://v2.quasar.dev/quasar-cli-vite/developing-ssr/ssr-webserver
 *
 * Runs in Node context.
 */

/**
 * Make sure to yarn add / npm install (in your project root)
 * anything you import here (except for express and compression).
 */
import express from 'express';
import compression from 'compression';
import {
  ssrClose,
  ssrCreate,
  ssrListen,
  ssrRenderPreloadTag,
  ssrServeStaticContent,
} from 'quasar/wrappers';
import http from 'http';
import { Server, Socket } from 'socket.io';

import { initDummyStates } from 'src/app/state/dummyState';
import { State } from '../../tserr-common/src/lib/schema/state';

/**
 * Create your webserver and return its instance.
 * If needed, prepare your webserver to receive
 * connect-like middlewares.
 *
 * Should NOT be async!
 */
export const create = ssrCreate((/* { ... } */) => {
  const app = express();

  // attackers can use this header to detect apps running Express
  // and then launch specifically-targeted attacks
  app.disable('x-powered-by');

  // place here any middlewares that
  // absolutely need to run before anything else
  if (process.env.PROD) {
    app.use(compression());
  }

  // initTsErrorDescriptions();
  initDummyStates();

  loadTsErrPlugins();

  return app;
});

/**
 * You need to make the server listen to the indicated port
 * and return the listening instance or whatever you need to
 * close the server with.
 *
 * The "listenResult" param for the "close()" definition below
 * is what you return here.
 *
 * For production, you can instead export your
 * handler for serverless use or whatever else fits your needs.
 */
export const listen = ssrListen(async ({ app, port, isReady }) => {
  await isReady();
  const server = http.createServer(app);
  const io = new Server(server);

  io.on('connection', (socket) => {
    socket.use((packet, next) => {
      console.log('recieved', packet);
      next();
    });
    serverStates(socket);
    socket.on('sendAllStates', () => {
      const allStates = Object.entries(schema).map(([name, state]) => [
        name,
        state.values(),
      ]);
      socket.emit('allStates', Object.fromEntries(allStates));
      console.log('allStates sent');

      for (const state of Object.values(schema)) {
        for (const _alias in state.$) {
          const alias = _alias as keyof typeof state.$;
          const relatedStates = Object.entries(state.$[alias])
            .map(([name, state]) =>
              typeof state === 'object' &&
              state &&
              'values' in state &&
              typeof state.values === 'function'
                ? [name, (state as any).values()]
                : undefined,
            )
            .filter((x) => x !== undefined && x.length > 0);
          socket.emit(
            'AllRelatedStates',
            state.stateName,
            alias,
            relatedStates,
          );
        }
      }
    });
  });

  const ret = server.listen(port, () => {
    // if (process.env.PROD) {
    console.log('Server listening at port ' + port);
    // }
  });

  return ret;
});
/**
 * Should close the server and free up any resources.
 * Will be used on development only when the server needs
 * to be rebooted.
 *
 * Should you need the result of the "listen()" call above,
 * you can use the "listenResult" param.
 *
 * Can be async.
 */
export const close = ssrClose(({ listenResult }) => {
  return listenResult.close();
});

const maxAge = process.env.DEV ? 0 : 1000 * 60 * 60 * 24 * 30;

/**
 * Should return middleware that serves the indicated path
 * with static content.
 */
export const serveStaticContent = ssrServeStaticContent((path, opts) => {
  return express.static(path, {
    maxAge,
    ...opts,
  });
});

const jsRE = /\.js$/;
const cssRE = /\.css$/;
const woffRE = /\.woff$/;
const woff2RE = /\.woff2$/;
const gifRE = /\.gif$/;
const jpgRE = /\.jpe?g$/;
const pngRE = /\.png$/;

/**
 * Should return a String with HTML output
 * (if any) for preloading indicated file
 */
export const renderPreloadTag = ssrRenderPreloadTag((file) => {
  if (jsRE.test(file) === true) {
    return `<link rel="modulepreload" href="${file}" crossorigin>`;
  }

  if (cssRE.test(file) === true) {
    return `<link rel="stylesheet" href="${file}">`;
  }

  if (woffRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`;
  }

  if (woff2RE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`;
  }

  if (gifRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="image" type="image/gif">`;
  }

  if (jpgRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="image" type="image/jpeg">`;
  }

  if (pngRE.test(file) === true) {
    return `<link rel="preload" href="${file}" as="image" type="image/png">`;
  }

  return '';
});

function serverStates(server: Socket) {
  //console.log('in serverStates');
  server.on('mutateState', (name: string, operation: string, arg: unknown) => {
    if (!(name in schema)) return;
    const k = name as keyof typeof schema;
    schema[k][operation as 'add'](arg as any);
  });
  for (const state of Object.values(schema)) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    state.onMutate.push((...args: unknown[]) => {
      server.emit('mutateState', state.stateName, ...args);
      //console.log('emit mutateState', state.name, ...args);
    });
    for (const _alias in state.$) {
      const alias = _alias as keyof typeof state.$;
      for (const _entry of Object.entries(state.$[alias])) {
        const entry = _entry as [string, State<string, any, PropertyKey[]>];
        const [relatedName, related] = entry;
        console.log({ alias, related, onMutate: related.onMutate });
        if (related.onMutate === undefined) {
          console.log(
            'skipping mutation listener',
            alias,
            relatedName,
            related.onMutate,
            { related },
          );
          continue;
        }
        console.log('adding mutation listiner to related');
        related.onMutate.push((...args: unknown[]) => {
          console.log({ alias, state, related });
          server.emit(
            'mutateRelatedState',
            state.stateName,
            alias,
            relatedName,
            ...args,
          );
        });
      }
    }
    console.log(schema.ErrLocation.$.At.Err.onMutate.map((x) => `${x}`));
  }

  // Why was this here?
  // server.on('sendAllStates', () => {
  //   //console.log('sending all states');
  //   server.send('allStates', schema);
  // });
}

function loadTsErrPlugins() {
  const args = process.argv.slice(2);
  console.log(args)

  for (const path of args) {
    import(path)
      .then((module) => {
        if (
          typeof module === 'object' &&
          'activate' in module &&
          typeof module.activate === 'function'
        ) {
          module.activate(schema);
        } else {
          throw new Error(`invalid plugin ${path}`);
        }
      })
      .catch((e) => {
        throw new Error(`import failed for ${path}: ${e}`);
      });
  }
}
