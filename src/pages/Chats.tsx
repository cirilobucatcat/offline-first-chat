import { useState } from 'react';
import ConversationList from '@/components/chats/ConversationList';
import MessageArea from '@/components/chats/MessageArea';
import { useAuth } from '@/context/AuthContext';
import { createOrGetConversation, useConversations } from '@/hooks/useConversations';
import { getInitials, type UserProfile } from '@/lib/users';

// TASK: Break this component into child components

export default function WeakChatChatsPage() {

  const { user } = useAuth();
  const { conversations } = useConversations(user?.uid ?? null)
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  async function handleStartConversation(other: UserProfile) {
    if (!user) return;
    
    const id = await createOrGetConversation(
      { uid: user.uid, name: user.displayName ?? 'You', initials: getInitials(user.displayName ?? '') },
      { uid: other.uid, name: other.name, initials: other.initials },
    );
    setActiveId(id);
  }

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
    >

      <ConversationList
        conversations={conversations}
        activeConversationId={activeId}
        onSelect={setActiveId}
        onStartConversation={handleStartConversation}
        mobileHidden={!!activeId}
      />

      <MessageArea
        conversation={activeConversation}
        onBack={() => setActiveId(null)}
        mobileHidden={!activeId}
      />

    </div>
  );
}