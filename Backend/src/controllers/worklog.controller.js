const prisma = require("../db/prisma");

// Start work for the day
exports.startDay = async (req, res) => {
  try {
    console.log("Prisma keys:", Object.keys(prisma));
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.dailyWorkLog.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        isActive: true,
        startTime: new Date(),
      },
      create: {
        userId,
        date: today,
        isActive: true,
        startTime: new Date(),
      },
    });

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Stop work for the day (pause)
exports.stopDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.dailyWorkLog.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    if (!log || !log.isActive || !log.startTime) {
      return res.status(400).json({ success: false, message: "No active session found" });
    }

    const duration = Math.floor((new Date() - new Date(log.startTime)) / 1000);
    const updatedLog = await prisma.dailyWorkLog.update({
      where: { id: log.id },
      data: {
        isActive: false,
        totalSeconds: log.totalSeconds + duration,
        startTime: null,
      },
    });

    res.status(200).json({ success: true, data: updatedLog });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get current work log for today
exports.getTodayLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.dailyWorkLog.findUnique({
      where: {
        userId_date: { userId, date: today },
      },
    });

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get stats for admin
exports.getWorkLogStats = async (req, res) => {
  try {
    const logs = await prisma.dailyWorkLog.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
