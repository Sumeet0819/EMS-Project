const prisma = require('../db/prisma');

// Get all channels for current user
exports.getChannels = async (req, res) => {
  const userId = req.user.id;

  try {
    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { isBroadcast: true },
          { members: { some: { userId } } }
        ]
      },
      include: {
         members: {
            where: { userId }
         }
      },
      orderBy: { createdAt: 'asc' }
    });

    const result = await Promise.all(channels.map(async ch => {
      let unreadCount = 0;
      const lastRead = ch.members[0]?.lastReadAt || ch.createdAt;
      unreadCount = await prisma.channelMessage.count({
         where: { channelId: ch.id, createdAt: { gt: lastRead } }
      });

      return {
        ...ch,
        unreadCount
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch channels" });
  }
};

// Create a new channel (Admin only)
exports.createChannel = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

  const { name, description, isBroadcast } = req.body;
  try {
    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        isBroadcast: isBroadcast || false,
        members: {
           create: { userId: req.user.id }
        }
      }
    });

    // Notify all via socket if broadcast
    if (channel.isBroadcast) {
       global.io.emit('new_channel', channel);
    } else {
       // Just to the creator for now
       const creatorSocket = global.connectedUsers.get(req.user.id);
       if(creatorSocket) global.io.to(creatorSocket).emit('new_channel', channel);
    }

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: "Failed to create channel" });
  }
};

exports.deleteChannel = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  try {
    await prisma.channel.delete({ where: { id: req.params.channelId } });
    global.io.emit('channel_deleted', req.params.channelId);
    res.json({ success: true });
  } catch(error) {
    res.status(500).json({ error: "Failed to delete" });
  }
};

// Add members
exports.addMembers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { userIds } = req.body; // Array of UUIDs
  const { channelId } = req.params;

  try {
    const data = userIds.map(uId => ({ channelId, userId: uId }));
    await prisma.channelMember.createMany({
       data,
       skipDuplicates: true
    });
    
    // Attempt to notify them if online
    userIds.forEach(uId => {
       const uSocket = global.connectedUsers.get(uId);
       if (uSocket) global.io.to(uSocket).emit('added_to_channel', { channelId });
    });

    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: "Failed to add members" });
  }
};

// Messages
exports.getMessages = async (req, res) => {
  const { channelId } = req.params;
  try {
    const messages = await prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      include: {
         sender: { select: { id: true, firstName: true, lastName: true} }
      }
    });
    res.json(messages);
  } catch(error) {
    res.status(500).json({ error: "Failed" });
  }
};

exports.sendMessage = async (req, res) => {
  const { channelId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;

  try {
    const msg = await prisma.channelMessage.create({
      data: { channelId, senderId, content },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } }
    });

    // We emit to the "room" in socket (the channelId)
    // Wait, since we haven't strictly joined users to socket rooms in server.js dynamically,
    // A quick robust fallback is just emitting globally and filtering on frontend, 
    // OR emitting specifically. Let's emit to the channelId room. 
    global.io.to(`channel_${channelId}`).emit('receive_channel_message', msg);
    
    res.status(201).json(msg);
  } catch(err) {
    res.status(500).json({ error: "Failed" });
  }
};

exports.markAsRead = async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user.id;
  try {
    await prisma.channelMember.upsert({
       where: { channelId_userId: { channelId, userId } },
       update: { lastReadAt: new Date() },
       create: { channelId, userId, lastReadAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark read" });
  }
};
