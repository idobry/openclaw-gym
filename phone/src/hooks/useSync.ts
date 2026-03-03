import { useState, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useAuthStore } from "../stores/authStore";
import { syncAll, pullFromServer } from "../lib/sync";

export function useSync() {
  const db = useSQLiteContext();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadLastSynced = useCallback(async () => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM user_settings WHERE key = 'lastSyncedAt'"
    );
    setLastSyncedAt(row?.value ?? null);
  }, [db]);

  const syncNow = useCallback(async () => {
    if (!isAuthenticated || isSyncing) return false;
    setIsSyncing(true);
    try {
      const hadChanges = await syncAll(db);
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'lastSyncedAt'"
      );
      setLastSyncedAt(row?.value ?? null);
      return hadChanges;
    } finally {
      setIsSyncing(false);
    }
  }, [db, isAuthenticated, isSyncing]);

  const checkForAgentChanges = useCallback(async () => {
    if (!isAuthenticated) return false;
    try {
      return await pullFromServer(db);
    } catch {
      return false;
    }
  }, [db, isAuthenticated]);

  return { isSyncing, lastSyncedAt, syncNow, checkForAgentChanges, loadLastSynced };
}
