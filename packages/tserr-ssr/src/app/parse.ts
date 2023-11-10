import { schema } from '@typeholes/tserr-common';

// note: this is likely to be slow due to linear seach
// could optimize by putting the parsers in an object keyed by the message up to the first single quote

export function parseErrorMessage(text: string) {
  //console.log('parsing', text);
  for (const parser of schema.ErrParser.values('tsc')) {
    if (!parser) {
      continue;
    }
    console.log(parser);
    //console.log(`trying ${parser.name}`);
    const parsed = parser.parse(text);
    //console.log('parsed', parsed);
    if (parsed !== undefined) {
      const desc = schema.ErrDesc.getByKeys(parser.name);
      if (!desc) {
        continue;
      }
      return schema.Err.add({
        name: parser.name,
        values: Object.fromEntries(desc.keys.map((k, i) => [k, parsed[i]])),
      });
    }
  }
  return false;
}
