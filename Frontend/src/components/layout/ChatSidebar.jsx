import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  RiCloseLine, RiSendPlane2Line, RiArrowLeftLine,
  RiHashtag, RiAddLine, RiSearch2Line, RiMessage3Line
} from '@remixicon/react';
import { toast } from 'sonner';
import { useSocket } from '../../contexts/SocketContext';

// API utilities
import { getConversations, getMessages, sendDM, markDmRead } from '../../api/messages.api';
import { getChannels, createChannel, deleteChannel, getChannelMessages, sendChannelMessage, markChannelRead } from '../../api/channels.api';

// Redux actions
import {
  setActiveChatUser, setMessages, addMessage,
  setConversations, incrementDmUnread, clearDmUnread, upsertConversation
} from '../../store/reducers/messageSlice';
import {
  setChannels, addChannel, removeChannel, setActiveChannel,
  setChannelMessages, addChannelMessage, incrementChannelUnread
} from '../../store/reducers/channelSlice';

import UserAvatar from '../common/UserAvatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/**
 * ChatSidebar — right-side panel version of the chat UI.
 * Props:
 *   isOpen  {boolean}   – whether the panel is visible
 *   onClose {function}  – callback to hide the panel
 *   unreadCount {number} – total unread badge count (controlled by parent)
 *   onUnreadChange {fn} – (count) => void — parent updates its badge
 */
