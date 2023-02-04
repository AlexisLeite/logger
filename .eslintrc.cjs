module.exports = {
  env: {
    es2021: true,
    node: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:react-hooks/recommended',
  ],
  overrides: [
    {
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:@typescript-eslint/strict',
        'eslint-config-airbnb-base',
      ],
      files: ['*.ts', '*.tsx', '.eslintrc.cjs'],
      parserOptions: {
        project: `${__dirname}/tsconfig.json`,
      },
      rules: {
        indent: 'off',
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'no-console': 'off',
        'prefer-object-spread': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        'import/extensions': ['error', 'never'],
        'no-void': 'off',
        'no-restricted-globals': ['error', 'event', 'fdescribe'],
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'react/react-in-jsx-scope': 'off',
        'class-methods-use-this': 'off',
        '@typescript-eslint/non-nullable-type-assertion-style': 'off',
        'linebreak-style': ['error', 'windows'],
        'no-dupe-class-members': 'off',
        'no-param-reassign': [
          'error',
          {
            props: true,
            ignorePropertyModificationsFor: ['state'],
          },
        ],
        'no-confusing-arrow': 'off',
        'implicit-arrow-linebreak': 'off',
        'function-paren-newline': 'off',
        'object-curly-newline': 'off',
        'no-underscore-dangle': 'off',
        'operator-linebreak': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'prettier/prettier': [
          'error',
          {
            endOfLine: 'crlf',
            singleQuote: true,
            trailingComma: 'all',
          },
        ],
        'no-multiple-empty-lines': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'eslint-plugin-react-hooks',
  ],
  settings: {
    'import/resolver': {
      typescript: {},
    },
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist', 'lib', 'node_modules'],
};
