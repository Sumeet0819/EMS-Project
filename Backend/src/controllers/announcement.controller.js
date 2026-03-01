const prisma = require('../db/prisma');

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { firstName: true, lastName: true, role: true }
        }
      },
      take: 10
    });
    res.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
};

exports.createAnnouncement = async (req, res) => {
  const { title, content, expiresAt } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only admins can broadcast announcements" });
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorId: req.user.id
      },
      include: {
        author: {
          select: { firstName: true, lastName: true, role: true }
        }
      }
    });

    // Broadcast globally
    if (global.io) {
      global.io.emit('new_announcement', announcement);
    }
    
    // Create notifications for all users except the author
    const allUsers = await prisma.user.findMany({ 
       where: { id: { not: req.user.id } }, 
       select: { id: true } 
    });
    const notificationData = allUsers.map(user => ({
      userId: user.id,
      title: 'New Announcement',
      message: title,
      type: 'ANNOUNCEMENT'
    }));
    await prisma.notification.createMany({ data: notificationData });

    // Notify connected users specifically (optional, since we already did broadcast above, but keeping badge counts updated)
    if (global.io && global.connectedUsers) {
      global.connectedUsers.forEach((socketId, userId) => {
        if (userId !== req.user.id) {
           global.io.to(socketId).emit('update_unreads');
        }
      });
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only admins can delete announcements" });
  }

  const { id } = req.params;
  try {
    await prisma.announcement.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
};
