require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/db/db');

// Connect to the database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store connected users (userId -> socketId mapping)
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // When a user connects, store their userId
  socket.on('register', (userId) => {
    if (userId) {
      connectedUsers.set(userId.toString(), socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  // Handle joining specific chat channels (Socket Rooms)
  socket.on('join_channel', (channelId) => {
     if (channelId) {
        socket.join(`channel_${channelId}`);
        console.log(`Socket ${socket.id} joined channel_${channelId}`);
     }
  });

  // Handle joining multiple channels (e.g. on login/refresh)
  socket.on('join_channels', (channelIds) => {
     if (Array.isArray(channelIds)) {
        channelIds.forEach(id => socket.join(`channel_${id}`));
        console.log(`Socket ${socket.id} joined ${channelIds.length} channels`);
     }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove user from connectedUsers map
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io instance available globally
global.io = io;
global.connectedUsers = connectedUsers;

server.listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('Socket.IO is ready');
});
