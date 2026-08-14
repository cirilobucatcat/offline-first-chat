import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchUsers, type UserProfile } from '../../lib/users';
import type { ParticipantSeed } from '../../lib/chat';
import { Avatar } from '../Avatar';
import { Modal } from '../ui/Modal';

const COLOR = {
  primary: '#0D47A1',
  paleBlue: '#E3F2FD',
  ink: '#0F3040',
  white: '#FFFFFF',
  muted: 'rgba(15, 48, 64, 0.72)',
  hairline: 'rgba(13, 71, 161, 0.14)',
  error: '#B3261E',
};

interface NewGroupModalProps {
  mode: 'create' | 'add';
  currentUid: string;
  excludeUids: string[];
  initialSelected?: ParticipantSeed[];
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (selected: ParticipantSeed[], groupName: string) => void;
}

export function NewGroupModal({
  mode,
  currentUid,
  excludeUids,
  initialSelected = [],
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: NewGroupModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ParticipantSeed[]>(initialSelected);
  const [groupName, setGroupName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const found = await searchUsers(trimmed, currentUid);
        const excluded = new Set([currentUid, ...excludeUids, ...selected.map((s) => s.uid)]);
        setResults(found.filter((u) => !excluded.has(u.uid)));
      } catch (err) {
        console.error('User search failed', err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentUid]);

  function toggleSelect(u: UserProfile) {
    setSelected((prev) => [...prev, { uid: u.uid, name: u.name, initials: u.initials }]);
    setResults((prev) => prev.filter((r) => r.uid !== u.uid));
  }

  function removeSelected(uid: string) {
    setSelected((prev) => prev.filter((p) => p.uid !== uid));
  }

  const minMembers = mode === 'create' ? 2 : 1;
  const canSubmit = selected.length >= minMembers && (mode === 'add' || groupName.trim().length > 0) && !submitting;

  return (
    <Modal
      titleId="new-group-title"
      title={mode === 'create' ? 'New group' : 'Add people'}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => canSubmit && onSubmit(selected, groupName)}
            disabled={!canSubmit}
            className="wc-focus w-full rounded-full py-2.5 text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: COLOR.primary, color: COLOR.white }}
          >
            {submitting ? 'Please wait…' : mode === 'create' ? 'Create group' : 'Add to group'}
          </button>
          {mode === 'create' && (
            <p className="text-xs text-center mt-2" style={{ color: COLOR.muted }}>
              Select at least 2 people to start a group
            </p>
          )}
        </>
      }
    >
      {mode === 'create' && (
        <div className="px-5 pt-4 shrink-0">
          <label htmlFor="wc-group-name" className="sr-only">Group name</label>
          <input
            id="wc-group-name"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="wc-focus w-full rounded-full py-2.5 px-4 text-sm"
            style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink }}
          />
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pt-3 shrink-0">
          {selected.map((s) => (
            <span
              key={s.uid}
              className="flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 text-xs font-medium"
              style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink }}
            >
              <Avatar initials={s.initials} uid={s.uid} size={20} />
              {s.name}
              <button
                type="button"
                onClick={() => removeSelected(s.uid)}
                aria-label={`Remove ${s.name}`}
                className="wc-focus rounded-full"
                style={{ color: COLOR.muted }}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="px-5 pt-3 pb-2 shrink-0">
        <label htmlFor="wc-group-search" className="sr-only">Search people</label>
        <div className="relative">
          <Search size={18} aria-hidden="true" className="absolute top-1/2 -translate-y-1/2" style={{ left: 14, color: COLOR.muted }} />
          <input
            id="wc-group-search"
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people to add"
            className="wc-focus w-full rounded-full py-2.5 text-sm"
            style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink, paddingLeft: 40, paddingRight: 16 }}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto wc-scroll px-2 pb-2" style={{ minHeight: 120 }}>
        {searching && <p className="px-3 py-3 text-sm" style={{ color: COLOR.muted }}>Searching…</p>}
        {!searching && query.trim() && results.length === 0 && (
          <p className="px-3 py-3 text-sm" style={{ color: COLOR.muted }}>No people found</p>
        )}
        <ul>
          {results.map((u) => (
            <li key={u.uid}>
              <button
                type="button"
                onClick={() => toggleSelect(u)}
                className="wc-item wc-focus w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
              >
                <Avatar initials={u.initials} uid={u.uid} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" style={{ color: COLOR.ink }}>{u.name}</p>
                  <p className="truncate text-xs" style={{ color: COLOR.muted }}>{u.email}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: 22, height: 22, border: `2px solid ${COLOR.hairline}` }}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p className="px-5 pb-2 text-xs shrink-0" style={{ color: COLOR.error }} role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}