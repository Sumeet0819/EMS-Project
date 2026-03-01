const prisma = require('../db/prisma');

exports.getUnreadCounts = async (req, res) => {
  const currentUserId = req.user.id;
  try {
    const counts = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: currentUserId,
        isRead: false
      },
      _count: {
        id: true
      }
    });
    
    // Transform into { [senderId]: count }
    const result = counts.reduce((acc, curr) => {
       acc[curr.senderId] = curr._count.id;
       return acc;
    }, {});
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unread counts" });
  }
};

// Returns a distinct list of users the current user has a conversation with,
// along with the unread count per conversation partner.
exports.getConversations = async (req, res) => {
  const currentUserId = req.user.id;
  try {
    // Find all messages involving this user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      select: {
        senderId: true,
        receiverId: true,
        isRead: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Collect unique partner IDs preserving first-seen order (most-recent first)
    const partnerIds = [];
    const seen = new Set();
    for (const m of messages) {
      const partnerId = m.senderId === currentUserId ? m.receiverId : m.senderId;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        partnerIds.push(partnerId);
      }
    }

    if (partnerIds.length === 0) return res.json([]);

    // Fetch user details for those partners
    const users = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, firstName: true, lastName: true, role: true }
    });

    // Count unread messages per partner (messages sent TO me, not yet read)
    const unreadGroups = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: currentUserId,
        senderId: { in: partnerIds },
        isRead: false
      },
      _count: { id: true }
    });
    const unreadMap = unreadGroups.reduce((acc, g) => {
      acc[g.senderId] = g._count.id;
      return acc;
    }, {});

    // Return in most-recent-conversation order
    const result = partnerIds.map(pid => {
      const u = users.find(u => u.id === pid);
      if (!u) return null;
      return {
        id: u.id,
        fullName: { firstName: u.firstName, lastName: u.lastName },
        role: u.role,
        unreadCount: unreadMap[pid] || 0
      };
    }).filter(Boolean);

    res.json(result);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

exports.getMessagesWithUser = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  try {
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content
      }
    });

    // Send via socket to specific user
    if (global.io && global.connectedUsers) {
      const targetSocketId = global.connectedUsers.get(receiverId);
      if (targetSocketId) {
        global.io.to(targetSocketId).emit('receive_message', message);
        global.io.to(targetSocketId).emit('update_unreads');
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  const { userId } = req.params; // The other user
  const currentUserId = req.user.id; // me

  try {
    const updated = await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    });

    if (global.io && global.connectedUsers && updated.count > 0) {
       const userSocket = global.connectedUsers.get(currentUserId);
       if (userSocket) {
           global.io.to(userSocket).emit('update_unreads');
       }
    }

    res.json({ success: true, count: updated.count });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};
