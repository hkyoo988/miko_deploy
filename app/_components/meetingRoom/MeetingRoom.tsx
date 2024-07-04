import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import NetworkGraph from "../Network/NetworkGraph";
import ControlPanel from "../Network/ControlPanel";
import NodeConversation from "../Network/NodeConversation";
import Video from "../Video/Video";
import Footer from "../common/Footer";
import SharingRoom from "../sharingRoom";
import VoiceRecorder from "../VoiceRecorder/VoiceRecorder";
import useHomeContent from "../../_hooks/useHomeContent";

const HomeContent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  const {
    socket,
    socketContext,
    containerRef,
    sessionId,
    userName,
    token,
    isConnected,
    nodes,
    edges,
    selectedNodeId,
    handleNodeClick,
    fitToScreen,
    controlNodeLabel,
    setControlNodeLabel,
    controlNodeContent,
    setControlNodeContent,
    controlNodeColor,
    setControlNodeColor,
    roomLink,
    isModalOpen,
    setIsModalOpen,
    isListOpen,
    handleAddNode,
    handleKeyword,
    handleSharingRoom,
    handleLeaveSession,
    setLeaveSessionCallback,
    setAction,
    publisher,
    subscriber,
  } = useHomeContent();

  // Add useEffect to handle window close event
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (socket && sessionId) {
        socket.emit("end_meeting", sessionId);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket, sessionId]);

  if (!socketContext) {
    return <p>Error: Socket context is not available.</p>;
  }

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="flex flex-col items-center h-[calc(100vh-3vh)] overflow-hidden">
      <div className="relative w-full h-screen">
        <div className="cursor-pointer fixed left-0 w-full h-[calc(100%-3%)] z-[20]">
          <NetworkGraph
            containerRef={containerRef}
            selectedNodeId={selectedNodeId}
            handleNodeClick={handleNodeClick}
            socket={socket}
          />
        </div>

        <div className="relative w-full h-full">
          {isConnected ? (
            <>
              <div className="relative w-full h-full">
                {sessionId && userName && token ? (
                  <Video
                    sessionId={sessionId}
                    userName={userName}
                    token={token}
                    setLeaveSessionCallback={setLeaveSessionCallback}
                  />
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </>
          ) : (
            <p>Socket is not connected. Please check your connection.</p>
          )}
        </div>
        <div
          className={`absolute top-0 mt-10 mr-5 z-20 bg-[rgba(249,249,249,0.7)] backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg transition-transform duration-300 ${
            isVisible ? "right-0" : "-right-[30%]"
          } w-[20%] h-[20%] p-4`}
        >
          {sessionId && (
            <VoiceRecorder
              sessionId={sessionId}
              publisher={publisher}
              subscriber={subscriber}
            />
          )}
        </div>
        <div
          className={`absolute top-[30%] mt-2 mr-5 border border-gray-300 rounded-lg shadow-lg bg-[rgba(249,249,249,0.7)] backdrop-blur-sm z-20 overflow-hidden transition-transform duration-300 ${
            isVisible ? "right-0" : "-right-[30%]"
          } w-[30%] h-[50%] p-4`}
        >
          <NodeConversation
            nodes={nodes.get()}
            edges={edges.get()}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>
        <button
          className="absolute right-0 top-0 mt-2 mr-5 z-30 bg-blue-500 text-white p-2 rounded flex items-center justify-center"
          onClick={toggleVisibility}
        >
          {isVisible ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      <Footer>
        <div className="flex justify-between items-center w-full z-2 p-2.5">
          <div className="flex items-center">
            <ControlPanel
              newNodeLabel={controlNodeLabel}
              newNodeContent={controlNodeContent}
              newNodeColor={controlNodeColor}
              handleKeyword={handleKeyword}
              setAction={setAction}
              fitToScreen={fitToScreen}
              handleSharingRoom={handleSharingRoom}
              handleLeaveSession={handleLeaveSession}
            />
          </div>
        </div>
      </Footer>
      <SharingRoom
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomLink={roomLink}
      />
    </div>
  );
};

export default HomeContent;
