import { describe, expect, it } from 'vitest';
import { Bytes, Timestamp } from 'firebase/firestore';
import { parseMessage } from './parseMessage';

const createdAt = Timestamp.fromMillis(1_700_000_000_000);

describe('parseMessage', () => {
  it('reads a legacy message with no encrypted field as plaintext', () => {
    const message = parseMessage('m1', { senderId: 'alice', text: 'hello', createdAt });

    expect(message).toEqual({ id: 'm1', senderId: 'alice', encrypted: false, text: 'hello', createdAt });
  });

  it('reads a group message as plaintext', () => {
    const message = parseMessage('m2', { senderId: 'alice', text: 'hello all', encrypted: false, createdAt });

    expect(message).toEqual({ id: 'm2', senderId: 'alice', encrypted: false, text: 'hello all', createdAt });
  });

  it('reads a direct message as ciphertext and never as text', () => {
    const ciphertext = Bytes.fromUint8Array(new Uint8Array([1, 2, 3]));
    const iv = Bytes.fromUint8Array(new Uint8Array(12));

    const message = parseMessage('m3', { senderId: 'alice', ciphertext, iv, encrypted: true, createdAt });

    expect(message).toEqual({ id: 'm3', senderId: 'alice', encrypted: true, ciphertext, iv, createdAt });
    expect(message).not.toHaveProperty('text');
  });

  it('keeps createdAt null while a write is still waiting on the server', () => {
    const message = parseMessage('m4', { senderId: 'alice', text: 'hi', encrypted: false, createdAt: null });

    expect(message.createdAt).toBeNull();
  });

  it('falls back to empty text when a plaintext message has none', () => {
    const message = parseMessage('m5', { senderId: 'alice', createdAt });

    expect(message).toMatchObject({ encrypted: false, text: '' });
  });
});
