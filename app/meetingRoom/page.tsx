"use client";

import React from "react";
import { RoomSocketProvider } from "../_components/Socket/SocketProvider";
import { VideoProvider } from "../_components/Video/VideoContext";
import HomeContent from "../_components/meetingRoom/MeetingRoom";
import Header from "../_components/common/Header";

const Home: React.FC = () => {
  const keyframesStyle = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

  return (
    <RoomSocketProvider>
      <VideoProvider>
      <style>{keyframesStyle}</style>
        <Header>MIKO</Header>
        <HomeContent />
      </VideoProvider>
    </RoomSocketProvider>
  );
};

export default Home;
