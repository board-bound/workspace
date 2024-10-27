import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { PackageManager } from './packageManager.js';
import { paths } from './constants.js';

export class Builder {
  constructor() {
    this.isBuilding = false;
    this.pendingRestart = false;
  }

  async buildDir(dir) {
    if (this.isBuilding) {
      this.pendingRestart = true;
      return;
    }

    try {
      this.isBuilding = true;
      const dirName = path.basename(dir);
      console.log(`🔨 Building ${dirName}...`);

      const sdkExists = await fs.access(paths.sdk)
        .then(() => true)
        .catch(() => false);

      let originalPkg;
      if (sdkExists || dirName !== 'sdk') {
        originalPkg = await PackageManager.addAliases(dir);
      }

      await this.runBuild(dir);

      if (originalPkg) {
        await PackageManager.restorePackageJson(dir, originalPkg);
      }

      console.log(`✅ Built ${dirName} successfully`);
    } catch (error) {
      console.error(`❌ Build failed for ${path.basename(dir)}:`, error.message);
    } finally {
      this.isBuilding = false;
      if (this.pendingRestart) {
        this.pendingRestart = false;
        await this.buildDir(dir);
      }
    }
  }

  async runBuild(dir) {
    return new Promise((resolve, reject) => {
      const build = spawn('pnpm', ['build'], { cwd: dir, stdio: 'inherit' });
      build.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with code ${code}`));
      });
      build.on('error', reject);
    });
  }

  async buildInOrder(subdirs) {
    if (subdirs.includes('sdk')) {
      await this.buildDir(path.join(process.cwd(), 'sdk'));
      subdirs = subdirs.filter(dir => dir !== 'sdk');
    }

    if (subdirs.includes('server')) {
      await this.buildDir(path.join(process.cwd(), 'server'));
      subdirs = subdirs.filter(dir => dir !== 'server');
    }

    for (const dir of subdirs) {
      await this.buildDir(path.join(process.cwd(), dir));
    }
  }
}
