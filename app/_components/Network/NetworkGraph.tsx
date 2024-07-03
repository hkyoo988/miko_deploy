"use client";

import React, { useEffect } from "react";
import useNetwork from "../../_hooks/useNetwork";
import styles from "./styles/NetworkGraph.module.css";
import { Socket } from "socket.io-client";

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedNodeId: number | null;
  handleNodeClick: (nodeId: number | null) => void;
  socket: Socket | null;
}

const NetworkGraph: React.FC<Props> = ({
  containerRef,
  selectedNodeId,
  handleNodeClick,
  socket,
}) => {
  const { network, nodes, edges } = useNetwork(containerRef, socket, null);

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
