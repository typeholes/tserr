import { type } from 'arktype';
import { loadPlugin } from 'src/boot/loadPlugins';
import { reactive, ref, watch, nextTick } from 'vue';
import { _mkSchema } from '@typeholes/tserr-common';

if (!window.tserrSchema?.schema) {
  window.tserrSchema = { schema: _mkSchema() };
}
const schema = window.tserrSchema.schema;

const readFile = window.tserrFileApi?.readFile;
const writeFile = window.tserrFileApi?.writeFile;

const configType = type({
  plugins: 'string[]',
  'templates?': type('any'), //Record<string,string[]>'),
});
export type ConfigType = typeof configType.infer;

export const config = reactive({
  plugins: [] as string[],
  templates: {} as Record<string, string[]>,
});

export const configDirty = ref(false);
watch(config, () => (configDirty.value = true));

export function writeConfig(configPath: string) {
  writeFile(configPath, JSON.stringify(config, null, 3));
  configDirty.value = false;
}

export function loadConfig(configPath: string) {
  try {
    const fileContents = readFile(configPath).toString();

    const fileJson = JSON.parse(fileContents);
    const { data, problems } = configType(fileJson);
    if (problems) {
      throw new Error(problems.summary);
    }

    const basePath = configPath.replace(/\/[^\/]+$/, '');
    const paths = data.plugins.map((path) =>
      path.replace(/^\.\//, basePath + '/'),
    );
    for (const pluginPath of paths) {
      loadPlugin(schema, pluginPath);
    }

    if (data.templates) {
      for (const name in data.templates) {
        const desc = schema.ErrDesc.getByKeys(name);
        if (desc) {
          desc.template = data.templates[name].join('\n');
          schema.ErrDesc.add(desc);
        }
      }
    }

    config.plugins = data.plugins;
    config.templates = data.templates ?? {};
    nextTick(() => (configDirty.value = false));
  } catch (e) {
    throw e;
  }
}


