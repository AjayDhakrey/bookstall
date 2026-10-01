import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  path.resolve(configDirectory, '../../../frontend'),
  path.resolve(configDirectory, '../../frontend'),
];
export const frontendRoot = candidates.find((candidate) =>
  existsSync(path.join(candidate, 'vite.config.ts'))
) ?? candidates[0];
export const frontendDist = path.join(frontendRoot, 'dist');
export const viteConfigFile = path.join(frontendRoot, 'vite.config.ts');
