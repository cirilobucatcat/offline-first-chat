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

export function useMyIdentityKey(): CryptoKeyPair {
    const keyPair = useContext(IdentityKeyContext);
    if (!keyPair) {
        throw new Error('useMyIdentityKey() called outside a ready IdentityKeyGate');
    }
    return keyPair;
}