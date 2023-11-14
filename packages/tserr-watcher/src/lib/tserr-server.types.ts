import {
  ProjectPath,
  ProjectConfigs,
  PluginName,
} from '@typeholes/tserr-common';
import { ProjectEvent } from './project';


export type ProjectEventHandlers = ((projectEvents: ProjectEvent[]) => void)[];

