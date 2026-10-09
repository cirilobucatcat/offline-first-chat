import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createOrGetConversation, useConversations } from '../hooks/useConversations';
import { useTypingStatus } from '../hooks/useTypingStatus';
import { addParticipantsToConversation, createGroupConversation, type ParticipantSeed } from '../lib/chat';
import { getInitials, type UserProfile } from '../lib/users';
import type { Conversation } from '@/types/chats';
import { ConversationList } from '@/components/chats/ConversationList';
import { MessageArea } from '@/components/chats/MessageArea';
import { NewGroupModal } from '@/components/chats/NewGroupModal';
import { Notice } from '@/components/ui/Notice';

type GroupModalState =
  | { mode: 'create'; initialSelected: ParticipantSeed[] }
  | { mode: 'add'; conversation: Conversation };

export default function Chats() {
  const { user } = useAuth();
  const { conversations, receivedAt } = useConversations(user?.uid ?? null);
  const typingByConversation = useTypingStatus(conversations, receivedAt, user?.uid ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<GroupModalState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    if (!openError) return;
    const timeout = setTimeout(() => setOpenError(null), 6000);
    return () => clearTimeout(timeout);
  }, [openError]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  // A phone shows one pane at a time. When the pane that held focus is hidden,
  // focus moves to the one that replaced it instead of dropping to the page.
  const listRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLElement>(null);
  const previousId = useRef<string | null>(null);
  useEffect(() => {
    const cameFrom = previousId.current;
    previousId.current = activeId;
    if (cameFrom === activeId) return;

    const focused = document.activeElement;
    const focusIsVisible = focused instanceof HTMLElement && focused !== document.body && focused.offsetParent !== null;
    if (focusIsVisible) return;

    if (activeId) {
      threadRef.current?.focus();
      return;
    }
    const row = cameFrom
      ? listRef.current?.querySelector<HTMLElement>(`[data-chat-id="${CSS.escape(cameFrom)}"]`)
      : null;
    (row ?? listRef.current)?.focus();
  }, [activeId]);

  const me: ParticipantSeed | null = user
    ? { uid: user.uid, name: user.displayName ?? 'You', initials: getInitials(user.displayName ?? '') }
    : null;

  async function handleStartConversation(other: UserProfile) {
    if (!me) return;
    setOpenError(null);
    try {
      const id = await createOrGetConversation(me, { uid: other.uid, name: other.name, initials: other.initials });
      setActiveId(id);
    } catch (err) {
      console.error('Could not open conversation', err);
      setOpenError("Couldn't open that chat. Try again.");
    }
  }

  function openNewGroup() {
    setModalError(null);
    setGroupModal({ mode: 'create', initialSelected: [] });
  }

  function openCreateGroupWithUser(participant: ParticipantSeed) {
    setModalError(null);
    setGroupModal({ mode: 'create', initialSelected: [participant] });
  }

  function openAddPeople(conversation: Conversation) {
    setModalError(null);
    setGroupModal({ mode: 'add', conversation });
  }

  async function handleGroupSubmit(selected: ParticipantSeed[], groupName: string) {
    if (!me || !groupModal) return;
    setSubmitting(true);
    setModalError(null);
    try {
      if (groupModal.mode === 'create') {
        const id = await createGroupConversation(me, selected, groupName);
        setActiveId(id);
      } else {
        await addParticipantsToConversation(groupModal.conversation.id, selected);
      }
      setGroupModal(null);
    } catch (err) {
      console.error('Group action failed', err);
      setModalError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <ConversationList
        conversations={conversations}
        typingByConversation={typingByConversation}
        activeConversationId={activeId}
        onSelect={setActiveId}
        onStartConversation={handleStartConversation}
        onOpenNewGroup={openNewGroup}
        mobileHidden={!!activeId}
        paneRef={listRef}
      />
      <MessageArea
        conversation={activeConversation}
        typingUids={activeId ? typingByConversation.get(activeId) : undefined}
        onBack={() => setActiveId(null)}
        onAddPeople={openAddPeople}
        onCreateGroupWithUser={openCreateGroupWithUser}
        mobileHidden={!activeId}
        paneRef={threadRef}
      />
      {openError && (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm">
          <Notice tone="danger" className="shadow-float">
            {openError}
          </Notice>
        </div>
      )}
      {groupModal && user && (
        <NewGroupModal
          mode={groupModal.mode}
          currentUid={user.uid}
          excludeUids={groupModal.mode === 'add' ? groupModal.conversation.participants : []}
          initialSelected={groupModal.mode === 'create' ? groupModal.initialSelected : []}
          submitting={submitting}
          error={modalError}
          onClose={() => setGroupModal(null)}
          onSubmit={handleGroupSubmit}
        />
      )}
    </div>
  );
}