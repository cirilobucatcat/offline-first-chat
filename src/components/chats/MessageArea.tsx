import { AVATAR_TINTS, COLOR } from '@/lib/constants';
import { Check, CheckCheck, ChevronLeft, Lock, MoreVertical, Paperclip, Send, Smile } from 'lucide-react';
import type { Conversation } from '@/types/chats';
import { colorIndexForId, formatMessageTime, groupMessagesByDay, isMessageReadBy, markConversationRead, sendMessage } from '@/lib/chat';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useEffect, useRef, useState, type FormEvent } from 'react';

type MessageAreaProps = {
    conversation: Conversation | null
    onBack: () => void,
    mobileHidden?: boolean
}

export default function MessageArea({ conversation, onBack, mobileHidden = false }: MessageAreaProps) {

    const { user } = useAuth();
    const { messages } = useMessages(conversation?.id ?? null);
    const [draft, setDraft] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const myUnread = conversation && user ? (conversation.unreadCount?.[user.uid] ?? 0) : 0;

    const otherUid = conversation && user ? conversation.participants.find((p) => p !== user.uid) : undefined;
    const other = conversation && otherUid ? conversation.participantInfo[otherUid] : undefined;

    useEffect(() => {
        if (!conversation || !user) return;
        if (myUnread === 0) return;
        
        markConversationRead(conversation.id, user.uid);
    }, [conversation, user, messages.length]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' });
    }, [messages.length]);

    async function handleSend(e: FormEvent) {
        e.preventDefault();
        if (!conversation || !user || !draft.trim()) return;
        const text = draft;
        setDraft('');
        try {
            await sendMessage(conversation.id, user.uid, conversation.participants, text);
        } catch (err) {
            console.error('Failed to send message', err);
            setDraft(text);
        }
    }

    if (!conversation) {
        return (
            <main className={`${mobileHidden ? 'hidden' : 'flex'} md:flex flex-1 items-center justify-center overflow-hidden`} style={{ backgroundColor: COLOR.paleBlue }}>
                <p style={{ color: COLOR.muted }}>Select a conversation to start chatting</p>
            </main>
        );
    }

    const groups = groupMessagesByDay(messages);

    return (<main
        className={`${mobileHidden ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}
        style={{ backgroundColor: COLOR.paleBlue }}
        aria-label={`Conversation with ${other?.name}`}
    >
        <header
            className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b"
            style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Back to conversation list"
                    className="wc-icon-btn wc-focus md:hidden rounded-full p-1.5 -ml-1.5"
                >
                    <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <div
                    aria-hidden="true"
                    className="flex items-center justify-center rounded-full font-semibold shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: AVATAR_TINTS[colorIndexForId(otherUid ?? conversation.id, AVATAR_TINTS.length)], color: COLOR.white, fontSize: 15 }}
                >
                    {other?.initials ?? '?'}
                </div>
                <div className="min-w-0">
                    <h2 className="font-semibold truncate leading-tight" style={{ color: COLOR.ink }}>
                        {other?.name ?? 'Unknown'}
                    </h2>
                    <p className="text-xs flex items-center gap-1" style={{ color: COLOR.muted }}>
                        <Lock size={11} aria-hidden="true" />
                        Encrypted · synced offline
                    </p>
                </div>
            </div>
            <button
                type="button"
                aria-label="Conversation options"
                className="wc-icon-btn wc-focus rounded-full p-2 shrink-0"
            >
                <MoreVertical size={20} aria-hidden="true" />
            </button>
        </header>

        <div className="flex-1 overflow-y-auto wc-scroll px-4 md:px-10 py-5">
            {messages.length === 0 && <p className="text-sm text-center mt-8" style={{ color: COLOR.muted }}>Say hello 👋</p>}
            {groups.map((group, gi) => (
                <div key={`${group.label}-${gi}`}>
                    <div className="flex justify-center py-2">
                        <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: COLOR.white, color: COLOR.muted }}>{group.label}</span>
                    </div>
                    {group.items.map((m) => {
                        const mine = m.senderId === user?.uid;
                        const read = mine && otherUid ? isMessageReadBy(m, conversation.lastRead?.[otherUid]) : false;
                        return (
                            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}>
                                <div style={{ maxWidth: '72%' }}>
                                    <div
                                        className="px-4 py-2.5"
                                        style={{
                                            backgroundColor: mine ? COLOR.primary : COLOR.white,
                                            color: mine ? COLOR.white : COLOR.ink,
                                            borderRadius: 18,
                                            borderBottomRightRadius: mine ? 4 : 18,
                                            borderBottomLeftRadius: mine ? 18 : 4,
                                        }}
                                    >
                                        <p className="text-sm leading-relaxed" style={{ wordBreak: 'break-word' }}>{m.text}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <span className="text-xs" style={{ color: mine ? COLOR.paleBlue : COLOR.muted }}>
                                                {m.createdAt ? formatMessageTime(m.createdAt) : 'Sending…'}
                                            </span>
                                            {mine && (read ? <CheckCheck size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} /> : <Check size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} />)}
                                            {mine && <span className="sr-only">{read ? 'Read' : 'Delivered'}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 px-3 md:px-4 py-3 border-t" style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}>
            <button type="button" aria-label="Attach file" className="wc-icon-btn wc-focus rounded-full p-2 shrink-0">
                <Paperclip size={20} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Add emoji" className="wc-icon-btn wc-focus rounded-full p-2 shrink-0">
                <Smile size={20} aria-hidden="true" />
            </button>
            <label htmlFor="wc-message" className="sr-only">Type a message</label>
            <input
                id="wc-message"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message"
                className="wc-focus flex-1 rounded-full py-2.5 px-4 text-sm min-w-0"
                style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink }}
            />
            <button
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim()}
                className="wc-focus rounded-full p-2.5 shrink-0 disabled:opacity-40"
                style={{ backgroundColor: COLOR.primary, color: COLOR.white }}
            >
                <Send size={18} aria-hidden="true" />
            </button>
        </form>
    </main>)
}
