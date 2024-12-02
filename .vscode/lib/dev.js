import { getProjects } from "./scanner.js";
import { existsSync } from 'fs';
import { join } from 'path';
import { spawn } from "child_process";
import chokidar from 'chokidar';

(async () => {
  if (!existsSync(join(process.cwd(), '.git', 'hooks', 'pre-commit'))) {
    console.warn('ℹ️ Dev Mode is not enabled. Run "pnpm enable-dev" to enable it.');
  }

  const cwd = process.cwd();
  const projects = getProjects().filter((p) => !['server', 'sdk'].includes(p.name));

  let server;
  let serverCrashed = false;

  function buildServer() {
    return new Promise((resolve, reject) => {
      console.log('🔨 Building server...');
      const opt = {
        cwd: join(cwd, 'server'),
      };
      const buildProcess = spawn('pnpm', ['build'], opt);

      buildProcess.stdout.on('data', (data) => process.stdout.write(data));
      buildProcess.stderr.on('data', (data) => process.stderr.write(data));

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Server build process exited with code ${code}`));
        }
      });
    });
  }

  async function startServer() {
    await buildServer();
    console.log('🚀 Starting server...');
    const opt = {
      cwd: join(cwd, 'server'),
    };
    server = spawn('node', [join(cwd, 'server', 'dist', 'index.cjs')], {
      ...opt,
      env: {
        PORT: '3000',
        LOG_LEVEL: 'debug',
        LOG_PRETTY: 'true',
        LOG_COLORIZE: 'true',
        PLUGIN_WATCH: 'true',
        PLUGIN_LOAD_DIRECT: projects.length ? projects.map((p) => `../${p.name}/dist/index.cjs`).join(',') : undefined,
      }
    });

    server.stdout.on('data', (data) => process.stdout.write(data));
    server.stderr.on('data', (data) => process.stderr.write(data));

    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (code !== 0) {
        serverCrashed = true;
        console.error('Server process crashed.');
        console.error('ℹ️  Waiting for changes to restart...');
      }
    });
  }

  for (const x of ['SIGINT', 'SIGTERM']) {
    process.on(x, () => {
      if (server) server.kill(x);
      process.exit(0);
    });
  }

  function buildSDK() {
    return new Promise((resolve, reject) => {
      console.log('🔨 Building SDK...');
      const opt = {
        cwd: join(cwd, 'sdk'),
      };
      const buildProcess = spawn('pnpm', ['build:ts'], opt);

      buildProcess.stdout.on('data', (data) => process.stdout.write(data));
      buildProcess.stderr.on('data', (data) => process.stderr.write(data));

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`SDK build process exited with code ${code}`));
        }
      });
    });
  }

  function buildPlugin(plugin) {
    return new Promise((resolve, reject) => {
      console.log(`🔨 Building plugin: "${plugin}"`);
      const opt = {
        cwd: join(cwd, plugin),
      };
      const buildProcess = spawn('pnpm', ['build'], opt);

      buildProcess.stdout.on('data', (data) => process.stdout.write(data));
      buildProcess.stderr.on('data', (data) => process.stderr.write(data));

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Plugin "${plugin}" build process exited with code ${code}`));
        }
      });
    });
  }

  // Initial SDK build
  await buildSDK();

  // Initial plugin builds
  for (const { name } of projects) {
    try {
      await buildPlugin(name);
    } catch (error) {
      console.error(`Error building plugin "${name}":`, error.message);
    }
  }

  // Watch options
  const opts = {
    ignoreInitial: true,
    awaitWriteFinish: true,
  };

  // Set up watchers for plugins
  for (const { name } of projects) {
    const watcher = chokidar.watch(join(cwd, name, 'src'), opts);
    watcher.on('all', async () => {
      try {
        await buildPlugin(name);
      } catch (error) {
        console.error(`Error rebuilding plugin "${name}":`, error.message);
        console.error('ℹ️  Waiting for changes to try again...');
      }
    });
  }

  // Watcher for server source changes
  chokidar.watch(join(cwd, 'server', 'src'), opts).on('all', async () => {
    if (server) server.kill('SIGINT');
    serverCrashed = false;
    await startServer();
  });

  // Watcher for SDK source changes
  chokidar.watch(join(cwd, 'sdk', 'src'), opts).on('all', async () => {
    if (server) server.kill('SIGINT');
    await buildSDK();
    console.log('ℹ️ Rebuilding all plugins...');
    await Promise.all(projects.map(async ({ name }) => {
      try {
        await buildPlugin(name);
      } catch (error) {
        console.error(`Error rebuilding plugin "${name}":`, error.message);
        console.error('ℹ️  Waiting for changes to try again...');
      }
    }));
    await startServer();
  });

  // Start the server
  await startServer();
})();
