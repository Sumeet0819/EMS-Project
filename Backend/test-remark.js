require('dotenv').config();
const prisma = require('./src/db/prisma');

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Check if table exists
  try {
    const count = await prisma.taskRemark.count();
    console.log('task_remarks count:', count);
  } catch(e) {
    console.log('Count error:', e.message);
    process.exit(1);
  }

  // Find any daily task
  const task = await prisma.task.findFirst({ where: { isDaily: true }, select: { id: true, assignedToId: true } });
  if (!task) { console.log('No daily task found'); process.exit(0); }
  console.log('Daily task:', task.id, '/ user:', task.assignedToId);

  // Try upsert
  try {
    const res = await prisma.taskRemark.upsert({
      where: {
        taskId_submittedBy_date: {
          taskId: task.id,
          submittedBy: task.assignedToId,
          date: today,
        }
      },
      update: { remark: 'test-update' },
      create: { taskId: task.id, submittedBy: task.assignedToId, date: today, remark: 'test-create' }
    });
    console.log('UPSERT SUCCESS:', res.id);
  } catch(e) {
    console.log('UPSERT FAIL:', e.message);
    if (e.meta) console.log('META:', JSON.stringify(e.meta));
  }
  process.exit(0);
}
main();
