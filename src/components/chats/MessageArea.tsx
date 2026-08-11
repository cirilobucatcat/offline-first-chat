import { COLOR } from '@/lib/constants';
import { Check, CheckCheck, ChevronLeft, Lock, MoreVertical, Paperclip, Send, Smile } from 'lucide-react';
import { Avatar } from '../Avatar';

type Thread = {
    id: number,
    type: string,
    sender: string,
    label: string,
    text: string,
    time: string,
    read: boolean,
    senderName: string
}

type MessageAreaProps = {
    thread: Record<number, Thread>
    mobileShowChat: boolean,
    active?: {
        initials: string
        name: string
    },
    activeIndex: number,
    onSetMobileShowChat: (active: boolean) => void
}


export default function MessageArea({thread, mobileShowChat, active, activeIndex, onSetMobileShowChat}: MessageAreaProps) {
    return (<main
        className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}
        style={{ backgroundColor: COLOR.paleBlue }}
        aria-label={active ? `Conversation with ${active.name}` : 'Conversation'}
    >
        <header
            className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b"
            style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={() => onSetMobileShowChat(false)}
                    aria-label="Back to conversation list"
                    className="wc-icon-btn wc-focus md:hidden rounded-full p-1.5 -ml-1.5"
                >
                    <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <Avatar initials={active?.initials || ''} index={activeIndex} size={40} />
                <div className="min-w-0">
                    <h2 className="font-semibold truncate leading-tight" style={{ color: COLOR.ink }}>
                        {active?.name}
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
            {Object.values(thread).map((item) => {
                if (item.type === 'divider') {
                    return (
                        <div key={item.id} className="flex justify-center py-2">
                            <span
                                className="text-xs px-3 py-1 rounded-full font-medium"
                                style={{ backgroundColor: COLOR.white, color: COLOR.muted }}
                            >
                                {item.label}
                            </span>
                        </div>
                    );
                }
                const mine = item.sender === 'me';
                return (
                    <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div style={{ maxWidth: '72%' }}>
                            {!mine && item.senderName && (
                                <span className="text-xs font-medium block mb-1 ml-1" style={{ color: COLOR.primary }}>
                                    {item.senderName}
                                </span>
                            )}
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
                                <p className="text-sm leading-relaxed" style={{ wordBreak: 'break-word' }}>
                                    {item.text}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-xs" style={{ color: mine ? COLOR.paleBlue : COLOR.muted }}>
                                        {item.time}
                                    </span>
                                    {mine &&
                                        (item.read ? (
                                            <CheckCheck size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} />
                                        ) : (
                                            <Check size={13} aria-hidden="true" style={{ color: COLOR.paleBlue }} />
                                        ))}
                                    {mine && <span className="sr-only">{item.read ? 'Read' : 'Delivered'}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div
            className="flex items-center gap-2 px-3 md:px-4 py-3 border-t"
            style={{ borderColor: COLOR.hairline, backgroundColor: COLOR.white }}
        >
            <button type="button" aria-label="Attach file" className="wc-icon-btn wc-focus rounded-full p-2 shrink-0">
                <Paperclip size={20} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Add emoji" className="wc-icon-btn wc-focus rounded-full p-2 shrink-0">
                <Smile size={20} aria-hidden="true" />
            </button>
            <label htmlFor="wc-message" className="sr-only">
                Type a message
            </label>
            <input
                id="wc-message"
                type="text"
                placeholder="Type a message"
                className="wc-focus flex-1 rounded-full py-2.5 px-4 text-sm min-w-0"
                style={{ backgroundColor: COLOR.paleBlue, color: COLOR.ink }}
            />
            <button
                type="button"
                aria-label="Send message"
                className="wc-focus rounded-full p-2.5 shrink-0"
                style={{ backgroundColor: COLOR.primary, color: COLOR.white }}
            >
                <Send size={18} aria-hidden="true" />
            </button>
        </div>
    </main>)
}
