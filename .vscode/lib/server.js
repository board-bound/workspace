import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { constants, paths } from './constants.js';

export class Server {
  constructor() {
    this.process = null;
  }

  async checkServerExists() {
    try {
      await fs.access(paths.server);
      return true;
    } catch {
      console.error('❌ Server directory not found!');
      console.error('💡 Try running "pnpm install" to fix this error');
      return false;
    }
  }

  async getPluginPaths() {
    const entries = await fs.readdir(constants.cwd, { withFileTypes: true });
    const pluginDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(dir => !constants.systemDirs.includes(dir) && !constants.coreDirs.includes(dir));
    
    return pluginDirs
      .map(dir => path.resolve(constants.cwd, dir, 'dist/index.cjs'))
      .join(',');
  }

  async start() {
    try {
      if (!await this.checkServerExists()) {
        return;
      }

      if (this.process) {
        this.process.kill();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const pluginPaths = await this.getPluginPaths();
      console.log('🚀 Starting server...');

      this.process = spawn('node', [paths.serverExec], {
        env: {
          ...process.env,
          PORT: constants.serverConfig.port,
          LOG_LEVEL: constants.serverConfig.logLevel,
          LOG_PRETTY: constants.serverConfig.logPretty,
          PLUGIN_WATCH: constants.serverConfig.pluginWatch,
          PLUGIN_LOAD_DIRECT: pluginPaths
        },
        stdio: 'inherit',
        cwd: paths.server
      });

      this.setupEventHandlers();

    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      this.process = null;
    }
  }

  setupEventHandlers() {
    this.process.on('error', (err) => {
      console.error('❌ Server failed to start:', err.message);
      this.process = null;
    });

    this.process.on('exit', (code, signal) => {
      if (code !== 0 && signal !== 'SIGTERM') {
        console.error(`❌ Server crashed with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
      }
      this.process = null;
    });
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
