import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join } from 'path';

export function getProjects() {
  return readdirSync(process.cwd()).filter((f) => {
    if (!statSync(join(process.cwd(), f)).isDirectory()) return false;
    if (!existsSync(join(process.cwd(), f, 'package.json'))) return false;
    console.log(`🔍 Found project: "${f}"`);
    return true;
  }).map((f) => ({
    name: f,
    package: JSON.parse(readFileSync(join(process.cwd(), f, 'package.json')).toString())
  }));
}

export function resolveDependencyChain(projects) {
  // Create a lookup map of project names to their package data
  const projectMap = projects.reduce((map, project) => {
    map[project.package.name] = project;
    return map;
  }, {});

  // Recursive function to resolve dependency chains
  function resolveDependencies(projectName, visited = new Set(), depth = 0) {
    const indent = '  '.repeat(depth); // Indentation for better readability
    console.log(`${indent}🔍 Resolving dependencies for "${projectName}"`);

    if (visited.has(projectName)) {
      console.error(
        `${indent}❌ Error: Circular dependency detected involving "${projectName}".`
      );
      process.exit(1); // Exit with an error code
    }

    visited.add(projectName);

    const project = projectMap[projectName];
    if (!project) {
      console.log(`${indent}⚠️ Project "${projectName}" not found locally.`);
      return {}; // If the project doesn't exist in the local map, return empty
    }

    const dependencies = {
      ...project.package.dependencies,
      ...project.package.devDependencies,
    };

    const localDeps = Object.keys(dependencies).filter((dep) =>
      projectMap.hasOwnProperty(dep)
    );

    if (localDeps.length === 0) {
      console.log(`${indent}✅ No local dependencies for "${projectName}".`);
    }

    const chain = localDeps.reduce((result, dep) => {
      console.log(`${indent}➡️ Found local dependency: "${dep}"`);
      result[dep] = resolveDependencies(dep, new Set(visited), depth + 1); // Pass a copy of the visited set
      return result;
    }, {});

    visited.delete(projectName); // Cleanup for subsequent calls

    console.log(`${indent}✅ Finished resolving "${projectName}"`);
    return chain;
  }

  // Recursive function to format the dependency chain as a tree
  function formatTree(chain, prefix = '', isRoot = true) {
    const entries = Object.entries(chain);
    const lines = [];
  
    entries.forEach(([key, value], index) => {
      const isFirstItem = index === 0;
      const isLastItem = index === entries.length - 1;
  
      let connector = '';
      if (isRoot) {
        if (isFirstItem && !isLastItem) connector = '╔ ';
        else if (!isFirstItem && !isLastItem) connector = '╠ ';
        else if (isLastItem && entries.length > 1) connector = '╚ ';
        else connector = '╚ ';
      } else connector = isLastItem ? '╚ ' : '╠ ';
  
      lines.push(`${prefix}${connector}${key}`);
      const childPrefix = prefix + (isLastItem ? '    ' : '║   ');
      const subtree = formatTree(value, childPrefix, false);
  
      if (subtree) lines.push(subtree);
    });
  
    return lines.join('\n');
  }
  

  // Build the dependency chain for all projects
  const dependencyChain = {};
  console.log('\n📦 Starting to build dependency chain...');
  projects.forEach((project) => {
    console.log(`\n🛠️ Building chain for project "${project.package.name}"`);
    dependencyChain[project.package.name] = resolveDependencies(
      project.package.name
    );
  });

  console.log('\n🎉 Dependency chain build complete!');

  // Print the final tree structure
  console.log('🌳 Final Dependency Tree:\n');
  console.log(formatTree(dependencyChain));

  return dependencyChain;
}
