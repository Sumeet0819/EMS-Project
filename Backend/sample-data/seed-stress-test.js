const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting stress test database seeding...');

  try {
    // 1. Clean up existing test data (optional, but good for consistent runs)
    // We prefix test users with 'stresstest_' so we can easily delete them later
    console.log('🧹 Cleaning up old stress test data...');
    await prisma.task.deleteMany({
      where: {
        assignedTo: {
          email: { startsWith: 'stresstest_' }
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: { startsWith: 'stresstest_' }
      }
    });

    // 2. Create an admin user for the test (if not exists)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'stresstest_admin@example.com' },
      update: {},
      create: {
        email: 'stresstest_admin@example.com',
        firstName: 'Stress',
        lastName: 'Admin',
        password: adminPassword,
        role: 'admin',
      },
    });

    console.log('👨‍💼 Admin user prepared:', adminUser.email);

    // 3. Create 30 employee users
    console.log('👥 Creating 30 employee users...');
    const employeePassword = await bcrypt.hash('password123', 10);
    const usersData = Array.from({ length: 30 }).map((_, i) => ({
      email: `stresstest_emp${i + 1}@example.com`,
      firstName: `EmpFirst${i + 1}`,
      lastName: `EmpLast${i + 1}`,
      password: employeePassword,
      role: 'employee',
    }));

    await prisma.user.createMany({
      data: usersData,
      skipDuplicates: true,
    });

    // Fetch the created users so we have their IDs
    const employees = await prisma.user.findMany({
      where: { email: { startsWith: 'stresstest_emp' } },
    });

    console.log(`✅ Created ${employees.length} employees.`);

    // 4. Create tasks for these employees
    console.log('📋 Creating tasks for employees...');
    const tasksData = [];
    const statuses = ['pending', 'in_progress', 'completed'];
    const priorities = ['low', 'medium', 'high'];

    for (const emp of employees) {
      // Create 5 tasks per employee
      for (let j = 0; j < 5; j++) {
        tasksData.push({
          title: `Stress Task ${j + 1} for ${emp.firstName}`,
          description: `This is an automated task description for stress testing. Loop ${j}`,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          deadline: new Date(Date.now() + 86400000 * (j + 1)), // Future dates
          assignedToId: emp.id,
          createdById: adminUser.id,
          isDaily: j === 0, // Make the first one daily
        });
      }
    }

    await prisma.task.createMany({
      data: tasksData,
    });

    console.log(`✅ Created ${tasksData.length} tasks.`);
    console.log('🟢 Seeding completed successfully!');
    
    // Save the credentials to a JSON file so Artillery can use them
    const fs = require('fs');
    const path = require('path');
    
    // Create payload file for Artillery
    const csvContent = employees.map(emp => `${emp.email},password123,${emp.id}`).join('\n');
    const csvHeader = 'email,password,id\n';
    
    const payloadDir = path.join(__dirname, '../tests/stress');
    if (!fs.existsSync(payloadDir)) {
      fs.mkdirSync(payloadDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(payloadDir, 'users.csv'), csvHeader + csvContent);
    console.log(`📄 Wrote test credentials to tests/stress/users.csv`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
