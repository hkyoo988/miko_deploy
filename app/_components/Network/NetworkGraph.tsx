"use client";

import React, { useEffect, useState } from "react";
import useNetwork from "../../_hooks/useNetwork";
import styles from "./styles/NetworkGraph.module.css";
import { Socket } from "socket.io-client";

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedNodeId: number | null;
  handleNodeClick: (nodeId: number | null) => void;
  handleNodeHover: (nodeId: number | null) => void;
  socket: Socket | null;
}

const NetworkGraph: React.FC<Props> = ({
  containerRef,
  selectedNodeId,
  handleNodeClick,
  handleNodeHover,
  socket,
}) => {

  const [popoverState, setPopoverState] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });
  const { network, nodes, edges } = useNetwork(containerRef, socket, null, setPopoverState);

  useEffect(() => {
    if (network) {
      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          handleNodeClick(nodeId);
        } else {
          handleNodeClick(null);
        }
      });
    }
  }, [network, handleNodeClick]);

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


  return (
    <div
      ref={containerRef}
      className={styles.container}
      onClick={() => {
        if (selectedNodeId !== null) {
          handleNodeClick(selectedNodeId);
        }
      }}
    />
  );
};

export default NetworkGraph;
