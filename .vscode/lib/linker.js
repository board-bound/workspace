import { getProjects, resolveDependencyChain } from './scanner.js';
import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

export function writeGitHook(dir) {
  writeFileSync(
    join(dir, '.git', 'hooks', 'pre-commit'),
    '#!/bin/sh\necho "Please disable Dev Mode before committing changes."\nexit 1'
  );
}

export function enableDevEnv() {
  console.log('\n🟡 Enabling Dev Mode...\n');
  const projects = getProjects();
  const chain = resolveDependencyChain(projects);
  console.log('');
  for (const project of projects) {
    const localDeps = Object.keys(chain[project.package.name]);
    project.package.alias = localDeps.reduce((aliases, dep) => {
      const p = projects.find((p) => p.package.name === dep);
      aliases[dep] = `../${p.name}/src/index.ts`;
      return aliases;
    }, {});
    writeFileSync(
      join(process.cwd(), project.name, 'package.json'),
      JSON.stringify(project.package, null, 2),
    );
    console.log(`📝 Updated package.json for "${project.name}"`);
    const tsconfigPath = join(process.cwd(), project.name, 'tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath).toString());
    tsconfig.compilerOptions.paths = localDeps.reduce((paths, dep) => {
      const p = projects.find((p) => p.package.name === dep);
      paths[dep] = [`../${p.name}/src`];
      return paths;
    }, {});
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log(`📝 Updated tsconfig.json for "${project.name}"`);
    writeGitHook(join(process.cwd(), project.name));
    console.log(`📝 Added pre-commit hook for "${project.name}"`);
  }
  writeGitHook(process.cwd());
  console.log('📝 Added root pre-commit hook\n');
  console.log('🟢 Dev Mode enabled!\n');
}

export function disableDevEnv() {
  console.log('\n🟡 Disabling Dev Mode...\n');
  const projects = getProjects();
  console.log('');
  for (const project of projects) {
    delete project.package.alias;
    writeFileSync(
      join(process.cwd(), project.name, 'package.json'),
      JSON.stringify(project.package, null, 2),
    );
    console.log(`📝 Updated package.json for "${project.name}"`);
    const tsconfigPath = join(process.cwd(), project.name, 'tsconfig.json');
    const tsconfig = JSON.parse(readFileSync(tsconfigPath).toString());
    delete tsconfig.compilerOptions.paths;
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log(`📝 Updated tsconfig.json for "${project.name}"`);
    if (existsSync(join(process.cwd(), project.name, '.git', 'hooks', 'pre-commit'))){
      rmSync(join(process.cwd(), project.name, '.git', 'hooks', 'pre-commit'));
      console.log(`📝 Removed pre-commit hook for "${project.name}"`)
    }
  }
  if (isDevEnvEnabled()) {
    rmSync(join(process.cwd(), '.git', 'hooks', 'pre-commit'));
    console.log('📝 Removed root pre-commit hook.');
  }
  console.log('\n🔴 Dev Mode disabled!\n');
}

export function isDevEnvEnabled() {
  return existsSync(join(process.cwd(), '.git', 'hooks', 'pre-commit'));;
}
