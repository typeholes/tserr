import messages from '../../../tserr-ssr/src/app/diagnosticMessages.json';
import { Schema } from './schema/schema';

const source = 'tsc';

let wasInit = false;

export function initTsErrorDescriptions(schema: Schema) {
  if (wasInit) return;
  wasInit = true;

  const strings = Object.keys(messages);

  const split = strings.map((s) => [
    s,
    s.replace(/\.$/, '').split(/'(\{[^}]+\})'/),
  ]);

  const errs = split.map(([name, parts]) => ({
    name: name as string,
    keys: parts as string[],
  }));

  for (const err of errs) {
    // for (const err of errs) {
    while (err.keys[0] === '') {
      err.keys.shift();
    }
    //console.log('keys', err.keys, err.keys.length);
    if (err.keys.length === 1) {
      schema.ErrDesc.add({ name: err.name, keys: [] });
      const key = err.keys[0];
      schema.ErrParser.add({
        name: err.name,
        source,
        parse: (text) => (text.replace(/\.$/, '') === key ? [] : undefined),
      });
      continue;
    }
    const keys: string[] = [];
    const parseParts: (string | undefined)[] = [];
    for (const key of err.keys) {
      if (key === '') {
        continue;
      }
      if (key.startsWith('{')) {
        parseParts.push(undefined);
        continue;
      }
      keys.push(key);
      parseParts.push(key);
    }
    schema.ErrDesc.add({
      name: err.name,
      keys,
      template: `
<div class="row q-ma-sm">
   <div class="row q-ma-sm" style="border: 1px solid purple" >${keys
     .map(
       (key) => {
          const cleanKey = key.replaceAll('`',"'");
         return `
  <div style="border: 1px solid blue" class="column q-pa-sm q-ma-sm">
     <div style="border-bottom: 1px dashed blue">${key}</div>
     <code-block :code="err?.values[\`${cleanKey}\`]"/>
  </div>`;
       }
     )
     .join(' ')}</div>
</div> `,
    });
    schema.ErrParser.add({
      name: err.name,
      source,
      parse: mkParseFn(parseParts),
    });
  }

  // schema.ErrParser.log();
  // console.log('puking', JSON.stringify(states.ErrParser.values(), null, 2));
  // throw 'a fit';
}

function mkParseFn(parts: (string | undefined)[]) {
  return (text: string) => {
    let tmp = text;
    const values: string[] = [];
    for (const part of parts) {
      if (part === undefined) {
        //console.log('looking for value');
        const match = tmp.match(/^'([^']*)'/);
        if (!match) {
          //console.log('no value');
          return undefined;
        }
        //console.log('value', match);
        const value = match[1];
        tmp = tmp.replace(match[0], '');
        values.push(value);
      } else {
        //console.log(['lookin for text', part, tmp]);
        if (!tmp.startsWith(part)) {
          //console.log('text not found');
          return undefined;
        }
        //console.log('text found');
        tmp = tmp.replace(part, '');
      }
    }
    return values;
  };
}