const ChatSidebar = ({ isOpen, onClose, onUnreadChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMsg, setInputMsg] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(false);

  const messagesEndRef = useRef(null);
  const dispatch = useDispatch();
  const socket = useSocket();

  const { user } = useSelector(s => s.userReducer);
  const { activeChatUser, messages, conversations } = useSelector(s => s.messageReducer);
  const { channels, activeChannel, channelMessages } = useSelector(s => s.channelReducer);

  // Sync totalUnread up to parent for header badge
  useEffect(() => {
    onUnreadChange?.(totalUnread);
  }, [totalUnread, onUnreadChange]);

  // ─── Data fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    if (!user?.id) return;
    Promise.all([getConversations(), getChannels()])
      .then(([convRes, chRes]) => {
        const convs = convRes.data;
        const chs   = chRes.data;
        dispatch(setConversations(convs));
        dispatch(setChannels(chs));
        if (socket) socket.emit('join_channels', chs.map(c => c.id));
        const dm = convs.reduce((a, c) => a + (c.unreadCount || 0), 0);
        const ch = chs.reduce((a, c)  => a + (c.unreadCount || 0), 0);
        setTotalUnread(dm + ch);
      }).catch(() => {});
  }, [user, dispatch, socket]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Socket handlers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleDM = (msg) => {
      if (activeChatUser && msg.senderId === activeChatUser.id) {
        dispatch(addMessage(msg));
        markDmRead(msg.senderId).catch(() => {});
      } else if (msg.senderId !== user?.id) {
        setTotalUnread(p => p + 1);
        dispatch(incrementDmUnread(msg.senderId));
        const sender = conversations.find(c => c.id === msg.senderId);
        const name = sender
          ? `${sender.fullName?.firstName || ''} ${sender.fullName?.lastName || ''}`.trim()
          : 'Someone';
        if (!sender) fetchData();
        toast.message(`New message from ${name}`, {
          description: msg.content.length > 40 ? msg.content.slice(0, 40) + '…' : msg.content,
          action: { label: 'Open', onClick: () => openDM(sender || { id: msg.senderId }) }
        });
      }
    };

    const handleChannelMsg = (msg) => {
      if (activeChannel && msg.channelId === activeChannel.id) {
        dispatch(addChannelMessage(msg));
        markChannelRead(msg.channelId).catch(() => {});
      } else if (msg.senderId !== user?.id) {
        setTotalUnread(p => p + 1);
        dispatch(incrementChannelUnread(msg.channelId));
        const ch = channels.find(c => c.id === msg.channelId);
        toast.message(`New message in #${ch?.name || 'channel'}`, {
          description: msg.content.length > 40 ? msg.content.slice(0, 40) + '…' : msg.content,
          action: { label: 'Open', onClick: () => openChannel(ch) }
        });
      }
    };

    const handleNewChannel = (ch) => {
      dispatch(addChannel({ ...ch, unreadCount: 0 }));
      socket.emit('join_channel', ch.id);
    };

    socket.on('receive_message', handleDM);
    socket.on('receive_channel_message', handleChannelMsg);
    socket.on('new_channel', handleNewChannel);
    socket.on('channel_deleted', (id) => dispatch(removeChannel(id)));
    socket.on('update_unreads', fetchData);

    return () => {
      socket.off('receive_message', handleDM);
      socket.off('receive_channel_message', handleChannelMsg);
      socket.off('new_channel', handleNewChannel);
      socket.off('channel_deleted');
      socket.off('update_unreads', fetchData);
    };
  }, [socket, activeChatUser, activeChannel, user, channels, conversations, dispatch, fetchData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, channelMessages]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const openDM = async (target) => {
    if (!target?.id) return;
    const name = `${target.fullName?.firstName || ''} ${target.fullName?.lastName || ''}`.trim() || 'Unknown';
    dispatch(setActiveChatUser({ id: target.id, name }));
    if (target.unreadCount > 0) {
      setTotalUnread(p => Math.max(0, p - target.unreadCount));
      dispatch(clearDmUnread(target.id));
    }
    try {
      const res = await getMessages(target.id);
      dispatch(setMessages(res.data));
      await markDmRead(target.id);
    } catch (e) {}
  };

  const openChannel = async (ch) => {
    if (!ch?.id) return;
    dispatch(setActiveChannel(ch));
    if (ch.unreadCount > 0) setTotalUnread(p => Math.max(0, p - ch.unreadCount));
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

  const handleDeleteChannel = async (e, id) => {
    e.stopPropagation();
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

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-40 flex flex-col w-[360px] max-w-[95vw] bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground border-b border-primary/80 shrink-0 h-14">
          {inFocus ? (
            <>
              <button
                onClick={() => { inChat ? dispatch(setActiveChatUser(null)) : dispatch(setActiveChannel(null)); }}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <RiArrowLeftLine size={18} />
              </button>
              <span className="font-semibold text-base truncate flex-1">
                {inChat ? activeChatUser.name : `# ${activeChannel.name}`}
              </span>
            </>
          ) : (
            <>
              <RiMessage3Line size={18} className="shrink-0" />
              <span className="font-semibold text-base flex-1">Communications</span>
            </>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors ml-auto shrink-0">
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!inFocus ? (
            <>
              {/* Search + add channel */}
              <div className="px-3 py-2 border-b border-border/40 flex gap-2 bg-card shrink-0">
                <div className="relative flex-1">
                  <RiSearch2Line size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search channels & chats…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 text-sm bg-muted/30 focus-visible:ring-1"
                  />
                </div>
                {user.role === 'admin' && (
                  <Button size="sm" variant="ghost" onClick={() => setIsCreatingChannel(v => !v)} className="h-8 px-2 text-muted-foreground hover:text-foreground" title="New channel">
                    <RiAddLine size={16} />
                  </Button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 py-1">
                {/* Create channel form */}
                {isCreatingChannel && user.role === 'admin' && (
                  <form onSubmit={handleCreateChannel} className="mx-2 my-2 p-3 bg-muted/30 border border-border rounded-xl space-y-2 text-sm animate-in fade-in">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">New Channel</p>
                    <Input required placeholder="Name (e.g. general)" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="h-8 text-sm" />
                    <Input placeholder="Description (optional)" value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} className="h-8 text-sm" />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
                      <input type="checkbox" checked={isBroadcast} onChange={e => setIsBroadcast(e.target.checked)} className="rounded" />
                      Broadcast (auto-add everyone)
                    </label>
                    <div className="flex gap-2 justify-end pt-1">
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreatingChannel(false)}>Cancel</Button>
                      <Button type="submit" size="sm" className="h-7 text-xs">Create</Button>
                    </div>
                  </form>
                )}

                {/* Channels */}
                {filteredChannels.length > 0 && (
                  <>
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Channels</p>
                    {filteredChannels.map(ch => (
                      <div key={ch.id} onClick={() => openChannel(ch)} className="relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors group">
                        <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <RiHashtag size={18} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                            {ch.name}
                            {ch.isBroadcast && (
                              <span className="text-[8px] px-1 py-px rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold uppercase">Global</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{ch.description || 'No description'}</div>
                        </div>
                        {ch.unreadCount > 0 && (
                          <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">{ch.unreadCount > 99 ? '99+' : ch.unreadCount}</span>
                        )}
                        {user.role === 'admin' && (
                          <button onClick={e => handleDeleteChannel(e, ch.id)} className="shrink-0 opacity-0 group-hover:opacity-100 text-destructive p-0.5 rounded transition-opacity">
                            <RiCloseLine size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* DM Conversations */}
                {filteredConvos.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Direct Messages</p>
                    {filteredConvos.map(conv => (
                      <div key={conv.id} onClick={() => openDM(conv)} className="relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors">
                        <UserAvatar firstName={conv.fullName?.firstName} lastName={conv.fullName?.lastName} size="sm" />
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-semibold truncate">{conv.fullName?.firstName || 'Unknown'} {conv.fullName?.lastName || ''}</div>
                          <div className="text-[10px] text-muted-foreground capitalize">{conv.role}</div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {filteredChannels.length === 0 && filteredConvos.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-20 px-6">
                    {searchQuery ? 'No results found.' : 'No channels or conversations yet.'}
                  </div>
                )}
              </div>
            </>
          ) : (
            // Message thread
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
              {((inChat && messages.length === 0) || (inChannel && channelMessages.length === 0)) && (
                <div className="m-auto text-center text-xs text-muted-foreground">Start the conversation!</div>
              )}
              {(inChat ? messages : channelMessages).map((msg, i) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id || i} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    {inChannel && !isMe && msg.sender && (
                      <span className="text-[9px] text-muted-foreground font-semibold ml-1 mb-0.5">
                        {msg.sender.firstName} {msg.sender.lastName}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-snug shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted/40 border border-border/50 text-foreground rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 mt-1 mx-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        {inFocus && (
          <div className="px-3 py-3 border-t border-border bg-card shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <Input
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                placeholder={inChat ? `Message ${activeChatUser.name.split(' ')[0]}…` : `Message #${activeChannel.name}…`}
                className="h-10 rounded-full bg-muted/30 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" disabled={!inputMsg.trim()} className="h-10 w-10 rounded-full shrink-0 shadow-md transition-transform hover:scale-105">
                <RiSendPlane2Line size={18} className="translate-x-px -translate-y-px" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatSidebar;
