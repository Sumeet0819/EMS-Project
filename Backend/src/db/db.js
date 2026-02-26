const prisma = require('./prisma');

async function connectDB() {
    try {
        await prisma.$connect();
        console.log('PostgreSQL Database connected successfully via Prisma'); 
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

module.exports = connectDB;