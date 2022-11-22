import { defineConfig } from 'vite';
import RubyPlugin from 'vite-plugin-ruby';
import react from '@vitejs/plugin-react';

import path from 'path';
import fs from 'fs';

const sourceCodeDir = 'app/javascript';
const items = fs.readdirSync(sourceCodeDir);
const directories = items.filter(item => fs.lstatSync(path.join(sourceCodeDir, item)).isDirectory());
const aliasesFromJavascriptRoot = {};
directories.forEach(directory => {
  aliasesFromJavascriptRoot[directory] = path.resolve(__dirname, sourceCodeDir, directory);
});

export default defineConfig({
  resolve: {
    alias: {
      ...aliasesFromJavascriptRoot,
      // can add more aliases, as "old" images or "@assets", see below
      images: path.resolve(__dirname, './app/assets/images'),
    },
  },
  plugins: [
    RubyPlugin(),
    react({
      babel: {
        plugins:
        [  ['@babel/proposal-decorators', { legacy: true }],
          ['react-intl', { messagesDir: './build/messages' }],
          'preval'],
      },
    }),
  ],
});
