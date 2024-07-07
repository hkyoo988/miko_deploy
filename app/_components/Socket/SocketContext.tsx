"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import socket from '../../_lib/socket';

interface SocketContextProps {
  socket: Socket;
  isConnected: boolean;
  connectSocket: (nickname: string) => void;
  disconnectSocket: () => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a MainSocketProvider');
  }
  return context;
};

export const MainSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      console.log("connected");
    };

    const handleError = (error: any) => {
      console.error('Error from server:', error);
    };

    socket.on('connect', handleConnect);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('error', handleError);
    };
  }, []);

  const connectSocket = (nickname: string) => {
    socket.auth = { nickname };
    socket.connect();
  };

  const disconnectSocket = () => {
    // socket.emit('disconnecting');
    socket.disconnect();
  };
  
  return (
    <SocketContext.Provider value={{ socket, isConnected, connectSocket, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
