import { join, resolve } from "path";
import { getProjects } from "./scanner.js";
import { existsSync, rmSync } from 'fs';

for (const {name} of getProjects()) {
  console.log(`Deleting cache for ${name}...`);
  const p = resolve(join(process.cwd(), name, '.parcel-cache'));
  if (existsSync(p)) rmSync(p, {recursive: true, force: true});
}
