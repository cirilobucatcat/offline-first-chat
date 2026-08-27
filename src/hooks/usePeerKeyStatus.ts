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
    const [status, setStatus] = useState<PeerKeyStatus>('checking');

    useEffect(() => {
        if (!peerUid) {
            setStatus('checking');
            return;
        }
        setStatus('checking');
        return subscribePeerKeyStatus(peerUid, setStatus);
    }, [peerUid]);

    return status;
}