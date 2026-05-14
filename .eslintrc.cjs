module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    browser: true,
    es2020: true,
  },
  rules: {
    '@typescript-eslint/no-inferrable-types': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/typedef': [
          'error',
          {
            variableDeclaration: true,
            memberVariableDeclaration: true,
            parameter: true,
            propertyDeclaration: true,
          },
        ],
      },
    },
  ],
};
