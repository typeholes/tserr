import { type } from 'arktype';
export const tsErrConfig = type({
  openProjects: 'string[]',
  ignoreErrCodes: 'string[]',
});

export type TsErrConfig = typeof tsErrConfig.infer;

export const TsErrConfigDefault: TsErrConfig = {
  openProjects: [],
  ignoreErrCodes: [],
};
