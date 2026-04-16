import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to the backend
    // Auto-detect production backend from Render if on Vercel
    const productionUrl = 'https://renthub-backend-ni16.onrender.com';
    const socketUrl = import.meta.env.VITE_API_URL || 
                      (window.location.hostname.includes('vercel.app') ? productionUrl : 'http://localhost:3001');
                      
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.io');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
