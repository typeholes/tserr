import { FlatErr, ProjectPath, ProjectConfigs } from '@typeholes/tserr-common';
import { ProjectEvent } from './project';

export type TserrPluginEvents = {
  resolvedErrors: (fileName: string, resolvedError: FlatErr[]) => void;
  resetResolvedErrors: (filenames?: string[]) => void;

  supplement: (id: number, supplement: string) => void;

  fixes: (
    fixesRec: Record<
      number,
      [fixId: number, fixDescription: string, fn: () => void][]
    >
  ) => void;

  hasProject: (projectPath: string) => void;
  openProject: (projectPath: string) => void;
  closeProject: (projectPath: string) => void;
};

export type TserrPluginApi = {
  // addSemanticErrorIdentifiers: (...identifiers: typeof semanticErrorIdentifiers) => void;
  getProjectRoot: () => string;
  getConfigs: () => ProjectConfigs;
  getProjectPaths: () => ProjectPath[];
  addProjectEventHandlers: (
    ...handlers: ((projectEvents: ProjectEvent[]) => void)[]
  ) => void;
  send: TserrPluginEvents;
  on: { [K in keyof TserrPluginEvents]: (on: TserrPluginEvents[K]) => void };
};

export type TserrPlugin = {
  key: string;
  register: (api: TserrPluginApi) => void;
  displayName: string;
};

export type ProjectEventHandlers = ((projectEvents: ProjectEvent[]) => void)[];

//prettier-ignore
export type OnPluginState<K extends keyof TserrPluginApi & `on${string}`> = TserrPluginApi[K] extends (...args: any[])=>void ? Parameters<TserrPluginApi[K]>[0] : never;

export type PluginState = {
  active: boolean;
  displayName: string;
  api: TserrPluginApi;
  projectEventHandlers: ProjectEventHandlers;
  on: TserrPluginEvents;
};
