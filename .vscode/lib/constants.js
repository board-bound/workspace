import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const constants = {
  cwd: process.cwd(),
  defaultIgnored: [
    '**/node_modules/**',
    '**/.git/**',
    '.vscode/**',
    '**/.parcel-cache/**',
    '**/package.json',
    '**/dist/**'
  ],
  systemDirs: [
    'node_modules',
    '.git',
    '.vscode',
    'dist',
    'build',
    'coverage',
    '.idea',
    '.DS_Store',
    '.parcel-cache'
  ],
  coreDirs: [
    'sdk',
    'server'
  ],
  serverConfig: {
    port: '3000',
    logLevel: 'debug',
    pluginWatch: 'true',
    logPretty: 'true'
  }
};

export const paths = {
  server: path.join(constants.cwd, 'server'),
  sdk: path.join(constants.cwd, 'sdk'),
  serverExec: 'dist/index.cjs'
};
