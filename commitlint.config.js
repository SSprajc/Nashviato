// Commit rules from AGENTS.md, enforced by the husky commit-msg hook.

const AI_ATTRIBUTION = [
  [/claude/i, 'mentions Claude'],
  [/anthropic/i, 'mentions Anthropic'],
  [/generated with/i, 'contains a "Generated with" line'],
  [/\u{1F916}/u, 'contains a robot emoji marker'],
];

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-ai-attribution': ({ raw }) => {
          const hit = AI_ATTRIBUTION.find(([pattern]) => pattern.test(raw ?? ''));
          return [!hit, `commit message ${hit?.[1]}; AI attribution is not allowed`];
        },
      },
    },
  ],
  rules: {
    'no-ai-attribution': [2, 'always'],
    'header-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'test',
        'refactor',
        'perf',
        'build',
        'ci',
        'chore',
        'style',
        'revert',
      ],
    ],
    'scope-enum': [2, 'always', ['core', 'ui', 'spec', 'adr', 'fixtures', 'ci', 'pwa']],
  },
};
