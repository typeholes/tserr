import { Schema, schema } from './schema/schema';
import { Err, ErrDesc } from './schema/models/ErrDesc';

// note: this is likely to be slow due to linear seach
// could optimize by putting the parsers in an object keyed by the message up to the first single quote

const unknownError: ErrDesc = {
  name: 'UnknownError',
  keys: ['message'],
  template: `<div>{{err.name}} {{err.keys}} </div>`,
};

export function parseTsErrorMessage(schema: Schema, text: string) {
  console.log('parsing', text, schema.ErrParser.values());
  for (const parser of schema.ErrParser.values('tsc')) {
    if (!parser) {
      continue;
    }
    // console.log(parser);
    console.log(`trying ${parser.name}`);
    const parsed = parser.parse(text);
    //console.log('parsed', parsed);
    if (parsed !== undefined) {
      const desc = schema.ErrDesc.getByKeys(parser.name);
      if (!desc) {
        continue;
      }
      const err: Err<ErrDesc<string>> = {
        name: parser.name,
        values: Object.fromEntries(desc.keys.map((k, i) => [k, parsed[i]])),
      };
      schema.Err.add(err);
      return err;
    }
  }
  schema.ErrDesc.add(unknownError);
  const err = { name: 'UnknownError', values: { message: text } };
  schema.Err.add(err);
  return err;
}
