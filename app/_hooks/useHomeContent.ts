import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../_components/Socket/SocketContext";
import { useVideoContext } from "../_components/Video/VideoContext";
import useNetwork from "../_hooks/useNetwork";
import useSocketHandlers from "../_hooks/useSocketHandlers";
import { RoomuseSocketContext } from "../_components/Socket/SocketProvider";

const useHomeContent = (popoverRef: React.RefObject<HTMLDivElement> | null) => {
  const socketContext = RoomuseSocketContext();
  const { socket } = useSocket();
  const { publisher, subscriber } = useVideoContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const { sessionId, userName, token, isConnected } = socketContext || {};
  
  const [popoverState, setPopoverState] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });

  const {
    nodes,
    edges,
    selectedNodeId,
    addNode,
    setAction,
    handleNodeClick,
    fitToScreen,
    handleNodeHover,
    network,
    removeNode
  } = useNetwork(containerRef, socket, sessionId, setPopoverState);

  useEffect(() => {
    if (network) {
      network.on("hoverNode", (params) => {
        if (params.node) {
          handleNodeHover(params.node);
        } else {
          handleNodeHover(null);
        }
      });
    }
  }, [network, handleNodeHover]);

  const [controlNodeLabel, setControlNodeLabel] = useState<string>("");
  const [controlNodeContent, setControlNodeContent] = useState<string>("");
  const [controlNodeColor, setControlNodeColor] = useState<string>("#5A5A5A");
  const [roomLink, setRoomLink] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextId, setNextId] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);
  const [leaveSessionCallback, setLeaveSessionCallback] = useState<
    (() => void) | null
  >(null);

  useSocketHandlers(edges, addNode, nodes);

  const handleAddNode = useCallback(
    (id: any) => {
      addNode(id, controlNodeLabel, controlNodeContent, controlNodeColor, false, 10);
      setNextId("");
      setControlNodeLabel("");
      setControlNodeContent("");
      setControlNodeColor("#5A5A5A");
    },
    [controlNodeLabel, controlNodeContent, controlNodeColor, addNode]
  );

  useEffect(() => {
    if (controlNodeLabel && controlNodeContent) {
      handleAddNode(nextId);
    }
  }, [controlNodeLabel, controlNodeContent, nextId, handleAddNode]);

  const handleKeyword = () => {
    socket.emit("summarize", socketContext?.sessionId);
  };

  const handleSharingRoom = async () => {
    try {
      const query = new URLSearchParams(window.location.search);
      const storedPassword = query.get("p");
      if (sessionId && storedPassword) {
        const link = `${
          window.location.origin
        }/share?sessionId=${sessionId}&p=${storedPassword}`;
        setRoomLink(link);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error generating room link:", error);
    }
  };

  const handleLeaveSession = () => {
    if (leaveSessionCallback) {
      leaveSessionCallback();
    }
  };

  const handleRemoveNode = () => {
    if (selectedNodeId !== null) {
        removeNode(selectedNodeId);
    } else {
        alert("Please select a node to remove.");
    }
};


  const toggleList = () => {
    setIsListOpen(!isListOpen);
    console.log(isListOpen);
  };

  return {
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
    setIsListOpen,
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
    setPopoverState,
    handleRemoveNode
  };
};

export default useHomeContent;
