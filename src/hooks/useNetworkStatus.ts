import { useEffect, useState } from "react";
import { waitForPendingWrites } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * "online"  — connected, nothing queued
 * "offline" — no connection; writes are queuing locally
 * "syncing" — connection just came back; flushing queued writes to Firestore
 */
export type NetworkStatus = "online" | "offline" | "syncing";

/**
 * Tracks connectivity using the browser's online/offline events, then
 * confirms the reconnect by waiting on Firestore's own pending-write queue
 * rather than trusting the browser event alone (navigator.onLine can be
 * true on a LAN with no real route to Firestore's backend).
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);

      waitForPendingWrites(db)
        .catch(() => {
          // If this rejects (e.g. connection drops again mid-flush), the
          // next "offline" -> "online" cycle will retry the check.
        })
        .finally(() => {
          if (!cancelled) setIsSyncing(false);
        });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSyncing(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) return "offline";
  if (isSyncing) return "syncing";
  return "online";
}