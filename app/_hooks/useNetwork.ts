import { useState, useEffect, useCallback } from "react";
import { Network, DataSet } from "vis-network/standalone";
import { Node, Edge } from "../_types/types";
import { Socket } from "socket.io-client";

const useNetwork = (
  containerRef: React.RefObject<HTMLDivElement>,
  socket: Socket | null,
  sessionId: string | null | undefined
) => {
  const [network, setNetwork] = useState<Network | null>(null);
  const [nodes] = useState<DataSet<Node>>(new DataSet<Node>([]));
  const [edges] = useState<DataSet<Edge>>(new DataSet<Edge>([]));
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [prevSelectedNodeId, setPrevSelectedNodeId] = useState<number | null>(
    null
  );
  const [nextNodeId, setNextNodeId] = useState<number>(1);
  const [nextEdgeId, setNextEdgeId] = useState<number>(1);
  const [action, setAction] = useState<string | null>(null);
  const [tempEdgeFrom, setTempEdgeFrom] = useState<number | null>(null);

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
          // edges.add(newEdge);
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
            // edges.remove(edgeToRemove[0].id);
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
              title: node.content, // 노드의 content를 title로 설정
            });
          }
        }
      }
    },
    [action, edges, nextEdgeId, tempEdgeFrom, nodes, sessionId, socket]
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
        boundingBox: {
          left: -300,
          right: 300,
          top: -300,
          bottom: 300,
        },
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
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

  const addNode = (nid: any, label: string, content: string, color: string) => {
    const newNode: Node = {
      id: nid || nextNodeId,
      label,
      content,
      color,
      title: content, // 추가: 노드 생성 시 content를 title로 설정
    };
    nodes.add(newNode);
    setNextNodeId(nextNodeId + 1);
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
  };
};

export default useNetwork;
