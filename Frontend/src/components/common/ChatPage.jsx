import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  RiHashtag, RiAddLine, RiSearch2Line, RiSendPlane2Line,
  RiCloseLine, RiMessage3Line, RiUserLine
} from '@remixicon/react';
import { toast } from 'sonner';
import { useSocket } from '../../contexts/SocketContext';

// API utilities
import { getConversations, getMessages, sendDM, markDmRead } from '../../api/messages.api';
import { getChannels, createChannel, deleteChannel, getChannelMessages, sendChannelMessage, markChannelRead } from '../../api/channels.api';

// Redux actions
import {
  setActiveChatUser, setMessages, addMessage,
  setConversations, clearDmUnread, upsertConversation
} from '../../store/reducers/messageSlice';
import {
  setChannels, setActiveChannel,
  setChannelMessages, addChannelMessage,
} from '../../store/reducers/channelSlice';

import UserAvatar from '../common/UserAvatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/**
 * ChatPage — full-page, two-column chat experience.
 * Left column: channel + DM list.
 * Right column: selected conversation / message thread.
 */
const ChatPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMsg, setInputMsg] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const socket = useSocket();

  const { user } = useSelector(s => s.userReducer);
  const { activeChatUser, messages, conversations } = useSelector(s => s.messageReducer);
  const { channels, activeChannel, channelMessages } = useSelector(s => s.channelReducer);

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  // ChatUnreadListener (always mounted) already bootstraps conversations + channels.
  // ChatPage only needs to refresh the list view when it mounts so the left panel
  // shows up-to-date data (new convos that arrived while away).
  useEffect(() => {
    if (!user?.id) return;
    getConversations().then(r => dispatch(setConversations(r.data))).catch(() => {});
    getChannels().then(r => dispatch(setChannels(r.data))).catch(() => {});
  }, [user?.id, dispatch]);

  // ─── Socket — active thread only ─────────────────────────────────────────────
  // Only handle appending messages to the OPEN thread + marking them read.
  // Unread counting is done by ChatUnreadListener which is always mounted.
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleDM = (msg) => {
      if (activeChatUser && msg.senderId === activeChatUser.id) {
        dispatch(addMessage(msg));
        markDmRead(msg.senderId).catch(() => {});
      }
    };

    const handleChannelMsg = (msg) => {
      if (activeChannel && msg.channelId === activeChannel.id) {
        dispatch(addChannelMessage(msg));
        markChannelRead(msg.channelId).catch(() => {});
      }
    };

    socket.on('receive_message',         handleDM);
    socket.on('receive_channel_message', handleChannelMsg);

    return () => {
      socket.off('receive_message',         handleDM);
      socket.off('receive_channel_message', handleChannelMsg);
    };
  }, [socket, user?.id, activeChatUser, activeChannel, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, channelMessages]);

  // Auto-focus input when switching conversations
  useEffect(() => {
    if ((activeChatUser || activeChannel) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeChatUser, activeChannel]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const openDM = async (target) => {
    if (!target?.id) return;
    dispatch(setActiveChannel(null));
    const name = `${target.fullName?.firstName || ''} ${target.fullName?.lastName || ''}`.trim() || 'Unknown';
    dispatch(setActiveChatUser({ id: target.id, name }));
    if (target.unreadCount > 0) dispatch(clearDmUnread(target.id));
    try {
      const res = await getMessages(target.id);
      dispatch(setMessages(res.data));
      await markDmRead(target.id);
    } catch (e) {}
  };

  const openChannel = async (ch) => {
    if (!ch?.id) return;
    dispatch(setActiveChatUser(null));
    dispatch(setActiveChannel(ch));
    socket?.emit('join_channel', ch.id);
    try {
      const res = await getChannelMessages(ch.id);
      dispatch(setChannelMessages(res.data));
      await markChannelRead(ch.id);
    } catch (e) {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    if (activeChatUser) {
      try {
        const res = await sendDM(activeChatUser.id, inputMsg);
        dispatch(addMessage(res.data));
        dispatch(upsertConversation({
          id: activeChatUser.id,
          fullName: { firstName: activeChatUser.name.split(' ')[0], lastName: activeChatUser.name.split(' ').slice(1).join(' ') },
          role: 'employee', unreadCount: 0
        }));
        setInputMsg('');
      } catch (e) {}
    } else if (activeChannel) {
      try {
        await sendChannelMessage(activeChannel.id, inputMsg);
        setInputMsg('');
      } catch (e) {}
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      await createChannel(newChannelName, newChannelDesc, isBroadcast);
      toast.success('Channel created');
      setIsCreatingChannel(false); setNewChannelName(''); setNewChannelDesc(''); setIsBroadcast(false);
    } catch { toast.error('Failed to create channel'); }
  };

  const handleDeleteChannel = async (ev, id) => {
    ev.stopPropagation();
    try { await deleteChannel(id); } catch { toast.error('Failed to delete'); }
  };

  if (!user) return null;

  const inChat    = !!activeChatUser;
  const inChannel = !!activeChannel;
  const inFocus   = inChat || inChannel;

  const q = searchQuery.toLowerCase();
  const filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(q));
  const filteredConvos   = conversations.filter(c =>
    `${c.fullName?.firstName || ''} ${c.fullName?.lastName || ''}`.toLowerCase().includes(q)
  );

  // Active messages array
  const activeMessages = inChat ? messages : channelMessages;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card">

      {/* ── Left sidebar: list ── */}
      <div className="w-[260px] shrink-0 flex flex-col border-r border-border bg-card/60">

        {/* Search + new channel */}
        <div className="px-3 pt-4 pb-2 border-b border-border/40">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Communications
          </div>
          <div className="relative">
            <RiSearch2Line size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs bg-muted/30 focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-0.5">

          {/* Channels */}
          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Channels</span>
            {user.role === 'admin' && (
              <button onClick={() => setIsCreatingChannel(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors" title="New channel">
                <RiAddLine size={14} />
              </button>
            )}
          </div>

          {/* Create channel form */}
          {isCreatingChannel && user.role === 'admin' && (
            <form onSubmit={handleCreateChannel} className="mx-2 mb-2 p-3 bg-muted/40 border border-border rounded-xl space-y-2 text-xs animate-in fade-in">
              <Input required placeholder="Channel name" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="h-7 text-xs" />
              <Input placeholder="Description (optional)" value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} className="h-7 text-xs" />
              <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={isBroadcast} onChange={e => setIsBroadcast(e.target.checked)} className="rounded" />
                Broadcast
              </label>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setIsCreatingChannel(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="h-6 text-[10px] px-2">Create</Button>
              </div>
            </form>
          )}

          {filteredChannels.map(ch => {
            const isActive = activeChannel?.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => openChannel(ch)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mx-1 text-left transition-colors group relative
                  ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                style={{ width: 'calc(100% - 8px)' }}
              >
                <RiHashtag size={14} className="shrink-0" />
                <span className="text-sm truncate flex-1">{ch.name}</span>
                {ch.isBroadcast && <span className="text-[7px] px-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold uppercase shrink-0">G</span>}
                {ch.unreadCount > 0 && (
                  <span className="shrink-0 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">{ch.unreadCount}</span>
                )}
                {user.role === 'admin' && !ch.unreadCount && (
                  <button onClick={e => handleDeleteChannel(e, ch.id)} className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-auto">
                    <RiCloseLine size={13} />
                  </button>
                )}
              </button>
            );
          })}

          {channels.length === 0 && !isCreatingChannel && (
            <p className="text-[10px] text-muted-foreground px-4 py-1">No channels yet.</p>
          )}

          {/* Direct Messages */}
          <div className="px-3 pt-4 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Direct Messages</span>
          </div>

          {filteredConvos.map(conv => {
            const isActive = activeChatUser?.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => openDM(conv)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mx-1 text-left transition-colors relative
                  ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                style={{ width: 'calc(100% - 8px)' }}
              >
                <UserAvatar firstName={conv.fullName?.firstName} lastName={conv.fullName?.lastName} size="xs" />
                <span className="text-sm truncate flex-1">{conv.fullName?.firstName} {conv.fullName?.lastName}</span>
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">{conv.unreadCount}</span>
                )}
              </button>
            );
          })}

          {conversations.length === 0 && (
            <p className="text-[10px] text-muted-foreground px-4 py-1">No conversations yet.</p>
          )}
        </div>
      </div>

      {/* ── Right panel: message thread ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/40">
        {inFocus ? (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card/80 shrink-0">
              {inChat ? (
                <>
                  <UserAvatar firstName={activeChatUser.name.split(' ')[0]} lastName={activeChatUser.name.split(' ')[1]} size="sm" />
                  <div>
                    <div className="font-semibold text-sm">{activeChatUser.name}</div>
                    <div className="text-[10px] text-muted-foreground">Direct Message</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <RiHashtag size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm"># {activeChannel.name}</div>
                    <div className="text-[10px] text-muted-foreground">{activeChannel.description || 'Channel'}</div>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 min-h-0">
              {activeMessages.length === 0 && (
                <div className="m-auto text-center text-sm text-muted-foreground">
                  <div className="text-4xl mb-3">👋</div>
                  <div className="font-semibold">Start the conversation!</div>
                  <div className="text-xs mt-1">Be the first to say something.</div>
                </div>
              )}
              {activeMessages.map((msg, i) => {
                const isMe = msg.senderId === user.id;
                // Group consecutive messages from the same sender
                const prevMsg = activeMessages[i - 1];
                const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
                return (
                  <div key={msg.id || i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {showSender && !isMe && (
                      <div className="shrink-0 mt-0.5">
                        {msg.sender ? (
                          <UserAvatar firstName={msg.sender.firstName} lastName={msg.sender.lastName} size="sm" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <RiUserLine size={14} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )}
                    {!showSender && !isMe && <div className="w-8 shrink-0" />}
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {showSender && !isMe && msg.sender && (
                        <span className="text-[11px] font-semibold text-muted-foreground mb-1 ml-0.5">
                          {msg.sender.firstName} {msg.sender.lastName}
                        </span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                        ${isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card border border-border/60 text-foreground rounded-bl-sm'
                        }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 mt-1 mx-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-border bg-card/60 shrink-0">
              <form onSubmit={handleSend} className="flex gap-3 items-center">
                <Input
                  ref={inputRef}
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder={inChat ? `Message ${activeChatUser.name.split(' ')[0]}…` : `Message #${activeChannel.name}…`}
                  className="h-11 rounded-xl bg-muted/30 border-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-primary text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputMsg.trim()}
                  className="h-11 w-11 rounded-xl shrink-0 shadow-md transition-transform hover:scale-105"
                >
                  <RiSendPlane2Line size={18} className="translate-x-px -translate-y-px" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          // Empty state when nothing selected
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <RiMessage3Line size={40} className="text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-base text-foreground">Select a channel or conversation</div>
              <div className="text-sm mt-1">Pick from the list on the left to start chatting.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
