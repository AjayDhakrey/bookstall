import express from 'express';
import path from 'node:path';
import { frontendRoot, frontendDist, viteConfigFile } from './config/paths.js';
import { loadServerEnvironment } from './config/environment.js';
import { createConfiguredRepository } from './config/database.js';
import { createDefaultStore, createEmptyStore } from './repositories/store.js';
import { createApp } from './app.js';

async function startServer() {
  loadServerEnvironment();
  const repository = createConfiguredRepository();
  await repository.initialize(repository.mode === 'supabase' ? createEmptyStore() : createDefaultStore());
  const app = createApp(repository);
  const PORT = Number(process.env.PORT) || 3000;

  console.log(repository.mode === 'supabase'
    ? 'Database: Supabase persistence enabled.'
    : 'Database: memory demo mode. Changes will not survive a restart.');

  // Serve static assets or mount Vite dev server
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    // In development mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: frontendRoot,
      configFile: viteConfigFile,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal: Failed to start server:', err);
  process.exit(1);
});
