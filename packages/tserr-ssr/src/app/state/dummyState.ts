// import { parseTsErrorMessage } from '../../../../tserr-common/src/lib/parser';
import { ErrLocation } from '../../../../tserr-common/src/lib/schema/models/ErrDesc';
import { schema } from '../../../../tserr-common/src/lib/schema/schema';

export function initDummyStates() {
  schema.ErrDesc.add({
    name: 'foo',
    keys: ['bar'],
    template: `
<div> bar: {{ err.values.bar }} </div>
`,
  });

  const err = {
    name: 'foo',
    values: { bar: '1' },
  };

  schema.Err.add(err);

  schema.ErrParser.add({
    name: 'foo',
    source: 'dummy',
    parse: (text) => [text],
  });

  const location: ErrLocation = {
    fileName: 'dummy.ts',
    span: { start: { line: 1, char: 2 }, end: { line: 3, char: 4 } },
  };
  schema.ErrLocation.add(location);

  // const errorsAtLocation = JSON.stringify(schema.ErrLocation.$.At.Err(location), null, 2); // Err<ErrDesc<string>>[]:

  //  const _errorsInDummyFile = schema.ErrLocation.$.At.Err.values('dummy.ts'); // : [ErrLocation, Err<ErrDesc<string>>][]
  //  const _errorsOnDummyFileLine1 = schema.ErrLocation.$.At.Err.values('dummy.ts', 1);

  // setTimeout(() => {
  // setInterval(() => {
  //   schema.Err.add({ name: 'foo', values: { bar: '4' } });
  //   schema.ErrLocation.$.At.Err.add([location, err]);
  //   console.log('Errs at loc', schema.ErrLocation.$.At.Err.values());
  //   // parseErrorMessage("'dummy' expected.");
  // }, 5000);
}
