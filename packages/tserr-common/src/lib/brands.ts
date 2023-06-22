type Branded<T, B extends string> = T & { __$Brand: B };

type Brand<T, B extends string> = {
  brandString: B;
  un: (tb: Branded<T, B>) => T;
  for: (t: T) => Branded<T, B>;
} & ((t: T) => Branded<T, B>);

export const mkBrand =
  <T>(
    validator: undefined | ((t: T) => string | undefined) = undefined,
    _for: undefined | ((t: T) => T | undefined) = undefined
  ) =>
  <B extends string>(b: B): Brand<T, B> | never => {
    const fn = (t: T) => {
      const errMsg = validator ? validator(t) : undefined;
      if (errMsg === undefined) {
        return t as Branded<T, B>;
      }
      throw new Error(errMsg);
    };
    fn.brandString = b;
    fn.un = (tb: Branded<T, B>) => tb as T;

    const forFn = _for ?? ((t: T) => t);
    fn.for = (t: T) => forFn(t) as Branded<T, B>;
    return fn;
  };

const brandStr = mkBrand<string>();

export const FileName = brandStr('FileName');
export type FileName = ReturnType<typeof FileName>;

export const ProjectPath = brandStr('ProjectPath');
export type ProjectPath = ReturnType<typeof ProjectPath>;

const plugins: string[] = [];

export const PluginName = mkBrand(
  (name: string) =>
    plugins.includes(name)
      ? `plugin ${name} is already registered`
      : void plugins.push(name),
  (name: string) => (plugins.includes(name) ? name : undefined)
)('PluginName');
export type PluginName = ReturnType<typeof PluginName>;
