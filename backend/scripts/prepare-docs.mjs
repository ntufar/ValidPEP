import { mkdir, cp, access } from 'fs/promises';
import path from 'path';
import { constants } from 'fs';

async function copyDocs() {
  const backendRoot = process.cwd();
  const repoRoot = path.resolve(backendRoot, '..');
  const sourceDir = path.resolve(repoRoot, 'docs');
  const targetDir = path.resolve(backendRoot, 'docs');

  try {
    await access(sourceDir, constants.R_OK);
  } catch (error) {
    console.warn(`[prepare-docs] Source docs directory not found at ${sourceDir}. Skipping copy.`);
    return;
  }

  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true, force: true });
  console.log(`[prepare-docs] Copied docs from ${sourceDir} to ${targetDir}`);
}

copyDocs().catch(error => {
  console.error('[prepare-docs] Failed to copy docs directory:', error);
  process.exitCode = 1;
});

