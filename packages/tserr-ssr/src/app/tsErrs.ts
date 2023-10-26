import messages from './diagnosticMessages.json';
import { states } from './state/states';

const source = 'tsc';

export function initTsErrorDescriptions() {
  const strings = Object.keys(messages);

  const split = strings.map((s) => [
    s,
    s.replace(/\.$/, '').split(/'(\{[^}]+\})'/),
  ]);

  const errs = split.map(([name, parts]) => ({
    name: name as string,
    keys: parts as string[],
  }));

  let cnt = 0;
  for (const err of errs.slice(0, 1)) {
    // for (const err of errs) {
    if (cnt++ > 5) break;
    while (err.keys[0] === '') {
      err.keys.shift();
    }
    //console.log('keys', err.keys, err.keys.length);
    if (err.keys.length === 1) {
      states.ErrDesc.add({ name: err.name, keys: [] });
      const key = err.keys[0];
      states.ErrParser.add({
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
    states.ErrDesc.add({
      name: err.name,
      keys,
      template: `<div> ${err.name}: {{ err.values }} </div> `,
    });
    states.ErrParser.add({
      name: err.name,
      source,
      parse: mkParseFn(parseParts),
    });
  }

  states.ErrParser.log();
  console.log('puking', JSON.stringify(states.ErrParser.values(), null, 2));
  // throw 'a fit';
}

function mkParseFn(parts: (string | undefined)[]) {
  return (text: string) => {
    let tmp = text;
    const values: string[] = [];
    for (const part of parts) {
      if (part === undefined) {
        //console.log('looking for value');
        const match = text.match(/^'([^']*)'/);
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
