import { useEffect, useState } from 'react';
import { subscribePeerKeyStatus, type PeerKeyStatus } from '@/lib/crypto/conversationKeys';

export type { PeerKeyStatus };

/**
 * Live status of whether a direct-conversation peer has set up encryption,
 * for gating the composer before a send is even attempted. Pass null to
 * skip subscribing entirely (group conversations, or no peer resolved
 * yet) — returns 'checking' without touching Firestore.
 */
export function usePeerKeyStatus(peerUid: string | null): PeerKeyStatus {
    // Kept with the peer it describes, so a status left over from the
    // previous conversation reads as 'checking'.
    const [result, setResult] = useState<{ peerUid: string; status: PeerKeyStatus } | null>(null);

    useEffect(() => {
        if (!peerUid) return;
        return subscribePeerKeyStatus(peerUid, (status) => setResult({ peerUid, status }));
    }, [peerUid]);

    return peerUid && result?.peerUid === peerUid ? result.status : 'checking';
}
