import { appState } from './appState'
import { format } from 'prettier';
import parserTS from 'prettier/parser-typescript';

// const highlighter = (window as any).highlighter as Highlighter;
const codeToHtml = (window as any).codeToHtml as (code: string, theme: string, lang: string) => string;

const codeTypes = {
  type: {
    stub: 'type __TSE_STUB__ =',
    cleanup: (s: string | undefined) =>
      s
        ?.replace(/ *type */, '')
        .replace(/ *__TSE_STUB__ */, '')
        .replace('>=', '>')
        .replace(/(<span[^>]*>\s*<\/span>)+/, ''),
  },
  signature: {
    stub: 'function ',
    cleanup: (s: string | undefined) => s?.replace(/function */, ''),
  },
  raw: {
    stub: '',
    cleanup: (s: string | undefined) => s??'No code provided'
  }
} as const;

export type CodeType = keyof typeof codeTypes;

export function prettyCode(
  code: string,
  codeType: CodeType = 'type',
  pretty: boolean = true,
  lang: 'ts'|'html' = 'ts',
) {
  const { stub, cleanup } = codeTypes[codeType ?? 'type'];
  if (pretty) {
    return cleanup(highlight(formatCode(`${stub} ${code}`), lang));
  } else {
    return highlight(code, lang);
  }
}

export function highlight(code: string | undefined,
  lang: 'ts'|'html' = 'ts',
  ) {
  if (code === undefined) {
    return undefined;
  }
  if (codeToHtml) {
    return codeToHtml(code, appState.shikiTheme, lang)
    // , {
    //   lang: 'ts',
    //   theme: appState.shikiTheme,
    // });
  }
  return code;
}

export function formatCode(code: string | undefined) {
  if (code === undefined) {
    return undefined;
  }
  try {
    return format(code, {
      parser: 'typescript',
      plugins: [parserTS],
    });
  } catch (e) {
    try {
      const fixed = code.replaceAll('...', 'ⵈ');

      return format(fixed, {
        parser: 'typescript',
        plugins: [parserTS],
      });
    } catch (e) {
      return code;
    }
  }
}
