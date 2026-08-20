import { createContext, useContext, type ReactNode } from 'react';

const IdentityKeyContext = createContext<CryptoKeyPair | null>(null);

export function IdentityKeyProvider({
    keyPair,
    children,
}: {
    keyPair: CryptoKeyPair;
    children: ReactNode;
}) {
    return <IdentityKeyContext.Provider value={keyPair}>{children}</IdentityKeyContext.Provider>;
}

/**
 * Returns the signed-in account's identity key pair (privateKey stays a
 * non-extractable CryptoKey — this never exposes raw bytes, only the live
 * object). Only call this from within IdentityKeyGate's 'ready' branch;
 * throws otherwise so a missing provider fails loudly instead of quietly
 * sending plaintext.
 */
export function useMyIdentityKey(): CryptoKeyPair {
    const keyPair = useContext(IdentityKeyContext);
    if (!keyPair) {
        throw new Error('useMyIdentityKey() called outside a ready IdentityKeyGate');
    }
    return keyPair;
}