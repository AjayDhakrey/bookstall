import type { RequestHandler } from 'express';
import { storeContext } from '../repositories/storeContext.js';
import { StorageError, type StateRepository } from '../repositories/stateRepository.js';

export function storeSession(repository: StateRepository): RequestHandler {
  let writeQueue = Promise.resolve();
  return async (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const previous = writeQueue;
      let release!: () => void;
      const turn = new Promise<void>((resolve) => { release = resolve; });
      writeQueue = previous.then(() => turn);
      res.once('finish', release);
      res.once('close', release);
      await previous;
      if (res.destroyed) { release(); return; }
    }
    try {
      const snapshot = await repository.load();
      storeContext.run({ ...snapshot, dirty: false, repository }, next);
    } catch (error) {
      res.status(error instanceof StorageError ? error.status : 503).json({
        success: false,
        error: error instanceof StorageError ? error.message : 'Database is unavailable. Please try again.',
      });
    }
  };
}
