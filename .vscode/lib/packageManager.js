import { promises as fs } from 'fs';
import path from 'path';

export class PackageManager {
  static async readPackageJson(dir) {
    const pkgPath = path.join(dir, 'package.json');
    const content = await fs.readFile(pkgPath, 'utf8');
    return JSON.parse(content);
  }

  static async writePackageJson(dir, content) {
    const pkgPath = path.join(dir, 'package.json');
    await fs.writeFile(pkgPath, JSON.stringify(content, null, 2));
  }

  static async addAliases(dir) {
    const pkg = await this.readPackageJson(dir);
    const originalPkg = { ...pkg };
    const dirName = path.basename(dir);

    if (!pkg.alias) pkg.alias = {};
    
    if (dirName !== 'sdk') {
      pkg.alias['@board-bound/sdk'] = '../sdk/dist/index.cjs';
    }
    
    if (!['sdk', 'server'].includes(dirName)) {
      pkg.alias['@board-bound/server'] = '../server/dist/index.cjs';
    }

    await this.writePackageJson(dir, pkg);
    return originalPkg;
  }

  static async restorePackageJson(dir, originalContent) {
    await this.writePackageJson(dir, originalContent);
  }
}
