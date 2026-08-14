import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createOrGetConversation, useConversations } from '../hooks/useConversations';
import { addParticipantsToConversation, createGroupConversation, type ParticipantSeed } from '../lib/chat';
import { getInitials, type UserProfile } from '../lib/users';
import type { Conversation } from '@/types/chats';
import { ConversationList } from '@/components/chats/ConversationList';
import { MessageArea } from '@/components/chats/MessageArea';
import { NewGroupModal } from '@/components/chats/NewGroupModal';

type GroupModalState =
  | { mode: 'create'; initialSelected: ParticipantSeed[] }
  | { mode: 'add'; conversation: Conversation };

export default function Chats() {
  const { user } = useAuth();
  const { conversations } = useConversations(user?.uid ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<GroupModalState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const me: ParticipantSeed | null = user
    ? { uid: user.uid, name: user.displayName ?? 'You', initials: getInitials(user.displayName ?? '') }
    : null;

  async function handleStartConversation(other: UserProfile) {
    if (!me) return;
    const id = await createOrGetConversation(me, { uid: other.uid, name: other.name, initials: other.initials });
    setActiveId(id);
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
        activeConversationId={activeId}
        onSelect={setActiveId}
        onStartConversation={handleStartConversation}
        onOpenNewGroup={openNewGroup}
        mobileHidden={!!activeId}
      />
      <MessageArea
        conversation={activeConversation}
        onBack={() => setActiveId(null)}
        onAddPeople={openAddPeople}
        onCreateGroupWithUser={openCreateGroupWithUser}
        mobileHidden={!activeId}
      />
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