import type { Response } from 'express';
import { commitStore } from '../repositories/storeContext.js';
import { StorageError } from '../repositories/stateRepository.js';

export const sendSuccess = async (res: Response, data: any, status = 200) => {
  try {
    await commitStore();
    return res.status(status).json({ success: true, data });
  } catch (error) {
    return sendError(res,
      error instanceof StorageError ? error : 'Database save failed. Please try again.',
      error instanceof StorageError ? error.status : 503);
  }
};

export const sendError = (res: Response, error: any, status = 400) => {
  const message = error instanceof Error ? error.message : String(error);
  return res.status(status).json({ success: false, error: message });
};
