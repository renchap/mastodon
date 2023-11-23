// @ts-check
const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  extends: ['../.eslintrc.js'],
  env: {
    browser: false,
  },
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname
  },
  rules: {
    'import/no-commonjs': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'streaming/.eslintrc.js',
        ],
        optionalDependencies: false,
        peerDependencies: false,
        includeTypes: true,
        packageDir: __dirname,
      },
    ],
  },
});
