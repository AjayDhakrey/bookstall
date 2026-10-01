import { useEffect, useState } from 'react';
import { databaseApi } from '../api/services';
import type { DatabaseStatus } from '../../../shared/database';

export function useDatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    databaseApi.getStatus().then((value) => {
      if (active) setStatus(value);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, []);
  return { status, error };
}
