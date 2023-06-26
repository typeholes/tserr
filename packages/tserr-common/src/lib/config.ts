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

export type ProjectConfigs = {
  [x: string]: {
    tsconfig?: string[] | undefined;
    tserr?: string | undefined;
    parentPath: string;
    config?:
      | {
          openProjects: string[];
          ignoreErrCodes: string[];
        }
      | undefined;
  };
};
