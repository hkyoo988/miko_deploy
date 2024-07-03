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
            className="p-4"
          />
        );
      case "conversation":
        return <Conversation messages={messages} className="p-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden p-4">
<ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400 mb-4">        <li
          className={`me-2 ${
            activeTab === "nodes"
              ? "inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500"
              : "inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("nodes")}
        >
          키워드 요약
        </li>
        <li
          className={`me-2 ${
            activeTab === "conversation"
              ? "inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500"
              : "inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("conversation")}
        >
          음성 기록
        </li>
      </ul>
      <div className={`h-[calc(100%-3rem)] overflow-auto ${styles['custom-scrollbar']}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default NodeConversation;
