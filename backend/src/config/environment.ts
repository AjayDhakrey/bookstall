import path from 'node:path';
import dotenv from 'dotenv';
import { frontendRoot } from './paths.js';

export const projectRoot = path.dirname(frontendRoot);

export function loadServerEnvironment(): void {
  dotenv.config({
    path: [
      path.join(projectRoot, 'backend', '.env.local'),
      path.join(projectRoot, 'backend', '.env'),
      path.join(projectRoot, '.env.local'),
      path.join(projectRoot, '.env'),
    ],
    quiet: true,
  });
}
