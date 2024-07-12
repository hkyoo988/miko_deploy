import React, { useState, useEffect, useCallback } from "react";
import { Network, DataSet } from "vis-network/standalone";
import { Node, Edge } from "../_types/types";
import { Socket } from "socket.io-client";

// 랜덤 색상을 생성하는 함수 추가
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const useNetwork = (
  containerRef: React.RefObject<HTMLDivElement>,
  socket: Socket | null,
  sessionId: string | null | undefined,
  setPopoverState: React.Dispatch<React.SetStateAction<any>> | null // 상태 업데이트 함수 추가
) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [nodes] = useState<DataSet<Node>>(new DataSet<Node>([]));
  const [edges] = useState<DataSet<Edge>>(new DataSet<Edge>([]));
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [prevSelectedNodeId, setPrevSelectedNodeId] = useState<number | null>(null);
  const [nextNodeId, setNextNodeId] = useState<number>(1);
  const [nextEdgeId, setNextEdgeId] = useState<number>(1);
  const [action, setAction] = useState<string | null>(null);
  const [tempEdgeFrom, setTempEdgeFrom] = useState<number | null>(null);

  const depth: number[] = [20, 15, 14, 13, 12, 11];

  const handleNodeClick = useCallback(
    (nodeId: number | null) => {
      if (action === "connect") {
        if (tempEdgeFrom === null && nodeId !== null) {
          setTempEdgeFrom(nodeId);
        } else if (nodeId !== null) {
          const newEdge: Edge = {
            id: nextEdgeId,
            from: tempEdgeFrom!,
            to: nodeId,
          };
          console.log("edge요청 보냄", nodeId, tempEdgeFrom);
          if (sessionId && socket) {
            socket.emit("edge", [
              `${sessionId}`,
              `${tempEdgeFrom}`,
              `${nodeId}`,
              "$push",
            ]);
          }

          setTempEdgeFrom(null);
          setNextEdgeId(nextEdgeId + 1);
          setAction(null);
        }
      } else if (action === "disconnect") {
        if (tempEdgeFrom === null && nodeId !== null) {
          setTempEdgeFrom(nodeId);
        } else if (nodeId !== null) {
          const edgeToRemove = edges.get({
            filter: (edge) =>
              (edge.from === tempEdgeFrom && edge.to === nodeId) ||
              (edge.from === nodeId && edge.to === tempEdgeFrom),
          });
          if (edgeToRemove.length > 0) {
            console.log("edge요청 보냄", nodeId, tempEdgeFrom);
            if (sessionId && socket) {
              socket.emit("edge", [
                `${sessionId}`,
                `${tempEdgeFrom}`,
                `${nodeId}`,
                "$pull",
              ]);
            }
          }
          setTempEdgeFrom(null);
          setAction(null);
        }
      } else {
        setSelectedNodeId(nodeId);
        if (nodeId !== null) {
          const node = nodes.get(nodeId);
          if (node) {
            nodes.update({
              id: nodeId,
              label: node.label,
            });
          }
        }
      }
    },
    [action, edges, nextEdgeId, tempEdgeFrom, nodes, sessionId, socket]
  );

  const handleNodeHover = useCallback(
    (nodeId: number | null) => {
      if (nodeId !== null) {
        const node = nodes.get(nodeId);
        if (node && network) {
          const canvasPosition = network.getPositions([nodeId])[nodeId];
          const domPosition = network.canvasToDOM({ x: canvasPosition.x, y: canvasPosition.y });

          console.log("Canvas Position:", canvasPosition);
          console.log("DOM Position:", domPosition);

          if (setPopoverState) {
            setPopoverState({
              visible: true,
              x: domPosition.x,
              y: domPosition.y,
              content: node.content,
            });
          }
        }
      } else {
        if (setPopoverState) {
          setPopoverState((prev: any) => ({ ...prev, visible: false }));
        }
      }
    },
    [network, nodes, setPopoverState]
  );

  const handleNodeBlur = useCallback(
    () => {
      if(setPopoverState)
      setPopoverState((prev : any) => ({ ...prev, visible: false }));
    },
    [setPopoverState]
  );

  const initializeNetwork = (container: HTMLDivElement) => {
    const data = {
      nodes: nodes,
      edges: edges,
    };
    const options = {
      nodes: {
        shape: "dot",
        size: 13,
        font: {
          size: 14,
          color: "#000000",
        },
        shadow: true,
      },
      edges: {
        width: 2,
        shadow: true,
      },
      physics: {
        enabled: true,
        stabilization: false,
        minVelocity: 0.75,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -45,
          centralGravity: 0.007,
          springLength: 200,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 1,
        },
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        hover: true,
      },
    };
    const net = new Network(container, data, options);
    setNetwork(net);

    net.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        handleNodeClick(nodeId);
      } else {
        handleNodeClick(null);
      }
    });

    net.on("hoverNode", (params) => {
      if (params.node) {
        handleNodeHover(params.node);
      } else {
        handleNodeHover(null);
      }
    });

    net.on("blurNode", (params) => {
      handleNodeBlur();
    });
  };

  useEffect(() => {
    if (containerRef.current && !network) {
      initializeNetwork(containerRef.current);
    }
  }, [containerRef, network, handleNodeClick, nodes, edges]);

  useEffect(() => {
    if (network) {
      if (prevSelectedNodeId !== null) {
        nodes.update({
          id: prevSelectedNodeId,
          color: "#5A5A5A",
        });
      }
      if (selectedNodeId !== null) {
        nodes.update({
          id: selectedNodeId,
          color: "#0CC95B",
        });
      }
      setPrevSelectedNodeId(selectedNodeId);
    }
  }, [network, nodes, selectedNodeId, prevSelectedNodeId]);

  const addNode = (nid: any, label: string, content: string, color: string, playSound = true, d: number) => {
    let size: number;

    if (d < 0) {
        size = Math.abs(d) + depth[0];
    } else {
        size = depth[d] || 10; // depth[d]가 유효하지 않으면 기본값 10을 사용합니다.
    }
    
    if (d === 0) {
      color = getRandomColor(); // 랜덤 색상을 할당
    }
    const newNode: Node = {
      id: nid || nextNodeId,
      label,
      content,
      color,
      size
    };
    nodes.add(newNode);
    setNextNodeId(nextNodeId + 1);
  
    if (playSound) {
      const audio = new Audio('/effect.mp3');
      audio.play();
    }
  };

  const fitToScreen = () => {
    if (network) {
      network.fit({
        animation: {
          duration: 1000,
          easingFunction: "easeInOutQuad",
        },
      });
    }
  };

  return {
    network,
    nodes,
    edges,
    selectedNodeId,
    addNode,
    setAction,
    handleNodeClick,
    fitToScreen,
    initializeNetwork,
    handleNodeHover,
  };
};

export default useNetwork;
