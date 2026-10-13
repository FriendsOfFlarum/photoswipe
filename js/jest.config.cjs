const path = require('path');
const base = require('@flarum/jest-config')();

module.exports = {
  ...base,
  // Vendored core also needs access to the shared config's dependencies under pnpm.
  modulePaths: [...base.modulePaths, path.resolve(path.dirname(require.resolve('@flarum/jest-config')), '../..')],
  transformIgnorePatterns: ['/node_modules/(?!(?:\\.pnpm/|@flarum/jest-config/))'],
};
