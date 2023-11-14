import { Schema, schema } from './schema/schema';


const handlers: Record<string, Record<string, (payload: unknown) => void>> = {};

export const eventbus = { sendEvent, onEvent }
export type EventBus = typeof eventbus;


export function sendEvent(pluginName: string, name: string, payload: unknown) {
  const pluginDesc = schema.Plugin.getByKeys(pluginName);
  if (!pluginDesc?.events[name]?.sends) {
    throw new Error(
      `Plugin ${pluginName} attempted to send unregisted event ${name}`,
    );
  }

  for (const [_pluginName, handler] of Object.entries(handlers[name] ?? {})) {
    handler(payload);
  }
}

export function onEvent(
  pluginName: string,
  name: string,
  handler: (payload: unknown) => void,
) {
  const pluginDesc = schema.Plugin.getByKeys(pluginName);
  if (!pluginDesc?.events[name]?.handles && pluginName !== '*DEBUG*') {
    throw new Error(
      `Plugin ${pluginName} attempted to add a handler for unregisted event ${name}`,
    );
  }
  handlers[name] ??= {};
  handlers[name][pluginName] = handler;
}
