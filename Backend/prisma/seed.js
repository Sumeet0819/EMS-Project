require('dotenv').config();
const prisma = require('../src/db/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Starting seed...');

  // 1. Clear existing data (optional but recommended for a clean demo)
  // await prisma.task.deleteMany();
  // await prisma.dailyWorkLog.deleteMany();
  // await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // 2. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      firstName: 'System',
      lastName: 'Admin',
      password,
      role: 'admin',
    },
  });
  console.log('Admin created:', admin.email);

  // 3. Create 50 Employees
  const employees = [];
  for (let i = 1; i <= 50; i++) {
    const email = `employee${i}@demo.com`;
    const employee = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        firstName: `Employee`,
        lastName: `${i}`,
        password,
        role: 'employee',
      },
    });
    employees.push(employee);
    if (i % 10 === 0) console.log(`Created ${i} employees...`);
  }

  // 4. Create Tasks for Employees
  const priorities = ['low', 'medium', 'high'];
  const now = new Date();
  
  // Calculate current bucket start for testing shift timers
  const bucketStart = new Date(now);
  bucketStart.setHours(now.getHours() < 12 ? 0 : 12, 0, 0, 0);

  for (const emp of employees) {
    // Each employee gets 4 types of tasks for testing
    
    // Type A: Completed Task with history
    await prisma.task.create({
      data: {
        title: `Completed Feature: ${emp.firstName} ${emp.lastName}`,
        description: 'Previously finished work item.',
        status: 'completed',
        priority: 'low',
        assignedToId: emp.id,
        createdById: admin.id,
        totalTimeSpent: 7200, // 2 hours
        shiftTimeSpent: 0,    // Shift reset
        lastResetTime: new Date(bucketStart.getTime() - 3600000 * 12), // Previous shift
        completedTime: new Date(now.getTime() - 86400000), // Yesterday
      }
    });

    // Type B: Pending Task
    await prisma.task.create({
      data: {
        title: `Pending Review: ${emp.firstName} ${emp.lastName}`,
        description: 'Awaiting start.',
        status: 'pending',
        priority: 'medium',
        assignedToId: emp.id,
        createdById: admin.id,
      }
    });

    // Type C: Active (In-Progress) Task - Started in current shift
    await prisma.task.create({
      data: {
        title: `Active Backend Dev: ${emp.firstName} ${emp.lastName}`,
        description: 'Currently being worked on.',
        status: 'in_progress',
        priority: 'high',
        assignedToId: emp.id,
        createdById: admin.id,
        startTime: new Date(now.getTime() - 1800000), // Started 30 mins ago
        shiftTimeSpent: 1200, // 20 mins already logged in this shift
        lastResetTime: bucketStart,
      }
    });

    // Type D: Daily Routine Task
    await prisma.task.create({
      data: {
        title: `Daily Sync: ${emp.firstName} ${emp.lastName}`,
        description: 'Standard daily protocol.',
        status: 'pending',
        priority: 'medium',
        isDaily: true,
        assignedToId: emp.id,
        createdById: admin.id,
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
