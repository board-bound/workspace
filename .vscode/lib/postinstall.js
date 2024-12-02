import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { disableDevEnv, enableDevEnv, isDevEnvEnabled } from './linker.js';

console.log('👋 Welcome to the board bound dev environment!');

try {
  execSync('git --version', { stdio: 'ignore' });
} catch {
  console.error('❌ Git is not installed!');
  process.exit(1);
}
try {
  execSync('pnpm --version', { stdio: 'ignore' });
} catch {
  console.error('❌ pnpm is not installed!');
  process.exit(1);
}

const config = existsSync('config.json') ? JSON.parse(readFileSync('config.json')) : {
  autoUpdate: [
    'server',
    'sdk',
  ],
};

const devModeWasEnabled = isDevEnvEnabled();
if (devModeWasEnabled) disableDevEnv();


if (!existsSync('server')) {
  console.log('🚀 Cloning server repository...');
  execSync('git clone git@github.com:board-bound/server.git', { stdio: 'inherit' });
}

if (!existsSync('sdk')) {
  console.log('🚀 Cloning sdk repository...');
  execSync('git clone git@github.com:board-bound/sdk.git', { stdio: 'inherit' });
}

for (const repo of config.autoUpdate) if (existsSync(repo)) {
  console.log(`🔄 Updating ${repo} repository...`);
  execSync('git pull', { stdio: 'inherit', cwd: join(process.cwd(), repo) });
  execSync('pnpm install', { stdio: 'inherit', cwd: join(process.cwd(), repo) });
}

if (devModeWasEnabled) enableDevEnv();

console.log('🎉 Development environment setup complete!');
console.log('🎓 While working on your project, remember to enable Dev Mode for the development environment.');
console.log('🎓 Use "pnpm enable-dev" to enable Dev Mode and "pnpm disable-dev" to disable it when needed.');
console.log('🎓 Enabling Dev Mode links local repositories to each other, ensuring TypeScript correctly recognizes local files.');
console.log('🎓 To avoid accidental commits of Dev Mode configuration, a git hook will be added.');
console.log('🎓 This hook will block any commits until Dev Mode is disabled.');
