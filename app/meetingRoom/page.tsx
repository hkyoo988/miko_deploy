"use client";

import React, { Suspense } from "react";
import { RoomSocketProvider } from "../_components/Socket/SocketProvider";
import { VideoProvider } from "../_components/Video/VideoContext";
import HomeContent from "../_components/meetingRoom/MeetingRoom";
import Loading from "../_components/common/Loading";

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
        <HomeContent />
      </VideoProvider>
    </RoomSocketProvider>
  );
};

const Page: React.FC = () => (
  <Suspense fallback={<Loading disabled={true} text={"Loading..."}/>}>
    <Home/>
  </Suspense>
);

export default Page;
