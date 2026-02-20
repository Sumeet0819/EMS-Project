const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/user.models');
const Task = require('../src/models/task.model');
const employeesData = require('./employees.json');
const tasksData = require('./tasks.json');

// MongoDB connection string - update with your credentials
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ems-database';

async function importData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await User.deleteMany({});
    await Task.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Hash passwords for employees
    const hashedEmployees = await Promise.all(
      employeesData.map(async (employee) => {
        // Hash the password (use a default password or generate one)
        const hashedPassword = await bcrypt.hash('password123', 10);
        return {
          ...employee,
          password: hashedPassword
        };
      })
    );

    // Import employees
    const importedEmployees = await User.insertMany(hashedEmployees);
    console.log(`✅ Imported ${importedEmployees.length} employees`);

    // Find admin and employee IDs
    const admin = importedEmployees.find(emp => emp.role === 'admin');
    const employees = importedEmployees.filter(emp => emp.role === 'employee');

    // Update tasks with actual ObjectIds
    const updatedTasks = tasksData.map((task, index) => {
      // Assign tasks to employees in a round-robin fashion
      const employeeIndex = index % employees.length;
      return {
        ...task,
        assignedTo: employees[employeeIndex]._id,
        createdBy: admin._id,
        // Convert date strings to Date objects
        deadline: task.deadline ? new Date(task.deadline) : null,
        startTime: task.startTime ? new Date(task.startTime) : null,
        completedTime: task.completedTime ? new Date(task.completedTime) : null
      };
    });

    // Import tasks
    const importedTasks = await Task.insertMany(updatedTasks);
    console.log(`✅ Imported ${importedTasks.length} tasks`);

    console.log('\n📊 Import Summary:');
    console.log(`   - Employees: ${importedEmployees.length}`);
    console.log(`   - Admin: 1`);
    console.log(`   - Regular Employees: ${employees.length}`);
    console.log(`   - Tasks: ${importedTasks.length}`);
    console.log('\n🔐 Default Password: password123');
    console.log('\n✨ Data import completed successfully!');

    // Close connection
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

// Run the import
importData();
