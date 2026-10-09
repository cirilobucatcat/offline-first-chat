import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { formatTyping, getTypingUids, nextTypingExpiry, TYPING_TTL_MS, type TypingSource } from './typing';

const now = 1_700_000_000_000;
const at = (msAgo: number) => Timestamp.fromMillis(now - msAgo);

describe('getTypingUids', () => {
  it('returns a participant who announced within the TTL', () => {
    const conversation = { participants: ['me', 'alice'], typing: { alice: at(1000) } };

    expect(getTypingUids(conversation, 'me', now)).toEqual(['alice']);
  });

  it('leaves out my own entry', () => {
    const conversation = { participants: ['me', 'alice'], typing: { me: at(1000) } };

    expect(getTypingUids(conversation, 'me', now)).toEqual([]);
  });

  it('ignores an entry older than the TTL', () => {
    const conversation = { participants: ['me', 'alice'], typing: { alice: at(TYPING_TTL_MS) } };

    expect(getTypingUids(conversation, 'me', now)).toEqual([]);
  });

  it('ignores an entry dated further ahead than the TTL', () => {
    const conversation = { participants: ['me', 'alice'], typing: { alice: at(-TYPING_TTL_MS) } };

    expect(getTypingUids(conversation, 'me', now)).toEqual([]);
  });

  it('keeps an entry a little ahead of this clock, as skew between devices', () => {
    const conversation = { participants: ['me', 'alice'], typing: { alice: at(-2000) } };

    expect(getTypingUids(conversation, 'me', now)).toEqual(['alice']);
  });

  it('ignores a write still waiting on the server', () => {
    const conversation = { participants: ['me', 'alice'], typing: { alice: null } };

    expect(getTypingUids(conversation, 'me', now)).toEqual([]);
  });

  it('ignores a value that is not a timestamp', () => {
    const typing = { alice: 'now' } as unknown as Record<string, Timestamp>;

    expect(getTypingUids({ participants: ['me', 'alice'], typing }, 'me', now)).toEqual([]);
  });

  it('ignores an entry for someone who is not a participant', () => {
    const conversation = { participants: ['me', 'alice'], typing: { mallory: at(1000) } };

    expect(getTypingUids(conversation, 'me', now)).toEqual([]);
  });

  it('returns nobody for a conversation with no typing field', () => {
    expect(getTypingUids({ participants: ['me', 'alice'] }, 'me', now)).toEqual([]);
  });

  it('returns everyone typing in a group, in participant order', () => {
    const conversation = {
      participants: ['me', 'alice', 'bob', 'carol'],
      typing: { carol: at(500), alice: at(3000), bob: at(TYPING_TTL_MS + 1) },
    };

    expect(getTypingUids(conversation, 'me', now)).toEqual(['alice', 'carol']);
  });
});

describe('nextTypingExpiry', () => {
  it('is null when nobody is typing', () => {
    const conversations: TypingSource[] = [
      { participants: ['me', 'alice'] },
      { participants: ['me', 'bob'], typing: { bob: at(TYPING_TTL_MS), me: at(1000) } },
    ];

    expect(nextTypingExpiry(conversations, 'me', now)).toBeNull();
  });

  it('is when the oldest live entry runs out', () => {
    const conversations: TypingSource[] = [
      { participants: ['me', 'alice'], typing: { alice: at(1000) } },
      { participants: ['me', 'bob'], typing: { bob: at(9000) } },
    ];

    expect(nextTypingExpiry(conversations, 'me', now)).toBe(now - 9000 + TYPING_TTL_MS);
  });
});

describe('formatTyping', () => {
  it('names nobody in a direct chat', () => {
    expect(formatTyping(['Mara'], false)).toBe('typing…');
  });

  it('names one person in a group', () => {
    expect(formatTyping(['Mara'], true)).toBe('Mara is typing…');
  });

  it('names two people in a group', () => {
    expect(formatTyping(['Mara', 'Jo'], true)).toBe('Mara and Jo are typing…');
  });

  it('counts three or more people in a group', () => {
    expect(formatTyping(['Mara', 'Jo', 'Sam'], true)).toBe('3 people are typing…');
  });
});
