/**
 * Conventional Commits — enforced via Husky `commit-msg` hook.
 * Format: type(scope): subject
 * Scopes map to the monorepo: api, web, mobile, shared, infra, ci, deps.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['api', 'web', 'mobile', 'shared', 'infra', 'ci', 'deps', 'docs', 'release'],
    ],
    'subject-case': [0],
  },
};
