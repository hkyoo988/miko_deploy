"use client";

import React from "react";
import { RoomSocketProvider } from "../_components/Socket/SocketProvider";
import { VideoProvider } from "../_components/Video/VideoContext";
import HomeContent from "../_components/meetingRoom/MeetingRoom";
import Header from "../_components/common/Header";

const Home: React.FC = () => {
  return (
    <RoomSocketProvider>
      <VideoProvider>
        <Header>MIKO</Header>
        <HomeContent />
      </VideoProvider>
    </RoomSocketProvider>
  );
};

export default Home;
