import { useEffect, useRef, useState } from 'react';
import { searchUsers, type UserProfile } from '@/lib/users';
import type { ParticipantSeed } from '@/lib/chat';
import { Avatar } from '../Avatar';
import { Field } from '../Field';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Modal } from '../ui/Modal';
import { Notice } from '../ui/Notice';
import { SearchField } from '../ui/SearchField';
import { PersonRow } from './PersonRow';

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
  // People results are kept with the query they answer. Until the results
  // for what is typed now arrive, the search is still running.
  const [peopleSearch, setPeopleSearch] = useState<{ query: string; results: UserProfile[] } | null>(null);
  const [selected, setSelected] = useState<ParticipantSeed[]>(initialSelected);
  const [groupName, setGroupName] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim();
  const searchSettled = peopleSearch?.query === trimmedQuery;
  const searching = Boolean(trimmedQuery) && !searchSettled;
  // Filtered here, not when the search lands, so a person taken off the selection shows up again.
  const taken = new Set([currentUid, ...excludeUids, ...selected.map((s) => s.uid)]);
  const results = trimmedQuery && searchSettled ? peopleSearch.results.filter((u) => !taken.has(u.uid)) : [];

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!trimmedQuery) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      let found: UserProfile[] = [];
      try {
        found = await searchUsers(trimmedQuery, currentUid);
      } catch (err) {
        console.error('User search failed', err);
      }
      // A slower, older search must not replace the results for a newer query.
      if (!cancelled) setPeopleSearch({ query: trimmedQuery, results: found });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmedQuery, currentUid]);

  // Both take away the control that was pressed, so focus goes back to the search field.
  function select(u: UserProfile) {
    setSelected((prev) => [...prev, { uid: u.uid, name: u.name, initials: u.initials }]);
    searchInputRef.current?.focus();
  }

  function removeSelected(uid: string) {
    setSelected((prev) => prev.filter((p) => p.uid !== uid));
    searchInputRef.current?.focus();
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
          <Button block isLoading={submitting} disabled={!canSubmit} onClick={() => onSubmit(selected, groupName)}>
            {mode === 'create' ? 'Create group' : 'Add to group'}
          </Button>
          {mode === 'create' && (
            <p className="mt-2 text-center text-footnote text-ink-muted">Select at least 2 people to start a group.</p>
          )}
        </>
      }
    >
      <div className="flex shrink-0 flex-col gap-3 px-5 pt-4 pb-2">
        {mode === 'create' && (
          <Field id="wc-group-name" label="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
        )}

        {selected.length > 0 && (
          <ul aria-label="Selected people" className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <li key={s.uid} className="flex items-center gap-1.5 rounded-full bg-surface-fill pl-2.5 text-footnote font-medium text-ink">
                <Avatar name={s.name} id={s.uid} size="xs" />
                {s.name}
                <IconButton icon="close" label={`Remove ${s.name}`} size="sm" onClick={() => removeSelected(s.uid)} />
              </li>
            ))}
          </ul>
        )}

        <p role="status" className="sr-only">
          {selected.length > 0 && `${selected.length} ${selected.length === 1 ? 'person' : 'people'} selected`}
        </p>

        <SearchField ref={searchInputRef} label="Search people to add" value={query} onChange={setQuery} />
      </div>

      <div className="wc-scroll min-h-30 flex-1 overflow-y-auto pb-2">
        {searching && (
          <p role="status" className="px-5 py-3 text-subhead text-ink-muted">
            Searching…
          </p>
        )}
        {!searching && trimmedQuery && results.length === 0 && (
          <p role="status" className="px-5 py-3 text-subhead text-ink-muted">No people found</p>
        )}
        <ul>
          {results.map((u) => (
            <PersonRow
              key={u.uid}
              name={u.name}
              id={u.uid}
              email={u.email}
              onClick={() => select(u)}
              className="px-5"
              trailing={<span aria-hidden="true" className="size-5.5 shrink-0 rounded-full border-2 border-line-strong" />}
            />
          ))}
        </ul>
      </div>

      {error && (
        <Notice tone="danger" className="shrink-0 rounded-none px-5">
          {error}
        </Notice>
      )}
    </Modal>
  );
}
