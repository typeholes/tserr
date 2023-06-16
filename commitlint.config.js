// import type { UserConfig } from '@commitlint/types';
// import { RuleConfigSeverity } from '@commitlint/types';

//const Configuration = {
module.exports = {
  /*
   * Resolve and load @commitlint/config-conventional from node_modules.
   * Referenced packages must be installed
   */
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0 /*RuleConfigSeverity.Disabled*/],
    'body-max-length': [0 /*RuleConfigSeverity.Disabled*/],
  },
};
