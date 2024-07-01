"use client";

import React from "react";
import { RoomSocketProvider } from "../../_components/Socket/SocketProvider";
import { VideoProvider } from "../../_components/Video/VideoContext";
import HomeContent from "./MobileObserver"

const Home: React.FC = () => {
  return (
    <RoomSocketProvider>
      <VideoProvider>
        <HomeContent />
      </VideoProvider>
    </RoomSocketProvider>
  );
};

export default Home;
