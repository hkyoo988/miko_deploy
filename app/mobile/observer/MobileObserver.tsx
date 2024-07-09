import React, {useState} from "react";
import NetworkGraph from "../../_components/Network/NetworkGraph";
import NodeConversation from "../../_components/Network/NodeConversation";
import styles from "./MobileObserver.module.css";
import Header from "../../_components/common/Header";
import Footer from "../../_components/common/Footer";
import useHomeContent from "../../_hooks/useHomeContent";

const HomeContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("conversation");
  const {
    socket,
    socketContext,
    containerRef,
    nodes,
    edges,
    selectedNodeId,
    handleNodeClick,
    fitToScreen,
    handleLeaveSession,
    handleNodeHover
  } = useHomeContent(null);

  if (!socketContext) {
    return <p>Error: Socket context is not available.</p>;
  }

  return (
    <div className={styles.container}>
      <Header>MIKO</Header>
      <div className={styles.mainContainer}>
        <div className={styles.networkGraphContainer}>
          <NetworkGraph
            containerRef={containerRef}
            selectedNodeId={selectedNodeId}
            handleNodeClick={handleNodeClick}
            handleNodeHover={handleNodeHover}
            socket={socket}
          />
        </div>
        {/*<div className={styles.appContainer}>*/}
        {/*  {isConnected ? (*/}
        {/*    <>*/}
        {/*      <div className={styles.appContainer}>*/}
        {/*        {sessionId && userName && token ? (*/}
        {/*          <Video*/}
        {/*            sessionId={sessionId}*/}
        {/*            userName={userName}*/}
        {/*            token={token}*/}
        {/*            setLeaveSessionCallback={setLeaveSessionCallback}*/}
        {/*          />*/}
        {/*        ) : (*/}
        {/*          <p>Loading...</p>*/}
        {/*        )}*/}
        {/*      </div>*/}
        {/*    </>*/}
        {/*  ) : (*/}
        {/*    <p>Socket is not connected. Please check your connection.</p>*/}
        {/*  )}*/}
        {/*</div>*/}
        <div className={styles.nodeConversationWrapper}>
          <NodeConversation
            nodes={nodes.get()}
            edges={edges.get()}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            autoScroll={false} // 또는 필요한 값으로 설정
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
      <Footer>
        <div className={styles.footerComponents}>
          <button onClick={fitToScreen}>Fit to Screen</button>
          {/*<button onClick={handleSharingRoom}>Sharing a room</button>*/}
          {/*<ControlPanel*/}
          {/*  newNodeLabel={controlNodeLabel}*/}
          {/*  newNodeContent={controlNodeContent}*/}
          {/*  newNodeColor={controlNodeColor}*/}
          {/*  setNewNodeLabel={setControlNodeLabel}*/}
          {/*  setNewNodeContent={setControlNodeContent}*/}
          {/*  setNewNodeColor={setControlNodeColor}*/}
          {/*  addNode={handleAddNode}*/}
          {/*  setAction={setAction}*/}
          {/*  fitToScreen={fitToScreen}*/}
          {/*/>*/}
          {/*{sessionId && (*/}
          {/*  <VoiceRecorder*/}
          {/*    sessionId={sessionId}*/}
          {/*    publisher={publisher}*/}
          {/*    subscriber={subscriber}*/}
          {/*  />*/}
          {/*)}*/}
          {/*<button className={styles.keywordButton} onClick={handleKeyword}>*/}
          {/*  keyword*/}
          {/*</button>*/}
          <button onClick={handleLeaveSession}>Leave Session</button>
        </div>
      </Footer>
      {/*<SharingRoom*/}
      {/*  isOpen={isModalOpen}*/}
      {/*  onClose={() => setIsModalOpen(false)}*/}
      {/*  roomLink={roomLink}*/}
      {/*/>*/}
    </div>
  );
};

export default HomeContent;
