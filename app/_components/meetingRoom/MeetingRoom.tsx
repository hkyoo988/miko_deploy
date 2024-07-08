import React, { useEffect, useState, CSSProperties } from "react";
import { FaMicrophone, FaComments } from "react-icons/fa";
import NetworkGraph from "../Network/NetworkGraph";
import ControlPanel from "../Network/ControlPanel";
import NodeConversation from "../Network/NodeConversation";
import Video from "../Video/Video";
import Header from "../common/Header";
import SharingRoom from "../sharingRoom";
import VoiceRecorder from "../VoiceRecorder/VoiceRecorder";
import useHomeContent from "../../_hooks/useHomeContent";
import Loading from "../common/Loading";

const HomeContent: React.FC = () => {
  const [isConversationVisible, setIsConversationVisible] = useState(false);
  const [isRecorderVisible, setIsRecorderVisible] = useState(false);

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
    handleNodeHover,
    popoverState,
  } = useHomeContent();

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

  const toggleConversationVisibility = () => {
    setIsConversationVisible((prev) => !prev);
  };

  const toggleRecorderVisibility = () => {
    setIsRecorderVisible((prev) => !prev);
  };

  const popoverStyle: CSSProperties = {
    position: "absolute",
    top: `${popoverState.y - 65}px`,
    left: `${popoverState.x - 75}px`,
    backgroundColor: "#333",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
    visibility: popoverState.visible ? "visible" : "hidden",
    opacity: popoverState.visible ? 1 : 0,
    animation: popoverState.visible ? "fade-in 300ms ease" : "none",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
  };

  const arrowStyle: CSSProperties = {
    position: "absolute",
    width: "10px",
    height: "10px",
    backgroundColor: "#333",
    transform: "rotate(45deg)",
    zIndex: -1,
    top: "calc(100% - 5px)",
    left: "50%",
    marginLeft: "-5px",
  };

  return (
    <div className="flex flex-col items-center h-screen overflow-hidden">
      <Header>MIKO</Header>
      <div className="relative w-full h-full">
        <div className="fixed left-0 w-full h-[calc(100%-3%)] z-20">
          <NetworkGraph
            containerRef={containerRef}
            selectedNodeId={selectedNodeId}
            handleNodeClick={handleNodeClick}
            handleNodeHover={handleNodeHover}
            socket={socket}
          />
          {popoverState.visible && (
            <div style={popoverStyle}>
              <p>{popoverState.content}</p>
              <div style={arrowStyle} data-popper-arrow></div>
            </div>
          )}
        </div>

        <div className="absolute w-20% h-full top-10 left-0 z-30">
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
                  <Loading disabled={true} text={"Loading..."} />
                )}
              </div>
            </>
          ) : (
            <Loading
              disabled={true}
              text={"Socket is not connected. Please check your connection."}
            />
          )}
        </div>

        <div className="absolute right-0 top-0 mt-2 mr-5 z-30 flex space-x-2">
          <button
            className="bg-blue-500 text-white p-2 rounded flex items-center justify-center"
            onClick={toggleRecorderVisibility}
          >
            <FaMicrophone />
          </button>
          <button
            className="bg-blue-500 text-white p-2 rounded flex items-center justify-center"
            onClick={toggleConversationVisibility}
          >
            <FaComments />
          </button>
        </div>

        <div
          className={`absolute right-0 top-12 z-20 bg-[rgba(249,249,249,0.7)] backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg transition-transform duration-300 ${
            isRecorderVisible ? "translate-x-0" : "translate-x-full"
          } w-[25%]`}
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
          className={`absolute right-0 top-40 z-20 bg-[rgba(249,249,249,0.7)] backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg transition-transform duration-300 ${
            isConversationVisible ? "translate-x-0" : "translate-x-full"
          } w-[25%] h-[78%]`}
        >
          <NodeConversation
            nodes={nodes.get()}
            edges={edges.get()}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>
      <div className="flex justify-between items-center w-full p-2 z-50">
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
      <SharingRoom
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomLink={roomLink}
      />
    </div>
  );
};

export default HomeContent;
