import { ErrDescState } from './ErrDescState';
import { ErrParserState } from './ErrParserState';
import { ErrState } from './ErrState';
import { ErrLocationState } from './ErrLocationState';
import { reactive } from 'vue';

export const states = reactive({
  ErrDesc: ErrDescState,
  ErrParser: ErrParserState,
  Err: ErrState,
  ErrLocation: ErrLocationState,
});
