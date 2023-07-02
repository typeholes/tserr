import { SlotsType, defineComponent, } from 'vue';
import { Space } from 'arktype';

export function makeArkComponent<T>(space: Space<T>) {
  type ST = {
    [K in keyof typeof space]: Record<K, (typeof space)[K]['infer']>;
  };

  const template = `
<div>
  ${Object.keys(space)
    .map(
      (key) => `
  <slot name="${key}" :${key}="data" v-if="space.${key}.allows(data)">   </slot>
  `
    )
    .join('\n')}
</div>`;
  const component = defineComponent({
    slots: Object as SlotsType<ST>,
    props: ['data'],
    data() {
      return { space };
    },
    template,
  });

  console.log('render: ', component.render, component.template);
  return component;
}
