import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'sonner';

// API — initial data fetch
import { getConversations } from '../../api/messages.api';
import { getChannels, markChannelRead } from '../../api/channels.api';

// Redux actions
import {
  setConversations, incrementDmUnread,
} from '../../store/reducers/messageSlice';
import {
  setChannels, addChannel, removeChannel,
  incrementChannelUnread,
} from '../../store/reducers/channelSlice';

/**
 * ChatUnreadListener — always-mounted, renders nothing.
 *
 * Handles all real-time socket events that affect unread counts so the
 * sidebar badge updates correctly even when ChatPage is not on screen.
 *
 * Mount this once inside AdminPage / EmployeeDashboard, outside the page
 * switch so it survives navigation between tabs.
 */
const ChatUnreadListener = () => {
  const dispatch  = useDispatch();
  const socket    = useSocket();
  const { user }  = useSelector(s => s.userReducer);

  // Grab the currently open conversation/channel so we know when NOT to
  // increment the counter (user already sees those messages).
  const activeChatUser  = useSelector(s => s.messageReducer.activeChatUser);
  const activeChannel   = useSelector(s => s.channelReducer.activeChannel);
  const conversations   = useSelector(s => s.messageReducer.conversations);
  const channels        = useSelector(s => s.channelReducer.channels);

  // ── Bootstrap: fetch conversations + channels once user is known ──────────
  const fetchData = useCallback(() => {
    if (!user?.id) return;
    Promise.all([getConversations(), getChannels()])
      .then(([convRes, chRes]) => {
        dispatch(setConversations(convRes.data));
        dispatch(setChannels(chRes.data));
        if (socket) socket.emit('join_channels', chRes.data.map(c => c.id));
      }).catch(() => {});
  }, [user, dispatch, socket]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleDM = (msg) => {
      // Skip if the sender is ourselves, or if that DM is already open
      if (msg.senderId === user.id) return;
      if (activeChatUser && msg.senderId === activeChatUser.id) return;

      dispatch(incrementDmUnread(msg.senderId));

      const sender = conversations.find(c => c.id === msg.senderId);
      const name   = sender
        ? `${sender.fullName?.firstName || ''} ${sender.fullName?.lastName || ''}`.trim()
        : 'Someone';

      // Refresh list if this is a new conversation partner
      if (!sender) fetchData();

      toast.message(`New message from ${name}`, {
        description: msg.content.length > 50 ? msg.content.slice(0, 50) + '…' : msg.content,
      });
    };

    const handleChannelMsg = (msg) => {
      // Skip our own messages, or messages in the channel we're currently viewing
      if (msg.senderId === user.id) return;
      if (activeChannel && msg.channelId === activeChannel.id) return;

      dispatch(incrementChannelUnread(msg.channelId));

      const ch   = channels.find(c => c.id === msg.channelId);
      const name = ch?.name || 'channel';

      toast.message(`New message in #${name}`, {
        description: msg.content.length > 50 ? msg.content.slice(0, 50) + '…' : msg.content,
      });
    };

    const handleNewChannel = (ch) => {
      dispatch(addChannel({ ...ch, unreadCount: 0 }));
      socket.emit('join_channel', ch.id);
    };

    const handleChannelDeleted = (id) => dispatch(removeChannel(id));

    // Refresh everything on a generic push (e.g. announcement unread update)
    const handleUpdateUnreads = () => fetchData();

    socket.on('receive_message',         handleDM);
    socket.on('receive_channel_message', handleChannelMsg);
    socket.on('new_channel',             handleNewChannel);
    socket.on('channel_deleted',         handleChannelDeleted);
    socket.on('update_unreads',          handleUpdateUnreads);

    return () => {
      socket.off('receive_message',         handleDM);
      socket.off('receive_channel_message', handleChannelMsg);
      socket.off('new_channel',             handleNewChannel);
      socket.off('channel_deleted',         handleChannelDeleted);
      socket.off('update_unreads',          handleUpdateUnreads);
    };
  }, [socket, user, activeChatUser, activeChannel, conversations, channels, dispatch, fetchData]);

  return null; // renders nothing
};

export default ChatUnreadListener;
