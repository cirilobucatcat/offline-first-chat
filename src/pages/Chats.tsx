import { useState } from 'react';
import { COLOR } from '@/lib/constants';
import ConversationList from '@/components/chats/ConversationList';
import MessageArea from '@/components/chats/MessageArea';

// TASK: Break this component into child components

const CONTACTS = [
  { id: 1, name: 'Maya Santos', initials: 'MS', lastMessage: "Sure, let's sync tomorrow at 10", time: '9:41 AM', unread: 2, fromMe: false },
  { id: 2, name: 'Jordan Lee', initials: 'JL', lastMessage: 'Sent the design files over', time: 'Yesterday', unread: 0, fromMe: true, read: true },
  { id: 3, name: 'Priya Kapoor', initials: 'PK', lastMessage: 'Can you check the offline sync bug?', time: 'Yesterday', unread: 1, fromMe: false },
  { id: 4, name: 'Design Team', initials: 'DT', lastMessage: 'Alex: Updated the mockups ✨', time: 'Mon', unread: 0, fromMe: false },
  { id: 5, name: 'Chris Okafor', initials: 'CO', lastMessage: '👍 Sounds good', time: 'Fri', unread: 0, fromMe: true, read: true },
  { id: 6, name: 'Nina Petrova', initials: 'NP', lastMessage: 'See you at 5!', time: 'Thu', unread: 1, fromMe: false },
  { id: 7, name: 'Sam Rivera', initials: 'SR', lastMessage: 'Just sent it your way!', time: 'Wed', unread: 0, fromMe: true, read: false },
];

const THREADS: Record<number, any[]> = {
  1: [
    { id: 'd', type: 'divider', label: 'Today' },
    { id: 1, sender: 'them', text: 'Hey! Are we still on for the sync tomorrow?', time: '9:12 AM' },
    { id: 2, sender: 'me', text: 'Yes, 10am works on my end', time: '9:15 AM', read: true },
    { id: 3, sender: 'them', text: "Perfect, I'll share the agenda tonight", time: '9:16 AM' },
    { id: 4, sender: 'me', text: 'Sounds good 👍', time: '9:20 AM', read: true },
    { id: 5, sender: 'them', text: "Sure, let's sync tomorrow at 10", time: '9:41 AM' },
  ],
  2: [
    { id: 'd', type: 'divider', label: 'Yesterday' },
    { id: 1, sender: 'them', text: 'Did you get a chance to look at the offline cache PR?', time: '3:02 PM' },
    { id: 2, sender: 'me', text: 'Yep, looks solid — left a couple comments', time: '3:10 PM', read: true },
    { id: 3, sender: 'me', text: 'Sent the design files over', time: '3:12 PM', read: true },
  ],
  3: [
    { id: 'd', type: 'divider', label: 'Yesterday' },
    { id: 1, sender: 'me', text: 'Hey, quick one — are you free for a call later?', time: '10:40 AM', read: true },
    { id: 2, sender: 'them', text: 'Sure, after lunch works', time: '10:50 AM' },
    { id: 3, sender: 'them', text: 'Can you check the offline sync bug?', time: '11:04 AM' },
  ],
  4: [
    { id: 'd', type: 'divider', label: 'Mon' },
    { id: 1, sender: 'them', senderName: 'Jordan', text: 'Pushed the new component library', time: '2:00 PM' },
    { id: 2, sender: 'me', text: 'Looks great, testing now', time: '2:10 PM', read: true },
    { id: 3, sender: 'them', senderName: 'Alex', text: 'Updated the mockups ✨', time: '2:22 PM' },
  ],
  5: [
    { id: 'd', type: 'divider', label: 'Fri' },
    { id: 1, sender: 'them', text: 'Ready for the demo tomorrow?', time: '5:00 PM' },
    { id: 2, sender: 'me', text: 'Almost, just polishing the offline indicator', time: '5:12 PM', read: true },
    { id: 3, sender: 'me', text: '👍 Sounds good', time: '5:15 PM', read: true },
  ],
  6: [
    { id: 'd', type: 'divider', label: 'Thu' },
    { id: 1, sender: 'them', text: 'Still on for coffee?', time: '4:30 PM' },
    { id: 2, sender: 'me', text: 'Yes! Same place as before', time: '4:35 PM', read: true },
    { id: 3, sender: 'them', text: 'See you at 5!', time: '4:36 PM' },
  ],
  7: [
    { id: 'd', type: 'divider', label: 'Wed' },
    { id: 1, sender: 'them', text: 'Can you resend the invite link for tomorrow?', time: '1:00 PM' },
    { id: 2, sender: 'me', text: 'Just sent it your way!', time: '1:05 PM', read: false },
  ],
};

export default function WeakChatChatsPage() {
  const [activeId, setActiveId] = useState(CONTACTS[0].id);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeIndex = CONTACTS.findIndex((c) => c.id === activeId);
  const active = CONTACTS[activeIndex];
  const thread = THREADS[activeId] || [];

  function handleContactSelection(id: number) {
    setActiveId(id);
    handleSetMobileShowChat(true)
  }

  function handleSetMobileShowChat(state: boolean) {
    setMobileShowChat(state);
  }

  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      style={{ fontFamily: "'Outfit', sans-serif", backgroundColor: COLOR.white }}
    >

      <ConversationList 
        contacts={CONTACTS} 
        activeId={activeId} 
        mobileShowChat={mobileShowChat}
        onContactSelect={handleContactSelection}
      />

      <MessageArea 
        thread={thread} 
        mobileShowChat={mobileShowChat} 
        active={active} 
        activeIndex={activeIndex} 
        onSetMobileShowChat={handleSetMobileShowChat}
      />      
    </div>
  );
}