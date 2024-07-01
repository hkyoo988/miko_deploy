// VideoContext.tsx

import React, { createContext, useContext, useState } from 'react';

interface VideoContextProps {
  publisher: any;
  subscriber: any[];
  setPublisher: (publisher: any) => void;
  setSubscriber: (subscriber: any) => void;
}

const VideoContext = createContext<VideoContextProps | undefined>(undefined);

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideoContext must be used within a VideoProvider');
  }
  return context;
};

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publisher, setPublisher] = useState<any>(null);
  const [subscriber, setSubscriber] = useState<any[]>([]);

  return (
    <VideoContext.Provider value={{ publisher, subscriber, setPublisher, setSubscriber }}>
      {children}
    </VideoContext.Provider>
  );
};
