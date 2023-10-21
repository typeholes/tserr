import { states } from './state/states';

// note: this is likely to be slow due to linear seach
// could optimize by putting the parsers in an object keyed by the message up to the first single quote

export function parseErrorMessage(text: string) {
  console.log('parsing', text);
  for (const key of states.ErrParser.keys.value) {
    const parser = states.ErrParser.get(key, 'tsc');
    if (!parser) {
      continue;
    }
    console.log(`trying ${parser.name}`);
    const parsed = parser.parse(text);
    console.log('parsed', parsed);
    if (parsed !== undefined) {
      const desc = states.ErrDesc.get(parser.name);
      if (!desc) {
        continue;
      }
      return states.Err.set({
        name: parser.name,
        values: Object.fromEntries(desc.keys.map((k, i) => [k, parsed[i]])),
      });
    }
  }
  return false;
}
