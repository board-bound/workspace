import { promises as fs } from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import picomatch from 'picomatch';
import { constants } from './constants.js';
import { Builder } from './builder.js';
import { Server } from './server.js';

export class Workspace {
  constructor() {
    this.server = new Server();
    this.builder = new Builder();
    this.setupInProgress = false;
    this.pendingRestart = false;
    this.fileChangeTimeout = null;
    this.isAliasUpdate = false;
  }

  async setup() {
    if (this.setupInProgress) {
      this.pendingRestart = true;
      return;
    }

    try {
      this.setupInProgress = true;
      console.log('🔄 Setting up workspace...');
      
      if (!await this.server.checkServerExists()) {
        return;
      }

      const subdirs = await this.getSubdirs();
      await this.builder.buildInOrder(subdirs);
      await this.server.start();

      console.log('✨ Workspace setup complete');

    } catch (error) {
      console.error('❌ Workspace setup failed:', error.message);
    } finally {
      this.setupInProgress = false;
      if (this.pendingRestart) {
        this.pendingRestart = false;
        setTimeout(() => this.setup(), 1000);
      }
    }
  }

  isValidPluginDir(dir) {
    return !constants.systemDirs.includes(dir) && !constants.coreDirs.includes(dir);
  }

  async getSubdirs() {
    const entries = await fs.readdir(constants.cwd, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(dir => !constants.systemDirs.includes(dir));
  }

  parseGitignore(content, basePath) {
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => {
        pattern = pattern.replace(/^\/+|\/+$/g, '');
        
        const isNegation = pattern.startsWith('!');
        if (isNegation) {
          pattern = pattern.slice(1);
        }

        const absolutePattern = pattern.startsWith('**') 
          ? path.join(basePath, pattern)
          : path.join(basePath, '**', pattern);

        return isNegation ? `!${absolutePattern}` : absolutePattern;
      });
  }

  async getIgnoredPatterns(dir) {
    const gitignorePath = path.join(dir, '.gitignore');
    const ignored = [...constants.defaultIgnored];

    try {
      const gitignore = await fs.readFile(gitignorePath, 'utf8');
      const gitignorePatterns = this.parseGitignore(gitignore, dir);
      ignored.push(...gitignorePatterns);
    } catch (err) {
      // .gitignore doesn't exist
    }

    const isIgnored = picomatch(ignored);

    return (testPath) => {
      if (
        testPath.includes('node_modules') ||
        testPath.includes('.git') ||
        testPath.includes('.parcel-cache') ||
        testPath.includes('dist') ||
        (path.basename(testPath) === 'package.json' && this.isAliasUpdate)
      ) {
        return true;
      }

      return isIgnored(testPath);
    };
  }

  async setupDirWatcher(dir) {
    if (constants.systemDirs.includes(dir)) {
      return null;
    }

    const fullPath = path.join(constants.cwd, dir);
    const ignoreFn = await this.getIgnoredPatterns(fullPath);

    const watcher = chokidar.watch(fullPath, {
      ignored: ignoreFn,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      },
      persistent: true
    });

    watcher.on('all', async (event, filepath) => {
      if (ignoreFn(filepath)) {
        return;
      }

      if (['add', 'change', 'unlink'].includes(event)) {
        clearTimeout(this.fileChangeTimeout);
        this.fileChangeTimeout = setTimeout(async () => {
          console.log(`📝 File ${event}: ${path.relative(constants.cwd, filepath)}`);
          
          try {
            if (constants.coreDirs.includes(dir)) {
              await this.setup();
            } else {
              await this.builder.buildDir(fullPath);
            }
          } catch (error) {
            console.error(`❌ Failed to handle file change: ${error.message}`);
          }
        }, 100);
      }
    });

    return watcher;
  }

  setupWatchers() {
    chokidar.watch(constants.cwd, {
      depth: 0,
      ignored: [
        ...constants.defaultIgnored,
        ...constants.systemDirs.map(dir => path.join(constants.cwd, dir))
      ],
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    }).on('addDir', async (dir) => {
      if (path.dirname(dir) === constants.cwd && this.isValidPluginDir(path.basename(dir))) {
        await this.setup();
      }
    }).on('unlinkDir', async (dir) => {
      if (path.dirname(dir) === constants.cwd && this.isValidPluginDir(path.basename(dir))) {
        await this.setup();
      }
    });

    this.getSubdirs().then(subdirs => {
      subdirs.forEach(dir => {
        if (!constants.systemDirs.includes(dir)) {
          this.setupDirWatcher(dir);
        }
      });
    });
  }

  shutdown() {
    this.server.stop();
  }
}
