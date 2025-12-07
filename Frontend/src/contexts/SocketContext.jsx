import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context; // Can be null while connecting
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useSelector((state) => state.userReducer);

  useEffect(() => {
    // Determine the socket server URL
    // For development, use localhost. For production, you might want to use environment variables
    const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    
    // Initialize socket connection
    const newSocket = io(socketURL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Register user when socket is connected and user is available
  useEffect(() => {
    if (!socket || !user || !user.id) return;

    const handleConnect = () => {
      socket.emit('register', user.id);
      console.log('Socket registered for user:', user.id);
    };

    // If already connected, register immediately
    if (socket.connected) {
      handleConnect();
    }

    // Listen for connection event
    socket.on('connect', handleConnect);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

