import React, { useState, useEffect, useRef } from "react";
import NodeList from "./NodeList";
import Conversation from "./Conversation";
import styles from "./styles/NodeConversation.module.css";
import { Node, Edge } from "../../_types/types";
import { useSocket } from "../Socket/SocketContext";

interface NodeConversationProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
  className?: string;
}

const NodeConversation: React.FC<NodeConversationProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<string>("nodes");
  const [messages, setMessages] = useState<string[]>([]);
  const { socket } = useSocket();
  const handleNewMessage = useRef((message: string) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  });

  useEffect(() => {
    const handleMessage = (message: string) => {
      console.log("Received message from server:", message);
      handleNewMessage.current(message);
    };

    socket.on("script", handleMessage);

    return () => {
      socket.off("script", handleMessage);
    };
  }, [socket]);

  const renderContent = () => {
    switch (activeTab) {
      case "nodes":
        return (
          <NodeList
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onNodeClick={onNodeClick}
          />
        );
      case "conversation":
        return <Conversation messages={messages} />;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className={styles.chromeTabs}>
        <div
          className={
            activeTab === "nodes" ? styles.chromeTabActive : styles.chromeTab
          }
          onClick={() => setActiveTab("nodes")}
        >
          키워드 요약
        </div>
        <div
          className={
            activeTab === "conversation"
              ? styles.chromeTabActive
              : styles.chromeTab
          }
          onClick={() => setActiveTab("conversation")}
        >
          음성 기록
        </div>
      </div>
      <div className={styles.nodeConversationContainer}>{renderContent()}</div>
    </div>
  );
};

export default NodeConversation;
