import React, { useEffect } from "react";
import NetworkGraph from "../Network/NetworkGraph";
import ControlPanel from "../Network/ControlPanel";
import NodeConversation from "../Network/NodeConversation";
import Video from "../Video/Video";
import styles from "./MeetingRoom.module.css";
import Footer from "../common/Footer";
import SharingRoom from "../sharingRoom";
import VoiceRecorder from "../VoiceRecorder/VoiceRecorder";
import useHomeContent from "../../_hooks/useHomeContent";

const HomeContent: React.FC = () => {
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

  return (
    <div className={styles.container}>
      <div className={styles.mainContainer}>
        <div className={styles.networkGraphContainer}>
          <NetworkGraph
            containerRef={containerRef}
            selectedNodeId={selectedNodeId}
            handleNodeClick={handleNodeClick}
            socket={socket}
          />
        </div>

        <div className={styles.appContainer}>
          {isConnected ? (
            <>
              <div className={styles.appContainer}>
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
        <div className={styles.voiceRecorderContainer}>
          {sessionId && (
            <VoiceRecorder
              sessionId={sessionId}
              publisher={publisher}
              subscriber={subscriber}
            />
          )}
        </div>
        <div className="absolute right-0 top-[200px] mr-5 border border-gray-300 rounded-lg shadow-lg bg-[rgba(249,249,249,0.7)] backdrop-blur-sm z-10 overflow-y-hidden overflow-x-hidden h-[60%] w-[15%]">
          <NodeConversation
            nodes={nodes.get()}
            edges={edges.get()}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>
      <Footer>
        <div className={styles.footerComponents}>
          <div className={styles.footerLeft}>
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
