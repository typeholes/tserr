import { invertRecord } from './invertRecord';

const categoryCodes: Record<string, string[]> = {
  lint: [],
  info: ['2772', '2769'],
};

const codeCategory = invertRecord(categoryCodes);

export const CodeDescription = {
  source(code: string) {
    if (Number.parseInt(code).toString() === code) {
      return 'tsc';
    }
    if (code.startsWith('tserr:')) {
      return 'tserr';
    }
    return 'unknown';
  },
  category(code: string) {
    return codeCategory[code] ?? 'Error';
  },
};
