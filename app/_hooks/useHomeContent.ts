import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../_components/Socket/SocketContext";
import { useVideoContext } from "../_components/Video/VideoContext";
import useNetwork from "../_hooks/useNetwork";
import useSocketHandlers from "../_hooks/useSocketHandlers";
import { RoomuseSocketContext } from "../_components/Socket/SocketProvider";

const APPLICATION_SERVER_URL =
  process.env.NEXT_PUBLIC_MAIN_SERVER_URL || "http://localhost:8080/";

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
    network
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

  useSocketHandlers(edges, addNode);

  const handleAddNode = useCallback(
    (id: any) => {
      addNode(id, controlNodeLabel, controlNodeContent, controlNodeColor);
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

  const getToken = async () => {
    if (sessionId) {
      const response = await axios.post(
        `${APPLICATION_SERVER_URL}api/openvidu/sessions/${sessionId}/connections`,
        {},
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.data.token;
    }
    return null;
  };

  const handleSharingRoom = async () => {
    try {
      const token = await getToken();
      if (sessionId) {
        const link = `${
          window.location.origin
        }/meetingRoom?sessionId=${encodeURIComponent(
          sessionId
        )}&userName=${encodeURIComponent("guest1")}&token=${encodeURIComponent(
          token
        )}`;
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
    setPopoverState
  };
};

export default useHomeContent;
