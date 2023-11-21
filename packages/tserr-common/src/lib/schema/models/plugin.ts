import { type, type Type,  } from 'arktype';

export type PluginDesc = {
  name: string;
  // schema: '', //todo
  events: Record<
    string,
    { sends: boolean; handles: boolean; type: Type<any> }
  >;
};


