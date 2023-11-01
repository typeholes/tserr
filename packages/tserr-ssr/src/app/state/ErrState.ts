import { Err, ErrDesc } from './models/ErrDesc';
import { mkState,  } from './state';

export const ErrState = mkState('Err', (x: Err<ErrDesc<string>>) => [
  x.name,
  ...Object.keys(x.values),
])






// export const bar = relate(foo, 'junk', () => () => ['hi'])
// {
//   'ErrDesc': <T extends string>(states: {ErrDesc: State<'ErrDesc', ErrDesc<T>>}, from: Err<ErrDesc<T>>) =>[states.ErrDesc.getByKeys(from.name)!]
// } );

